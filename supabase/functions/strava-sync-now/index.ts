import { errorResponse, getCorsHeaders, jsonResponse } from "../_shared/cors.js";
import { createServiceClient, requireUser } from "../_shared/supabase_clients.js";
import {
  fetchStravaActivities,
  fetchStravaActivity,
  fetchStravaActivityLaps,
  getValidStravaToken,
} from "../_shared/strava_client.js";
import { mapStravaActivityToWorkoutRows } from "../_shared/strava_mapper.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getCorsHeaders(req) });
  if (req.method !== "POST") return errorResponse("Method not allowed.", 405, req);

  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 30);
    const supabase = createServiceClient();

    const { data: dataSource, error: sourceError } = await supabase
      .from("data_sources")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "strava")
      .single();

    if (sourceError || !dataSource) throw new Error("Geen Strava koppeling gevonden.");

    await supabase
      .from("data_sources")
      .update({ sync_status: "syncing", last_error: "" })
      .eq("id", dataSource.id);

    const accessToken = await getValidStravaToken(supabase, dataSource);
    const summaries = await fetchStravaActivities(accessToken, limit);
    let imported = 0;
    let lapCount = 0;

    for (const summary of summaries) {
      const activityId = String(summary.id || "");
      if (!activityId) continue;

      const activity = await fetchStravaActivity(accessToken, activityId);
      const laps = await fetchStravaActivityLaps(accessToken, activityId);
      const rows = mapStravaActivityToWorkoutRows(activity, laps, user.id);

      const { error: workoutError } = await supabase
        .from("workouts")
        .upsert(rows.workout, { onConflict: "id" });

      if (workoutError) throw workoutError;

      const { error: deleteLapsError } = await supabase
        .from("workout_laps")
        .delete()
        .eq("workout_id", rows.workout.id);

      if (deleteLapsError) throw deleteLapsError;

      if (rows.laps.length) {
        const { error: insertLapsError } = await supabase
          .from("workout_laps")
          .insert(rows.laps);

        if (insertLapsError) throw insertLapsError;
      }

      await supabase.from("strava_import_logs").insert({
        user_id: user.id,
        activity_id: activityId,
        status: "imported",
        message: `${activity.name || "Activiteit"} geimporteerd met ${rows.laps.length} lap(s).`,
        finished_at: new Date().toISOString(),
      });

      imported += 1;
      lapCount += rows.laps.length;
    }

    await supabase
      .from("data_sources")
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: "connected",
        last_error: "",
      })
      .eq("id", dataSource.id);

    return jsonResponse({
      imported,
      laps: lapCount,
      checked: summaries.length,
    }, 200, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Strava sync mislukt.";
    return errorResponse(message, 400, req);
  }
});
