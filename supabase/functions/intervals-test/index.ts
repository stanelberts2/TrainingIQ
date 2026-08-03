import { errorResponse, getCorsHeaders, jsonResponse } from "../_shared/cors.js";
import { requireUser } from "../_shared/supabase_clients.js";

const INTERVALS_BASE_URL = "https://intervals.icu/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getCorsHeaders(req) });
  if (req.method !== "POST") return errorResponse("Method not allowed.", 405, req);

  try {
    await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const previewLimit = Math.min(Math.max(Number(body.previewLimit) || 8, 1), 20);
    const days = Math.min(Math.max(Number(body.days) || 30, 7), 730);

    const apiKey = getSecret("INTERVALS_ICU_API_KEY");
    const athleteId = normalizeAthleteId(Deno.env.get("INTERVALS_ICU_ATHLETE_ID") || "0");
    const jsonHeaders = {
      Authorization: `Basic ${btoa(`API_KEY:${apiKey}`)}`,
      Accept: "application/json",
    };
    const csvHeaders = {
      Authorization: `Basic ${btoa(`API_KEY:${apiKey}`)}`,
      Accept: "text/csv",
    };

    const profile = await safeIntervalsFetch(`${INTERVALS_BASE_URL}/athlete/${athleteId}`, jsonHeaders, "json");
    const activityAttempts = await Promise.all([
      safeIntervalsFetch(`${INTERVALS_BASE_URL}/athlete/${athleteId}/activities${dateRangeQuery(days)}`, jsonHeaders, "json"),
      safeIntervalsFetch(`${INTERVALS_BASE_URL}/athlete/${athleteId}/activities${dateRangeQuery(365)}`, jsonHeaders, "json"),
      safeIntervalsFetch(`${INTERVALS_BASE_URL}/athlete/${athleteId}/activities.csv${dateRangeQuery(days)}`, csvHeaders, "csv"),
      safeIntervalsFetch(`${INTERVALS_BASE_URL}/athlete/${athleteId}/activities.csv${dateRangeQuery(365)}`, csvHeaders, "csv"),
    ]);
    const activities = activityAttempts.find((attempt) => attempt.activityCount > 0) || activityAttempts.find((attempt) => attempt.ok) || activityAttempts[0];

    const previewActivities = await enrichPreviewActivities(
      activities.activities.slice(0, previewLimit),
      jsonHeaders,
    );
    const firstActivity = previewActivities[0] || null;

    return jsonResponse({
      ok: profile.ok || activityAttempts.some((attempt) => attempt.activityCount > 0),
      athleteId,
      profile: {
        ok: profile.ok,
        status: profile.status,
        name: profile.body?.name || profile.body?.athlete_name || "",
      },
      activities: {
        ok: activities.ok,
        status: activities.status,
        endpoint: safeEndpointLabel(activities.endpoint),
        count: activities.activityCount,
        first: firstActivity ? summarizeActivity(firstActivity) : null,
        preview: previewActivities.map(summarizeImportPreview),
      },
      attempts: activityAttempts.map((attempt) => ({
        endpoint: safeEndpointLabel(attempt.endpoint),
        ok: attempt.ok,
        status: attempt.status,
        count: attempt.activityCount,
        message: attempt.message,
      })),
      errors: [profile, ...activityAttempts]
        .filter((result) => !result.ok)
        .map((result) => ({
          endpoint: safeEndpointLabel(result.endpoint),
          status: result.status,
          message: result.message,
        })),
    }, 200, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intervals.icu test mislukt.";
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

async function safeIntervalsFetch(endpoint: string, headers: Record<string, string>, responseType: "json" | "csv") {
  try {
    const response = await fetch(endpoint, { headers });
    const text = await response.text();
    const body = responseType === "csv" ? null : text ? parseJson(text) : null;
    const activities = responseType === "csv" ? parseCsvActivities(text) : normalizeActivityBody(body);
    return {
      endpoint,
      ok: response.ok,
      status: response.status,
      body,
      activities,
      activityCount: activities.length,
      message: response.ok ? "" : readableError(body, text),
    };
  } catch (error) {
    return {
      endpoint,
      ok: false,
      status: 0,
      body: null,
      activities: [],
      activityCount: 0,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

function parseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 300) };
  }
}

function readableError(body: unknown, fallback: string) {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    return String(record.error || record.message || record.raw || fallback || "Intervals.icu error");
  }
  return fallback || "Intervals.icu error";
}

function normalizeActivityBody(body: unknown) {
  if (Array.isArray(body)) return body as Record<string, unknown>[];
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    for (const key of ["activities", "items", "data", "results"]) {
      if (Array.isArray(record[key])) return record[key] as Record<string, unknown>[];
    }
  }
  return [];
}

function parseCsvActivities(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1, 21).map((line) => {
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

function safeEndpointLabel(endpoint: string) {
  return endpoint.replace(INTERVALS_BASE_URL, "").replace(/\?.*$/, "");
}

function summarizeActivity(activity: Record<string, unknown>) {
  return {
    id: activity.id || activity.Id || activity.icu_activity_id || "",
    name: activity.name || activity.Name || activity.file_name || "",
    startDate: activity.start_date_local || activity.start_date || activity.date || activity.Date || "",
    type: activity.type || activity.Type || activity.sport || activity.category || "",
    load: activity.training_load || activity["Training Load"] || activity.load || activity.icu_training_load || null,
    duration: activity.moving_time || activity.elapsed_time || activity.duration || activity.Duration || null,
  };
}

function summarizeImportPreview(activity: Record<string, unknown>) {
  const detail = (activity.__detail || null) as Record<string, unknown> | null;
  const intervalPreview = intervalPreviewRows(detail || activity);
  const intervals = intervalPreview.rows;
  const title = firstValue(activity, ["name", "Name", "file_name", "Filename"]) || "Intervals.icu activiteit";
  const startDate = firstValue(activity, ["start_date_local", "start_date", "date", "Date"]);
  const sport = mapSport(firstValue(activity, ["type", "Type", "sport", "Sport", "category", "Category"]));
  const durationSeconds = numberFromActivity(activity, ["moving_time", "elapsed_time", "duration", "Duration", "Moving Time"]);
  const distanceMeters = numberFromActivity(activity, ["distance", "Distance", "total_distance"]);
  const load = numberFromActivity(activity, ["training_load", "Training Load", "load", "icu_training_load"]);
  const avgHr = numberFromActivity(activity, ["average_heartrate", "Avg HR", "avg_hr", "average_hr"]);
  const avgWatts = numberFromActivity(activity, ["weighted_average_watts", "Average Watts", "avg_watts", "power"]);

  return {
    source: "intervals_icu",
    externalId: firstValue(activity, ["id", "Id", "icu_activity_id"]) || "",
    title,
    date: normalizeDate(startDate),
    sport,
    workoutType: inferWorkoutType(title, sport),
    durationMin: durationSeconds ? Math.round(durationSeconds / 60) : 0,
    distanceKm: distanceMeters ? Number((distanceMeters / 1000).toFixed(2)) : 0,
    avgHr: avgHr ? Math.round(avgHr) : 0,
    avgWatts: avgWatts ? Math.round(avgWatts) : 0,
    intervalsLoad: load ? Math.round(load) : 0,
    intervalCount: intervals.length,
    intervalSource: intervalPreview.source,
    intervalArrayOptions: intervalPreview.options,
    intervals,
    detailStatus: activity.__detailStatus || "",
    detailError: activity.__detailError || "",
    detailKeys: detail ? Object.keys(detail).slice(0, 16) : [],
    rawKeys: Object.keys(activity).slice(0, 12),
    rawSample: rawSample(activity),
  };
}

async function enrichPreviewActivities(activities: Record<string, unknown>[], headers: Record<string, string>) {
  return Promise.all(activities.map(async (activity) => {
    const id = firstValue(activity, ["id", "Id", "icu_activity_id"]);
    if (!id) {
      return {
        ...activity,
        __detailStatus: "geen activiteit-id",
      };
    }

    const detail = await safeIntervalsFetch(`${INTERVALS_BASE_URL}/activity/${id}?intervals=true`, headers, "json");
    if (!detail.ok) {
      return {
        ...activity,
        __detailStatus: `detail ${detail.status || "mislukt"}`,
        __detailError: detail.message,
      };
    }

    return {
      ...activity,
      __detail: detail.body || {},
      __detailStatus: "detail opgehaald",
    };
  }));
}

function intervalPreviewRows(source: Record<string, unknown>) {
  const candidates = [
    ["device_laps", source.device_laps],
    ["activity_laps", source.activity_laps],
    ["garmin_laps", source.garmin_laps],
    ["laps", source.laps],
    ["manual_laps", source.manual_laps],
    ["lap_data", source.lap_data],
    ["recording_laps", source.recording_laps],
    ["work_intervals", source.work_intervals],
    ["intervals", source.intervals],
    ["icu_intervals", source.icu_intervals],
  ];
  const options = candidates
    .filter(([, value]) => Array.isArray(value))
    .map(([name, value]) => ({ name, count: (value as unknown[]).length }));
  const [sourceName, sourceRows] = candidates.find(([, value]) => Array.isArray(value) && (value as unknown[]).length) || ["", []];
  const intervals = sourceRows as Record<string, unknown>[];
  if (!intervals?.length) return { source: "", options, rows: [] };

  const rows = intervals.slice(0, 30).map((interval, index) => {
    const durationSeconds = numberFromActivity(interval, ["moving_time", "elapsed_time", "duration", "secs", "seconds", "Time"]);
    const distanceMeters = numberFromActivity(interval, ["distance", "Distance", "total_distance"]);
    const paceSecPerKm = secondsPerKm(durationSeconds, distanceMeters);
    const avgHr = numberFromActivity(interval, ["average_heartrate", "avg_hr", "Average HR", "Avg HR", "hr"]);
    const maxHr = numberFromActivity(interval, ["max_heartrate", "max_hr", "Max HR"]);
    const watts = numberFromActivity(interval, ["weighted_average_watts", "avg_watts", "Average Watts", "power", "watts"]);
    return {
      index: index + 1,
      name: firstValue(interval, ["name", "Name", "label", "Label"]) || `Lap ${index + 1}`,
      type: firstValue(interval, ["type", "Type", "category", "Category"]) || "",
      durationSeconds,
      distanceMeters,
      pacePerKm: paceSecPerKm ? paceText(paceSecPerKm) : "",
      avgHr: avgHr ? Math.round(avgHr) : 0,
      maxHr: maxHr ? Math.round(maxHr) : 0,
      watts: watts ? Math.round(watts) : 0,
      rawKeys: Object.keys(interval).slice(0, 10),
    };
  });
  return { source: String(sourceName), options, rows };
}

function secondsPerKm(durationSeconds: number, distanceMeters: number) {
  if (!durationSeconds || !distanceMeters) return 0;
  return durationSeconds / (distanceMeters / 1000);
}

function paceText(seconds: number) {
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}/km`;
}

function rawSample(activity: Record<string, unknown>) {
  const preferredKeys = [
    "id",
    "Id",
    "name",
    "Name",
    "date",
    "Date",
    "type",
    "Type",
    "sport",
    "Sport",
    "duration",
    "Duration",
    "distance",
    "Distance",
    "training_load",
    "Training Load",
    "average_heartrate",
    "Avg HR",
    "weighted_average_watts",
    "Average Watts",
  ];
  const entries = preferredKeys
    .filter((key) => activity[key] !== undefined && activity[key] !== null && String(activity[key]).trim() !== "")
    .map((key) => [key, activity[key]]);
  const fallbackEntries = Object.entries(activity)
    .filter(([key]) => !preferredKeys.includes(key))
    .slice(0, Math.max(0, 12 - entries.length));
  return Object.fromEntries([...entries, ...fallbackEntries].slice(0, 12));
}

function firstValue(activity: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = activity[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function numberFromActivity(activity: Record<string, unknown>, keys: string[]) {
  const raw = firstValue(activity, keys).replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
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
