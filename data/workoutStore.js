import {
  normalizeCsvWorkout,
  normalizeManualWorkout,
  normalizeWorkout,
  normalizeWorkouts,
  seedWorkouts,
} from "./workoutModel.js";

const STORAGE_KEY = "trainiq-clean-workouts";

export function loadWorkouts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return normalizeWorkouts(seedWorkouts);

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? normalizeWorkouts(parsed) : normalizeWorkouts(seedWorkouts);
  } catch {
    return normalizeWorkouts(seedWorkouts);
  }
}

export function saveWorkouts(workouts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeWorkouts(workouts)));
}

export function resetWorkouts() {
  const workouts = normalizeWorkouts(seedWorkouts);
  saveWorkouts(workouts);
  return workouts;
}

export function createManualWorkout(formData, currentWorkouts = loadWorkouts()) {
  const workout = normalizeManualWorkout(formData);
  const workouts = [workout, ...currentWorkouts];
  saveWorkouts(workouts);
  return { workout, workouts };
}

export function importCsvWorkouts(records, currentWorkouts = loadWorkouts()) {
  const imported = records.map((record) => normalizeCsvWorkout(record));
  const workouts = mergeWorkouts(imported, currentWorkouts);
  saveWorkouts(workouts);
  return { imported, workouts };
}

export function importWorkouts(rawWorkouts, currentWorkouts = loadWorkouts()) {
  const imported = rawWorkouts.map((workout) => normalizeWorkout(workout));
  const workouts = mergeWorkouts(imported, currentWorkouts);
  saveWorkouts(workouts);
  return { imported, workouts };
}

export function upsertWorkout(rawWorkout, currentWorkouts = loadWorkouts()) {
  const workout = normalizeWorkout(rawWorkout);
  const workouts = [
    workout,
    ...currentWorkouts.filter((existing) => existing.id !== workout.id),
  ];
  saveWorkouts(workouts);
  return { workout, workouts };
}

export function sortWorkoutsByDate(workouts) {
  return [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function mergeWorkouts(incoming, existing) {
  const merged = new Map();
  existing.forEach((workout) => {
    merged.set(workoutKey(workout), workout);
  });
  incoming.forEach((workout) => {
    const key = workoutKey(workout);
    merged.set(key, mergeWorkoutRecord(merged.get(key), workout));
  });

  return sortWorkoutsByDate([...merged.values()]);
}

function mergeWorkoutRecord(existing, incoming) {
  if (!existing) return incoming;

  return {
    ...existing,
    ...incoming,
    title: bestWorkoutTitle(existing, incoming),
    workoutType: bestWorkoutType(existing, incoming),
    notes: incoming.notes || existing.notes,
    rawPayload: {
      ...(existing.rawPayload || {}),
      ...(incoming.rawPayload || {}),
    },
  };
}

function bestWorkoutTitle(existing, incoming) {
  const incomingTitle = String(incoming.title || "");
  const existingTitle = String(existing.title || "");
  const incomingLooksGenerated = generatedImportTitle(incomingTitle, incoming);
  const existingLooksGenerated = generatedImportTitle(existingTitle, existing);

  if (incomingTitle && !incomingLooksGenerated) return incomingTitle;
  if (existingTitle && !existingLooksGenerated) return existingTitle;
  return incomingTitle || existingTitle || "Training";
}

function bestWorkoutType(existing, incoming) {
  if (incoming.workoutType === "fit_import" && existing.workoutType && existing.workoutType !== "fit_import") {
    return existing.workoutType;
  }
  return incoming.workoutType || existing.workoutType || "general";
}

function generatedImportTitle(title, workout) {
  const externalId = workout?.externalId ? String(workout.externalId) : "";
  return Boolean(
    !title
      || title === externalId
      || title === `Run ${externalId}`
      || title === `Fietsrit ${externalId}`
      || title === `Krachttraining ${externalId}`
      || title === `Fitness ${externalId}`,
  );
}

function workoutKey(workout) {
  if (workout.source && workout.externalId) return `${workout.source}:${workout.externalId}`;
  return workout.id;
}
