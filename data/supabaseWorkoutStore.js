import { getSupabaseClient } from "../lib/supabase.js";
import { normalizeWorkouts } from "./workoutModel.js";
import {
  intervalToSupabaseLapRow,
  workoutToSupabaseRow,
  workoutsFromSupabaseRows,
} from "./supabaseWorkoutMapper.js";

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase.auth.getUser();
  if (error) return { user: null, error };

  return { user: data.user, error: null };
}

export async function signInWithEmail(email) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase is not configured.") };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  return { error };
}

export async function signOut() {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase is not configured.") };

  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function loadSupabaseWorkouts() {
  const supabase = getSupabaseClient();
  if (!supabase) return { workouts: [], error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_laps(*)")
    .order("date", { ascending: false });

  if (error) return { workouts: [], error };

  return { workouts: workoutsFromSupabaseRows(data), error: null };
}

export async function saveSupabaseWorkout(workout) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      workout: null,
      error: new Error("Supabase is not configured."),
    };
  }

  const { user, error: userError } = await getCurrentUser();
  if (userError || !user) {
    return {
      workout: null,
      error: userError || new Error("No authenticated Supabase user."),
    };
  }

  const normalizedWorkouts = normalizeWorkouts([workout]);
  const row = workoutToSupabaseRow(normalizedWorkouts[0], user.id);
  const { error } = await supabase
    .from("workouts")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();

  if (error) return { workout: null, error };

  const lapError = await replaceWorkoutLaps(supabase, normalizedWorkouts);
  if (lapError) return { workout: null, error: lapError };

  const { workouts: savedWorkouts, error: reloadError } = await loadSupabaseWorkoutsByIds([row.id]);
  if (reloadError) return { workout: null, error: reloadError };

  return { workout: savedWorkouts[0] || null, error: null };
}

export async function saveSupabaseWorkouts(workouts) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      workouts: [],
      error: new Error("Supabase is not configured."),
    };
  }

  const { user, error: userError } = await getCurrentUser();
  if (userError || !user) {
    return {
      workouts: [],
      error: userError || new Error("No authenticated Supabase user."),
    };
  }

  const normalizedWorkouts = normalizeWorkouts(workouts);
  const rows = normalizedWorkouts.map((workout) => workoutToSupabaseRow(workout, user.id));
  const { error } = await supabase
    .from("workouts")
    .upsert(rows, { onConflict: "id" })
    .select();

  if (error) return { workouts: [], error };

  const lapError = await replaceWorkoutLaps(supabase, normalizedWorkouts);
  if (lapError) return { workouts: [], error: lapError };

  const { workouts: savedWorkouts, error: reloadError } = await loadSupabaseWorkoutsByIds(rows.map((row) => row.id));
  if (reloadError) return { workouts: [], error: reloadError };

  return { workouts: savedWorkouts, error: null };
}

async function loadSupabaseWorkoutsByIds(ids) {
  const supabase = getSupabaseClient();
  if (!supabase) return { workouts: [], error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_laps(*)")
    .in("id", ids)
    .order("date", { ascending: false });

  if (error) return { workouts: [], error };

  return { workouts: workoutsFromSupabaseRows(data), error: null };
}

async function replaceWorkoutLaps(supabase, workouts) {
  const workoutIds = workouts.map((workout) => workout.id);
  if (!workoutIds.length) return null;

  const { error: deleteError } = await supabase
    .from("workout_laps")
    .delete()
    .in("workout_id", workoutIds);

  if (deleteError) return deleteError;

  const lapRows = workouts.flatMap((workout) => {
    return (workout.intervals || []).map((interval) => intervalToSupabaseLapRow(interval, workout.id));
  });

  if (!lapRows.length) return null;

  const { error: insertError } = await supabase
    .from("workout_laps")
    .insert(lapRows);

  return insertError || null;
}
