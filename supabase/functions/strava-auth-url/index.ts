import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.js";
import { createServiceClient, getEnv, requireUser } from "../_shared/supabase_clients.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed.", 405);

  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const state = crypto.randomUUID();
    const supabase = createServiceClient();
    const { error } = await supabase.from("oauth_states").insert({
      user_id: user.id,
      provider: "strava",
      state,
      redirect_to: String(body.redirectTo || ""),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (error) throw error;

    const url = new URL("https://www.strava.com/oauth/authorize");
    url.searchParams.set("client_id", getEnv("STRAVA_CLIENT_ID"));
    url.searchParams.set("redirect_uri", getEnv("STRAVA_REDIRECT_URI"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("approval_prompt", "auto");
    url.searchParams.set("scope", Deno.env.get("STRAVA_SCOPE") || "activity:read_all");
    url.searchParams.set("state", state);

    return jsonResponse({ url: url.toString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Strava autorisatie kon niet worden gestart.";
    return errorResponse(message, 400);
  }
});
