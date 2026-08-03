import { errorResponse, getCorsHeaders, jsonResponse } from "../_shared/cors.js";
import { createServiceClient, requireUser } from "../_shared/supabase_clients.js";

const INTERVALS_BASE_URL = "https://intervals.icu/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getCorsHeaders(req) });
  if (req.method !== "POST") return errorResponse("Method not allowed.", 405, req);

  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const days = Math.min(Math.max(Number(body.days) || 30, 7), 730);
    const maxActivities = Math.min(Math.max(Number(body.limit) || 80, 1), 500);

    const apiKey = getSecret("INTERVALS_ICU_API_KEY");
    const athleteId = normalizeAthleteId(Deno.env.get("INTERVALS_ICU_ATHLETE_ID") || "0");
    const headers = {
      Authorization: `Basic ${btoa(`API_KEY:${apiKey}`)}`,
      Accept: "text/csv",
    };

    const activities = await fetchIntervalsActivities(athleteId, headers, days);
    const summaries = activities.slice(0, maxActivities).map(summarizeIntervalsActivity);
    const supabase = createServiceClient();
    const oldest = new Date();
    oldest.setDate(oldest.getDate() - days - 2);

    const { data: workouts, error: workoutError } = await supabase
      .from("workouts")
      .select("id,date,start_time,title,sport,workout_type,duration_min,distance_km,avg_hr,max_hr,load,raw_payload")
      .eq("user_id", user.id)
      .gte("date", oldest.toISOString().slice(0, 10))
      .order("date", { ascending: false });

    if (workoutError) throw workoutError;

    let matched = 0;
    let updated = 0;
    const previews = [];

    for (const summary of summaries) {
      const match = bestWorkoutMatch(summary, workouts || []);
      if (!match.workout || match.score < 45) {
        previews.push({ summary, matched: false, score: match.score, workoutId: "" });
        continue;
      }

      matched += 1;
      const existingPayload = match.workout.raw_payload || {};
      const intervalsIcu = {
        id: summary.id,
        syncedAt: new Date().toISOString(),
        score: match.score,
        title: summary.title,
        date: summary.date,
        sport: summary.sport,
        workoutType: summary.workoutType,
        durationMin: summary.durationMin,
        distanceKm: summary.distanceKm,
        avgHr: summary.avgHr,
        avgWatts: summary.avgWatts,
        load: summary.load,
        raw: summary.raw,
      };

      const { error: updateError } = await supabase
        .from("workouts")
        .update({
          load: summary.load || match.workout.load || 0,
          avg_hr: match.workout.avg_hr || summary.avgHr || null,
          raw_payload: {
            ...existingPayload,
            intervalsIcu,
          },
        })
        .eq("id", match.workout.id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;
      updated += 1;
      previews.push({
        summary,
        matched: true,
        score: match.score,
        workoutId: match.workout.id,
        workoutTitle: match.workout.title,
      });
    }

    return jsonResponse({
      athleteId,
      checked: summaries.length,
      matched,
      updated,
      days,
      preview: previews.slice(0, 12),
    }, 200, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intervals.icu sync mislukt.";
    return errorResponse(message, 400, req);
  }
});

function getSecret(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret: ${name}`);
  return value;
}

function normalizeAthleteId(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "0") return "0";
  if (/^i\d+$/i.test(trimmed)) return trimmed.toLowerCase();
  if (/^\d+$/.test(trimmed)) return `i${trimmed}`;
  return trimmed;
}

function dateRangeQuery(days: number) {
  const newest = new Date();
  const oldest = new Date(newest);
  oldest.setDate(oldest.getDate() - days);
  return `?oldest=${oldest.toISOString().slice(0, 10)}&newest=${newest.toISOString().slice(0, 10)}`;
}

async function fetchIntervalsActivities(athleteId: string, headers: Record<string, string>, days: number) {
  const response = await fetch(`${INTERVALS_BASE_URL}/athlete/${athleteId}/activities.csv${dateRangeQuery(days)}`, { headers });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Intervals.icu API error ${response.status}`);
  return parseCsv(text);
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function summarizeIntervalsActivity(activity: Record<string, string>) {
  const title = firstValue(activity, ["Name", "name", "Filename", "file_name"]) || "Intervals.icu activiteit";
  const date = normalizeDate(firstValue(activity, ["Date", "date", "start_date", "start_date_local"]));
  const sport = mapSport(firstValue(activity, ["Type", "type", "Sport", "sport", "Category", "category"]));
  const durationSeconds = durationSecondsFromActivity(activity, ["Duration", "duration", "Moving Time", "moving_time", "elapsed_time"]);
  const distanceMeters = distanceMetersFromActivity(activity, ["Distance", "distance", "total_distance"]);

  return {
    id: firstValue(activity, ["Id", "id", "icu_activity_id"]),
    title,
    date,
    sport,
    workoutType: inferWorkoutType(title, sport),
    durationMin: durationSeconds ? Math.round(durationSeconds / 60) : 0,
    distanceKm: distanceMeters ? Number((distanceMeters / 1000).toFixed(2)) : 0,
    avgHr: Math.round(numberFromActivity(activity, ["Avg HR", "average_heartrate", "avg_hr", "average_hr"])),
    avgWatts: Math.round(numberFromActivity(activity, ["Average Watts", "weighted_average_watts", "avg_watts", "power"])),
    load: Math.round(numberFromActivity(activity, ["Training Load", "training_load", "load", "icu_training_load"])),
    raw: activity,
  };
}

function bestWorkoutMatch(summary: ReturnType<typeof summarizeIntervalsActivity>, workouts: Record<string, any>[]) {
  let best = { workout: null as Record<string, any> | null, score: 0 };
  for (const workout of workouts) {
    let score = 0;
    if (workout.date === summary.date) score += 35;
    else if (Math.abs(daysBetween(workout.date, summary.date)) <= 1) score += 15;
    if (normalizedTitle(workout.title) && normalizedTitle(workout.title) === normalizedTitle(summary.title)) score += 30;
    if (durationClose(Number(workout.duration_min || 0), summary.durationMin)) score += 18;
    if (distanceClose(Number(workout.distance_km || 0), summary.distanceKm)) score += 14;
    if (sportCompatible(workout.sport, summary.sport)) score += 8;
    if (score > best.score) best = { workout, score };
  }
  return best;
}

function firstValue(activity: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = activity[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function numberFromActivity(activity: Record<string, string>, keys: string[]) {
  const raw = firstValue(activity, keys).replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function durationSecondsFromActivity(activity: Record<string, string>, keys: string[]) {
  const raw = firstValue(activity, keys);
  if (!raw) return 0;
  const text = raw.trim();
  if (/^\d+:\d{2}(:\d{2})?$/.test(text)) {
    const parts = text.split(":").map((part) => Number(part));
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }
  return numberFromActivity(activity, keys);
}

function distanceMetersFromActivity(activity: Record<string, string>, keys: string[]) {
  const value = numberFromActivity(activity, keys);
  if (!value) return 0;
  return value < 500 ? value * 1000 : value;
}

function normalizeDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] || value.slice(0, 10);
}

function mapSport(value: string) {
  const text = value.toLowerCase();
  if (/run|hardlopen|treadmill/.test(text)) return "running";
  if (/ride|bike|cycling|fiets/.test(text)) return "cycling";
  if (/strength|weight|kracht|workout|fitness/.test(text)) return "strength";
  if (/row/.test(text)) return "rowing";
  if (/ski/.test(text)) return "ski_erg";
  return text || "other";
}

function inferWorkoutType(title: string, sport: string) {
  const text = `${title} ${sport}`.toLowerCase();
  if (/vo2|v02|4x4|4\s*x\s*4|norwegian|norweigan|4x1/.test(text)) return "vo2max";
  if (/threshold|treshold|drempel|tempo/.test(text)) return "threshold";
  if (/z2|zone 2|easy|recovery|herstel/.test(text)) return "z2";
  if (/hyrox|compromised|stations|race|wedstrijd/.test(text)) return "hyrox";
  if (/strength|kracht|upper|lower|fullbody|leg/.test(text)) return "strength";
  return sport === "running" ? "run" : sport;
}

function normalizedTitle(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function durationClose(a: number, b: number) {
  if (!a || !b) return false;
  return Math.abs(a - b) / Math.max(a, b) <= 0.15;
}

function distanceClose(a: number, b: number) {
  if (!a || !b) return false;
  return Math.abs(a - b) / Math.max(a, b) <= 0.15;
}

function sportCompatible(a: string, b: string) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (["cycling", "bike_erg"].includes(a) && ["cycling", "bike_erg"].includes(b)) return true;
  if (["strength", "other"].includes(a) && ["strength", "other"].includes(b)) return true;
  return false;
}

function daysBetween(a: string, b: string) {
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  if (!left || !right) return 999;
  return Math.round((left - right) / 86400000);
}
