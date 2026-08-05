import { getSupabaseClient } from "../lib/supabase.js";
import { normalizeWorkouts } from "./workoutModel.js";
import {
  intervalToSupabaseLapRow,
  segmentToSupabaseRow,
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
      emailRedirectTo: currentAppUrl(),
    },
  });

  return { error };
}

export async function signInWithPassword(email, password) {
  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data?.user || null, error };
}

export async function signUpWithPassword(email, password) {
  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, session: null, error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: currentAppUrl(),
    },
  });

  return {
    user: data?.user || null,
    session: data?.session || null,
    error,
  };
}

export async function resetPasswordForEmail(email) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase is not configured.") };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: currentAppUrl(),
  });

  return { error };
}

export async function updatePassword(password) {
  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase.auth.updateUser({ password });
  return { user: data?.user || null, error };
}

function currentAppUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

export async function signOut() {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error("Supabase is not configured.") };

  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getStravaDataSource() {
  const supabase = getSupabaseClient();
  if (!supabase) return { dataSource: null, error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase
    .from("data_sources")
    .select("provider, external_account_id, provider_scope, sync_status, last_sync_at, last_error, provider_profile")
    .eq("provider", "strava")
    .maybeSingle();

  return { dataSource: data || null, error };
}

export async function getStravaAuthUrl() {
  const supabase = getSupabaseClient();
  if (!supabase) return { url: "", error: new Error("Supabase is not configured.") };

  const { headers, error: authError } = await functionAuthHeaders(supabase);
  if (authError) return { url: "", error: authError };

  const { data, error } = await supabase.functions.invoke("strava-auth-url", {
    body: { redirectTo: window.location.href.split("?")[0] },
    headers,
  });

  if (error) return { url: "", error };
  return { url: data?.url || "", error: null };
}

export async function syncStravaNow(options = 10) {
  const supabase = getSupabaseClient();
  if (!supabase) return { result: null, error: new Error("Supabase is not configured.") };
  const body = typeof options === "number" ? { limit: options } : options;
  const { headers, error: authError } = await functionAuthHeaders(supabase);
  if (authError) return { result: null, error: authError };

  const { data, error } = await supabase.functions.invoke("strava-sync-now", {
    body,
    headers,
  });

  return { result: data || null, error: error ? await normalizeFunctionError(error) : null };
}

export async function testIntervalsIcuConnection() {
  const supabase = getSupabaseClient();
  if (!supabase) return { result: null, error: new Error("Supabase is not configured.") };

  const { headers, error: authError } = await functionAuthHeaders(supabase);
  if (authError) return { result: null, error: authError };

  const { data, error } = await supabase.functions.invoke("intervals-test", {
    body: {},
    headers,
  });

  return { result: data || null, error: error ? await normalizeFunctionError(error) : null };
}

export async function previewIntervalsIcuImport(options = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) return { result: null, error: new Error("Supabase is not configured.") };

  const { headers, error: authError } = await functionAuthHeaders(supabase);
  if (authError) return { result: null, error: authError };

  const { data, error } = await supabase.functions.invoke("intervals-test", {
    body: {
      previewLimit: options.previewLimit || 8,
      days: options.days || 30,
    },
    headers,
  });

  return { result: data || null, error: error ? await normalizeFunctionError(error) : null };
}

export async function syncIntervalsIcuSummary(options = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) return { result: null, error: new Error("Supabase is not configured.") };

  const { headers, error: authError } = await functionAuthHeaders(supabase);
  if (authError) return { result: null, error: authError };

  const { data, error } = await supabase.functions.invoke("intervals-sync", {
    body: {
      days: options.days || 30,
      limit: options.limit || 80,
    },
    headers,
  });

  return { result: data || null, error: error ? await normalizeFunctionError(error) : null };
}

export async function importStravaActivity(activityId) {
  const supabase = getSupabaseClient();
  if (!supabase) return { result: null, error: new Error("Supabase is not configured.") };

  const { headers, error: authError } = await functionAuthHeaders(supabase);
  if (authError) return { result: null, error: authError };

  const { data, error } = await supabase.functions.invoke("strava-import-activity", {
    body: { activityId },
    headers,
  });

  return { result: data || null, error: error ? await normalizeFunctionError(error) : null };
}

async function functionAuthHeaders(supabase) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { headers: {}, error: sessionError };

  const accessToken = sessionData.session?.access_token;
  if (!accessToken) return { headers: {}, error: new Error("Login eerst bij Supabase.") };

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    error: null,
  };
}

async function normalizeFunctionError(error) {
  const context = error?.context;
  if (!context || typeof context.clone !== "function") return error;

  try {
    const body = await context.clone().json();
    const message = body?.error || body?.message;
    if (message) return new Error(message);
  } catch {
    try {
      const text = await context.clone().text();
      if (text) return new Error(text);
    } catch {
      // Fall through to the original Supabase error.
    }
  }

  return error;
}

export async function loadSupabaseWorkouts() {
  const supabase = getSupabaseClient();
  if (!supabase) return { workouts: [], error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_laps(*), workout_segments(*)")
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

  const segmentError = await replaceWorkoutSegments(supabase, normalizedWorkouts);
  if (segmentError) return { workout: null, error: segmentError };

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

  const segmentError = await replaceWorkoutSegments(supabase, normalizedWorkouts);
  if (segmentError) return { workouts: [], error: segmentError };

  const { workouts: savedWorkouts, error: reloadError } = await loadSupabaseWorkoutsByIds(rows.map((row) => row.id));
  if (reloadError) return { workouts: [], error: reloadError };

  return { workouts: savedWorkouts, error: null };
}

async function loadSupabaseWorkoutsByIds(ids) {
  const supabase = getSupabaseClient();
  if (!supabase) return { workouts: [], error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_laps(*), workout_segments(*)")
    .in("id", ids)
    .order("date", { ascending: false });

  if (error) return { workouts: [], error };

  return { workouts: workoutsFromSupabaseRows(data), error: null };
}

async function replaceWorkoutLaps(supabase, workouts) {
  const workoutsWithLaps = workouts.filter((workout) => (workout.intervals || []).length);
  const workoutIds = workoutsWithLaps.map((workout) => workout.id);
  if (!workoutIds.length) return null;

  const { error: deleteError } = await supabase
    .from("workout_laps")
    .delete()
    .in("workout_id", workoutIds);

  if (deleteError) return deleteError;

  const lapRows = workoutsWithLaps.flatMap((workout) => {
    return (workout.intervals || []).map((interval) => intervalToSupabaseLapRow(interval, workout.id));
  });

  if (!lapRows.length) return null;

  const { error: insertError } = await supabase
    .from("workout_laps")
    .insert(lapRows);

  return insertError || null;
}

async function replaceWorkoutSegments(supabase, workouts) {
  const workoutIds = workouts.map((workout) => workout.id);
  if (!workoutIds.length) return null;

  const { error: deleteError } = await supabase
    .from("workout_segments")
    .delete()
    .in("workout_id", workoutIds);

  if (deleteError) return deleteError;

  const segmentRows = workouts.flatMap((workout) => {
    return (workout.segments || []).map((segment) => segmentToSupabaseRow(segment, workout.id));
  });

  if (!segmentRows.length) return null;

  const { error: insertError } = await supabase
    .from("workout_segments")
    .insert(segmentRows);

  return insertError || null;
}
