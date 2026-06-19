export const sportLabels = {
  running: "Hardlopen",
  hyrox: "Hyrox",
  strength: "Kracht",
  cycling: "Fietsen",
};

export const allowedSports = Object.keys(sportLabels);

export const hyroxSegmentTypes = [
  "run",
  "ski_erg",
  "row_erg",
  "sled_push",
  "sled_pull",
  "burpee_broad_jump",
  "sandbag_lunge",
  "farmer_carry",
  "wall_ball",
  "strength",
  "rest",
  "transition",
  "other",
];

export const seedWorkouts = [
  {
    id: "run-threshold-2026-04-23",
    source: "manual",
    externalId: "",
    date: "2026-04-23",
    startTime: "",
    sport: "running",
    title: "6 x 1 km drempel",
    workoutType: "threshold",
    durationMin: 51,
    distanceKm: 11.2,
    avgHr: 164,
    maxHr: 0,
    load: 86,
    avgPace: "",
    elevationGain: 0,
    intervals: [
      { intervalIndex: 1, name: "1 km", durationSeconds: 236, distanceMeters: 1000, avgHr: 158, maxHr: 166, avgPace: "3:56/km" },
      { intervalIndex: 2, name: "1 km", durationSeconds: 235, distanceMeters: 1000, avgHr: 162, maxHr: 170, avgPace: "3:55/km" },
      { intervalIndex: 3, name: "1 km", durationSeconds: 237, distanceMeters: 1000, avgHr: 164, maxHr: 172, avgPace: "3:57/km" },
      { intervalIndex: 4, name: "1 km", durationSeconds: 238, distanceMeters: 1000, avgHr: 166, maxHr: 174, avgPace: "3:58/km" },
      { intervalIndex: 5, name: "1 km", durationSeconds: 239, distanceMeters: 1000, avgHr: 168, maxHr: 176, avgPace: "3:59/km" },
      { intervalIndex: 6, name: "1 km", durationSeconds: 240, distanceMeters: 1000, avgHr: 169, maxHr: 178, avgPace: "4:00/km" },
    ],
    notes: "Stabiel tempo, lichte hartslagdrift in de laatste twee herhalingen.",
  },
  {
    id: "run-threshold-2025-10-20",
    source: "manual",
    externalId: "",
    date: "2025-10-20",
    startTime: "",
    sport: "running",
    title: "5 x 1 km drempel",
    workoutType: "threshold",
    durationMin: 46,
    distanceKm: 9.6,
    avgHr: 168,
    maxHr: 0,
    load: 79,
    avgPace: "",
    elevationGain: 0,
    intervals: [
      { intervalIndex: 1, name: "1 km", durationSeconds: 244, distanceMeters: 1000, avgHr: 162, maxHr: 170, avgPace: "4:04/km" },
      { intervalIndex: 2, name: "1 km", durationSeconds: 242, distanceMeters: 1000, avgHr: 166, maxHr: 174, avgPace: "4:02/km" },
      { intervalIndex: 3, name: "1 km", durationSeconds: 243, distanceMeters: 1000, avgHr: 169, maxHr: 177, avgPace: "4:03/km" },
      { intervalIndex: 4, name: "1 km", durationSeconds: 245, distanceMeters: 1000, avgHr: 171, maxHr: 179, avgPace: "4:05/km" },
      { intervalIndex: 5, name: "1 km", durationSeconds: 247, distanceMeters: 1000, avgHr: 173, maxHr: 181, avgPace: "4:07/km" },
    ],
    notes: "Zelfde type prikkel, maar duurder qua hartslag.",
  },
  {
    id: "hyrox-sim-2026-04-18",
    source: "manual",
    externalId: "",
    date: "2026-04-18",
    startTime: "",
    sport: "hyrox",
    title: "Hyrox race sim 70%",
    workoutType: "race-sim",
    durationMin: 68,
    distanceKm: 8,
    avgHr: 169,
    maxHr: 0,
    load: 104,
    avgPace: "",
    elevationGain: 0,
    intervals: [],
    segments: [
      { segmentIndex: 1, segmentType: "run", name: "Run 1", distanceMeters: 1000, durationSeconds: 270, avgHr: 158, avgPace: "4:30/km" },
      { segmentIndex: 2, segmentType: "ski_erg", name: "SkiErg", distanceMeters: 1000, durationSeconds: 250, avgWatts: 218, avgHr: 166, rpe: 7 },
      { segmentIndex: 3, segmentType: "run", name: "Run 2", distanceMeters: 1000, durationSeconds: 278, avgHr: 164, avgPace: "4:38/km" },
      { segmentIndex: 4, segmentType: "sled_push", name: "Sled push", distanceMeters: 50, durationSeconds: 92, weightKg: 152, avgHr: 171, rpe: 8 },
      { segmentIndex: 5, segmentType: "run", name: "Run 3", distanceMeters: 1000, durationSeconds: 286, avgHr: 168, avgPace: "4:46/km" },
      { segmentIndex: 6, segmentType: "wall_ball", name: "Wall balls", reps: 100, weightKg: 6, durationSeconds: 245, avgHr: 174, rpe: 9 },
    ],
    notes: "Stations technisch houden, runs gecontroleerd.",
  },
  {
    id: "strength-lower-2026-04-21",
    source: "manual",
    externalId: "",
    date: "2026-04-21",
    startTime: "",
    sport: "strength",
    title: "Lower body strength",
    workoutType: "legday",
    durationMin: 58,
    distanceKm: 0,
    avgHr: 118,
    maxHr: 0,
    load: 48,
    avgPace: "",
    elevationGain: 0,
    intervals: [],
    notes: "Krachtprikkel zonder tot falen te gaan.",
  },
  {
    id: "bike-z2-2026-04-16",
    source: "manual",
    externalId: "",
    date: "2026-04-16",
    startTime: "",
    sport: "cycling",
    title: "Z2 duur rit",
    workoutType: "endurance",
    durationMin: 92,
    distanceKm: 44.8,
    avgHr: 138,
    maxHr: 0,
    load: 72,
    avgPace: "",
    elevationGain: 0,
    intervals: [],
    notes: "Rustige duurprikkel met lage intensiteit.",
  },
];

export function normalizeWorkout(input = {}) {
  const now = new Date().toISOString();
  const workoutType = input.workoutType || input.label || "general";
  const intervals = normalizeIntervals(input.intervals || input.laps || input.workout_laps || []);
  const intervalProfile = inferIntervalProfile(intervals);

  return {
    id: String(input.id || createWorkoutId(input.source || "manual")),
    source: String(input.source || "manual"),
    externalId: String(input.externalId || input.external_id || ""),
    date: normalizeDate(input.date || input.startDate || input.start_date),
    startTime: String(input.startTime || input.start_time || ""),
    sport: normalizeSport(input.sport),
    title: String(input.title || input.name || "Training").trim(),
    workoutType: String(workoutType).trim() || "general",
    durationMin: numberOrZero(input.durationMin ?? input.duration_min),
    distanceKm: numberOrZero(input.distanceKm ?? input.distance_km),
    avgHr: numberOrZero(input.avgHr ?? input.avg_hr),
    maxHr: numberOrZero(input.maxHr ?? input.max_hr),
    load: numberOrZero(input.load ?? input.trainingLoad ?? input.training_load),
    avgPace: String(input.avgPace || input.avg_pace || ""),
    elevationGain: numberOrZero(input.elevationGain ?? input.elevation_gain),
    intervals,
    segments: normalizeSegments(input.segments || input.workout_segments || []),
    intervalFamily: String(input.intervalFamily || input.interval_family || intervalProfile.intervalFamily || ""),
    repDistanceMeters: numberOrZero(input.repDistanceMeters ?? input.rep_distance_meters) || intervalProfile.repDistanceMeters,
    repDurationSeconds: numberOrZero(input.repDurationSeconds ?? input.rep_duration_seconds) || intervalProfile.repDurationSeconds,
    repCount: numberOrZero(input.repCount ?? input.rep_count) || intervalProfile.repCount,
    qualityVolumeMeters: numberOrZero(input.qualityVolumeMeters ?? input.quality_volume_meters) || intervalProfile.qualityVolumeMeters,
    qualityDurationSeconds: numberOrZero(input.qualityDurationSeconds ?? input.quality_duration_seconds) || intervalProfile.qualityDurationSeconds,
    notes: String(input.notes || input.description || ""),
    createdAt: String(input.createdAt || input.created_at || now),
    updatedAt: String(input.updatedAt || input.updated_at || now),
  };
}

export function normalizeWorkouts(workouts = []) {
  return workouts.map((workout) => normalizeWorkout(workout));
}

export function normalizeManualWorkout(formData) {
  const intervals = formData.getAll("intervalName")
    .map((name, index) => ({
      intervalIndex: index + 1,
      name,
      durationText: formData.getAll("intervalDuration")[index],
      distanceKm: formData.getAll("intervalDistanceKm")[index],
      avgHr: formData.getAll("intervalAvgHr")[index],
      maxHr: formData.getAll("intervalMaxHr")[index],
      avgPace: formData.getAll("intervalAvgPace")[index],
    }))
    .filter((interval) => {
      return interval.name || interval.durationText || interval.distanceKm || interval.avgHr || interval.maxHr || interval.avgPace;
    });
  const segments = formData.getAll("segmentType")
    .map((segmentType, index) => ({
      segmentIndex: index + 1,
      segmentType,
      name: formData.getAll("segmentName")[index],
      durationText: formData.getAll("segmentDuration")[index],
      distanceMeters: formData.getAll("segmentDistanceMeters")[index],
      reps: formData.getAll("segmentReps")[index],
      weightKg: formData.getAll("segmentWeightKg")[index],
      avgWatts: formData.getAll("segmentAvgWatts")[index],
      rpe: formData.getAll("segmentRpe")[index],
      avgHr: formData.getAll("segmentAvgHr")[index],
      maxHr: formData.getAll("segmentMaxHr")[index],
      notes: formData.getAll("segmentNotes")[index],
    }))
    .filter((segment) => {
      return segment.name || segment.durationText || segment.distanceMeters || segment.reps || segment.weightKg || segment.avgWatts || segment.rpe || segment.avgHr || segment.maxHr || segment.notes;
    });
  const strengthSegments = formData.getAll("strengthName")
    .map((name, index) => ({
      segmentIndex: segments.length + index + 1,
      segmentType: "strength",
      name,
      sets: formData.getAll("strengthSets")[index],
      reps: formData.getAll("strengthReps")[index],
      weightKg: formData.getAll("strengthWeightKg")[index],
      rpe: formData.getAll("strengthRpe")[index],
      notes: formData.getAll("strengthNotes")[index],
    }))
    .filter((segment) => {
      return segment.name || segment.sets || segment.reps || segment.weightKg || segment.rpe || segment.notes;
    });

  return normalizeWorkout({
    source: "manual",
    date: formData.get("date"),
    sport: formData.get("sport"),
    title: formData.get("title"),
    workoutType: formData.get("workoutType") || formData.get("label"),
    startTime: formData.get("startTime"),
    durationMin: formData.get("durationMin"),
    distanceKm: formData.get("distanceKm"),
    avgHr: formData.get("avgHr"),
    maxHr: formData.get("maxHr"),
    load: formData.get("load"),
    avgPace: formData.get("avgPace"),
    elevationGain: formData.get("elevationGain"),
    intervals,
    segments: [...segments, ...strengthSegments],
    notes: formData.get("notes"),
  });
}

export function normalizeCsvWorkout(record = {}) {
  if (isStravaExportRecord(record)) {
    return normalizeStravaExportWorkout(record);
  }

  return normalizeWorkout({
    id: record.id,
    source: record.source || "google_sheets",
    externalId: record.externalId || record.external_id,
    date: record.date,
    startTime: record.startTime || record.start_time,
    sport: record.sport,
    title: record.title,
    workoutType: record.workoutType || record.workout_type || record.label,
    durationMin: record.durationMin || record.duration_min,
    distanceKm: record.distanceKm || record.distance_km,
    avgHr: record.avgHr || record.avg_hr,
    maxHr: record.maxHr || record.max_hr,
    load: record.load || record.trainingLoad || record.training_load,
    avgPace: record.avgPace || record.avg_pace,
    elevationGain: record.elevationGain || record.elevation_gain,
    intervals: parseIntervals(record.intervals || record.laps || record.workout_laps),
    segments: parseStructuredArray(record.segments || record.workout_segments),
    intervalFamily: record.intervalFamily || record.interval_family,
    repDistanceMeters: record.repDistanceMeters || record.rep_distance_meters,
    repDurationSeconds: record.repDurationSeconds || record.rep_duration_seconds,
    repCount: record.repCount || record.rep_count,
    qualityVolumeMeters: record.qualityVolumeMeters || record.quality_volume_meters,
    qualityDurationSeconds: record.qualityDurationSeconds || record.quality_duration_seconds,
    notes: record.notes,
  });
}

function isStravaExportRecord(record = {}) {
  return Boolean(record["Activity ID"] || record.activity_id || record.activityId);
}

function normalizeStravaExportWorkout(record = {}) {
  const externalId = String(record["Activity ID"] || record.activity_id || record.activityId || "").trim();
  const distanceMeters = numberOrZero(record.Distance);
  const movingSeconds = numberOrZero(record["Moving Time"] || record.MovingTime || record.moving_time);
  const elapsedSeconds = numberOrZero(record["Elapsed Time"] || record.ElapsedTime || record.elapsed_time);
  const durationSeconds = movingSeconds || elapsedSeconds;
  const date = parseStravaDate(record["Activity Date"] || record.activity_date || record.date);
  const startTime = parseStravaStartTime(record["Activity Date"] || record.activity_date || "");
  const sport = mapStravaSport(record["Activity Type"] || record.activity_type || record.sport);

  return normalizeWorkout({
    id: externalId ? `strava-${externalId}` : record.id,
    source: "strava",
    externalId,
    date,
    startTime,
    sport,
    title: record["Activity Name"] || record.activity_name || record.title || "Strava activiteit",
    workoutType: "strava_export",
    durationMin: durationSeconds ? Math.round(durationSeconds / 60) : 0,
    distanceKm: distanceMeters ? distanceMeters / 1000 : numberOrZero(record.distance_km),
    avgHr: record["Average Heart Rate"] || record.average_heartrate || record.avg_hr,
    maxHr: record["Max Heart Rate"] || record.max_heartrate || record.max_hr,
    load: record["Relative Effort"] || record.relative_effort || record.load,
    avgPace: paceFromSecondsAndMeters(durationSeconds, distanceMeters),
    elevationGain: record["Elevation Gain"] || record.elevation_gain,
    notes: record["Activity Description"] || record.description || "",
  });
}

function parseStravaDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function parseStravaStartTime(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toTimeString().slice(0, 5);
}

function mapStravaSport(type) {
  const normalized = String(type || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["ride", "virtualride", "virtual_ride", "gravelride", "mountainbikeride", "ebikeride"].includes(normalized)) return "cycling";
  if (["weighttraining", "weight_training", "workout", "crossfit"].includes(normalized)) return "strength";
  return "running";
}

function paceFromSecondsAndMeters(seconds, meters) {
  const duration = numberOrZero(seconds);
  const distance = numberOrZero(meters);
  if (!duration || !distance) return "";

  const secondsPerKm = duration / (distance / 1000);
  const minutes = Math.floor(secondsPerKm / 60);
  const remainder = Math.round(secondsPerKm % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}/km`;
}

export function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSport(sport) {
  return allowedSports.includes(sport) ? sport : "running";
}

function normalizeDate(date) {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const parsed = date ? new Date(date) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function createWorkoutId(source) {
  const prefix = String(source || "manual").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeIntervals(intervals = []) {
  if (!Array.isArray(intervals)) return [];

  return intervals
    .map((interval, index) => {
      const distanceKm = numberOrZero(interval.distanceKm ?? interval.distance_km);
      return {
        intervalIndex: numberOrZero(interval.intervalIndex ?? interval.interval_index ?? interval.lapIndex ?? interval.lap_index) || index + 1,
        name: String(interval.name || interval.label || `Interval ${index + 1}`).trim(),
        exerciseType: normalizeIntervalExerciseType(interval.exerciseType || interval.exercise_type),
        lapRole: normalizeLapRole(interval.lapRole || interval.lap_role),
        effortGoal: normalizeEffortGoal(interval.effortGoal || interval.effort_goal),
        startOffsetSeconds: numberOrZero(interval.startOffsetSeconds ?? interval.start_offset_seconds),
        durationSeconds: normalizeDurationSeconds(interval.durationSeconds ?? interval.duration_seconds ?? interval.durationText),
        distanceMeters: numberOrZero(interval.distanceMeters ?? interval.distance_meters) || Math.round(distanceKm * 1000),
        avgHr: numberOrZero(interval.avgHr ?? interval.avg_hr),
        maxHr: numberOrZero(interval.maxHr ?? interval.max_hr),
        avgPace: String(interval.avgPace || interval.avg_pace || ""),
        rawPayload: interval.rawPayload || interval.raw_payload || {},
      };
    })
    .filter((interval) => {
      return interval.name || interval.durationSeconds || interval.distanceMeters || interval.avgHr || interval.maxHr || interval.avgPace;
    });
}

function normalizeDurationSeconds(value) {
  if (typeof value === "string" && value.includes(":")) {
    const parts = value.split(":").map(Number);
    if (parts.length === 2 && parts.every(Number.isFinite)) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3 && parts.every(Number.isFinite)) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  return numberOrZero(value);
}

function parseIntervals(value) {
  return parseStructuredArray(value);
}

function parseStructuredArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeSegments(segments = []) {
  if (!Array.isArray(segments)) return [];

  return segments
    .map((segment, index) => ({
      segmentIndex: numberOrZero(segment.segmentIndex ?? segment.segment_index) || index + 1,
      segmentType: normalizeSegmentType(segment.segmentType || segment.segment_type),
      name: String(segment.name || segment.label || `Segment ${index + 1}`).trim(),
      startOffsetSeconds: normalizeDurationSeconds(segment.startOffsetSeconds ?? segment.start_offset_seconds),
      durationSeconds: normalizeDurationSeconds(segment.durationSeconds ?? segment.duration_seconds ?? segment.durationText),
      distanceMeters: numberOrZero(segment.distanceMeters ?? segment.distance_meters),
      sets: numberOrZero(segment.sets),
      reps: numberOrZero(segment.reps),
      weightKg: numberOrZero(segment.weightKg ?? segment.weight_kg),
      avgHr: numberOrZero(segment.avgHr ?? segment.avg_hr),
      maxHr: numberOrZero(segment.maxHr ?? segment.max_hr),
      avgPace: String(segment.avgPace || segment.avg_pace || ""),
      avgWatts: numberOrZero(segment.avgWatts ?? segment.avg_watts),
      rpe: clamp(numberOrZero(segment.rpe), 0, 10),
      load: numberOrZero(segment.load),
      notes: String(segment.notes || ""),
      rawPayload: segment.rawPayload || segment.raw_payload || {},
    }))
    .filter((segment) => {
      return segment.name || segment.durationSeconds || segment.distanceMeters || segment.reps || segment.weightKg || segment.avgWatts || segment.notes;
    });
}

function normalizeSegmentType(type) {
  const normalized = String(type || "other").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return hyroxSegmentTypes.includes(normalized) ? normalized : "other";
}

function normalizeIntervalExerciseType(type) {
  const allowed = ["", "run", "ski_erg", "row_erg", "bike_erg", "strength", "rest", "transition", "other"];
  const normalized = String(type || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return allowed.includes(normalized) ? normalized : "";
}

function normalizeLapRole(role) {
  const allowed = ["work", "recovery", "warmup", "cooldown", "transition", "unknown"];
  const normalized = String(role || "work").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return allowed.includes(normalized) ? normalized : "work";
}

function normalizeEffortGoal(goal) {
  const allowed = ["", "z1", "z2", "z3", "threshold", "vo2max", "all_out", "race_pace", "recovery", "technique", "other"];
  const normalized = String(goal || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return allowed.includes(normalized) ? normalized : "";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function inferIntervalProfile(intervals) {
  const qualityIntervals = intervals.filter((interval) => interval.distanceMeters || interval.durationSeconds);
  if (!qualityIntervals.length) {
    return {
      intervalFamily: "",
      repDistanceMeters: 0,
      repDurationSeconds: 0,
      repCount: 0,
      qualityVolumeMeters: 0,
      qualityDurationSeconds: 0,
    };
  }

  const distances = qualityIntervals
    .map((interval) => numberOrZero(interval.distanceMeters))
    .filter((distance) => distance > 0);
  const repDistanceMeters = mostCommonRoundedDistance(distances);
  const durations = qualityIntervals
    .map((interval) => numberOrZero(interval.durationSeconds))
    .filter((duration) => duration > 0);
  const repDurationSeconds = mostCommonRoundedDuration(durations);
  const prefersDuration = shouldPreferDurationFamily(repDistanceMeters, repDurationSeconds);
  const matchingReps = repDistanceMeters && !prefersDuration
    ? qualityIntervals.filter((interval) => Math.abs(numberOrZero(interval.distanceMeters) - repDistanceMeters) <= Math.max(25, repDistanceMeters * 0.03))
    : repDurationSeconds
      ? qualityIntervals.filter((interval) => Math.abs(numberOrZero(interval.durationSeconds) - repDurationSeconds) <= Math.max(5, repDurationSeconds * 0.05))
    : qualityIntervals;
  const repCount = matchingReps.length;
  const qualityVolumeMeters = matchingReps.reduce((sum, interval) => sum + numberOrZero(interval.distanceMeters), 0);
  const qualityDurationSeconds = matchingReps.reduce((sum, interval) => sum + numberOrZero(interval.durationSeconds), 0);

  return {
    intervalFamily: repDistanceMeters && !prefersDuration
      ? `${formatDistanceLabel(repDistanceMeters)}-reps`
      : repDurationSeconds
        ? `${formatDurationLabel(repDurationSeconds)}-reps`
        : "intervals",
    repDistanceMeters,
    repDurationSeconds,
    repCount,
    qualityVolumeMeters,
    qualityDurationSeconds,
  };
}

function mostCommonRoundedDistance(distances) {
  if (!distances.length) return 0;

  const counts = distances.reduce((acc, distance) => {
    const rounded = Math.round(distance / 50) * 50;
    acc[rounded] = (acc[rounded] || 0) + 1;
    return acc;
  }, {});

  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
}

function mostCommonRoundedDuration(durations) {
  if (!durations.length) return 0;

  const counts = durations.reduce((acc, duration) => {
    const rounded = Math.round(duration / 5) * 5;
    acc[rounded] = (acc[rounded] || 0) + 1;
    return acc;
  }, {});

  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
}

function shouldPreferDurationFamily(repDistanceMeters, repDurationSeconds) {
  if (!repDurationSeconds || repDurationSeconds < 300 || repDurationSeconds % 60 !== 0) return false;
  if (!repDistanceMeters) return true;

  const classicDistanceReps = new Set([200, 300, 400, 500, 800, 1000, 1200, 1600, 2000, 3000]);
  return !classicDistanceReps.has(repDistanceMeters);
}

function formatDistanceLabel(distanceMeters) {
  if (distanceMeters >= 1000 && distanceMeters % 1000 === 0) {
    return `${distanceMeters / 1000}km`;
  }

  return `${distanceMeters}m`;
}

function formatDurationLabel(durationSeconds) {
  if (durationSeconds >= 60 && durationSeconds % 60 === 0) {
    return `${durationSeconds / 60}min`;
  }

  return `${durationSeconds}s`;
}
