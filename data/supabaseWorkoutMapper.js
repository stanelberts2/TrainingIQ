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
    interval_family: normalized.intervalFamily,
    rep_distance_meters: normalized.repDistanceMeters,
    rep_duration_seconds: normalized.repDurationSeconds,
    rep_count: normalized.repCount,
    quality_volume_meters: normalized.qualityVolumeMeters,
    quality_duration_seconds: normalized.qualityDurationSeconds,
    notes: normalized.notes,
    raw_payload: {
      ...(normalized.rawPayload || {}),
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
    exercise_type: interval.exerciseType || "",
    lap_role: interval.lapRole || "work",
    effort_goal: interval.effortGoal || "",
    start_offset_seconds: interval.startOffsetSeconds || 0,
    duration_seconds: interval.durationSeconds,
    distance_meters: interval.distanceMeters,
    avg_hr: interval.avgHr,
    max_hr: interval.maxHr,
    avg_pace: interval.avgPace,
    raw_payload: interval.rawPayload || {},
  };
}

export function segmentToSupabaseRow(segment, workoutId) {
  return {
    workout_id: workoutId,
    segment_index: segment.segmentIndex,
    segment_type: segment.segmentType,
    name: segment.name,
    start_offset_seconds: segment.startOffsetSeconds,
    duration_seconds: segment.durationSeconds,
    distance_meters: segment.distanceMeters,
    sets: segment.sets,
    reps: segment.reps,
    weight_kg: segment.weightKg,
    avg_hr: segment.avgHr,
    max_hr: segment.maxHr,
    avg_pace: segment.avgPace,
    avg_watts: segment.avgWatts,
    rpe: segment.rpe,
    load: segment.load,
    notes: segment.notes,
    raw_payload: segment.rawPayload || {},
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
    segments: segmentsFromSupabaseRows(row.workout_segments),
    intervalFamily: row.interval_family,
    repDistanceMeters: row.rep_distance_meters,
    repDurationSeconds: row.rep_duration_seconds,
    repCount: row.rep_count,
    qualityVolumeMeters: row.quality_volume_meters,
    qualityDurationSeconds: row.quality_duration_seconds,
    notes: row.notes,
    rawPayload: row.raw_payload || {},
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
      exerciseType: row.exercise_type || "",
      lapRole: row.lap_role || "work",
      effortGoal: row.effort_goal || "",
      startOffsetSeconds: row.start_offset_seconds,
      durationSeconds: row.duration_seconds,
      distanceMeters: row.distance_meters,
      avgHr: row.avg_hr,
      maxHr: row.max_hr,
      avgPace: row.avg_pace,
      rawPayload: row.raw_payload || {},
    }));
}

export function segmentsFromSupabaseRows(rows = []) {
  if (!Array.isArray(rows)) return [];

  return rows
    .sort((a, b) => a.segment_index - b.segment_index)
    .map((row) => ({
      segmentIndex: row.segment_index,
      segmentType: row.segment_type,
      name: row.name,
      startOffsetSeconds: row.start_offset_seconds,
      durationSeconds: row.duration_seconds,
      distanceMeters: row.distance_meters,
      sets: row.sets,
      reps: row.reps,
      weightKg: row.weight_kg,
      avgHr: row.avg_hr,
      maxHr: row.max_hr,
      avgPace: row.avg_pace,
      avgWatts: row.avg_watts,
      rpe: row.rpe,
      load: row.load,
      notes: row.notes,
      rawPayload: row.raw_payload || {},
    }));
}
