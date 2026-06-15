import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.js";
import { createServiceClient, getEnv } from "../_shared/supabase_clients.js";
import { fetchStravaActivity, fetchStravaActivityLaps, getValidStravaToken } from "../_shared/strava_client.js";
import { mapStravaActivityToWorkoutRows } from "../_shared/strava_mapper.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed.", 405);

  try {
    const internalSecret = getEnv("STRAVA_INTERNAL_SECRET");
    if (req.headers.get("x-internal-secret") !== internalSecret) {
      return errorResponse("Unauthorized.", 401);
    }

    const { userId, activityId } = await req.json();
    if (!userId || !activityId) throw new Error("userId en activityId zijn verplicht.");

    const supabase = createServiceClient();
    const { data: dataSource, error: sourceError } = await supabase
      .from("data_sources")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "strava")
      .single();

    if (sourceError || !dataSource) throw new Error("Geen Strava data source gevonden.");

    await supabase.from("strava_import_logs").insert({
      user_id: userId,
      activity_id: String(activityId),
      status: "queued",
      message: "Import gestart.",
    });

    const accessToken = await getValidStravaToken(supabase, dataSource);
    const activity = await fetchStravaActivity(accessToken, activityId);
    const laps = await fetchStravaActivityLaps(accessToken, activityId);
    const rows = mapStravaActivityToWorkoutRows(activity, laps, userId);

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

    await supabase
      .from("data_sources")
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: "connected",
        last_error: "",
      })
      .eq("id", dataSource.id);

    await supabase.from("strava_import_logs").insert({
      user_id: userId,
      activity_id: String(activityId),
      status: "imported",
      message: `${activity.name || "Activiteit"} geimporteerd met ${rows.laps.length} lap(s).`,
      finished_at: new Date().toISOString(),
    });

    return jsonResponse({
      imported: true,
      workoutId: rows.workout.id,
      laps: rows.laps.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Strava import mislukt.";
    return errorResponse(message, 400);
  }
});
