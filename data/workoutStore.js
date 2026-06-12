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
  const workouts = [...imported, ...currentWorkouts];
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
