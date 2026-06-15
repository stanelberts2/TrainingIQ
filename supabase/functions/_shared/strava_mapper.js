function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function toTime(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.slice(11, 19);
  }

  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(11, 19);
}

function secondsToPace(secondsPerKm) {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return "";
  const rounded = Math.round(secondsPerKm);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}/km`;
}

function paceFromSecondsAndMeters(seconds, meters) {
  const distanceKm = numberOrZero(meters) / 1000;
  if (!distanceKm) return "";
  return secondsToPace(numberOrZero(seconds) / distanceKm);
}

function sportFromStrava(activity = {}) {
  const type = String(activity.sport_type || activity.type || "").toLowerCase();
  if (type.includes("ride") || type.includes("cycling")) return "cycling";
  if (type.includes("weight") || type.includes("workout") || type.includes("crossfit")) return "strength";
  return "running";
}

function workoutTypeFromStrava(activity = {}) {
  const type = String(activity.sport_type || activity.type || "general").toLowerCase();
  const name = String(activity.name || "").toLowerCase();
  if (name.includes("hyrox")) return "hyrox";
  if (name.includes("threshold") || name.includes("drempel")) return "threshold";
  if (name.includes("interval")) return "interval";
  if (name.includes("tempo")) return "tempo";
  return type.replace(/[^a-z0-9]+/g, "-") || "general";
}

function eventTimestampToIso(seconds) {
  const timestamp = numberOrZero(seconds);
  return timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
}

function inferIntervalProfile(laps = []) {
  const usable = laps.filter((lap) => lap.distance_meters || lap.duration_seconds);
  const totalDistance = usable.reduce((sum, lap) => sum + numberOrZero(lap.distance_meters), 0);
  const totalDuration = usable.reduce((sum, lap) => sum + numberOrZero(lap.duration_seconds), 0);
  const distances = usable.map((lap) => numberOrZero(lap.distance_meters)).filter(Boolean);
  const roundedDistances = distances.map((distance) => Math.round(distance / 50) * 50);
  const repDistance = mode(roundedDistances);
  const repCount = repDistance
    ? usable.filter((lap) => Math.abs(numberOrZero(lap.distance_meters) - repDistance) <= Math.max(25, repDistance * 0.03)).length
    : usable.length;

  return {
    interval_family: repDistance ? `${formatDistance(repDistance)}-reps` : "",
    rep_distance_meters: repDistance || 0,
    rep_duration_seconds: mode(usable.map((lap) => Math.round(numberOrZero(lap.duration_seconds) / 5) * 5).filter(Boolean)) || 0,
    rep_count: repCount,
    quality_volume_meters: totalDistance,
    quality_duration_seconds: totalDuration,
  };
}

function mode(values) {
  if (!values.length) return 0;
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function formatDistance(meters) {
  if (meters >= 1000 && meters % 1000 === 0) return `${meters / 1000}km`;
  return `${meters}m`;
}

export function mapStravaWebhookEvent(payload = {}, userId = null) {
  return {
    user_id: userId,
    owner_id: String(payload.owner_id || ""),
    object_id: String(payload.object_id || ""),
    object_type: String(payload.object_type || ""),
    aspect_type: String(payload.aspect_type || ""),
    event_time: eventTimestampToIso(payload.event_time),
    subscription_id: String(payload.subscription_id || ""),
    updates: payload.updates || {},
    raw_payload: payload,
  };
}

export function mapStravaActivityToWorkoutRows(activity = {}, laps = [], userId) {
  const id = `strava-${activity.id}`;
  const startDate = activity.start_date_local || activity.start_date;
  const lapRows = laps.map((lap, index) => ({
    workout_id: id,
    lap_index: numberOrZero(lap.lap_index) || index + 1,
    name: lap.name || `Lap ${index + 1}`,
    start_offset_seconds: numberOrZero(lap.start_index ?? lap.start_offset_seconds),
    duration_seconds: numberOrZero(lap.moving_time || lap.elapsed_time),
    distance_meters: numberOrZero(lap.distance),
    avg_hr: Math.round(numberOrZero(lap.average_heartrate)),
    max_hr: Math.round(numberOrZero(lap.max_heartrate)),
    avg_pace: paceFromSecondsAndMeters(lap.moving_time || lap.elapsed_time, lap.distance),
    raw_payload: lap,
  }));
  const profile = inferIntervalProfile(lapRows);
  const durationMin = Math.round(numberOrZero(activity.moving_time || activity.elapsed_time) / 60);
  const distanceKm = numberOrZero(activity.distance) / 1000;

  return {
    workout: {
      id,
      user_id: userId,
      source: "strava",
      external_id: String(activity.id || ""),
      date: toDate(startDate),
      start_time: toTime(startDate),
      sport: sportFromStrava(activity),
      title: activity.name || "Strava activiteit",
      workout_type: workoutTypeFromStrava(activity),
      duration_min: durationMin,
      distance_km: Number(distanceKm.toFixed(3)),
      avg_hr: Math.round(numberOrZero(activity.average_heartrate)),
      max_hr: Math.round(numberOrZero(activity.max_heartrate)),
      load: 0,
      avg_pace: paceFromSecondsAndMeters(activity.moving_time || activity.elapsed_time, activity.distance),
      elevation_gain: numberOrZero(activity.total_elevation_gain),
      notes: activity.description || "",
      raw_payload: {
        strava_activity: activity,
        source: "strava_import",
      },
      updated_at: new Date().toISOString(),
      ...profile,
    },
    laps: lapRows,
  };
}
