export const sportLabels = {
  running: "Hardlopen",
  hyrox: "Hyrox",
  strength: "Kracht",
  cycling: "Fietsen",
};

export const allowedSports = Object.keys(sportLabels);

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
    notes: "Rustige duurprikkel met lage intensiteit.",
  },
];

export function normalizeWorkout(input = {}) {
  const now = new Date().toISOString();
  const workoutType = input.workoutType || input.label || "general";

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
    notes: String(input.notes || input.description || ""),
    createdAt: String(input.createdAt || input.created_at || now),
    updatedAt: String(input.updatedAt || input.updated_at || now),
  };
}

export function normalizeWorkouts(workouts = []) {
  return workouts.map((workout) => normalizeWorkout(workout));
}

export function normalizeManualWorkout(formData) {
  return normalizeWorkout({
    source: "manual",
    date: formData.get("date"),
    sport: formData.get("sport"),
    title: formData.get("title"),
    workoutType: formData.get("workoutType") || formData.get("label"),
    durationMin: formData.get("durationMin"),
    distanceKm: formData.get("distanceKm"),
    avgHr: formData.get("avgHr"),
    maxHr: formData.get("maxHr"),
    load: formData.get("load"),
    notes: formData.get("notes"),
  });
}

export function normalizeCsvWorkout(record = {}) {
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
    notes: record.notes,
  });
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
