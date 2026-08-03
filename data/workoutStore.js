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
    if (!Array.isArray(parsed)) return normalizeWorkouts(seedWorkouts);
    const cleaned = cleanWorkouts(normalizeWorkouts(parsed));
    if (cleaned.length !== parsed.length) saveWorkouts(cleaned);
    return cleaned;
  } catch {
    return normalizeWorkouts(seedWorkouts);
  }
}

export function saveWorkouts(workouts) {
  const cleaned = cleanWorkouts(normalizeWorkouts(workouts));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    return;
  } catch (error) {
    if (!isStorageQuotaError(error)) throw error;
  }

  const compact = compactWorkoutsForStorage(cleaned);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    return;
  } catch (error) {
    if (!isStorageQuotaError(error)) throw error;
  }

  const recentCompact = compact.slice(0, 250);
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentCompact));
    localStorage.setItem(`${STORAGE_KEY}-truncated`, new Date().toISOString());
  } catch (error) {
    if (!isStorageQuotaError(error)) throw error;
    console.warn("TrainIQ lokale cache is te groot; Supabase blijft de bron van waarheid.", error);
  }
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
    intervals: mergeWorkoutIntervals(existing.intervals, incoming.intervals),
    segments: mergeWorkoutSegments(existing.segments, incoming.segments),
    notes: incoming.notes || existing.notes,
    rawPayload: {
      ...(existing.rawPayload || {}),
      ...(incoming.rawPayload || {}),
      intervals: mergeWorkoutIntervals(existing.rawPayload?.intervals, incoming.rawPayload?.intervals),
    },
  };
}

function mergeWorkoutIntervals(existing = [], incoming = []) {
  return mergeIndexedItems(existing, incoming, intervalMergeKey, (item, index) => ({
    ...item,
    intervalIndex: index + 1,
  }));
}

function mergeWorkoutSegments(existing = [], incoming = []) {
  return mergeIndexedItems(existing, incoming, segmentMergeKey, (item, index) => ({
    ...item,
    segmentIndex: index + 1,
  }));
}

function mergeIndexedItems(existing = [], incoming = [], keyForItem, reindexItem) {
  const items = [...(Array.isArray(existing) ? existing : []), ...(Array.isArray(incoming) ? incoming : [])];
  const merged = [];
  const byKey = new Map();

  items.forEach((item) => {
    if (!item) return;
    const key = keyForItem(item);
    if (key && byKey.has(key)) {
      const existingItem = byKey.get(key);
      Object.assign(existingItem, {
        ...existingItem,
        ...item,
        rawPayload: {
          ...(existingItem.rawPayload || {}),
          ...(item.rawPayload || {}),
        },
      });
      return;
    }

    const copy = {
      ...item,
      rawPayload: item.rawPayload || item.raw_payload || {},
    };
    merged.push(copy);
    if (key) byKey.set(key, copy);
  });

  return merged
    .sort((a, b) => {
      const startA = Number(a.startOffsetSeconds ?? a.start_offset_seconds ?? 0);
      const startB = Number(b.startOffsetSeconds ?? b.start_offset_seconds ?? 0);
      if (startA || startB) return startA - startB;
      return Number(a.intervalIndex ?? a.segmentIndex ?? a.lap_index ?? 0) - Number(b.intervalIndex ?? b.segmentIndex ?? b.lap_index ?? 0);
    })
    .map(reindexItem);
}

function intervalMergeKey(interval = {}) {
  const startOffset = Number(interval.startOffsetSeconds ?? interval.start_offset_seconds ?? 0);
  const duration = Number(interval.durationSeconds ?? interval.duration_seconds ?? 0);
  const distance = Number(interval.distanceMeters ?? interval.distance_meters ?? 0);
  const exerciseType = interval.exerciseType || interval.exercise_type || "";
  const role = interval.lapRole || interval.lap_role || "";
  const index = Number(interval.intervalIndex ?? interval.interval_index ?? interval.lapIndex ?? interval.lap_index ?? 0);

  if (startOffset) {
    return ["offset", startOffset, duration, distance, exerciseType, role].join(":");
  }

  if (duration || distance || exerciseType || role || index) {
    return ["index", index, duration, distance, exerciseType, role].join(":");
  }

  return "";
}

function segmentMergeKey(segment = {}) {
  const startOffset = Number(segment.startOffsetSeconds ?? segment.start_offset_seconds ?? 0);
  const duration = Number(segment.durationSeconds ?? segment.duration_seconds ?? 0);
  const distance = Number(segment.distanceMeters ?? segment.distance_meters ?? 0);
  const name = String(segment.name || "").toLowerCase();
  const type = segment.segmentType || segment.segment_type || "";
  if (startOffset || duration || distance || name || type) {
    return [startOffset, duration, distance, name, type].join(":");
  }
  return "";
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

export function cleanWorkouts(workouts) {
  return dedupeSimilarWorkouts(mergeWorkouts([], workouts.filter((workout) => !isBrokenPlaceholderWorkout(workout))));
}

function dedupeSimilarWorkouts(workouts) {
  const merged = new Map();
  workouts.forEach((workout) => {
    const key = duplicateWorkoutKey(workout);
    if (!key) {
      merged.set(workout.id, workout);
      return;
    }

    const existing = merged.get(key);
    if (existing && similarWorkoutMetrics(existing, workout)) {
      merged.set(key, mergeDuplicateWorkout(existing, workout));
      return;
    }

    const uniqueKey = existing ? `${key}:${workout.id}` : key;
    merged.set(uniqueKey, workout);
  });

  return sortWorkoutsByDate([...merged.values()]);
}

function duplicateWorkoutKey(workout) {
  const title = String(workout.title || "").trim();
  if (!title || generatedImportTitle(title, workout) || title === "Training") return "";
  if (!workout.date) return "";

  const normalizedTitle = title
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9:./ -]+/g, "")
    .trim();
  if (!normalizedTitle || normalizedTitle.length < 6) return "";

  return `${workout.date}:${normalizedTitle}`;
}

function similarWorkoutMetrics(a, b) {
  const durationA = Number(a.durationMin || 0);
  const durationB = Number(b.durationMin || 0);
  const distanceA = Number(a.distanceKm || 0);
  const distanceB = Number(b.distanceKm || 0);

  if (closeStartTimes(a, b, 120)) return true;
  if (durationA && durationB && Math.abs(durationA - durationB) > 2) return false;
  if (distanceA && distanceB && Math.abs(distanceA - distanceB) > 0.15) return false;
  if (!durationA && !durationB && !distanceA && !distanceB) return false;
  return true;
}

function closeStartTimes(a, b, toleranceSeconds) {
  const secondsA = startTimeSeconds(a.startTime);
  const secondsB = startTimeSeconds(b.startTime);
  if (secondsA === null || secondsB === null) return false;
  return Math.abs(secondsA - secondsB) <= toleranceSeconds;
}

function startTimeSeconds(value) {
  const parts = String(value || "").split(":").map(Number);
  if (parts.length < 2 || parts.some((part) => !Number.isFinite(part))) return null;
  return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
}

function mergeDuplicateWorkout(existing, incoming) {
  const primary = preferredDuplicateWorkout(existing, incoming);
  const secondary = primary === existing ? incoming : existing;
  const merged = mergeWorkoutRecord(secondary, primary);
  return {
    ...merged,
    rawPayload: {
      ...(secondary.rawPayload || {}),
      ...(primary.rawPayload || {}),
      duplicateExternalIds: uniqueValues([
        ...(secondary.rawPayload?.duplicateExternalIds || []),
        ...(primary.rawPayload?.duplicateExternalIds || []),
        secondary.externalId,
        primary.externalId,
      ]),
      duplicateSourceIds: uniqueValues([
        ...(secondary.rawPayload?.duplicateSourceIds || []),
        ...(primary.rawPayload?.duplicateSourceIds || []),
        secondary.id,
        primary.id,
      ]),
    },
  };
}

function preferredDuplicateWorkout(a, b) {
  const scoreA = duplicateQualityScore(a);
  const scoreB = duplicateQualityScore(b);
  if (scoreA !== scoreB) return scoreA > scoreB ? a : b;
  return new Date(a.updatedAt || a.createdAt || 0) >= new Date(b.updatedAt || b.createdAt || 0) ? a : b;
}

function duplicateQualityScore(workout) {
  const type = String(workout.workoutType || "").toLowerCase();
  const rawPayload = workout.rawPayload || {};
  const reviewStatus = rawPayload.reviewContext?.reviewStatus || "";
  return [
    reviewStatus === "confirmed" ? 100 : 0,
    reviewStatus === "context_added" ? 80 : 0,
    type === "hyrox" || type.includes("hyrox") ? 30 : 0,
    type && type !== "run" && type !== "general" ? 20 : 0,
    Array.isArray(workout.segments) && workout.segments.length ? 12 : 0,
    Array.isArray(workout.intervals) && workout.intervals.length ? 10 : 0,
    rawPayload.importType === "strava_api" ? 8 : 0,
    Number(workout.durationMin || 0) > 0 ? 4 : 0,
    Number(workout.distanceKm || 0) > 0 ? 3 : 0,
    Number(workout.avgHr || 0) > 0 ? 2 : 0,
  ].reduce((sum, value) => sum + value, 0);
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function isStorageQuotaError(error) {
  return error?.name === "QuotaExceededError"
    || error?.name === "NS_ERROR_DOM_QUOTA_REACHED"
    || error?.code === 22
    || error?.code === 1014;
}

function compactWorkoutsForStorage(workouts) {
  return workouts.map((workout) => ({
    ...workout,
    rawPayload: compactWorkoutRawPayload(workout.rawPayload),
    intervals: compactIntervalsForStorage(workout.intervals),
    segments: compactSegmentsForStorage(workout.segments),
  }));
}

function compactWorkoutRawPayload(rawPayload = {}) {
  return compactObject({
    importType: rawPayload.importType,
    fileName: rawPayload.fileName,
    intervalSource: rawPayload.intervalSource,
    detailStatus: rawPayload.detailStatus,
    fitLinkedFromFile: rawPayload.fitLinkedFromFile,
    lapRepairNotFound: rawPayload.lapRepairNotFound,
    reviewContext: rawPayload.reviewContext,
    duplicateExternalIds: rawPayload.duplicateExternalIds,
    duplicateSourceIds: rawPayload.duplicateSourceIds,
    strava_activity: compactStravaActivity(rawPayload.strava_activity),
    stravaActivity: compactStravaActivity(rawPayload.stravaActivity),
    activity: compactStravaActivity(rawPayload.activity),
  });
}

function compactStravaActivity(activity = {}) {
  if (!activity || typeof activity !== "object") return undefined;
  return compactObject({
    id: activity.id,
    name: activity.name,
    type: activity.type,
    sport_type: activity.sport_type,
    start_date: activity.start_date,
    start_date_local: activity.start_date_local,
  });
}

function compactIntervalsForStorage(intervals = []) {
  if (!Array.isArray(intervals)) return [];
  return intervals.map((interval) => ({
    ...interval,
    rawPayload: compactIntervalRawPayload(interval.rawPayload),
  }));
}

function compactIntervalRawPayload(rawPayload = {}) {
  return compactObject({
    manualPace500: rawPayload.manualPace500,
    manualWatts: rawPayload.manualWatts,
    estimatedDistanceFromWatts: rawPayload.estimatedDistanceFromWatts,
    estimatedWattsFromPace500: rawPayload.estimatedWattsFromPace500,
    metricUnavailable: rawPayload.metricUnavailable,
    metricUnavailableReason: rawPayload.metricUnavailableReason,
    hrFilledFromWorkoutAverage: rawPayload.hrFilledFromWorkoutAverage,
    maxHrFilledFromWorkout: rawPayload.maxHrFilledFromWorkout,
    avg_watts: rawPayload.avg_watts,
    avgWatts: rawPayload.avgWatts,
    lapId: rawPayload.lapId,
    stravaLapId: rawPayload.stravaLapId,
    fitLinkedFromFile: rawPayload.fitLinkedFromFile,
    fitLapSource: rawPayload.fitLapSource,
    fitLap: compactObject({
      avgPower: rawPayload.fitLap?.avgPower,
      avgHeartRate: rawPayload.fitLap?.avgHeartRate,
      maxHeartRate: rawPayload.fitLap?.maxHeartRate,
    }),
  });
}

function compactSegmentsForStorage(segments = []) {
  if (!Array.isArray(segments)) return [];
  return segments.map((segment) => ({
    ...segment,
    rawPayload: compactObject(segment.rawPayload || {}),
  }));
}

function compactObject(object = {}) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => (
      value !== undefined
      && value !== null
      && value !== ""
      && !(Array.isArray(value) && value.length === 0)
      && !(typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0)
    )),
  );
}

function isBrokenPlaceholderWorkout(workout) {
  return workout.source === "google_sheets"
    && !workout.externalId
    && workout.title === "Training"
    && workout.workoutType === "general"
    && !workout.durationMin
    && !workout.distanceKm
    && !workout.avgHr
    && !workout.maxHr
    && !workout.notes;
}
