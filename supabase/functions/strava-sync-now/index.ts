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
    const mode = String(body.mode || "recent");
    const startPage = Math.max(Number(body.startPage) || 1, 1);
    const historyPageSize = Math.min(Math.max(Number(body.pageSize) || 15, 1), 50);
    const pageSize = mode === "history" ? historyPageSize : Math.min(Math.max(Number(body.limit) || 10, 1), 30);
    const maxPages = mode === "history" ? Math.min(Math.max(Number(body.maxPages) || 5, 1), 10) : 1;
    const maxActivities = mode === "history" ? Math.min(Math.max(Number(body.maxActivities) || 500, 1), 1000) : pageSize;
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
    const summaries = [];
    const endPage = startPage + maxPages - 1;
    for (let page = startPage; page <= endPage && summaries.length < maxActivities; page += 1) {
      const pageActivities = await fetchStravaActivities(accessToken, pageSize, page);
      summaries.push(...pageActivities);
      if (pageActivities.length < pageSize) break;
    }
    const activitiesToImport = summaries.slice(0, maxActivities);
    let imported = 0;
    let lapCount = 0;

    for (const summary of activitiesToImport) {
      const activityId = String(summary.id || "");
      if (!activityId) continue;

      const activity = await fetchStravaActivity(accessToken, activityId);
      const laps = await fetchStravaActivityLaps(accessToken, activityId);
      const rows = mapStravaActivityToWorkoutRows(activity, laps, user.id);

      const { error: workoutError } = await supabase
        .from("workouts")
        .upsert(rows.workout, { onConflict: "id" });

      if (workoutError) throw workoutError;

      const { data: existingLaps, error: existingLapsError } = await supabase
        .from("workout_laps")
        .select("lap_index, exercise_type, lap_role, effort_goal")
        .eq("workout_id", rows.workout.id);

      if (existingLapsError) throw existingLapsError;

      const lapsToInsert = mergeManualLapMetadata(rows.laps, existingLaps || []);

      const { error: deleteLapsError } = await supabase
        .from("workout_laps")
        .delete()
        .eq("workout_id", rows.workout.id);

      if (deleteLapsError) throw deleteLapsError;

      if (lapsToInsert.length) {
        const { error: insertLapsError } = await supabase
          .from("workout_laps")
          .insert(lapsToInsert);

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
      checked: activitiesToImport.length,
      mode,
      startPage,
      endPage,
    }, 200, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Strava sync mislukt.";
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
