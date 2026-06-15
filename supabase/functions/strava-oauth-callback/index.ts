import { exchangeCodeForToken } from "../_shared/strava_client.js";
import { createServiceClient, getEnv } from "../_shared/supabase_clients.js";

function redirectWithStatus(target: string, status: string, message: string) {
  const url = new URL(target || getEnv("APP_URL"));
  url.searchParams.set("strava", status);
  if (message) url.searchParams.set("message", message);
  return Response.redirect(url.toString(), 302);
}

Deno.serve(async (req) => {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const grantedScope = requestUrl.searchParams.get("scope") || "";
  const denied = requestUrl.searchParams.get("error");
  const supabase = createServiceClient();

  try {
    if (denied) throw new Error("Strava toegang geweigerd.");
    if (!code || !state) throw new Error("Strava callback mist code of state.");

    const { data: oauthState, error: stateError } = await supabase
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("provider", "strava")
      .is("consumed_at", null)
      .single();

    if (stateError || !oauthState) throw new Error("Ongeldige Strava state.");
    if (new Date(oauthState.expires_at).getTime() < Date.now()) {
      throw new Error("Strava state is verlopen. Probeer opnieuw te koppelen.");
    }

    const token = await exchangeCodeForToken(code);
    const athleteId = String(token.athlete?.id || "");
    if (!athleteId) throw new Error("Strava gaf geen athlete ID terug.");

    const { error: upsertError } = await supabase.from("data_sources").upsert({
      user_id: oauthState.user_id,
      provider: "strava",
      external_account_id: athleteId,
      access_token_encrypted: token.access_token,
      refresh_token_encrypted: token.refresh_token,
      token_expires_at: new Date(token.expires_at * 1000).toISOString(),
      provider_scope: grantedScope || token.scope || "",
      provider_profile: token.athlete || {},
      sync_status: "connected",
      last_error: "",
      raw_payload: {
        token_type: token.token_type,
        expires_in: token.expires_in,
      },
    }, { onConflict: "user_id,provider" });

    if (upsertError) throw upsertError;

    await supabase
      .from("oauth_states")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", oauthState.id);

    return redirectWithStatus(oauthState.redirect_to, "connected", "");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Strava koppelen mislukt.";
    return redirectWithStatus("", "error", message);
  }
});
