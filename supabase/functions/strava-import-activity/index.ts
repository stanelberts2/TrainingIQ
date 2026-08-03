import { errorResponse, getCorsHeaders, jsonResponse } from "../_shared/cors.js";
import { createServiceClient, getEnv, requireUser } from "../_shared/supabase_clients.js";
import { fetchStravaActivity, fetchStravaActivityLaps, fetchStravaActivityStreams, getValidStravaToken } from "../_shared/strava_client.js";
import { mapStravaActivityToWorkoutRows } from "../_shared/strava_mapper.js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getCorsHeaders(req) });
  if (req.method !== "POST") return errorResponse("Method not allowed.", 405, req);

  try {
    const body = await req.json();
    const internalSecret = getEnv("STRAVA_INTERNAL_SECRET");
    const isInternalRequest = internalSecret && req.headers.get("x-internal-secret") === internalSecret;
    const user = isInternalRequest ? null : await requireUser(req);

    const { userId: requestedUserId, activityId } = body;
    const userId = isInternalRequest ? requestedUserId : user.id;
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
    const streams = await fetchStravaActivityStreams(accessToken, activityId, ["time", "heartrate"]);
    const rows = mapStravaActivityToWorkoutRows(activity, laps, userId, streams);

    const { error: workoutError } = await supabase
      .from("workouts")
      .upsert(rows.workout, { onConflict: "id" });

    if (workoutError) throw workoutError;

    const { data: existingLaps, error: existingLapsError } = await supabase
      .from("workout_laps")
      .select("lap_index, exercise_type, lap_role, effort_goal")
      .eq("workout_id", rows.workout.id);

    if (existingLapsError) throw existingLapsError;

    if (rows.laps.length) {
      const lapsToInsert = mergeManualLapMetadata(rows.laps, existingLaps || []);

      const { error: deleteLapsError } = await supabase
        .from("workout_laps")
        .delete()
        .eq("workout_id", rows.workout.id);

      if (deleteLapsError) throw deleteLapsError;

      const { error: insertLapsError } = await supabase
        .from("workout_laps")
        .insert(lapsToInsert);

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
    }, 200, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Strava import mislukt.";
    return errorResponse(message, 400, req);
  }
});

function mergeManualLapMetadata(laps, existingLaps) {
  const existingByIndex = new Map(existingLaps.map((lap) => [Number(lap.lap_index), lap]));

  return laps.map((lap) => {
    const existing = existingByIndex.get(Number(lap.lap_index));
    if (!existing) return lap;

    return {
      ...lap,
      exercise_type: existing.exercise_type || lap.exercise_type || "",
      lap_role: existing.lap_role || lap.lap_role || "work",
      effort_goal: existing.effort_goal || lap.effort_goal || "",
    };
  });
}
