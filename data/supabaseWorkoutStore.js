import { getSupabaseClient } from "../lib/supabase.js";
import { normalizeWorkouts } from "./workoutModel.js";
import {
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
    .select("*")
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

  const row = workoutToSupabaseRow(workout, user.id);
  const { data, error } = await supabase
    .from("workouts")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();

  if (error) return { workout: null, error };

  return { workout: workoutsFromSupabaseRows([data])[0], error: null };
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

  const rows = normalizeWorkouts(workouts).map((workout) => workoutToSupabaseRow(workout, user.id));
  const { data, error } = await supabase
    .from("workouts")
    .upsert(rows, { onConflict: "id" })
    .select();

  if (error) return { workouts: [], error };

  return { workouts: workoutsFromSupabaseRows(data), error: null };
}
