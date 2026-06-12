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
    raw_payload: {
      intervals: normalized.intervals,
    },
    updated_at: normalized.updatedAt,
  };
}

export function intervalToSupabaseLapRow(interval, workoutId) {
  return {
    workout_id: workoutId,
    lap_index: interval.intervalIndex,
    name: interval.name,
    start_offset_seconds: interval.startOffsetSeconds || 0,
    duration_seconds: interval.durationSeconds,
    distance_meters: interval.distanceMeters,
    avg_hr: interval.avgHr,
    max_hr: interval.maxHr,
    avg_pace: interval.avgPace,
    raw_payload: interval.rawPayload || {},
  };
}

export function workoutFromSupabaseRow(row) {
  const lapIntervals = intervalsFromSupabaseLapRows(row.workout_laps);

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
    intervals: lapIntervals.length ? lapIntervals : row.raw_payload?.intervals || [],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function workoutsFromSupabaseRows(rows = []) {
  return rows.map((row) => workoutFromSupabaseRow(row));
}

export function intervalsFromSupabaseLapRows(rows = []) {
  if (!Array.isArray(rows)) return [];

  return rows
    .sort((a, b) => a.lap_index - b.lap_index)
    .map((row) => ({
      intervalIndex: row.lap_index,
      name: row.name,
      startOffsetSeconds: row.start_offset_seconds,
      durationSeconds: row.duration_seconds,
      distanceMeters: row.distance_meters,
      avgHr: row.avg_hr,
      maxHr: row.max_hr,
      avgPace: row.avg_pace,
      rawPayload: row.raw_payload || {},
    }));
}
