import { errorResponse, getCorsHeaders, jsonResponse } from "../_shared/cors.js";
import { createServiceClient, getEnv } from "../_shared/supabase_clients.js";
import { mapStravaWebhookEvent } from "../_shared/strava_mapper.js";

function waitUntil(promise: Promise<unknown>) {
  const edgeRuntime = (globalThis as any).EdgeRuntime;
  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(promise);
  }
}

async function triggerImport(userId: string, activityId: string) {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const response = await fetch(`${supabaseUrl}/functions/v1/strava-import-activity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": getEnv("STRAVA_INTERNAL_SECRET"),
    },
    body: JSON.stringify({ userId, activityId }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Strava import function failed.");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getCorsHeaders(req) });

  const url = new URL(req.url);
  if (req.method === "GET") {
    const verifyToken = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (verifyToken !== getEnv("STRAVA_VERIFY_TOKEN") || !challenge) {
      return errorResponse("Invalid verify token.", 403, req);
    }

    return jsonResponse({ "hub.challenge": challenge }, 200, req);
  }

  if (req.method !== "POST") return errorResponse("Method not allowed.", 405, req);

  try {
    const payload = await req.json();
    const supabase = createServiceClient();
    const ownerId = String(payload.owner_id || "");
    const activityId = String(payload.object_id || "");

    const { data: dataSource } = await supabase
      .from("data_sources")
      .select("user_id")
      .eq("provider", "strava")
      .eq("external_account_id", ownerId)
      .maybeSingle();

    const userId = dataSource?.user_id || null;
    const { data: event, error } = await supabase
      .from("strava_webhook_events")
      .insert(mapStravaWebhookEvent(payload, userId))
      .select("id")
      .single();

    if (error) throw error;

    if (userId && payload.object_type === "activity" && ["create", "update"].includes(payload.aspect_type)) {
      waitUntil(
        triggerImport(userId, activityId)
          .then(async () => {
            await supabase
              .from("strava_webhook_events")
              .update({ processed_at: new Date().toISOString(), processing_error: "" })
              .eq("id", event.id);
          })
          .catch(async (importError) => {
            const message = importError instanceof Error ? importError.message : "Import failed.";
            await supabase
              .from("strava_webhook_events")
              .update({ processing_error: message })
              .eq("id", event.id);
          }),
      );
    }

    return jsonResponse({ received: true }, 200, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook verwerking mislukt.";
    return errorResponse(message, 400, req);
  }
});
