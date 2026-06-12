import { normalizeWorkout } from "./workoutModel.js";

export function workoutToSupabaseRow(workout, userId) {
  const normalized = normalizeWorkout(workout);

  return {
    id: normalized.id,
    user_id: userId,
    source: normalized.source,
    external_id: normalized.externalId || null,
    date: normalized.date,
    start_time: normalized.startTime || null,
    sport: normalized.sport,
    title: normalized.title,
    workout_type: normalized.workoutType,
    duration_min: normalized.durationMin,
    distance_km: normalized.distanceKm,
    avg_hr: normalized.avgHr,
    max_hr: normalized.maxHr,
    load: normalized.load,
    avg_pace: normalized.avgPace,
    elevation_gain: normalized.elevationGain,
    notes: normalized.notes,
    updated_at: normalized.updatedAt,
  };
}

export function workoutFromSupabaseRow(row) {
  return normalizeWorkout({
    id: row.id,
    source: row.source,
    externalId: row.external_id,
    date: row.date,
    startTime: row.start_time,
    sport: row.sport,
    title: row.title,
    workoutType: row.workout_type,
    durationMin: row.duration_min,
    distanceKm: row.distance_km,
    avgHr: row.avg_hr,
    maxHr: row.max_hr,
    load: row.load,
    avgPace: row.avg_pace,
    elevationGain: row.elevation_gain,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function workoutsFromSupabaseRows(rows = []) {
  return rows.map((row) => workoutFromSupabaseRow(row));
}
