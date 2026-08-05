import { numberOrZero, sportLabels } from "./data/workoutModel.js";
import {
  createManualWorkout,
  cleanWorkouts,
  importCsvWorkouts,
  importWorkouts,
  loadWorkouts as loadStoredWorkouts,
  resetWorkouts,
  saveWorkouts,
  sortWorkoutsByDate,
} from "./data/workoutStore.js";

const TEMP_DISABLE_AUTH_GATE = false;

const state = {
  workouts: loadStoredWorkouts(),
  selectedWorkoutId: null,
  sportFilter: "all",
  calendarOpen: false,
  calendarMonth: null,
  selectedDate: null,
  supabaseUser: null,
  passwordRecoveryMode: false,
  analysisTab: "z2",
  z2AnalysisTab: "run",
  z2PeriodMonths: 3,
  workoutDetailReturnView: "analysis",
  z2WorkoutPages: {
    run: 1,
    bike: 1,
    ski_erg: 1,
    row_erg: 1,
  },
  z2VisibleMetrics: {
    metric: true,
    hr: true,
    load: true,
    volume: true,
  },
};

const SUPABASE_CONFIG_KEY = "trainiq-supabase-config";
const DEFAULT_SUPABASE_CONFIG = {
  url: "https://izbhhunefxtygkswwsjl.supabase.co",
  anonKey: "sb_publishable_cGWG00suCMcvDO_pdMxuZg_1KG65wYP",
};
const STRAVA_HISTORY_PAGE_KEY = "trainiq-strava-history-page";
const STRAVA_RECENT_SYNC_SIZE = 15;
const STRAVA_HISTORY_BATCH_SIZE = 8;
const STRAVA_BIKE_LAP_DISTANCE_METERS = 5000;
const Z2_WORKOUTS_PER_PAGE = 20;
const Z2_RUN_BASELINE = {
  paceFastSecPerKm: 327,
  paceSlowSecPerKm: 355,
  hrMin: 132,
  hrMax: 150,
  label: "Z2 testzone: 5:55-5:27/km bij 132-150 bpm",
};
const RUN_TEST_PROFILE = {
  date: "2026-06-25",
  vo2Max: 50,
  restHr: 53,
  threshold1: { hr: 150, speedKmh: 11.0 },
  threshold2: { hr: 168, speedKmh: 13.3 },
  maxAerobic: { hr: 181, speedKmh: 16.0 },
  zones: {
    z1: { hrMin: 92, hrMax: 131, paceSlow: "09:59", paceFast: "05:56" },
    z2: { hrMin: 132, hrMax: 150, paceSlow: "05:55", paceFast: "05:27", rpe: "3-4" },
    z3: { hrMin: 151, hrMax: 168, paceSlow: "05:26", paceFast: "04:31" },
    z4: { hrMin: 169, hrMax: 174, paceSlow: "04:30", paceFast: "04:00" },
    z5: { hrMin: 175, hrMax: 181, paceSlow: "03:59", paceFast: "03:45" },
  },
};
const Z2_PERIODS = [1, 3, 6, 9, 12];
const ANALYSIS_TABS = [
  { key: "z2", label: "Z2" },
  { key: "threshold", label: "Threshold" },
  { key: "vo2", label: "VO2 max" },
  { key: "hyrox", label: "HYROX" },
  { key: "load", label: "Load" },
];
const Z2_TABS = [
  { key: "run", label: "Z2 Run" },
  { key: "bike", label: "BikeErg" },
  { key: "ski_erg", label: "SkiErg" },
  { key: "row_erg", label: "RowErg" },
];
const Z2_METRIC_TOGGLES = [
  { key: "metric", label: "Pace/snelheid" },
  { key: "hr", label: "Hartslag" },
  { key: "load", label: "Load" },
  { key: "volume", label: "Volume" },
];
const Z2_ANALYSIS_RULES = {
  ergDurationTargetsMin: [2, 3, 4, 5, 7.5, 10, 12.5, 15, 20, 25, 30],
  ergDurationStrongMarginPct: 0.1,
  ergDurationHardMarginPct: 0.2,
  runProgressPaceSec: 5,
  hrProgressBpm: 2,
  ergProgressPace500Sec: 2,
  bikeProgressWatts: 5,
  minWorkBlockSeconds: 60,
  maxSkiRowWorkBlockSeconds: 35 * 60,
  maxBikeWorkBlockSeconds: 120 * 60,
  skiRowPace500RangeSec: { min: 80, max: 240 },
  bikeWattsRange: { min: 30, max: 500 },
};

const els = {
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  seedButton: document.querySelector("#seedButton"),
  totalWorkouts: document.querySelector("#totalWorkouts"),
  totalWorkoutsMeta: document.querySelector("#totalWorkoutsMeta"),
  totalDuration: document.querySelector("#totalDuration"),
  avgLoad: document.querySelector("#avgLoad"),
  focusSport: document.querySelector("#focusSport"),
  focusSportMeta: document.querySelector("#focusSportMeta"),
  latestTitle: document.querySelector("#latestTitle"),
  latestWorkout: document.querySelector("#latestWorkout"),
  sportDistribution: document.querySelector("#sportDistribution"),
  dashboardLoad: document.querySelector("#dashboardLoad"),
  workoutForm: document.querySelector("#workoutForm"),
  addIntervalButton: document.querySelector("#addIntervalButton"),
  intervalRows: document.querySelector("#intervalRows"),
  addSegmentButton: document.querySelector("#addSegmentButton"),
  segmentRows: document.querySelector("#segmentRows"),
  addStrengthButton: document.querySelector("#addStrengthButton"),
  strengthRows: document.querySelector("#strengthRows"),
  calendarToggle: document.querySelector("#calendarToggle"),
  calendarPopover: document.querySelector("#calendarPopover"),
  prevMonthButton: document.querySelector("#prevMonthButton"),
  nextMonthButton: document.querySelector("#nextMonthButton"),
  calendarMonthLabel: document.querySelector("#calendarMonthLabel"),
  calendarGrid: document.querySelector("#calendarGrid"),
  agendaTitle: document.querySelector("#agendaTitle"),
  agendaList: document.querySelector("#agendaList"),
  sportFilter: document.querySelector("#sportFilter"),
  workoutList: document.querySelector("#workoutList"),
  analysisWorkoutSelect: document.querySelector("#analysisWorkoutSelect"),
  analysisTabs: document.querySelector("#analysisTabs"),
  z2Analysis: document.querySelector("#z2Analysis"),
  intensityAnalysis: document.querySelector("#intensityAnalysis"),
  loadAnalysis: document.querySelector("#loadAnalysis"),
  analysisSummary: document.querySelector("#analysisSummary"),
  comparisonTable: document.querySelector("#comparisonTable"),
  intervalComparison: document.querySelector("#intervalComparison"),
  segmentAnalysis: document.querySelector("#segmentAnalysis"),
  workoutDetailBackButton: document.querySelector("#workoutDetailBackButton"),
  workoutDetailContent: document.querySelector("#workoutDetailContent"),
  qualitySummary: document.querySelector("#qualitySummary"),
  qualitySaveStatus: document.querySelector("#qualitySaveStatus"),
  z2ErgDataGaps: document.querySelector("#z2ErgDataGaps"),
  vo2DataCheck: document.querySelector("#vo2DataCheck"),
  thresholdDataCheck: document.querySelector("#thresholdDataCheck"),
  qualityBulkCategories: document.querySelector("#qualityBulkCategories"),
  qualityList: document.querySelector("#qualityList"),
  authScreen: document.querySelector("#authScreen"),
  authForm: document.querySelector("#authForm"),
  authEmailInput: document.querySelector("#authEmailInput"),
  authPasswordInput: document.querySelector("#authPasswordInput"),
  authSignUpButton: document.querySelector("#authSignUpButton"),
  authForgotPasswordButton: document.querySelector("#authForgotPasswordButton"),
  authFaceIdButton: document.querySelector("#authFaceIdButton"),
  authResetPanel: document.querySelector("#authResetPanel"),
  authNewPasswordInput: document.querySelector("#authNewPasswordInput"),
  authUpdatePasswordButton: document.querySelector("#authUpdatePasswordButton"),
  authSupabaseUrlInput: document.querySelector("#authSupabaseUrlInput"),
  authSupabaseAnonKeyInput: document.querySelector("#authSupabaseAnonKeyInput"),
  authSaveConfigButton: document.querySelector("#authSaveConfigButton"),
  authStatus: document.querySelector("#authStatus"),
  appShell: document.querySelector(".app-shell"),
  csvInput: document.querySelector("#csvInput"),
  importStatus: document.querySelector("#importStatus"),
  supabaseConfigForm: document.querySelector("#supabaseConfigForm"),
  supabaseUrlInput: document.querySelector("#supabaseUrlInput"),
  supabaseAnonKeyInput: document.querySelector("#supabaseAnonKeyInput"),
  supabaseEmailInput: document.querySelector("#supabaseEmailInput"),
  supabaseLoginButton: document.querySelector("#supabaseLoginButton"),
  supabaseSignOutButton: document.querySelector("#supabaseSignOutButton"),
  supabaseUploadButton: document.querySelector("#supabaseUploadButton"),
  supabaseDownloadButton: document.querySelector("#supabaseDownloadButton"),
  supabaseStatus: document.querySelector("#supabaseStatus"),
  supabaseStatusBadge: document.querySelector("#supabaseStatusBadge"),
  stravaConnectButton: document.querySelector("#stravaConnectButton"),
  stravaRefreshButton: document.querySelector("#stravaRefreshButton"),
  stravaSyncNowButton: document.querySelector("#stravaSyncNowButton"),
  stravaSyncHistoryButton: document.querySelector("#stravaSyncHistoryButton"),
  dailySyncButton: document.querySelector("#dailySyncButton"),
  stravaStatus: document.querySelector("#stravaStatus"),
  stravaStatusBadge: document.querySelector("#stravaStatusBadge"),
  intervalsTestButton: document.querySelector("#intervalsTestButton"),
  intervalsPreviewButton: document.querySelector("#intervalsPreviewButton"),
  intervalsStatus: document.querySelector("#intervalsStatus"),
  intervalsStatusBadge: document.querySelector("#intervalsStatusBadge"),
};

const segmentTypeLabels = {
  run: "Run",
  ski_erg: "SkiErg",
  row_erg: "RowErg",
  sled_push: "Sled push",
  sled_pull: "Sled pull",
  burpee_broad_jump: "Burpee broad jumps",
  sandbag_lunge: "Sandbag lunges",
  farmer_carry: "Farmer's carry",
  wall_ball: "Wall balls",
  strength: "Kracht",
  rest: "Rust",
  transition: "Transitie",
  other: "Overig",
};

const intervalExerciseTypeLabels = {
  "": "Niet gelabeld",
  run: "Run",
  ski_erg: "SkiErg",
  row_erg: "RowErg",
  bike_erg: "BikeErg",
  strength: "Kracht",
  rest: "Rust",
  transition: "Transitie",
  other: "Overig",
};

const lapRoleLabels = {
  work: "Werkblok",
  recovery: "Herstel",
  warmup: "Warming-up",
  cooldown: "Cooling-down",
  transition: "Wissel",
  unknown: "Onbekend",
};

const effortGoalLabels = {
  "": "Geen doel",
  z1: "Z1",
  z2: "Z2",
  z3: "Z3",
  threshold: "Threshold",
  vo2max: "VO2max",
  all_out: "All-out",
  race_pace: "Race pace",
  recovery: "Herstel",
  technique: "Techniek",
  other: "Overig",
};

const reviewGoalLabels = {
  "": "Nog kiezen",
  z1: "Z1",
  z2: "Z2",
  z2_under_overs: "Z2 under/overs",
  z3: "Z3",
  threshold: "Threshold",
  vo2max: "VO2max",
  all_out: "All-out",
  race_pace: "Race pace",
  hyrox: "HYROX",
  strength: "Kracht",
  technique: "Techniek",
  recovery: "Herstel",
  other: "Overig",
};

const reviewStatusLabels = {
  needs_review: "Nog reviewen",
  later: "Later bekijken",
  context_added: "Context toegevoegd",
  ai_suggested: "AI voorstel klaar",
  confirmed: "Bevestigd",
  excluded: "Uitgesloten van analyse",
};

const approvedBulkCategoryKeys = new Set([
  "hyrox_pre_race",
  "hyrox_race",
  "easy_bike_wallballs",
  "shakeout",
  "threshold_under_overs",
  "erg_intervals",
  "compromised_running",
  "bike_z2",
  "erg_z2",
  "vo2max",
  "threshold",
  "hyrox",
  "z2_general",
  "z2_under_overs",
  "strength",
  "run_hill_sprints",
  "run_endurance_progressive",
  "run_intervals",
  "run_general",
  "hiit_hyrox_strength",
  "return_to_run",
  "rehab",
  "other_sport_snowboard",
  "other_sport_hike",
  "other_sport_hockey",
]);

function sortedWorkouts(workouts = state.workouts) {
  return sortWorkoutsByDate(workouts);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("nl-NL", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}u ${rest}m` : `${hours}u`;
}

function paceForWorkout(workout) {
  if (workout.avgPace) return workout.avgPace;
  if (!workout.distanceKm || !workout.durationMin) return "-";
  const secondsPerKm = Math.round((workout.durationMin * 60) / workout.distanceKm);
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = String(secondsPerKm % 60).padStart(2, "0");
  return `${minutes}:${seconds}/km`;
}

function formatDistance(workout) {
  const distance = numberOrZero(workout.distanceKm);
  return distance ? `${distance.toFixed(2)} km` : "-";
}

function formatAvgHr(workouts) {
  const avgHr = average(workouts.map((workout) => validHr(workout.avgHr)));
  return avgHr ? `${Math.round(avgHr)} bpm` : "-";
}

function formatSeconds(seconds) {
  const totalSeconds = Math.round(numberOrZero(seconds));
  if (!totalSeconds) return "-";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const rest = String(totalSeconds % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

function secondsFromPaceText(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function paceTextFromSeconds(seconds) {
  const totalSeconds = Math.round(numberOrZero(seconds));
  if (!totalSeconds) return "";
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function averagePace500(workouts, field) {
  const values = workouts
    .map((workout) => secondsFromPaceText(workout.rawPayload?.reviewContext?.z2Metrics?.[field]))
    .filter(Boolean);
  return values.length ? `${paceTextFromSeconds(average(values))}/500m` : "-";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char]));
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function paceForInterval(interval) {
  if (interval.avgPace) return interval.avgPace;
  if (!interval.durationSeconds || !interval.distanceMeters) return "-";
  const secondsPerKm = Math.round(interval.durationSeconds / (interval.distanceMeters / 1000));
  return `${Math.floor(secondsPerKm / 60)}:${String(secondsPerKm % 60).padStart(2, "0")}/km`;
}

function pace500ForInterval(interval) {
  const rawPace = manualPace500Text(interval);
  if (rawPace) {
    const seconds = secondsFromPaceText(rawPace);
    return seconds ? paceTextFromSeconds(seconds) : rawPace;
  }
  if (!interval.durationSeconds || !interval.distanceMeters) return "";
  const secondsPer500 = Math.round(interval.durationSeconds / (interval.distanceMeters / 500));
  return paceTextFromSeconds(secondsPer500);
}

function distanceFromPace500(durationSeconds, pace500Text) {
  const secondsPer500 = secondsFromPaceText(pace500Text);
  if (!durationSeconds || !secondsPer500) return 0;
  return Math.round((durationSeconds / secondsPer500) * 500);
}

function manualPace500Text(interval) {
  return String(
    interval?.rawPayload?.manualPace500
    || interval?.rawPayload?.manual_pace_500
    || interval?.rawPayload?.pace500
    || "",
  ).trim();
}

function manualPace500Seconds(interval) {
  return secondsFromPaceText(manualPace500Text(interval));
}

function distanceFromErgWatts(durationSeconds, watts) {
  const power = numberOrZero(watts);
  if (!durationSeconds || !power) return 0;
  const secondsPer500 = 500 * Math.cbrt(2.8 / power);
  return Math.round((durationSeconds / secondsPer500) * 500);
}

function wattsForInterval(interval) {
  const actualWatts = numberOrZero(
    interval.rawPayload?.avg_watts
    || interval.rawPayload?.avgWatts
    || interval.rawPayload?.fitLap?.avgPower
    || interval.avgWatts,
  );
  if (actualWatts) return actualWatts;
  if (interval.rawPayload?.estimatedWattsFromPace500) return 0;
  return numberOrZero(interval.rawPayload?.manualWatts);
}

function validHr(value) {
  const hr = numberOrZero(value);
  return hr >= 35 && hr <= 230 ? hr : 0;
}

function paceForSegment(segment) {
  if (segment.avgPace) return segment.avgPace;
  if (!segment.durationSeconds || !segment.distanceMeters) return "-";
  const secondsPerKm = Math.round(segment.durationSeconds / (segment.distanceMeters / 1000));
  return `${Math.floor(secondsPerKm / 60)}:${String(secondsPerKm % 60).padStart(2, "0")}/km`;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function renderDashboard() {
  const workouts = state.workouts;
  const totalDuration = workouts.reduce((sum, workout) => sum + numberOrZero(workout.durationMin), 0);
  const totalLoad = workouts.reduce((sum, workout) => sum + numberOrZero(workout.load), 0);
  const latest = sortedWorkouts()[0];
  const sportCounts = workouts.reduce((counts, workout) => {
    counts[workout.sport] = (counts[workout.sport] || 0) + 1;
    return counts;
  }, {});
  const focusSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0];

  els.totalWorkouts.textContent = workouts.length;
  els.totalWorkoutsMeta.textContent = workouts.length === 1 ? "1 sessie opgeslagen" : `${workouts.length} sessies opgeslagen`;
  els.totalDuration.textContent = formatDuration(totalDuration);
  els.avgLoad.textContent = workouts.length ? Math.round(totalLoad / workouts.length) : "0";
  els.focusSport.textContent = focusSport ? sportLabels[focusSport[0]] : "-";
  els.focusSportMeta.textContent = focusSport ? `${focusSport[1]} sessies` : "Meest getrainde sport";

  if (!latest) {
    els.latestTitle.textContent = "Nog geen workout";
    els.latestWorkout.innerHTML = `<p class="empty-state">Voeg je eerste training toe om het dashboard te vullen.</p>`;
  } else {
    els.latestTitle.textContent = latest.title;
    const latestRows = [
      ["Datum", formatDate(latest.date), true],
      ["Starttijd", latest.startTime],
      ["Sport", sportLabels[latest.sport], true],
      ["Duur", latest.durationMin ? formatDuration(numberOrZero(latest.durationMin)) : ""],
      ["Afstand", numberOrZero(latest.distanceKm) ? formatDistance(latest) : ""],
      ["Tempo", paceForWorkout(latest)],
      ["Gem. HR", validHr(latest.avgHr)],
      ["Max HR", validHr(latest.maxHr)],
      ["Load", latest.load],
      ["Hoogtemeters", latest.elevationGain ? `${latest.elevationGain} m` : ""],
      ["Intervaltype", latest.intervalFamily],
      ["Repduur", latest.repDurationSeconds ? formatSeconds(latest.repDurationSeconds) : ""],
      ["Kwaliteitsvolume", latest.qualityVolumeMeters ? `${latest.qualityVolumeMeters} m` : ""],
      ["Kwaliteitstijd", latest.qualityDurationSeconds ? formatSeconds(latest.qualityDurationSeconds) : ""],
      ["HYROX onderdelen", latest.segments?.length ? latest.segments.length : ""],
      ["Notitie", latest.notes],
    ];
    els.latestWorkout.innerHTML = `
      <details class="inline-collapsible" open>
        <summary>
          <span>Details laatste training</span>
          <b>${formatDuration(numberOrZero(latest.durationMin))}</b>
        </summary>
        <div class="detail-list">
          ${latestRows.map(([label, value, required]) => optionalDetailRow(label, value, required)).join("")}
        </div>
      </details>
    `;
  }

  renderSportDistribution(workouts, totalDuration);
  renderDashboardLoadSummary(workouts);
}

function renderDashboardLoadSummary(workouts) {
  if (!els.dashboardLoad) return;
  const summary = trainingLoadSummary(sortedWorkouts(workouts).slice().reverse());
  if (!summary.latest) {
    els.dashboardLoad.innerHTML = `<p class="empty-state">Nog geen load-data.</p>`;
    return;
  }

  els.dashboardLoad.innerHTML = `
    <div class="dashboard-load-grid">
      <div><span>Fitness</span><strong>${Math.round(summary.ctl)}</strong><small>42d</small></div>
      <div><span>Fatigue</span><strong>${Math.round(summary.atl)}</strong><small>7d</small></div>
      <div><span>Vorm</span><strong>${formatSignedNumber(summary.tsb)}</strong><small>CTL - ATL</small></div>
    </div>
    ${renderDashboardLoadChart(summary.points)}
  `;
}

function renderDashboardLoadChart(points) {
  const recent = points.slice(-90);
  if (recent.length < 2) return `<p class="empty-state">Nog niet genoeg loadpunten voor een grafiek.</p>`;
  const width = 520;
  const height = 160;
  const pad = 18;
  const maxValue = Math.max(10, ...recent.flatMap((point) => [point.ctl, point.atl]));
  const xFor = (index) => pad + (index / Math.max(1, recent.length - 1)) * (width - pad * 2);
  const yFor = (value) => height - pad - (value / maxValue) * (height - pad * 2);
  const pathFor = (field) => recent.map((point, index) => `${index ? "L" : "M"}${xFor(index).toFixed(1)},${yFor(point[field]).toFixed(1)}`).join(" ");
  const latest = recent[recent.length - 1];

  return `
    <svg class="dashboard-load-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Fitness fatigue vorm grafiek">
      <path class="dashboard-load-area" d="${pathFor("ctl")} L${width - pad},${height - pad} L${pad},${height - pad} Z"></path>
      <path class="dashboard-load-fitness" d="${pathFor("ctl")}"></path>
      <path class="dashboard-load-fatigue" d="${pathFor("atl")}"></path>
      <line class="dashboard-load-zero" x1="${pad}" x2="${width - pad}" y1="${yFor(Math.max(0, latest.ctl)).toFixed(1)}" y2="${yFor(Math.max(0, latest.ctl)).toFixed(1)}"></line>
    </svg>
  `;
}

function renderSportDistribution(workouts, totalDuration) {
  if (!workouts.length) {
    els.sportDistribution.innerHTML = `<p class="empty-state">Nog geen verdeling beschikbaar.</p>`;
    return;
  }

  const bySport = workouts.reduce((acc, workout) => {
    acc[workout.sport] = (acc[workout.sport] || 0) + numberOrZero(workout.durationMin);
    return acc;
  }, {});

  els.sportDistribution.innerHTML = Object.entries(sportLabels)
    .map(([sport, label]) => {
      const minutes = bySport[sport] || 0;
      const width = totalDuration ? Math.round((minutes / totalDuration) * 100) : 0;
      return `
        <div class="bar-row">
          <div>
            <strong>${label}</strong>
            <div class="bar-track" aria-hidden="true"><span class="bar-fill" style="width: ${width}%"></span></div>
          </div>
          <span>${formatDuration(minutes)}</span>
        </div>
      `;
    })
    .join("");
}

function renderWorkoutList() {
  const filtered = state.sportFilter === "all"
    ? sortedWorkouts()
    : sortedWorkouts().filter((workout) => matchesWorkoutSportFilter(workout, state.sportFilter));

  if (!filtered.length) {
    els.workoutList.innerHTML = `<p class="empty-state">Geen workouts voor dit filter.</p>`;
    return;
  }

  els.workoutList.innerHTML = filtered
    .map((workout) => `
      <button class="workout-item ${workout.id === state.selectedWorkoutId ? "is-selected" : ""}" type="button" data-workout-id="${workout.id}">
        <strong>${workout.title}</strong>
        <span>${formatDate(workout.date)} · ${sportLabels[workout.sport]} · ${workout.workoutType}</span>
        <span>${formatDuration(numberOrZero(workout.durationMin))} · ${paceForWorkout(workout)} · HR ${validHr(workout.avgHr) || "-"} / ${validHr(workout.maxHr) || "-"} · load ${workout.load || "-"}${workout.intervalFamily ? ` · ${workout.repCount}x ${workout.intervalFamily}` : ""}</span>
      </button>
    `)
    .join("");
}

function matchesWorkoutSportFilter(workout, filter) {
  if (filter === "hyrox") return isTrueHyroxWorkout(workout);
  return workout.sport === filter;
}

function renderCalendar() {
  els.calendarPopover.hidden = !state.calendarOpen;

  if (!state.calendarOpen) return;

  const monthDate = state.calendarMonth || new Date();
  const selectedDate = state.selectedDate || toDateKey(new Date());
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(monthStart);
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  gridStart.setDate(monthStart.getDate() - mondayOffset);
  const workoutDates = new Set(state.workouts.map((workout) => workout.date));

  els.calendarMonthLabel.textContent = formatMonth(monthDate);
  els.calendarGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = toDateKey(date);
    const classes = [
      "calendar-day",
      date.getMonth() !== monthDate.getMonth() ? "is-muted" : "",
      dateKey === selectedDate ? "is-selected" : "",
      workoutDates.has(dateKey) ? "has-workout" : "",
    ].filter(Boolean).join(" ");

    return `<button class="${classes}" type="button" data-date="${dateKey}">${date.getDate()}</button>`;
  }).join("");

  renderAgenda();
}

function renderAgenda() {
  const selectedDate = state.selectedDate || toDateKey(new Date());
  const dayWorkouts = sortedWorkouts(state.workouts.filter((workout) => workout.date === selectedDate)).reverse();

  els.agendaTitle.textContent = formatDate(selectedDate);
  els.agendaList.innerHTML = dayWorkouts.length
    ? dayWorkouts.map((workout) => `
      <div class="agenda-item">
        <strong>${workout.title}</strong>
        <span>${sportLabels[workout.sport]} · ${workout.workoutType} · ${formatDuration(numberOrZero(workout.durationMin))}</span>
      </div>
    `).join("")
    : `<p class="empty-state">Geen trainingen op deze datum.</p>`;
}

function renderAnalysisOptions() {
  const workouts = sortedWorkouts();
  state.selectedWorkoutId = state.selectedWorkoutId || workouts[0]?.id || null;

  els.analysisWorkoutSelect.innerHTML = workouts.length
    ? workouts.map((workout) => `<option value="${workout.id}">${formatDate(workout.date)} - ${workout.title}</option>`).join("")
    : `<option value="">Geen workouts</option>`;

  if (state.selectedWorkoutId) {
    els.analysisWorkoutSelect.value = state.selectedWorkoutId;
  }
}

function renderAnalysis() {
  const selected = state.workouts.find((workout) => workout.id === state.selectedWorkoutId) || sortedWorkouts()[0];
  renderAnalysisTabs();
  setAnalysisPanelVisibility();
  renderZ2Analysis();
  renderIntensityAnalysis();
  renderLoadAnalysis();

  if (!selected) {
    els.z2Analysis.innerHTML = `<p class="empty-state">Voeg Z2-workouts toe om deze analyse te vullen.</p>`;
    if (els.intensityAnalysis) els.intensityAnalysis.innerHTML = `<p class="empty-state">Voeg VO2max- of threshold-workouts toe om deze analyse te vullen.</p>`;
    if (els.loadAnalysis) els.loadAnalysis.innerHTML = `<p class="empty-state">Voeg workouts met duur toe om load op te bouwen.</p>`;
    clearLegacyAnalysisPanels();
    return;
  }

  clearLegacyAnalysisPanels();
}

function renderAnalysisTabs() {
  if (!els.analysisTabs) return;
  els.analysisTabs.innerHTML = ANALYSIS_TABS.map((tab) => `
    <button type="button" data-analysis-tab="${tab.key}" class="${state.analysisTab === tab.key ? "is-active" : ""}">
      ${escapeHtml(tab.label)}
    </button>
  `).join("");
}

function setAnalysisPanelVisibility() {
  const z2Panel = els.z2Analysis?.closest(".panel");
  const intensityPanel = els.intensityAnalysis?.closest(".panel");
  const loadPanel = els.loadAnalysis?.closest(".panel");
  if (z2Panel) z2Panel.hidden = state.analysisTab !== "z2";
  if (intensityPanel) intensityPanel.hidden = !["vo2", "threshold", "hyrox"].includes(state.analysisTab);
  if (loadPanel) loadPanel.hidden = state.analysisTab !== "load";
}

function clearLegacyAnalysisPanels() {
  if (els.analysisSummary) els.analysisSummary.innerHTML = "";
  if (els.comparisonTable) els.comparisonTable.innerHTML = "";
  if (els.intervalComparison) els.intervalComparison.innerHTML = "";
  if (els.segmentAnalysis) els.segmentAnalysis.innerHTML = "";
}

function renderIntensityAnalysis() {
  if (!els.intensityAnalysis) return;

  if (state.analysisTab === "hyrox") {
    els.intensityAnalysis.innerHTML = renderHyroxAnalysisPlaceholder();
    return;
  }
  if (state.analysisTab === "vo2") {
    els.intensityAnalysis.innerHTML = renderIntensityFamilyDetail("vo2", "VO2max", "Werkblokken vergelijken op pace, repkwaliteit en verval. HR is optioneel.");
    return;
  }
  if (state.analysisTab === "threshold") {
    els.intensityAnalysis.innerHTML = renderIntensityFamilyDetail("threshold", "Threshold", "Drempelblokken vergelijken op pace-stabiliteit, werktijd en verval.");
    return;
  }

  els.intensityAnalysis.innerHTML = `
    ${renderIntensityFamilyDetail("vo2", "VO2max", "Werkblokken vergelijken op pace, repkwaliteit en verval. HR is optioneel.")}
    ${renderIntensityFamilyDetail("threshold", "Threshold", "Drempelblokken vergelijken op pace-stabiliteit, werktijd en verval.")}
  `;
}

function renderHyroxAnalysisPlaceholder() {
  const hyroxWorkouts = sortedWorkouts().filter(isTrueHyroxWorkout);
  return `
    <article class="z2-erg-analysis-panel">
      <div class="z2-analysis-header">
        <div>
          <span>HYROX analyse</span>
          <strong>${hyroxWorkouts.length} workout(s)</strong>
          <small>Volgende model: compromised running, stations, races en simulaties los vergelijken.</small>
        </div>
        <div>
          <span>Status</span>
          <strong>Voorbereid</strong>
          <small>Nu bewust nog geen valse conclusies.</small>
        </div>
      </div>
      ${hyroxWorkouts.length ? `
        <details class="z2-collapsible-list">
          <summary>
            <span>
              <strong>HYROX workouts</strong>
              <small>Echte HYROX-sessies, races en simulaties.</small>
            </span>
            <b>${hyroxWorkouts.length} sessie(s)</b>
          </summary>
          <div class="z2-lap-list">
            ${hyroxWorkouts.slice(0, 20).map((workout) => `
              <button class="z2-row z2-erg-lap-row" type="button" data-workout-id="${escapeHtml(workout.id)}">
                <strong>${formatDate(workout.date)}</strong>
                <span>${escapeHtml(workout.title || "Training")}</span>
                <span>${formatDuration(numberOrZero(workout.durationMin))}</span>
                <span>${(workout.segments || []).length || "-"} station(s)</span>
                <span>HR ${validHr(workout.avgHr) || "-"} / ${validHr(workout.maxHr) || "-"}</span>
              </button>
            `).join("")}
          </div>
        </details>
      ` : `<p class="empty-state">Nog geen echte HYROX-workouts gevonden in dit filter.</p>`}
    </article>
  `;
}

function renderLoadAnalysis() {
  if (!els.loadAnalysis) return;
  const summary = trainingLoadSummary(sortedWorkouts().slice().reverse());

  if (!summary.latest) {
    els.loadAnalysis.innerHTML = `<p class="empty-state">Nog geen load-data. Workouts met duur vullen dit automatisch.</p>`;
    return;
  }

  els.loadAnalysis.innerHTML = `
    <section class="z2-quality-panel ${summary.tsb >= 5 ? "is-good" : summary.tsb <= -15 ? "is-warning" : ""}">
      <div>
        <span>TrainIQ load score</span>
        <strong>${loadStatusTitle(summary)}</strong>
        <small>Gebaseerd op duur x intensiteitsfactor. CTL/ATL/TSB zijn signalen, geen diagnose.</small>
      </div>
      <div class="z2-quality-grid">
        <div><span>Fitness CTL</span><strong>${Math.round(summary.ctl)}</strong><small>42d EWMA</small></div>
        <div><span>Fatigue ATL</span><strong>${Math.round(summary.atl)}</strong><small>7d EWMA</small></div>
        <div><span>Vorm TSB</span><strong>${formatSignedNumber(summary.tsb)}</strong><small>CTL - ATL</small></div>
        <div><span>7d load</span><strong>${Math.round(summary.load7d)}</strong><small>28d ${Math.round(summary.load28d)}</small></div>
      </div>
    </section>
    <article class="z2-erg-analysis-panel">
      <div class="z2-analysis-header">
        <div>
          <span>Recente load</span>
          <strong>${summary.recent.length} sessies</strong>
          <small>Controleer vooral uitschieters en lage betrouwbaarheid.</small>
        </div>
        <div>
          <span>Ramp</span>
          <strong>${formatSignedNumber(summary.ramp7d)}</strong>
          <small>CTL-verandering laatste 7 dagen</small>
        </div>
      </div>
      <div class="z2-lap-list">
        ${summary.recent.map((item) => `
          <button class="z2-row z2-erg-lap-row" type="button" data-workout-id="${escapeHtml(item.workout.id)}">
            <strong>${formatDate(item.workout.date)}</strong>
            <span>${escapeHtml(item.workout.title || "Training")}</span>
            <span>${analysisFamilyLabel(item.family)}</span>
            <span>${formatDuration(Math.round(numberOrZero(item.workout.durationMin)))}</span>
            <span>${item.load} load · ${item.confidence}</span>
          </button>
        `).join("")}
      </div>
    </article>
  `;
}

function renderIntensityFamilyDetail(kind, title, subtitle) {
  const sessions = intensitySessions(kind);
  const incomplete = intensityIncompleteSessions(kind);
  const usable = sessions.filter((session) => session.metrics.avgPace);
  const latest = sessions[0] || null;
  const best = kind === "vo2" ? bestVo2Session(sessions) : null;
  const previous = latest ? comparableIntensitySessions(latest, sessions).filter((session) => session.workout.id !== latest.workout.id) : [];
  const avgPace = average(usable.map((session) => session.metrics.avgPace));
  const avgDecay = average(usable.map((session) => kind === "vo2" ? Math.abs(session.metrics.decaySeconds || 0) : session.metrics.variationPct || 0));
  const totalWorkSeconds = sessions.reduce((sum, session) => sum + numberOrZero(session.metrics.durationSeconds), 0);
  const totalDistanceMeters = sessions.reduce((sum, session) => sum + numberOrZero(session.metrics.distanceMeters), 0);

  return `
    <article class="z2-erg-analysis-panel intensity-family-panel">
      <div class="z2-analysis-header">
        <div>
          <span>${escapeHtml(title)}</span>
          <strong>${sessions.length} sessie(s)</strong>
          <small>${escapeHtml(subtitle)}${incomplete.length ? ` · ${incomplete.length} naar datacheck` : ""}</small>
        </div>
        <div>
          <span>Gem. werkpace</span>
          <strong>${avgPace ? formatPacePerKm(avgPace) : "-"}</strong>
          <small>${formatDuration(Math.round(totalWorkSeconds / 60))} werk · ${(totalDistanceMeters / 1000).toFixed(1)} km</small>
        </div>
      </div>
      ${sessions.length ? `
        <div class="z2-quality-grid analysis-model-grid">
          <div><span>Goede blokken</span><strong>${sessions.reduce((sum, session) => sum + numberOrZero(kind === "vo2" ? session.metrics.goodReps : session.metrics.goodBlocks), 0)}</strong><small>Met pace + tijd</small></div>
          <div><span>${kind === "vo2" ? "Gem. verval" : "Gem. variatie"}</span><strong>${kind === "vo2" ? `${Math.round(avgDecay)} sec/km` : `${avgDecay.toFixed(1)}%`}</strong><small>${kind === "vo2" ? "Eerste vs laatste rep" : "Pace-stabiliteit"}</small></div>
          <div><span>Laatste sessie</span><strong>${latest ? formatDate(latest.workout.date) : "-"}</strong><small>${latest ? escapeHtml(latest.workout.title || "Training") : "-"}</small></div>
          <div><span>${kind === "vo2" ? "Beste sessie" : "Vergelijkbaar"}</span><strong>${kind === "vo2" && best ? formatPacePerKm(best.metrics.avgPace) : previous.length}</strong><small>${kind === "vo2" && best ? `${formatDate(best.workout.date)} · ${best.metrics.goodReps}/${best.metrics.reps} reps` : "Zelfde profiel/familie"}</small></div>
        </div>
        ${kind === "vo2" ? renderVo2QualitySummary(sessions, latest, best) : ""}
        ${latest ? renderIntensityRepComparison(kind, latest, previous) : ""}
        ${renderIntensitySessionList(kind, sessions)}
      ` : `<p class="empty-state">Nog geen bruikbare ${escapeHtml(title)} data.</p>`}
    </article>
  `;
}

function bestVo2Session(sessions) {
  return sessions
    .filter((session) => session.metrics.avgPace && session.metrics.goodReps)
    .sort((a, b) => {
      const repDelta = numberOrZero(b.metrics.goodReps) - numberOrZero(a.metrics.goodReps);
      if (repDelta) return repDelta;
      return numberOrZero(a.metrics.avgPace) - numberOrZero(b.metrics.avgPace);
    })[0] || null;
}

function renderVo2QualitySummary(sessions, latest, best) {
  const allRows = sessions.flatMap((session) => session.metrics.rows || []);
  const paceValues = allRows.map((row) => numberOrZero(row.paceSecPerKm)).filter(Boolean);
  const fastest = paceValues.length ? Math.min(...paceValues) : 0;
  const slowest = paceValues.length ? Math.max(...paceValues) : 0;
  const latestVsBest = latest && best && latest.workout.id !== best.workout.id && latest.metrics.avgPace && best.metrics.avgPace
    ? latest.metrics.avgPace - best.metrics.avgPace
    : 0;

  return `
    <div class="vo2-quality-strip">
      <div><span>Snelste rep</span><strong>${fastest ? formatPacePerKm(fastest) : "-"}</strong><small>Alle VO2 werkblokken</small></div>
      <div><span>Langzaamste rep</span><strong>${slowest ? formatPacePerKm(slowest) : "-"}</strong><small>Controleer uitschieters</small></div>
      <div><span>Laatste vs beste</span><strong>${latestVsBest ? formatSignedPace(latestVsBest) : "-"}</strong><small>${best ? `Beste: ${formatDate(best.workout.date)}` : "Nog geen basis"}</small></div>
    </div>
  `;
}

function renderIntensityRepComparison(kind, latest, previous) {
  const rows = latest.metrics.rows || [];
  if (!rows.length) {
    return `<p class="empty-state">Geen werkblokken gevonden in de meest recente ${kind === "vo2" ? "VO2" : "threshold"} sessie.</p>`;
  }
  const unitLabel = intensityWorkoutIsRun(latest.workout) ? "Pace /km" : "Pace";

  return `
    <div class="intensity-block">
      <div class="z2-list-header">
        <strong>${kind === "vo2" ? "Rep-by-rep vergelijking" : "Blokvergelijking"}</strong>
        <span>${escapeHtml(latest.workout.title || "Training")} · ${formatDate(latest.workout.date)}</span>
      </div>
      <div class="intensity-rep-table">
        <div class="intensity-rep-row intensity-rep-head">
          <span>Blok</span>
          <span>Tijd</span>
          <span>Afstand</span>
          <span>${unitLabel}</span>
          <span>HR</span>
          <span>Vs vorige</span>
        </div>
        ${rows.map((row, index) => {
          const previousPace = average(previous.map((session) => session.metrics.rows?.[index]?.paceSecPerKm).filter(Boolean));
          return `
            <button class="intensity-rep-row" type="button" data-workout-id="${escapeHtml(latest.workout.id)}">
              <span><strong>${escapeHtml(row.name)}</strong><small>${row.status}</small></span>
              <span>${formatSeconds(row.durationSeconds)}</span>
              <span>${row.distanceMeters ? `${Math.round(row.distanceMeters)} m` : "-"}</span>
              <span>${row.paceSecPerKm ? formatPacePerKm(row.paceSecPerKm) : "-"}</span>
              <span>${row.avgHr ? `${row.avgHr} bpm` : "-"}</span>
              <span>${previousPace && row.paceSecPerKm ? formatSignedPace(row.paceSecPerKm - previousPace) : "Nieuwe referentie"}</span>
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderIntensitySessionList(kind, sessions) {
  return `
    <details class="z2-collapsible-list intensity-session-list">
      <summary>
        <span>
          <strong>Vergelijkbare ${kind === "vo2" ? "VO2" : "threshold"} workouts</strong>
          <small>${sessions.length} sessie(s), nieuwste eerst</small>
        </span>
        <b>Open lijst</b>
      </summary>
      <div class="z2-lap-list">
        ${sessions.map((session) => `
          <button class="z2-row z2-erg-lap-row" type="button" data-workout-id="${escapeHtml(session.workout.id)}">
            <strong>${formatDate(session.workout.date)}</strong>
            <span>${escapeHtml(session.workout.title || "Training")}</span>
            <span>${session.metrics.avgPace ? formatPacePerKm(session.metrics.avgPace) : "-"}</span>
            <span>${formatDuration(Math.round(numberOrZero(session.metrics.durationSeconds) / 60))}</span>
            <span>${kind === "vo2" ? `${session.metrics.goodReps}/${session.metrics.reps} reps` : `${session.metrics.variationPct ? `${session.metrics.variationPct.toFixed(1)}% variatie` : "stabiliteit -"}`}</span>
          </button>
        `).join("")}
      </div>
    </details>
  `;
}

function intensityWorkoutIsRun(workout) {
  return workout?.sport === "running" || /run|hardloop|loop|treadmill/i.test(`${workout?.title || ""} ${workout?.workoutType || ""}`);
}

function collectIntensityRows(kind) {
  return sortedWorkouts()
    .filter((workout) => kind === "vo2" ? Boolean(vo2ProfileForWorkout(workout)) : Boolean(thresholdProfileForWorkout(workout)))
    .flatMap((workout) => {
      const intervals = intensityWorkIntervals(workout, kind);
      if (intervals.length) {
        return intervals.map((interval) => ({
          workout,
          interval,
          durationSeconds: numberOrZero(interval.durationSeconds),
          distanceMeters: numberOrZero(interval.distanceMeters),
          paceSecPerKm: secondsPerKmForInterval(interval),
        }));
      }
      return [{
        workout,
        interval: null,
        durationSeconds: numberOrZero(workout.durationMin) * 60,
        distanceMeters: numberOrZero(workout.distanceKm) * 1000,
        paceSecPerKm: paceSecondsPerKm(workout),
      }];
    })
    .filter((row) => row.durationSeconds || row.distanceMeters || row.paceSecPerKm);
}

function intensitySessions(kind) {
  return sortedWorkouts()
    .filter((workout) => kind === "vo2" ? Boolean(vo2ProfileForWorkout(workout)) : Boolean(thresholdProfileForWorkout(workout)))
    .map((workout) => ({
      workout,
      kind,
      profileKey: intensityProfileKey(kind, workout),
      metrics: kind === "vo2" ? vo2SessionMetrics(workout) : thresholdSessionMetrics(workout),
    }))
    .filter((session) => intensitySessionIsUsable(session));
}

function intensityIncompleteSessions(kind) {
  return sortedWorkouts()
    .filter((workout) => kind === "vo2" ? Boolean(vo2ProfileForWorkout(workout)) : Boolean(thresholdProfileForWorkout(workout)))
    .map((workout) => ({
      workout,
      kind,
      profileKey: intensityProfileKey(kind, workout),
      metrics: kind === "vo2" ? vo2SessionMetrics(workout) : thresholdSessionMetrics(workout),
    }))
    .filter((session) => !intensitySessionIsUsable(session));
}

function intensitySessionIsUsable(session) {
  return Boolean(
    session.metrics.reps
    && session.metrics.avgPace
    && numberOrZero(session.metrics.durationSeconds)
  );
}

function comparableIntensitySessions(target, sessions) {
  return sessions.filter((session) => (
    session.kind === target.kind
    && session.profileKey === target.profileKey
  ));
}

function intensityProfileKey(kind, workout) {
  const profile = kind === "vo2" ? vo2ProfileForWorkout(workout) : thresholdProfileForWorkout(workout);
  return profile?.key || kind;
}

function isIntensityWorkInterval(interval, kind = null) {
  if (!interval || isTransitionInterval(interval)) return false;
  if (["warmup", "cooldown", "recovery", "transition"].includes(interval.lapRole || "work")) return false;
  if (!kind) return true;

  const goal = String(interval.effortGoal || "").toLowerCase();
  const pace = secondsPerKmForInterval(interval);
  if (kind === "vo2") {
    if (goal === "vo2max") return true;
    return pace >= 225 && pace <= 248;
  }
  if (kind === "threshold") {
    if (goal === "threshold") return true;
    return pace >= 250 && pace <= 285;
  }
  return true;
}

function analysisMetricsForWorkout(workout) {
  const family = workoutAnalysisFamily(workout);
  const load = estimatedTrainingLoad(workout, family);
  const quality = analysisQualityForWorkout(workout, family);
  return {
    family,
    familyLabel: analysisFamilyLabel(family),
    load,
    confidence: analysisConfidence(workout, family),
    quality,
    vo2: family === "vo2max" ? vo2SessionMetrics(workout) : null,
    threshold: family === "threshold" ? thresholdSessionMetrics(workout) : null,
  };
}

function workoutAnalysisSnapshot(workout) {
  const metrics = analysisMetricsForWorkout(workout);
  const sessionRpe = workoutSessionRpe(workout);
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    family: metrics.family,
    familyLabel: metrics.familyLabel,
    loadScore: metrics.load,
    intensityFactor: Number(workoutIntensityFactor(workout, metrics.family).toFixed(2)),
    sessionRpe,
    confidence: metrics.confidence,
    quality: metrics.quality,
    vo2: metrics.vo2 ? {
      reps: metrics.vo2.reps,
      durationSeconds: metrics.vo2.durationSeconds,
      distanceMeters: metrics.vo2.distanceMeters,
      avgPaceSecPerKm: Math.round(metrics.vo2.avgPace || 0),
      fastestPaceSecPerKm: Math.round(metrics.vo2.fastestPace || 0),
      slowestPaceSecPerKm: Math.round(metrics.vo2.slowestPace || 0),
      decaySeconds: Math.round(metrics.vo2.decaySeconds || 0),
      decayPct: Number((metrics.vo2.decayPct || 0).toFixed(1)),
      goodReps: metrics.vo2.goodReps,
    } : null,
    threshold: metrics.threshold ? {
      reps: metrics.threshold.reps,
      durationSeconds: metrics.threshold.durationSeconds,
      distanceMeters: metrics.threshold.distanceMeters,
      avgPaceSecPerKm: Math.round(metrics.threshold.avgPace || 0),
      paceSpreadSeconds: Math.round(metrics.threshold.paceSpread || 0),
      variationPct: Number((metrics.threshold.variationPct || 0).toFixed(1)),
      goodBlocks: metrics.threshold.goodBlocks,
    } : null,
  };
}

function analysisQualityForWorkout(workout, family = workoutAnalysisFamily(workout)) {
  const reasons = [];
  const intervals = workout.intervals || [];
  const workIntervals = family === "vo2max"
    ? intensityWorkIntervals(workout, "vo2")
    : family === "threshold"
      ? intensityWorkIntervals(workout, "threshold")
      : intensityWorkIntervals(workout);
  const hasIntentionalUnknown = intervals.some((interval) => interval.rawPayload?.metricUnavailable);

  if (family === "general") {
    return {
      status: "excluded",
      label: "Uitgesloten",
      reasons: ["Geen herkenbaar analyseprofiel. Deze telt alleen mee in algemene load als duur aanwezig is."],
      missing: [],
      blocks: [],
    };
  }

  if (!numberOrZero(workout.durationMin)) reasons.push("Duur ontbreekt.");
  if (!intervals.length && ["vo2max", "threshold"].includes(family)) reasons.push("Geen laps/blokken opgeslagen.");

  const missing = [];
  if (["z2", "threshold", "vo2max"].includes(family)) {
    const missingPaceDistance = workIntervals.filter((interval) => !secondsPerKmForInterval(interval) && !numberOrZero(interval.distanceMeters));
    if (missingPaceDistance.length) missing.push(`${missingPaceDistance.length} werkblok(ken) missen pace/afstand.`);
  }
  if (family === "z2" && !validHr(workout.avgHr) && !workIntervals.some((interval) => validHr(interval.avgHr))) {
    missing.push("Hartslag ontbreekt voor Z2-efficiency.");
  }
  if (["vo2max", "threshold"].includes(family) && !workIntervals.length) {
    missing.push("Nog geen werkblokken gelabeld.");
  }

  const blocks = workIntervals.map((interval) => {
    const missingBlock = [];
    if (!numberOrZero(interval.durationSeconds)) missingBlock.push("tijd");
    if (!secondsPerKmForInterval(interval) && !numberOrZero(interval.distanceMeters)) missingBlock.push("pace/afstand");
    if (!validHr(interval.avgHr) && family === "z2") missingBlock.push("HR");
    return {
      intervalIndex: interval.intervalIndex,
      name: interval.name || `Lap ${interval.intervalIndex || "-"}`,
      status: interval.rawPayload?.metricUnavailable
        ? "bewust_onbekend"
        : missingBlock.length ? "mist_data" : "bruikbaar",
      missing: missingBlock,
    };
  });

  const status = reasons.length || missing.length
    ? hasIntentionalUnknown && !reasons.length ? "bewust_onbekend" : "mist_data"
    : "bruikbaar";

  return {
    status,
    label: {
      bruikbaar: "Bruikbaar voor analyse",
      mist_data: "Mist data",
      bewust_onbekend: "Bewust onbekend",
      excluded: "Uitgesloten",
    }[status],
    reasons,
    missing,
    blocks,
  };
}

function workoutAnalysisFamily(workout) {
  const override = String(workout.rawPayload?.reviewContext?.overrideAnalysisFamily || "").toLowerCase();
  if (override && override !== "excluded") return override;
  if (override === "excluded" || isWorkoutExcludedFromAnalysis(workout)) return "general";

  const title = String(workout.title || "").toLowerCase();
  const type = String(workout.workoutType || "").toLowerCase();
  const goal = String(workout.rawPayload?.reviewContext?.trainingGoal || "").toLowerCase();
  const haystack = `${title} ${type} ${goal}`;

  if (vo2ProfileForWorkout(workout)) return "vo2max";
  if (thresholdProfileForWorkout(workout)) return "threshold";
  if (isZ2Workout(workout)) return "z2";
  if (isTrueHyroxWorkout(workout)) return "hyrox";
  if (/kracht|strength|upper|lower|fullbody|full body|legday|rehab/.test(haystack) || workout.sport === "strength") return "strength";
  if (/recovery|herstel|shakeout|easy/.test(haystack)) return "recovery";
  return "general";
}

function isTrueHyroxWorkout(workout) {
  const override = String(workout.rawPayload?.reviewContext?.overrideAnalysisFamily || "").toLowerCase();
  if (override) return override === "hyrox";

  const title = String(workout.title || "").toLowerCase();
  const type = String(workout.workoutType || "").toLowerCase();
  const goal = String(workout.rawPayload?.reviewContext?.trainingGoal || "").toLowerCase();
  const category = String(workout.rawPayload?.reviewContext?.bulkCategory || "").toLowerCase();
  const structure = String(workout.rawPayload?.reviewContext?.structureText || "").toLowerCase();
  const haystack = `${title} ${type} ${goal} ${category} ${structure}`;
  const explicitHyrox = /(hyrox|compromised|compromissed|station|wedstrijd|race|sim)/.test(haystack);
  const ergOnly = /(erg_z2|easy erg|easy ergs|ski\s*->\s*row\s*->\s*bike|skierg|rowerg|bikeerg)/.test(haystack)
    && !/(run|hardloop|sled|burpee|lunge|wall ?ball|farmer|sandbag|station|hyrox|compromised|compromissed|wedstrijd|race|sim)/.test(haystack);
  const hasHyroxSegment = (workout.segments || []).some((segment) => {
    const typeText = String(segment.segmentType || "").toLowerCase();
    return /(ski|row|sled|burpee|lunge|wall|farmer|sandbag|run)/.test(typeText);
  });

  return Boolean(explicitHyrox && !ergOnly) || Boolean(hasHyroxSegment && explicitHyrox);
}

function analysisFamilyLabel(family) {
  return {
    z2: "Z2 basis",
    vo2max: "VO2max",
    threshold: "Threshold",
    hyrox: "HYROX",
    strength: "Kracht",
    recovery: "Herstel",
    general: "Algemeen",
  }[family] || "Algemeen";
}

function estimatedTrainingLoad(workout, family = workoutAnalysisFamily(workout)) {
  const durationMin = numberOrZero(workout.durationMin);
  if (!durationMin) return 0;
  const factor = workoutIntensityFactor(workout, family);
  return Math.round((durationMin / 60) * factor * factor * 100);
}

function workoutIntensityFactor(workout, family = workoutAnalysisFamily(workout)) {
  const sessionRpe = workoutSessionRpe(workout);
  if (sessionRpe && ["strength", "hyrox"].includes(family)) {
    return Math.min(1, Math.max(0.45, 0.35 + (sessionRpe * 0.065)));
  }

  const avgHr = validHr(workout.avgHr);
  const maxHr = validHr(workout.maxHr);
  const hrProxy = avgHr && maxHr ? Math.min(1.05, Math.max(0.45, avgHr / maxHr)) : 0;
  const familyFactor = {
    recovery: 0.45,
    z2: 0.62,
    strength: 0.65,
    general: 0.7,
    hyrox: 0.88,
    threshold: 0.9,
    vo2max: 0.95,
  }[family] || 0.7;

  return hrProxy ? Math.max(familyFactor * 0.9, Math.min(1, (familyFactor + hrProxy) / 2)) : familyFactor;
}

function workoutSessionRpe(workout) {
  const contextRpe = numberOrZero(workout.rawPayload?.reviewContext?.sessionRpe);
  if (contextRpe) return Math.min(10, Math.max(1, contextRpe));
  const segmentRpe = average((workout.segments || []).map((segment) => numberOrZero(segment.rpe)));
  return segmentRpe ? Math.min(10, Math.max(1, segmentRpe)) : 0;
}

function analysisConfidence(workout, family = workoutAnalysisFamily(workout)) {
  const hasDuration = Boolean(numberOrZero(workout.durationMin));
  const hasHr = Boolean(validHr(workout.avgHr));
  const hasPace = Boolean(paceSecondsPerKm(workout) || (workout.intervals || []).some((interval) => secondsPerKmForInterval(interval)));
  const hasIntervals = Boolean((workout.intervals || []).length);
  const knownFamily = family !== "general";

  if (hasDuration && knownFamily && (hasHr || hasPace) && (family === "z2" || hasIntervals || family === "strength")) return "hoog";
  if (hasDuration && knownFamily) return "middel";
  if (hasDuration) return "laag";
  return "onvoldoende";
}

function trainingLoadSummary(workouts) {
  const sorted = workouts
    .filter((workout) => numberOrZero(workout.durationMin))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestDate = latestWorkoutDate(sorted) || new Date();
  const startDate = new Date(latestDate);
  startDate.setDate(startDate.getDate() - 119);
  const dailyLoad = new Map();

  sorted.forEach((workout) => {
    const key = workout.date;
    dailyLoad.set(key, (dailyLoad.get(key) || 0) + estimatedTrainingLoad(workout));
  });

  const points = [];
  let ctl = 0;
  let atl = 0;
  for (const date = new Date(startDate); date <= latestDate; date.setDate(date.getDate() + 1)) {
    const key = toDateKey(date);
    const load = dailyLoad.get(key) || 0;
    ctl += (load - ctl) / 42;
    atl += (load - atl) / 7;
    points.push({ date: key, load, ctl, atl, tsb: ctl - atl });
  }

  const latest = points[points.length - 1] || null;
  const loadSince = (days) => {
    const cutoff = new Date(latestDate);
    cutoff.setDate(cutoff.getDate() - (days - 1));
    return sorted
      .filter((workout) => new Date(workout.date) >= cutoff)
      .reduce((sum, workout) => sum + estimatedTrainingLoad(workout), 0);
  };
  const weekAgo = points[Math.max(0, points.length - 8)] || latest;
  const recent = sorted
    .slice(-10)
    .reverse()
    .map((workout) => {
      const metrics = analysisMetricsForWorkout(workout);
      return { workout, ...metrics };
    });

  return {
    latest,
    points,
    ctl: latest?.ctl || 0,
    atl: latest?.atl || 0,
    tsb: latest?.tsb || 0,
    load7d: loadSince(7),
    load28d: loadSince(28),
    ramp7d: latest && weekAgo ? latest.ctl - weekAgo.ctl : 0,
    recent,
  };
}

function loadStatusTitle(summary) {
  if (summary.tsb <= -20) return "Veel vermoeidheid";
  if (summary.tsb <= -8) return "Trainingsblok actief";
  if (summary.tsb >= 8) return "Fris / taper";
  return "In balans";
}

function vo2SessionMetrics(workout) {
  const intervals = intensityWorkIntervals(workout, "vo2");
  const rows = intensityIntervalMetricRows(workout, "vo2");
  const paceValues = intervals.map((interval) => secondsPerKmForInterval(interval)).filter(Boolean);
  const distanceMeters = intervals.reduce((sum, interval) => sum + numberOrZero(interval.distanceMeters), 0);
  const durationSeconds = intervals.reduce((sum, interval) => sum + numberOrZero(interval.durationSeconds), 0);
  const firstPace = paceValues[0] || 0;
  const lastPace = paceValues[paceValues.length - 1] || 0;
  const decaySeconds = firstPace && lastPace ? lastPace - firstPace : 0;
  const decayPct = firstPace && decaySeconds ? (decaySeconds / firstPace) * 100 : 0;

  return {
    reps: intervals.length,
    durationSeconds,
    distanceMeters,
    avgPace: average(paceValues),
    fastestPace: paceValues.length ? Math.min(...paceValues) : 0,
    slowestPace: paceValues.length ? Math.max(...paceValues) : 0,
    decaySeconds,
    decayPct,
    goodReps: intervals.filter((interval) => secondsPerKmForInterval(interval) && numberOrZero(interval.durationSeconds)).length,
    rows,
  };
}

function thresholdSessionMetrics(workout) {
  const intervals = intensityWorkIntervals(workout, "threshold");
  const rows = intensityIntervalMetricRows(workout, "threshold");
  const paceValues = intervals.map((interval) => secondsPerKmForInterval(interval)).filter(Boolean);
  const distanceMeters = intervals.reduce((sum, interval) => sum + numberOrZero(interval.distanceMeters), 0);
  const durationSeconds = intervals.reduce((sum, interval) => sum + numberOrZero(interval.durationSeconds), 0);
  const avgPace = average(paceValues);
  const paceSpread = paceValues.length ? Math.max(...paceValues) - Math.min(...paceValues) : 0;
  const variationPct = avgPace ? (standardDeviation(paceValues) / avgPace) * 100 : 0;

  return {
    reps: intervals.length,
    durationSeconds,
    distanceMeters,
    avgPace,
    paceSpread,
    variationPct,
    goodBlocks: intervals.filter((interval) => secondsPerKmForInterval(interval) && numberOrZero(interval.durationSeconds)).length,
    rows,
  };
}

function intensityWorkIntervals(workout, kind = null) {
  return (workout.intervals || []).filter((interval) => isIntensityWorkInterval(interval, kind));
}

function intensityIntervalMetricRows(workout, kind = null) {
  return intensityWorkIntervals(workout, kind).map((interval) => {
    const paceSecPerKm = secondsPerKmForInterval(interval);
    const durationSeconds = numberOrZero(interval.durationSeconds);
    const distanceMeters = numberOrZero(interval.distanceMeters);
    const missing = [
      !durationSeconds ? "tijd" : "",
      !paceSecPerKm && !distanceMeters ? "pace/afstand" : "",
    ].filter(Boolean);

    return {
      intervalIndex: interval.intervalIndex,
      name: interval.name || `Lap ${interval.intervalIndex || "-"}`,
      durationSeconds,
      distanceMeters,
      paceSecPerKm,
      avgHr: validHr(interval.avgHr),
      maxHr: validHr(interval.maxHr),
      status: interval.rawPayload?.metricUnavailable
        ? "Bewust onbekend"
        : missing.length ? `Mist ${missing.join(", ")}` : "Bruikbaar",
    };
  });
}

function standardDeviation(values) {
  const usable = values.filter((value) => Number.isFinite(value) && value > 0);
  if (usable.length < 2) return 0;
  const mean = average(usable);
  const variance = average(usable.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function renderLegacyAnalysis(selected) {
  const similar = sortedWorkouts()
    .filter((workout) => workout.sport === selected.sport && workout.workoutType.toLowerCase() === selected.workoutType.toLowerCase())
    .slice(0, 8);
  const previous = similar.filter((workout) => workout.id !== selected.id);
  const avgHrDelta = previous.length
    ? Math.round(validHr(selected.avgHr) - average(previous.map((workout) => validHr(workout.avgHr))))
    : null;
  const loadDelta = previous.length
    ? Math.round(numberOrZero(selected.load) - average(previous.map((workout) => numberOrZero(workout.load))))
    : null;

  els.analysisSummary.innerHTML = `
    <div class="summary-card">
      <strong>${selected.title}</strong>
      <span>${formatDate(selected.date)} · ${sportLabels[selected.sport]} · ${selected.workoutType}</span>
    </div>
    <div class="summary-card">
      <strong>${previous.length ? `${previous.length} eerdere sessie(s)` : "Nog geen vergelijkingsgroep"}</strong>
      <span>Zelfde sport en workouttype. De preciezere match-score gebruiken we nu alleen in Z2.</span>
    </div>
    <div class="summary-card">
      <strong>${avgHrDelta === null ? "-" : `${avgHrDelta > 0 ? "+" : ""}${avgHrDelta} bpm`}</strong>
      <span>Verschil in gemiddelde hartslag versus eerdere vergelijkbare trainingen.</span>
    </div>
    <div class="summary-card">
      <strong>${loadDelta === null ? "-" : `${loadDelta > 0 ? "+" : ""}${loadDelta} load`}</strong>
      <span>Verschil in trainingsbelasting versus eerdere vergelijkbare trainingen.</span>
    </div>
  `;

  els.comparisonTable.innerHTML = similar
    .map((workout, index) => `
      <div class="table-row">
        <strong>${formatDate(workout.date)}</strong>
        <span>${workout.title}</span>
        <span>${paceForWorkout(workout)}</span>
        <span>HR ${validHr(workout.avgHr) || "-"} / ${validHr(workout.maxHr) || "-"}</span>
        <span>${index === 0 ? "Geselecteerd" : `Load ${workout.load || "-"}`}</span>
      </div>
    `)
    .join("");

  renderIntervalComparison(selected, previous);
  renderSegmentAnalysis(selected, previous);
}

function renderZ2Analysis() {
  if (!els.z2Analysis) return;

  const groups = getZ2Groups();
  const selectedGroup = groups.find((group) => group.key === state.z2AnalysisTab) || groups[0];
  state.z2AnalysisTab = selectedGroup.key;

  els.z2Analysis.innerHTML = `
    <div class="z2-controls" aria-label="Z2 analyse filters">
      <div class="segmented-control" role="tablist" aria-label="Z2 categorie">
        ${Z2_TABS.map((tab) => `
          <button type="button" data-z2-tab="${tab.key}" class="${tab.key === selectedGroup.key ? "is-active" : ""}">
            ${tab.label}
          </button>
        `).join("")}
      </div>
      <div class="segmented-control" aria-label="Periode">
        ${Z2_PERIODS.map((months) => `
          <button type="button" data-z2-period="${months}" class="${months === state.z2PeriodMonths ? "is-active" : ""}">
            ${months === 1 ? "1 maand" : `${months} maanden`}
          </button>
        `).join("")}
      </div>
      <div class="z2-metric-toggles" aria-label="Grafiek informatie">
        ${Z2_METRIC_TOGGLES.map((toggle) => `
          <label>
            <input type="checkbox" data-z2-metric-toggle="${toggle.key}" ${state.z2VisibleMetrics[toggle.key] ? "checked" : ""} />
            <span>${toggle.label}</span>
          </label>
        `).join("")}
      </div>
    </div>
    ${renderZ2Group(selectedGroup)}
  `;
}

function getZ2Groups() {
  const z2Workouts = sortedWorkouts().filter((workout) => isZ2Workout(workout) && !isExcludedFromZ2Analysis(workout));
  return [
    {
      key: "run",
      label: "Z2 hardlopen",
      workouts: z2Workouts.filter((workout) => z2Subtype(workout) === "run"),
    },
    {
      key: "bike",
      label: "Z2 BikeErg",
      workouts: z2Workouts.filter((workout) => z2Subtype(workout) === "bike" || hasErgComponent(workout, "bike_erg")),
    },
    {
      key: "ski_erg",
      label: "Z2 SkiErg",
      workouts: z2Workouts.filter((workout) => hasErgComponent(workout, "ski_erg")),
    },
    {
      key: "row_erg",
      label: "Z2 RowErg",
      workouts: z2Workouts.filter((workout) => hasErgComponent(workout, "row_erg")),
    },
  ];
}

function isExcludedFromZ2Analysis(workout) {
  const title = String(workout.title || "").toLowerCase().trim();
  const type = String(workout.workoutType || "").toLowerCase();
  const startTime = String(workout.startTime || "");
  const context = workout.rawPayload?.reviewContext || {};

  return Boolean(
    context.excludeFromAnalysis
    || (
      workout.date === "2025-05-17"
      && title === "zone 2 erg"
      && (type === "erg_z2" || type === "z2" || String(context.bulkCategory || "").toLowerCase() === "erg_z2")
      && (!startTime || startTime.startsWith("11:50"))
    )
  );
}

function isZ2Workout(workout) {
  const override = String(workout.rawPayload?.reviewContext?.overrideAnalysisFamily || "").toLowerCase();
  if (override) return override === "z2";

  const type = String(workout.workoutType || "").toLowerCase();
  const title = String(workout.title || "").toLowerCase();
  const goal = String(workout.rawPayload?.reviewContext?.trainingGoal || "").toLowerCase();
  const category = String(workout.rawPayload?.reviewContext?.bulkCategory || "").toLowerCase();
  const structure = String(workout.rawPayload?.reviewContext?.structureText || "").toLowerCase();
  const haystack = `${title} ${type} ${goal} ${category} ${structure}`;
  const hasZ2Lap = (workout.intervals || []).some((interval) => interval.effortGoal === "z2");
  if (goal === "z2_under_overs" || category === "z2_under_overs" || category === "threshold_under_overs") {
    return false;
  }
  if (/deload/.test(haystack) && /(interval|vo2|v02|4x4|4\s*x\s*4)/.test(haystack)) {
    return false;
  }

  return goal === "z2"
    || hasZ2Lap
    || type === "z2"
    || type.includes("z2")
    || category === "z2_general"
    || category === "bike_z2"
    || category === "erg_z2";
}

function z2Subtype(workout) {
  const title = String(workout.title || "").toLowerCase();
  const type = String(workout.workoutType || "").toLowerCase();
  const category = String(workout.rawPayload?.reviewContext?.bulkCategory || "").toLowerCase();
  const structure = String(workout.rawPayload?.reviewContext?.structureText || "").toLowerCase();
  const haystack = `${title} ${type} ${category} ${structure}`;

  const hasErgLap = (workout.intervals || []).some((interval) => ["ski_erg", "row_erg", "bike_erg"].includes(interval.exerciseType));

  if (hasErgLap || category === "erg_z2" || type === "erg_z2" || /(erg|skierg|rowerg|ski erg|row erg|ski -> row -> bike)/.test(haystack)) {
    return "erg";
  }

  if (workout.sport === "cycling" || category === "bike_z2" || /(bike|fiets|ride)/.test(haystack)) {
    return "bike";
  }

  return "run";
}

function hasErgComponent(workout, componentType) {
  const title = String(workout.title || "").toLowerCase();
  const type = String(workout.workoutType || "").toLowerCase();
  const category = String(workout.rawPayload?.reviewContext?.bulkCategory || "").toLowerCase();
  const structure = String(workout.rawPayload?.reviewContext?.structureText || "").toLowerCase();
  const haystack = `${title} ${type} ${category} ${structure}`;
  const componentPatterns = {
    ski_erg: /(ski|skierg|ski erg)/,
    row_erg: /(row|rowerg|row erg)/,
    bike_erg: /(bike|bikeerg|bike erg|fiets)/,
  };
  return (workout.intervals || []).some((interval) => interval.exerciseType === componentType && !isTransitionInterval(interval))
    || Boolean(componentPatterns[componentType]?.test(haystack));
}

function isErgComponentGroup(groupKey) {
  return ["ski_erg", "row_erg"].includes(groupKey);
}

function normalizeAppWorkouts(workouts) {
  const normalized = autoLabelVo2RunWorkouts(autoLabelBikeOnlyWorkouts(applyKnownWorkoutCorrections(correctGeneratedStrengthWorkouts(cleanWorkouts(workouts)))));
  return sortWorkoutsByDate(addAnalysisSnapshots(normalized));
}

function addAnalysisSnapshots(workouts) {
  return workouts.map((workout) => withAnalysisSnapshot(workout));
}

function withAnalysisSnapshot(workout) {
  return {
    ...workout,
    rawPayload: {
      ...(workout.rawPayload || {}),
      analysis: workoutAnalysisSnapshot(workout),
    },
  };
}

function applyKnownWorkoutCorrections(workouts) {
  return workouts.map((workout) => {
    if (isRotterdamHyroxDuoCorrection(workout)) {
      return markRotterdamHyroxDuo(workout);
    }
    if (isMarchBikeWithoutWattsCorrection(workout)) {
      return markBikeWorkoutWithoutWatts(workout);
    }
    return workout;
  });
}

function correctGeneratedStrengthWorkouts(workouts) {
  return workouts.map((workout) => {
    if (!looksLikeGeneratedStrengthWorkout(workout)) return workout;
    const now = new Date().toISOString();
    const reviewContext = workout.rawPayload?.reviewContext || {};
    return {
      ...workout,
      sport: "strength",
      workoutType: "strength",
      rawPayload: {
        ...(workout.rawPayload || {}),
        reviewContext: {
          ...reviewContext,
          trainingGoal: reviewContext.trainingGoal || "strength",
          bulkCategory: reviewContext.bulkCategory || "strength",
          structureText: reviewContext.structureText || "Gegenereerde Run-titel, maar bron/type wijst op kracht/workout. Automatisch uit run/VO2/threshold analyse gehouden.",
          correctedFromGeneratedRun: true,
          updatedAt: reviewContext.updatedAt || now,
        },
      },
    };
  });
}

function looksLikeGeneratedStrengthWorkout(workout) {
  if (!generatedRunTitle(workout)) return false;
  if (isTrueHyroxWorkout(workout)) return false;
  if (numberOrZero(workout.distanceKm) >= 1.5 && workout.sport === "running") return false;

  const raw = workout.rawPayload || {};
  const sourceActivity = raw.activity || raw.stravaActivity || raw.intervalsActivity || raw.raw || raw.source || {};
  const typeText = [
    workout.sport,
    workout.workoutType,
    raw.sport_type,
    raw.type,
    raw.activity_type,
    raw.category,
    raw.originalType,
    raw.original_type,
    raw.workout_type,
    sourceActivity.sport_type,
    sourceActivity.type,
    sourceActivity.activity_type,
    sourceActivity.category,
    sourceActivity.workout_type,
    workout.rawPayload?.reviewContext?.bulkCategory,
    workout.rawPayload?.reviewContext?.trainingGoal,
  ].map((value) => String(value || "").toLowerCase()).join(" ");

  const title = String(workout.title || "").toLowerCase();
  const hasStrengthSignal = /(strength|kracht|weight|weights|weighttraining|weight_training|workout|fitness|upper|lower|fullbody|full body|legday|gym|rehab)/.test(typeText)
    || /(upper|lower|fullbody|full body|legday|gym|kracht|strength|fitness|rehab)/.test(title);
  const hasRunSignal = /(hardloop|running|run|loop|treadmill|interval|vo2|v02|threshold|treshold|tempo|z2|easy|recovery)/.test(typeText.replace(/workout/g, ""))
    || /(hardloop|loop|treadmill|interval|vo2|v02|threshold|treshold|tempo|z2|easy|recovery)/.test(title);

  return hasStrengthSignal && !hasRunSignal;
}

function generatedRunTitle(workout) {
  const title = String(workout?.title || "").trim();
  const externalId = String(workout?.externalId || "").trim();
  return /^Run\s+\d+$/i.test(title) || Boolean(externalId && title === `Run ${externalId}`);
}

function autoLabelVo2RunWorkouts(workouts) {
  return workouts.map((workout) => {
    if (!isVo2RunAutoLabelWorkout(workout)) return workout;
    const intervals = workout.intervals || [];
    if (!intervals.length) return workout;

    let changed = false;
    const runIntervals = intervals.filter((interval) => !isTransitionInterval(interval));
    const fullKmRunIntervals = runIntervals.filter((interval) => isOneKmRunInterval(interval));
    const lastFullKmIndex = fullKmRunIntervals[fullKmRunIntervals.length - 1]?.intervalIndex || 0;
    if (!fullKmRunIntervals.length) return workout;

    const nextIntervals = intervals.map((interval) => {
      if (isTransitionInterval(interval)) return interval;
      const paceSec = secondsPerKmForInterval(interval);
      const isFullKm = isOneKmRunInterval(interval);
      const isWarmup = isFullKm && interval.intervalIndex === fullKmRunIntervals[0]?.intervalIndex;
      const isCooldown = isFullKm && interval.intervalIndex === lastFullKmIndex && paceSec >= 330 && paceSec <= 390;
      const isFastRep = isFullKm && !isWarmup && !isCooldown && paceSec > 0 && paceSec < 240;
      const nextRole = isWarmup ? "warmup" : isCooldown ? "cooldown" : isFastRep ? "work" : "recovery";
      const nextGoal = isFastRep ? "vo2max" : isWarmup || isCooldown ? "z2" : "recovery";
      if (interval.exerciseType !== "run" || interval.lapRole !== nextRole || interval.effortGoal !== nextGoal) changed = true;

      return {
        ...interval,
        exerciseType: "run",
        lapRole: nextRole,
        effortGoal: nextGoal,
        rawPayload: {
          ...(interval.rawPayload || {}),
          autoVo2RunLabel: true,
        },
      };
    });

    if (!changed) return workout;
    return {
      ...workout,
      intervals: nextIntervals,
      rawPayload: {
        ...(workout.rawPayload || {}),
        reviewContext: {
          ...((workout.rawPayload || {}).reviewContext || {}),
          trainingGoal: "vo2max",
          autoVo2RunLabelUpdatedAt: new Date().toISOString(),
        },
      },
      updatedAt: new Date().toISOString(),
    };
  });
}

function isVo2RunAutoLabelWorkout(workout) {
  const title = String(workout.title || "").toLowerCase();
  return workout.sport === "running" && /(vo2|v02|4x1k|4\s*x\s*1k|4x1km|4\s*x\s*1km)/.test(title);
}

function isOneKmRunInterval(interval) {
  const distance = numberOrZero(interval.distanceMeters);
  return distance >= 995 && distance <= 1005;
}

function secondsPerKmForInterval(interval) {
  const duration = numberOrZero(interval.durationSeconds);
  const distance = numberOrZero(interval.distanceMeters);
  if (!duration || !distance) return 0;
  return duration / (distance / 1000);
}

function isRotterdamHyroxDuoCorrection(workout) {
  const title = String(workout.title || "").toLowerCase();
  return workout.date === "2026-04-16"
    && (
      workout.sport === "cycling"
      || title.includes("bike")
      || title.includes("fiets")
      || title.includes("duur rit")
      || title.includes("rotterdam")
      || title.includes("hyrox")
    );
}

function markRotterdamHyroxDuo(workout) {
  const previousContext = (workout.rawPayload || {}).reviewContext || {};
  const now = previousContext.correctedByRule === "2026-04-16-rotterdam-hyrox-duo"
    ? previousContext.updatedAt || workout.updatedAt || new Date().toISOString()
    : new Date().toISOString();
  return {
    ...workout,
    sport: "hyrox",
    title: "HYROX Duo Open Rotterdam",
    workoutType: "hyrox_race",
    avgPace: "",
    intervals: [],
    rawPayload: {
      ...(workout.rawPayload || {}),
      reviewContext: {
        ...previousContext,
        bulkCategory: "hyrox_race",
        trainingGoal: "hyrox",
        reviewStatus: "confirmed",
        dataCheckStatus: "complete",
        structureText: "HYROX Duo Open Rotterdam. Race/simulatie bewaren als HYROX, niet als BikeErg/Z2.",
        correctedByRule: "2026-04-16-rotterdam-hyrox-duo",
        updatedAt: now,
      },
    },
    updatedAt: now,
  };
}

function isMarchBikeWithoutWattsCorrection(workout) {
  const title = String(workout.title || "").toLowerCase();
  const category = String(workout.rawPayload?.reviewContext?.bulkCategory || "").toLowerCase();
  return workout.date === "2026-03-13"
    && (
      workout.sport === "cycling"
      || category === "bike_z2"
      || title.includes("bike")
      || title.includes("fiets")
      || title.includes("ride")
      || title.includes("rit")
    );
}

function markBikeWorkoutWithoutWatts(workout) {
  const previousContext = (workout.rawPayload || {}).reviewContext || {};
  const now = previousContext.correctedByRule === "2026-03-13-bike-no-watts"
    ? previousContext.updatedAt || workout.updatedAt || new Date().toISOString()
    : new Date().toISOString();
  const intervals = (workout.intervals || []).map((interval) => {
    if (isTransitionInterval(interval)) return interval;
    const { manualWatts, estimatedDistanceFromWatts, ...rawPayload } = interval.rawPayload || {};
    return {
      ...interval,
      exerciseType: "bike_erg",
      effortGoal: interval.effortGoal || "z2",
      distanceMeters: STRAVA_BIKE_LAP_DISTANCE_METERS,
      avgPace: "",
      rawPayload: {
        ...rawPayload,
        metricUnavailable: true,
        metricUnavailableReason: "Geen wattagedata beschikbaar voor deze rit",
        standardBikeLapDistanceMeters: STRAVA_BIKE_LAP_DISTANCE_METERS,
      },
    };
  });

  return {
    ...workout,
    sport: "cycling",
    workoutType: "z2",
    intervals,
    rawPayload: {
      ...(workout.rawPayload || {}),
      reviewContext: {
        ...previousContext,
        bulkCategory: "bike_z2",
        trainingGoal: "z2",
        reviewStatus: "confirmed",
        dataCheckStatus: "complete",
        structureText: "BikeErg/Z2 rit zonder beschikbare wattagedata. Bewust verwerkt; niet meer tonen als datagat.",
        correctedByRule: "2026-03-13-bike-no-watts",
        updatedAt: now,
      },
    },
    updatedAt: now,
  };
}

function autoLabelBikeOnlyWorkouts(workouts) {
  return workouts.map((workout) => {
    if (!isBikeOnlyWorkout(workout) || !Array.isArray(workout.intervals) || !workout.intervals.length) return workout;

    let changed = false;
    const useStandardBikeLapDistance = usesStravaBikeLapDistance(workout);
    const intervals = workout.intervals.map((interval) => {
      if (isTransitionInterval(interval)) return interval;
      const nextRawPayload = { ...(interval.rawPayload || {}) };
      const hadEstimatedWatts = Boolean(nextRawPayload.estimatedWattsFromPace500);
      if (hadEstimatedWatts) {
        delete nextRawPayload.manualWatts;
        delete nextRawPayload.estimatedWattsFromPace500;
      }
      if (useStandardBikeLapDistance) {
        nextRawPayload.standardBikeLapDistanceMeters = STRAVA_BIKE_LAP_DISTANCE_METERS;
      }
      const workoutAvgHr = validHr(workout.avgHr);
      const workoutMaxHr = validHr(workout.maxHr) || workoutAvgHr;
      const nextAvgHr = validHr(interval.avgHr) || workoutAvgHr;
      const nextMaxHr = validHr(interval.maxHr) || workoutMaxHr || nextAvgHr;
      const nextInterval = {
        ...interval,
        exerciseType: "bike_erg",
        effortGoal: interval.effortGoal || "z2",
        distanceMeters: useStandardBikeLapDistance ? STRAVA_BIKE_LAP_DISTANCE_METERS : interval.distanceMeters,
        avgHr: nextAvgHr,
        maxHr: nextMaxHr,
        avgPace: useStandardBikeLapDistance ? "" : interval.avgPace,
        rawPayload: {
          ...nextRawPayload,
          ...(!validHr(interval.avgHr) && workoutAvgHr ? { hrFilledFromWorkoutAverage: true } : {}),
          ...(!validHr(interval.maxHr) && workoutMaxHr ? { maxHrFilledFromWorkout: true } : {}),
        },
      };

      if (
        nextInterval.exerciseType !== interval.exerciseType
        || hadEstimatedWatts
        || (useStandardBikeLapDistance && numberOrZero(interval.distanceMeters) !== STRAVA_BIKE_LAP_DISTANCE_METERS)
        || nextAvgHr !== validHr(interval.avgHr)
        || nextMaxHr !== validHr(interval.maxHr)
      ) changed = true;
      return nextInterval;
    });

    if (!changed) return workout;
    return {
      ...workout,
      intervals,
      rawPayload: {
        ...(workout.rawPayload || {}),
        autoBikeErgLabelApplied: true,
      },
    };
  });
}

function usesStravaBikeLapDistance(workout) {
  return workout?.source === "strava" && isBikeOnlyWorkout(workout);
}

function isBikeOnlyWorkout(workout) {
  const title = String(workout.title || "").toLowerCase();
  const type = String(workout.workoutType || "").toLowerCase();
  const category = String(workout.rawPayload?.reviewContext?.bulkCategory || "").toLowerCase();
  const structure = String(workout.rawPayload?.reviewContext?.structureText || "").toLowerCase();
  const haystack = `${title} ${type} ${category} ${structure}`;
  const hasBikeSignal = workout.sport === "cycling"
    || category === "bike_z2"
    || /\b(bike|bikeerg|bike erg|fiets|fietsrit|ride|rit)\b/.test(haystack);
  const hasMixedSignal = /(easy bike\s*\+\s*wb|wall ?balls?|wb\b|ski|skierg|ski erg|row|rowerg|row erg|hyrox|station|sled|burpee|lunge|run|hardloop|compromised|erg z2|easy ergs|ski\s*->\s*row\s*->\s*bike)/.test(haystack);
  const hasNonBikeErgLap = (workout.intervals || []).some((interval) => {
    if (isTransitionInterval(interval)) return false;
    return ["ski_erg", "row_erg", "run", "strength"].includes(interval.exerciseType);
  });

  return Boolean(hasBikeSignal && !hasMixedSignal && !hasNonBikeErgLap);
}

function z2UsesErgComponentMatching(workout, groupKey) {
  if (isErgComponentGroup(groupKey)) return hasErgComponent(workout, groupKey);
  if (groupKey === "bike") return hasErgComponent(workout, "bike_erg");
  return false;
}

function z2ComponentTypeForGroup(groupKey) {
  return groupKey === "bike" ? "bike_erg" : groupKey;
}

function z2ComparableDurationMin(workout, groupKey) {
  if (!workout) return 0;
  if (!z2UsesErgComponentMatching(workout, groupKey)) return numberOrZero(workout.durationMin);
  const componentType = z2ComponentTypeForGroup(groupKey);
  const component = ergComponentStats([workout])[componentType];
  return component?.durationSeconds ? component.durationSeconds / 60 : 0;
}

function nearestZ2ErgDurationBucket(durationMin) {
  const duration = numberOrZero(durationMin);
  if (!duration) return null;
  const bestTarget = Z2_ANALYSIS_RULES.ergDurationTargetsMin
    .map((target) => ({
      target,
      deltaPct: Math.abs(duration - target) / target,
    }))
    .sort((a, b) => a.deltaPct - b.deltaPct)[0];

  if (!bestTarget || bestTarget.deltaPct > Z2_ANALYSIS_RULES.ergDurationHardMarginPct) return null;

  return {
    ...bestTarget,
    durationMin: duration,
    label: `${formatDurationLabel(bestTarget.target)} blok`,
    isStrong: bestTarget.deltaPct <= Z2_ANALYSIS_RULES.ergDurationStrongMarginPct,
  };
}

function z2DurationBucketForWorkout(workout, groupKey) {
  return nearestZ2ErgDurationBucket(z2ComparableDurationMin(workout, groupKey));
}

function z2ErgDurationBucketSimilarity(target, candidate, groupKey) {
  const targetBucket = z2DurationBucketForWorkout(target, groupKey);
  const candidateBucket = z2DurationBucketForWorkout(candidate, groupKey);
  if (!targetBucket || !candidateBucket) return null;
  if (targetBucket.target !== candidateBucket.target) return 0;
  return targetBucket.isStrong && candidateBucket.isStrong ? 1 : 0.82;
}

function z2ErgDurationBucketReason(target, groupKey) {
  const bucket = z2DurationBucketForWorkout(target, groupKey);
  return bucket ? `zelfde duurblok: ${bucket.label}` : "duurblok vergelijkbaar";
}

function formatDurationLabel(minutes) {
  if (!minutes) return "-";
  return Number.isInteger(minutes) ? `${minutes} min` : `${String(minutes).replace(".", ",")} min`;
}

function renderZ2Group(group) {
  const sourceWorkouts = group.workouts;
  const workouts = z2AnalysisWorkoutsForGroup(sourceWorkouts, group.key);
  const latest = workouts[0];
  const allStats = z2StatsForGroupWorkouts(workouts, group.key);
  const totalDuration = allStats.totalDurationMin || workouts.reduce((sum, workout) => sum + numberOrZero(workout.durationMin), 0);
  const totalDistance = allStats.totalDistanceKm || workouts.reduce((sum, workout) => sum + numberOrZero(workout.distanceKm), 0);
  const currentStats = z2GroupPeriodStats(workouts, state.z2PeriodMonths, 0, group.key);
  const previousStats = z2GroupPeriodStats(workouts, state.z2PeriodMonths, 1, group.key);
  const pageData = z2WorkoutPageData(group.key, workouts);

  return `
    <section class="z2-group">
      <div class="z2-group-header">
        <div>
          <strong>${group.label}</strong>
          <span>${allStats.count || workouts.length} workout(s) · ${formatDuration(totalDuration)} · ${totalDistance ? `${totalDistance.toFixed(1)} km` : "afstand -"}</span>
        </div>
        <div>
          <strong>${allStats.avgHr ? `${Math.round(allStats.avgHr)} bpm` : formatAvgHr(workouts)}</strong>
          <span>Gem. HR${latest ? ` · laatste: ${formatDate(latest.date)}` : ""}</span>
        </div>
      </div>
      ${renderZ2ProgressCards(group, currentStats, previousStats)}
      ${renderZ2TestZoneCard(group.key, currentStats, workouts)}
      ${renderZ2DataQualityPanel(group.key, sourceWorkouts)}
      ${renderZ2ErgComparisonPanel(group.key, sourceWorkouts)}
      ${renderZ2VisualSummary(group, workouts, currentStats)}
      ${workouts.length ? `
        <details class="z2-collapsible-list">
          <summary>
            <span>
              <strong>Vergelijkbare sessies</strong>
              <small>Klik open voor de volledige lijst en workoutdetails.</small>
            </span>
            <b>${pageData.totalWorkouts} sessie(s)</b>
          </summary>
          ${renderZ2WorkoutPager(group.key, pageData, "top")}
          <div class="z2-table">
            ${pageData.pageWorkouts.map((workout) => renderZ2WorkoutRow(workout, group.key)).join("")}
          </div>
          ${renderZ2WorkoutPager(group.key, pageData, "bottom")}
        </details>
      ` : `<p class="empty-state">Nog geen workouts in deze Z2-groep.</p>`}
    </section>
  `;
}

function z2AnalysisWorkoutsForGroup(workouts, groupKey) {
  if (!(isErgComponentGroup(groupKey) || groupKey === "bike")) return workouts;
  return workouts.filter((workout) => z2StatsForGroupWorkouts([workout], groupKey).usableLaps);
}

function z2WorkoutPageData(groupKey, workouts) {
  const totalPages = Math.max(1, Math.ceil(workouts.length / Z2_WORKOUTS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, state.z2WorkoutPages[groupKey] || 1), totalPages);
  state.z2WorkoutPages[groupKey] = currentPage;
  const startIndex = (currentPage - 1) * Z2_WORKOUTS_PER_PAGE;
  const pageWorkouts = workouts.slice(startIndex, startIndex + Z2_WORKOUTS_PER_PAGE);

  return {
    currentPage,
    totalPages,
    totalWorkouts: workouts.length,
    firstItem: startIndex + 1,
    lastItem: startIndex + pageWorkouts.length,
    pageWorkouts,
  };
}

function renderZ2WorkoutPager(groupKey, pageData, position) {
  if (pageData.totalPages <= 1 && position === "bottom") return "";

  return `
    <div class="z2-pager" data-z2-pager="${position}">
      <span>${pageData.firstItem}-${pageData.lastItem} van ${pageData.totalWorkouts}</span>
      <div class="z2-page-list" aria-label="Z2 pagina's">
        ${Array.from({ length: pageData.totalPages }, (_, index) => {
          const page = index + 1;
          return `
            <button type="button" data-z2-page="${groupKey}:${page}" class="${page === pageData.currentPage ? "is-active" : ""}" aria-label="Pagina ${page}">
              ${page}
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function getZ2MatchedWorkouts(target, workouts, groupKey, options = {}) {
  const {
    limit = 8,
    includeFuture = false,
    minScore = 60,
  } = options;
  const targetDate = new Date(target.date);

  return workouts
    .filter((candidate) => {
      if (candidate.id === target.id) return false;
      if (!includeFuture && new Date(candidate.date) >= targetDate) return false;
      return z2HardFiltersPass(target, candidate, groupKey);
    })
    .map((candidate) => ({
      workout: candidate,
      ...scoreZ2WorkoutMatch(target, candidate, groupKey),
    }))
    .filter((match) => match.score >= minScore)
    .sort((a, b) => b.score - a.score || new Date(b.workout.date) - new Date(a.workout.date))
    .slice(0, limit);
}

function z2HardFiltersPass(target, candidate, groupKey) {
  if (!isZ2Workout(target) || !isZ2Workout(candidate)) return false;
  if (isErgComponentGroup(groupKey)) {
    if (!hasErgComponent(target, groupKey) || !hasErgComponent(candidate, groupKey)) return false;
  } else if (groupKey === "bike") {
    const targetIsBikeErg = hasErgComponent(target, "bike_erg");
    const candidateIsBikeErg = hasErgComponent(candidate, "bike_erg");
    if (targetIsBikeErg || candidateIsBikeErg) {
      if (!targetIsBikeErg || !candidateIsBikeErg) return false;
    } else if (z2Subtype(target) !== groupKey || z2Subtype(candidate) !== groupKey) {
      return false;
    }
  } else if (z2Subtype(target) !== groupKey || z2Subtype(candidate) !== groupKey) {
    return false;
  }
  if ((groupKey === "run" || groupKey === "bike") && !z2UsesErgComponentMatching(target, groupKey) && target.sport && candidate.sport && target.sport !== candidate.sport) return false;

  if (z2UsesErgComponentMatching(target, groupKey) || z2UsesErgComponentMatching(candidate, groupKey)) {
    const targetBucket = z2DurationBucketForWorkout(target, groupKey);
    const candidateBucket = z2DurationBucketForWorkout(candidate, groupKey);
    return Boolean(targetBucket && candidateBucket && targetBucket.target === candidateBucket.target);
  }

  const targetDistance = numberOrZero(target.distanceKm);
  const candidateDistance = numberOrZero(candidate.distanceKm);
  if ((groupKey === "run" || groupKey === "bike") && targetDistance && candidateDistance) {
    const distanceDelta = Math.abs(targetDistance - candidateDistance) / targetDistance;
    if (distanceDelta > 0.2) return false;
  }

  const targetDuration = numberOrZero(target.durationMin);
  const candidateDuration = numberOrZero(candidate.durationMin);
  if (targetDuration && candidateDuration) {
    const durationDelta = Math.abs(targetDuration - candidateDuration) / targetDuration;
    if (durationDelta > 0.3) return false;
  }

  return true;
}

function scoreZ2WorkoutMatch(target, candidate, groupKey) {
  const parts = z2MatchParts(target, candidate, groupKey).filter((part) => part.score !== null);
  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0) || 1;
  const score = Math.round(parts.reduce((sum, part) => sum + (part.score * part.weight), 0) / totalWeight * 100);
  const quality = z2MatchQuality(score);
  const reasons = [quality.label, ...parts
    .filter((part) => part.reason && part.score >= 0.75)
    .sort((a, b) => b.weight - a.weight)
    .map((part) => part.reason)]
    .slice(0, 4);

  return {
    score: Math.max(0, Math.min(100, score)),
    quality: quality.key,
    qualityLabel: quality.label,
    reasons,
  };
}

function z2MatchParts(target, candidate, groupKey) {
  const usesErgComponent = z2UsesErgComponentMatching(target, groupKey) || z2UsesErgComponentMatching(candidate, groupKey);
  const goalScore = workoutGoalKey(target) === workoutGoalKey(candidate) ? 1 : normalizedWorkoutType(target) === normalizedWorkoutType(candidate) ? 0.8 : 0.55;
  const baseParts = [
    {
      label: "workout_type",
      weight: 0.15,
      score: goalScore,
      reason: "zelfde doel/type",
    },
    {
      label: "duration",
      weight: usesErgComponent ? 0.35 : 0.2,
      score: usesErgComponent
        ? z2ErgDurationBucketSimilarity(target, candidate, groupKey)
        : similarityByPct(numberOrZero(target.durationMin), numberOrZero(candidate.durationMin), 0.3),
      reason: usesErgComponent ? z2ErgDurationBucketReason(target, groupKey) : "duur vergelijkbaar",
    },
    {
      label: "intensity",
      weight: 0.2,
      score: similarityByAbs(validHr(target.avgHr), validHr(candidate.avgHr), 12),
      reason: "HR vergelijkbaar",
    },
  ];

  if (groupKey === "run") {
    return [
      ...baseParts,
      {
        label: "distance",
        weight: 0.25,
        score: similarityByPct(numberOrZero(target.distanceKm), numberOrZero(candidate.distanceKm), 0.2),
        reason: "afstand vergelijkbaar",
      },
      {
        label: "elevation",
        weight: 0.1,
        score: similarityByAbs(numberOrZero(target.elevationGainM), numberOrZero(candidate.elevationGainM), 60),
        reason: "hoogtemeters vergelijkbaar",
      },
      {
        label: "route_context",
        weight: 0.1,
        score: null,
        reason: "",
      },
    ];
  }

  if (groupKey === "bike") {
    if (usesErgComponent) {
      return [
        ...baseParts,
        {
          label: "bike_watts",
          weight: 0.25,
          score: bikeErgWattsSimilarity(target, candidate),
          reason: "BikeErg wattage vergelijkbaar",
        },
        {
          label: "bike_component_distance",
          weight: 0.1,
          score: similarityByPct(
            z2StatsForGroupWorkouts([target], groupKey).distanceKm,
            z2StatsForGroupWorkouts([candidate], groupKey).distanceKm,
            0.2,
          ),
          reason: "BikeErg afstand vergelijkbaar",
        },
      ];
    }
    return [
      ...baseParts,
      {
        label: "distance",
        weight: 0.25,
        score: similarityByPct(numberOrZero(target.distanceKm), numberOrZero(candidate.distanceKm), 0.2),
        reason: "afstand vergelijkbaar",
      },
      {
        label: "speed",
        weight: 0.2,
        score: similarityByPct(speedKmh(target), speedKmh(candidate), 0.15),
        reason: "snelheid vergelijkbaar",
      },
    ];
  }

  return [
    ...baseParts,
    {
      label: "distance",
      weight: 0.15,
      score: similarityByPct(numberOrZero(target.distanceKm), numberOrZero(candidate.distanceKm), 0.25),
      reason: "afstand vergelijkbaar",
    },
    {
      label: "manual_erg_pace",
      weight: 0.2,
      score: ergManualPaceSimilarity(target, candidate, groupKey),
      reason: `${intervalExerciseTypeLabels[groupKey] || "ERG"}-tempo vergelijkbaar`,
    },
  ];
}

function workoutGoalKey(workout) {
  const goal = String(workout.rawPayload?.reviewContext?.trainingGoal || "").toLowerCase();
  if (goal) return goal;
  const category = String(workout.rawPayload?.reviewContext?.bulkCategory || "").toLowerCase();
  if (category.includes("z2")) return "z2";
  if (category.includes("vo2")) return "vo2max";
  if (category.includes("threshold") || category.includes("drempel")) return "threshold";
  if (category.includes("hyrox")) return "hyrox";
  if (category.includes("strength")) return "strength";
  return normalizedWorkoutType(workout);
}

function normalizedWorkoutType(workout) {
  return String(workout.workoutType || "general").trim().toLowerCase().replace(/\s+/g, "_");
}

function similarityByPct(targetValue, candidateValue, tolerancePct) {
  if (!targetValue || !candidateValue) return null;
  return Math.max(0, 1 - Math.abs(targetValue - candidateValue) / (targetValue * tolerancePct));
}

function similarityByAbs(targetValue, candidateValue, tolerance) {
  if (!targetValue || !candidateValue) return null;
  return Math.max(0, 1 - Math.abs(targetValue - candidateValue) / tolerance);
}

function ergManualPaceSimilarity(target, candidate, groupKey = "") {
  const fieldByGroup = {
    ski_erg: "skiPace500",
    row_erg: "rowPace500",
    bike_erg: "bikePace500",
  };
  const fields = fieldByGroup[groupKey]
    ? [fieldByGroup[groupKey]]
    : ["skiPace500", "rowPace500", "bikePace500"];
  let targetValues = fields
    .map((field) => secondsFromPaceText(target.rawPayload?.reviewContext?.z2Metrics?.[field]))
    .filter(Boolean);
  let candidateValues = fields
    .map((field) => secondsFromPaceText(candidate.rawPayload?.reviewContext?.z2Metrics?.[field]))
    .filter(Boolean);
  if (!targetValues.length && isErgComponentGroup(groupKey)) {
    const targetPace = z2StatsForGroupWorkouts([target], groupKey).pace500Sec;
    if (targetPace) targetValues.push(targetPace);
  }
  if (!candidateValues.length && isErgComponentGroup(groupKey)) {
    const candidatePace = z2StatsForGroupWorkouts([candidate], groupKey).pace500Sec;
    if (candidatePace) candidateValues.push(candidatePace);
  }
  if (!targetValues.length || !candidateValues.length) return null;
  return similarityByPct(average(targetValues), average(candidateValues), 0.12);
}

function bikeErgWattsSimilarity(target, candidate) {
  const targetWatts = z2StatsForGroupWorkouts([target], "bike").avgWatts;
  const candidateWatts = z2StatsForGroupWorkouts([candidate], "bike").avgWatts;
  if (!targetWatts || !candidateWatts) return null;
  return similarityByPct(targetWatts, candidateWatts, 0.18);
}

function z2MatchQuality(score) {
  if (score >= 90) return { key: "strong", label: "sterke match" };
  if (score >= 75) return { key: "good", label: "goede match" };
  return { key: "usable", label: "bruikbare match" };
}

function renderZ2SelectedWorkoutDetail(group, workouts, selected) {
  if (!selected) return "";

  const matchResults = getZ2MatchedWorkouts(selected, workouts, group.key, {
    limit: 8,
    includeFuture: false,
    minScore: 60,
  });
  const previousWindow = matchResults.map((match) => match.workout);
  const previousStats = z2StatsForGroupWorkouts(previousWindow, group.key);
  const selectedStats = z2StatsForGroupWorkouts([selected], group.key);
  const matchSummary = z2MatchSummary(matchResults);
  const paceOrSpeedDelta = group.key === "run"
    ? formatPaceDelta(selectedStats.paceSecPerKm, previousStats.paceSecPerKm)
    : group.key === "bike"
      ? formatWattsDelta(selectedStats.avgWatts, previousStats.avgWatts)
      : formatErg500Delta(selectedStats.pace500Sec, previousStats.pace500Sec);
  const paceOrSpeedValue = group.key === "run"
    ? formatPacePerKm(selectedStats.paceSecPerKm)
    : group.key === "bike"
      ? formatWatts(selectedStats.avgWatts)
      : formatPace500(selectedStats.pace500Sec);
  const efficiency = z2EfficiencyInsight(group.key, selectedStats, previousStats);
  const context = z2ContextInsight(selectedStats, previousStats);

  return `
    <article class="z2-detail">
      <div class="z2-detail-header">
        <div>
          <span>Geselecteerde training</span>
          <strong>${escapeHtml(selected.title)}</strong>
          <small>${formatDate(selected.date)} · ${sportLabels[selected.sport] || selected.sport} · ${escapeHtml(selected.workoutType || "general")}</small>
        </div>
        <div>
          <span>Vergelijking</span>
          <strong>${previousWindow.length ? `${previousWindow.length} matched sessies` : "Nog geen eerdere match"}</strong>
          <small>${escapeHtml(matchSummary)}</small>
        </div>
      </div>
      <div class="z2-insight-grid">
        <section class="z2-insight-card ${efficiency.tone}">
          <span>Efficiëntie</span>
          <strong>${escapeHtml(efficiency.title)}</strong>
          <p>${escapeHtml(efficiency.body)}</p>
        </section>
        <section class="z2-insight-card ${context.tone}">
          <span>Context</span>
          <strong>${escapeHtml(context.title)}</strong>
          <p>${escapeHtml(context.body)}</p>
        </section>
      </div>
      <div class="z2-detail-grid">
        <div class="z2-progress-card">
          <span>${group.key === "run" ? "Pace" : group.key === "bike" ? "Wattage" : "Tempo /500m"}</span>
          <strong>${paceOrSpeedValue}</strong>
          <small>${paceOrSpeedDelta}</small>
        </div>
        <div class="z2-progress-card">
          <span>Hartslag</span>
          <strong>${validHr(selected.avgHr) ? `${validHr(selected.avgHr)} bpm` : "-"}</strong>
          <small>${formatHrDelta(selectedStats.avgHr, previousStats.avgHr)}</small>
        </div>
        <div class="z2-progress-card">
          <span>Afstand</span>
          <strong>${selectedStats.distanceKm ? `${selectedStats.distanceKm.toFixed(2)} km` : formatDistance(selected)}</strong>
          <small>${formatDistanceDelta(selectedStats.distanceKm, previousStats.distanceKm)}</small>
        </div>
        <div class="z2-progress-card">
          <span>Tijd</span>
          <strong>${formatDuration(Math.round(selectedStats.durationMin || numberOrZero(selected.durationMin)))}</strong>
          <small>${formatDurationDelta(selectedStats.durationMin, previousStats.durationMin)}</small>
        </div>
      </div>
      ${selected.notes ? `<p class="z2-detail-note">${escapeHtml(selected.notes)}</p>` : ""}
    </article>
  `;
}

function z2EfficiencyInsight(groupKey, selectedStats, previousStats) {
  if (!previousStats.count) {
    return {
      tone: "is-neutral",
      title: "Nieuwe referentie",
      body: "Er zijn nog geen eerdere vergelijkbare Z2-sessies om deze training eerlijk naast te leggen.",
    };
  }

  const hrDelta = selectedStats.avgHr && previousStats.avgHr ? selectedStats.avgHr - previousStats.avgHr : 0;
  const paceDelta = selectedStats.paceSecPerKm && previousStats.paceSecPerKm
    ? selectedStats.paceSecPerKm - previousStats.paceSecPerKm
    : 0;

  if (groupKey === "run") {
    const paceText = paceDelta ? `${formatSignedPace(paceDelta)} ${paceDelta <= 0 ? "sneller" : "langzamer"}` : "gelijk tempo";
    const hrText = hrDelta ? `${formatSignedNumber(hrDelta, "bpm")} ${hrDelta <= 0 ? "lager" : "hoger"}` : "gelijke hartslag";
    const isBetter = (paceDelta <= -Z2_ANALYSIS_RULES.runProgressPaceSec && hrDelta <= Z2_ANALYSIS_RULES.hrProgressBpm)
      || (hrDelta <= -Z2_ANALYSIS_RULES.hrProgressBpm && paceDelta <= Z2_ANALYSIS_RULES.runProgressPaceSec);
    const isWorse = paceDelta > Z2_ANALYSIS_RULES.runProgressPaceSec && hrDelta > Z2_ANALYSIS_RULES.hrProgressBpm;
    return {
      tone: isBetter ? "is-good" : isWorse ? "is-warning" : "is-neutral",
      title: isBetter ? "Progressie zichtbaar" : isWorse ? "Zwaarder dan gemiddeld" : "Ongeveer stabiel",
      body: `Bij vergelijkbare Z2-runs liep je deze keer ${paceText} met ${hrText}.`,
    };
  }

  if (groupKey === "bike") {
    const wattsDelta = selectedStats.avgWatts && previousStats.avgWatts ? selectedStats.avgWatts - previousStats.avgWatts : 0;
    const wattsText = wattsDelta ? `${wattsDelta > 0 ? "+" : ""}${Math.round(wattsDelta)} W ${wattsDelta >= 0 ? "hoger" : "lager"}` : "gelijk wattage";
    const hrText = hrDelta ? `${formatSignedNumber(hrDelta, "bpm")} ${hrDelta <= 0 ? "lager" : "hoger"}` : "gelijke hartslag";
    const isBetter = (wattsDelta >= Z2_ANALYSIS_RULES.bikeProgressWatts && hrDelta <= Z2_ANALYSIS_RULES.hrProgressBpm)
      || hrDelta <= -Z2_ANALYSIS_RULES.hrProgressBpm;
    return {
      tone: isBetter ? "is-good" : "is-neutral",
      title: isBetter ? "Progressie zichtbaar" : "Vergelijkbare prikkel",
      body: `Bij vergelijkbare BikeErg Z2-sessies zat je op ${wattsText} met ${hrText}.`,
    };
  }

  const ergText = formatErg500Delta(selectedStats.pace500Sec, previousStats.pace500Sec);
  const hrText = hrDelta ? `${formatSignedNumber(hrDelta, "bpm")} ${hrDelta <= 0 ? "lager" : "hoger"}` : "gelijke hartslag";
  const isBetter = (selectedStats.pace500Sec && previousStats.pace500Sec && selectedStats.pace500Sec <= previousStats.pace500Sec - Z2_ANALYSIS_RULES.ergProgressPace500Sec)
    || hrDelta <= -Z2_ANALYSIS_RULES.hrProgressBpm;
  return {
    tone: isBetter ? "is-good" : "is-neutral",
    title: `${intervalExerciseTypeLabels[groupKey] || "ERG"} vergelijking`,
    body: `Je /500m tempo geeft: ${ergText}. Hartslag: ${hrText}.`,
  };
}

function z2ContextInsight(selectedStats, previousStats) {
  if (!previousStats.count) {
    return {
      tone: "is-neutral",
      title: "Nog geen context",
      body: "Deze workout wordt vanaf nu gebruikt als vergelijkingsmateriaal voor latere sessies.",
    };
  }

  const distanceDelta = selectedStats.distanceKm - previousStats.distanceKm;
  const durationDelta = selectedStats.durationMin - previousStats.durationMin;
  const loadDelta = selectedStats.load && previousStats.load ? selectedStats.load - previousStats.load : 0;
  const distancePct = previousStats.distanceKm ? Math.abs(distanceDelta / previousStats.distanceKm) : 0;
  const durationPct = previousStats.durationMin ? Math.abs(durationDelta / previousStats.durationMin) : 0;
  const isComparable = distancePct <= 0.15 && durationPct <= 0.15;
  const loadText = loadDelta ? ` Load: ${formatSignedNumber(loadDelta, "load")}.` : "";

  if (isComparable) {
    return {
      tone: "is-good",
      title: "Goed vergelijkbaar",
      body: `Afstand en duur liggen dicht bij je eerdere sessies, dus deze vergelijking is redelijk één-op-één.${loadText}`,
    };
  }

  const distanceText = distanceDelta ? `${distanceDelta > 0 ? "+" : ""}${distanceDelta.toFixed(2)} km` : "gelijke afstand";
  const durationText = Math.round(durationDelta) ? `${durationDelta > 0 ? "+" : ""}${Math.round(durationDelta)} min` : "gelijke duur";
  return {
    tone: "is-warning",
    title: "Niet helemaal één-op-één",
    body: `Deze sessie wijkt af in omvang: ${distanceText} en ${durationText} versus je vergelijkingsgroep.${loadText} Lees pace/HR daarom als richting, niet als harde conclusie.`,
  };
}

function z2MatchSummary(matches) {
  if (!matches.length) return "Geen eerdere sessies met voldoende match-score.";
  const avgScore = Math.round(average(matches.map((match) => match.score)));
  const strongest = matches[0]?.qualityLabel || "bruikbare match";
  const confidence = z2MatchConfidence(matches);
  const qualityLabels = new Set(["sterke match", "goede match", "bruikbare match"]);
  const topReasons = [...new Set(matches.flatMap((match) => match.reasons || []).filter((reason) => !qualityLabels.has(reason)))].slice(0, 2);
  return `${confidence.label} · gem. matchscore ${avgScore}/100 · beste ${strongest} · ${topReasons.join(", ") || "zelfde Z2-groep"}`;
}

function z2MatchConfidence(matches) {
  const count = matches.length;
  const avgScore = count ? average(matches.map((match) => match.score)) : 0;
  if (count >= 6 && avgScore >= 75) {
    return { key: "high", label: "hoge betrouwbaarheid", detail: `${count} matches met sterke gemiddelde score` };
  }
  if (count >= 3 && avgScore >= 65) {
    return { key: "medium", label: "redelijke betrouwbaarheid", detail: `${count} matches, genoeg voor richting` };
  }
  if (count) {
    return { key: "low", label: "lage betrouwbaarheid", detail: `${count} match(es), gebruik als indicatie` };
  }
  return { key: "none", label: "geen betrouwbaarheid", detail: "nog geen vergelijkingsgroep" };
}

function z2StatsForWorkouts(workouts) {
  const durationMin = workouts.reduce((sum, workout) => sum + numberOrZero(workout.durationMin), 0);
  const distanceKm = workouts.reduce((sum, workout) => sum + numberOrZero(workout.distanceKm), 0);
  return {
    count: workouts.length,
    durationMin: average(workouts.map((workout) => numberOrZero(workout.durationMin))),
    distanceKm: average(workouts.map((workout) => numberOrZero(workout.distanceKm))),
    totalDurationMin: durationMin,
    totalDistanceKm: distanceKm,
    avgHr: average(workouts.map((workout) => validHr(workout.avgHr))),
    load: average(workouts.map((workout) => numberOrZero(workout.load))),
    totalLoad: workouts.reduce((sum, workout) => sum + numberOrZero(workout.load), 0),
    paceSecPerKm: average(workouts.map((workout) => paceSecondsPerKm(workout))),
    speedKmh: average(workouts.map((workout) => speedKmh(workout))),
    skiPace500: averagePaceField(workouts, "skiPace500"),
    rowPace500: averagePaceField(workouts, "rowPace500"),
    bikePace500: averagePaceField(workouts, "bikePace500"),
  };
}

function z2StatsForGroupWorkouts(workouts, groupKey) {
  const stats = z2StatsForWorkouts(workouts);
  if (groupKey === "bike") {
    const component = ergComponentStats(workouts).bike_erg;
    const sessions = component.sessions || 0;
    return {
      ...stats,
      count: sessions,
      durationMin: sessions ? (component.durationSeconds / 60) / sessions : 0,
      distanceKm: sessions ? (component.distanceMeters / 1000) / sessions : 0,
      totalDurationMin: component.durationSeconds / 60,
      totalDistanceKm: component.distanceMeters / 1000,
      avgHr: component.avgHr,
      avgWatts: component.avgWatts,
      usableLaps: component.usableLaps,
      excludedLaps: component.excludedLaps,
      knownMissingLaps: component.knownMissingLaps,
      componentStats: component,
    };
  }
  if (!isErgComponentGroup(groupKey)) return stats;

  const component = ergComponentStats(workouts)[groupKey];
  const sessions = component.sessions || 0;
  return {
    ...stats,
    count: sessions,
    durationMin: sessions ? (component.durationSeconds / 60) / sessions : 0,
    distanceKm: sessions ? (component.distanceMeters / 1000) / sessions : 0,
    totalDurationMin: component.durationSeconds / 60,
    totalDistanceKm: component.distanceMeters / 1000,
    avgHr: component.avgHr,
    pace500Sec: component.pace500Sec,
    usableLaps: component.usableLaps,
    excludedLaps: component.excludedLaps,
    knownMissingLaps: component.knownMissingLaps,
    componentStats: component,
  };
}

function formatDistanceDelta(current, previous) {
  if (!current || !previous) return "Geen vorige periode";
  const delta = current - previous;
  return `${delta > 0 ? "+" : ""}${delta.toFixed(2)} km versus eerdere sessies`;
}

function formatDurationDelta(current, previous) {
  if (!current || !previous) return "Geen vorige periode";
  const delta = Math.round(current - previous);
  if (!delta) return "Gelijk aan eerdere sessies";
  return `${delta > 0 ? "+" : ""}${delta} min versus eerdere sessies`;
}

function renderZ2ProgressCards(group, currentStats, previousStats) {
  const verdict = z2ProgressVerdict(group.key, currentStats, previousStats);
  const baselineDelta = group.key === "run" ? z2BaselineDelta(currentStats) : null;
  const paceLabel = group.key === "run" ? "Gem. pace" : group.key === "bike" ? "Gem. wattage" : "Gem. /500m";
  const paceValue = group.key === "run"
    ? formatPacePerKm(currentStats.paceSecPerKm)
    : group.key === "bike"
      ? formatWatts(currentStats.avgWatts)
      : formatPace500(currentStats.pace500Sec);
  const paceDelta = group.key === "run"
    ? formatPaceDelta(currentStats.paceSecPerKm, previousStats.paceSecPerKm)
    : group.key === "bike"
      ? formatWattsDelta(currentStats.avgWatts, previousStats.avgWatts)
      : formatErg500Delta(currentStats.pace500Sec, previousStats.pace500Sec);

  return `
    <div class="z2-progress-grid">
      <article class="z2-progress-card ${verdict.tone}">
        <span>Progressie</span>
        <strong>${verdict.title}</strong>
        <small>${verdict.detail}</small>
      </article>
      <article class="z2-progress-card">
        <span>${paceLabel}</span>
        <strong>${paceValue}</strong>
        <small>${paceDelta}</small>
      </article>
      <article class="z2-progress-card">
        <span>Gem. hartslag</span>
        <strong>${currentStats.avgHr ? `${Math.round(currentStats.avgHr)} bpm` : "-"}</strong>
        <small>${formatHrDelta(currentStats.avgHr, previousStats.avgHr)}</small>
      </article>
      <article class="z2-progress-card">
        <span>Volume</span>
        <strong>${formatDuration(Math.round(currentStats.totalDurationMin || currentStats.durationMin))}</strong>
        <small>${currentStats.count} sessie(s) · ${(currentStats.totalDistanceKm || currentStats.distanceKm) ? `${(currentStats.totalDistanceKm || currentStats.distanceKm).toFixed(1)} km` : "afstand -"}</small>
      </article>
      ${group.key === "run" ? `
        <article class="z2-progress-card">
          <span>Referentie</span>
          <strong>${Z2_RUN_BASELINE.label}</strong>
          <small>${baselineDelta}</small>
        </article>
      ` : ""}
    </div>
  `;
}

function renderZ2ErgSummary(workouts, previousWorkouts = []) {
  const currentStats = ergComponentStats(workouts);
  const previousStats = ergComponentStats(previousWorkouts);

  return `
    <div class="z2-erg-summary">
      ${renderErgComponentCard("ski_erg", currentStats.ski_erg, previousStats.ski_erg)}
      ${renderErgComponentCard("row_erg", currentStats.row_erg, previousStats.row_erg)}
      ${renderErgComponentCard("bike_erg", currentStats.bike_erg, previousStats.bike_erg)}
    </div>
  `;
}

function renderZ2ErgComparisonPanel(groupKey, workouts) {
  if (!(isErgComponentGroup(groupKey) || groupKey === "bike")) return "";

  const componentType = z2ComponentTypeForGroup(groupKey);
  const allLaps = collectZ2ComponentLaps(workouts, componentType);
  const usableLaps = allLaps.filter(isUsableZ2ComponentLap);
  if (!allLaps.length) return "";

  const periodLaps = filterLapsByRecentMonths(usableLaps, state.z2PeriodMonths);
  const analysisLaps = periodLaps.length ? periodLaps : usableLaps;
  const shownLaps = analysisLaps.slice(0, 14);
  const bucketStats = z2LapBucketStats(analysisLaps, componentType);
  const completeness = z2LapCompleteness(allLaps, componentType);
  const bestLap = bestZ2ComponentLap(usableLaps, componentType);
  const recentAvg = z2LapAverages(shownLaps, componentType);

  return `
    <article class="z2-erg-analysis-panel">
      <div class="z2-chart-header">
        <div>
          <span>Lap-vergelijking</span>
          <strong>${intervalExerciseTypeLabels[componentType]} per blokduur</strong>
        </div>
        <small>${analysisLaps.length} bruikbare lap(s) · ${state.z2PeriodMonths} maanden filter</small>
      </div>
      <div class="z2-erg-kpi-grid">
        <div>
          <span>Recente waarde</span>
          <strong>${componentType === "bike_erg" ? formatWatts(recentAvg.avgWatts) : formatPace500(recentAvg.pace500Sec)}</strong>
          <small>${recentAvg.avgHr ? `${Math.round(recentAvg.avgHr)} bpm` : "HR -"} · ${shownLaps.length} lap(s)</small>
        </div>
        <div>
          <span>Beste referentie</span>
          <strong>${bestLap ? z2LapPrimaryMetric(bestLap, componentType) : "-"}</strong>
          <small>${bestLap ? `${formatDate(bestLap.date)} · ${bestLap.bucketLabel}` : "Nog geen referentie"}</small>
        </div>
        <div>
          <span>Datakwaliteit</span>
          <strong>${completeness.label}</strong>
          <small>${completeness.detail}</small>
        </div>
      </div>
      ${bucketStats.length ? `
        <div class="z2-erg-buckets">
          ${bucketStats.map((bucket) => `
            <div>
              <span>${escapeHtml(bucket.label)}</span>
              <strong>${componentType === "bike_erg" ? formatWatts(bucket.avgWatts) : formatPace500(bucket.pace500Sec)}</strong>
              <small>${bucket.avgHr ? `${Math.round(bucket.avgHr)} bpm` : "HR -"} · ${bucket.count} lap(s)</small>
            </div>
          `).join("")}
        </div>
      ` : ""}
      ${usableLaps.length ? `<div class="z2-erg-lap-table">
        <div class="z2-erg-lap-row z2-erg-lap-head">
          <span>Datum / workout</span>
          <span>Blok</span>
          <span>Tijd</span>
          <span>${componentType === "bike_erg" ? "Watt" : "/500m"}</span>
          <span>HR</span>
          <span>Vergelijking</span>
        </div>
        ${shownLaps.map((lap) => renderZ2ErgLapRow(lap, usableLaps, componentType)).join("")}
      </div>` : `<p class="empty-state">Er zijn wel laps voor dit onderdeel, maar nog geen laps die voldoen aan de analyse-regels.</p>`}
    </article>
  `;
}

function collectZ2ComponentLaps(workouts, componentType) {
  return workouts
    .flatMap((workout) => (workout.intervals || [])
      .filter((interval) => interval.exerciseType === componentType && isZ2AnalysisWorkInterval(interval))
      .map((interval) => z2ComponentLapFromInterval(workout, interval, componentType)))
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date) || b.startOffsetSeconds - a.startOffsetSeconds);
}

function z2ComponentLapFromInterval(workout, interval, componentType) {
  const durationSeconds = numberOrZero(interval.durationSeconds);
  if (!durationSeconds) return null;
  const manualPace500Sec = manualPace500Seconds(interval);
  const distanceMeters = ergIntervalDistance(interval);
  const pace500Sec = manualPace500Sec || (distanceMeters ? durationSeconds / (distanceMeters / 500) : 0);
  const avgWatts = wattsForInterval(interval);
  const bucket = nearestZ2ErgDurationBucket(durationSeconds / 60);
  const lap = {
    workoutId: workout.id,
    workoutTitle: workout.title || "Training",
    date: workout.date,
    startTime: workout.startTime || "",
    intervalIndex: interval.intervalIndex,
    name: interval.name || `Lap ${interval.intervalIndex || ""}`,
    componentType,
    durationSeconds,
    distanceMeters,
    pace500Sec,
    avgWatts,
    avgHr: validHr(interval.avgHr),
    maxHr: validHr(interval.maxHr),
    load: numberOrZero(workout.load),
    metricUnavailable: Boolean(interval.rawPayload?.metricUnavailable),
    startOffsetSeconds: numberOrZero(interval.startOffsetSeconds),
    bucketTarget: bucket?.target || 0,
    bucketLabel: bucket?.label || "ander blok",
  };
  const quality = z2ComponentLapQuality(lap, componentType);
  return {
    ...lap,
    quality,
    analysisUsable: quality.usable,
  };
}

function isUsableZ2ComponentLap(lap) {
  return Boolean(lap?.analysisUsable);
}

function z2ComponentLapQuality(lap, componentType) {
  const reasons = [];
  const duration = numberOrZero(lap.durationSeconds);

  if (duration < Z2_ANALYSIS_RULES.minWorkBlockSeconds) {
    reasons.push("te kort voor Z2-analyse");
  }

  const maxDuration = componentType === "bike_erg"
    ? Z2_ANALYSIS_RULES.maxBikeWorkBlockSeconds
    : Z2_ANALYSIS_RULES.maxSkiRowWorkBlockSeconds;
  if (duration > maxDuration) {
    reasons.push("blokduur onwaarschijnlijk lang voor dit onderdeel");
  }

  if (lap.metricUnavailable) {
    reasons.push(componentType === "bike_erg" ? "wattage bewust onbekend" : "/500m bewust onbekend");
  } else if (componentType === "bike_erg") {
    const watts = numberOrZero(lap.avgWatts);
    const range = Z2_ANALYSIS_RULES.bikeWattsRange;
    if (!watts) reasons.push("wattage ontbreekt");
    else if (watts < range.min || watts > range.max) reasons.push("wattage buiten analyse-range");
  } else {
    const pace = numberOrZero(lap.pace500Sec);
    const range = Z2_ANALYSIS_RULES.skiRowPace500RangeSec;
    if (!pace) reasons.push("/500m tempo ontbreekt");
    else if (pace < range.min || pace > range.max) reasons.push("/500m tempo buiten analyse-range");
  }

  if (numberOrZero(lap.distanceMeters) > 0 && numberOrZero(lap.distanceMeters) <= 100) {
    reasons.push("verdachte afstand");
  }

  return {
    usable: reasons.length === 0,
    level: reasons.length ? (lap.metricUnavailable ? "known_missing" : "excluded") : "usable",
    label: reasons.length ? reasons.join(", ") : "bruikbaar",
    reasons,
  };
}

function filterLapsByRecentMonths(laps, months) {
  const latest = laps.map((lap) => new Date(lap.date).getTime()).filter(Number.isFinite).sort((a, b) => b - a)[0];
  if (!latest) return laps;
  const end = new Date(latest);
  end.setDate(end.getDate() + 1);
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  return laps.filter((lap) => {
    const date = new Date(lap.date);
    return date >= start && date < end;
  });
}

function z2LapAverages(laps, componentType) {
  const weighted = weightedLapStats(laps, componentType);
  return {
    avgHr: weighted.avgHr,
    avgWatts: weighted.avgWatts,
    pace500Sec: weighted.pace500Sec,
  };
}

function weightedLapStats(laps, componentType) {
  const durationTotal = laps.reduce((sum, lap) => sum + numberOrZero(lap.durationSeconds), 0);
  const distanceTotal = laps.reduce((sum, lap) => sum + numberOrZero(lap.distanceMeters), 0);
  const hrWeighted = laps.reduce((sum, lap) => sum + (validHr(lap.avgHr) && lap.durationSeconds ? validHr(lap.avgHr) * lap.durationSeconds : 0), 0);
  const hrWeight = laps.reduce((sum, lap) => sum + (validHr(lap.avgHr) && lap.durationSeconds ? lap.durationSeconds : 0), 0);
  const wattsWeighted = laps.reduce((sum, lap) => sum + (lap.avgWatts && lap.durationSeconds ? lap.avgWatts * lap.durationSeconds : 0), 0);
  const wattsWeight = laps.reduce((sum, lap) => sum + (lap.avgWatts && lap.durationSeconds ? lap.durationSeconds : 0), 0);
  return {
    avgHr: hrWeight ? hrWeighted / hrWeight : 0,
    avgWatts: componentType === "bike_erg" && wattsWeight ? wattsWeighted / wattsWeight : 0,
    pace500Sec: componentType !== "bike_erg" && durationTotal && distanceTotal ? durationTotal / (distanceTotal / 500) : 0,
  };
}

function z2LapBucketStats(laps, componentType) {
  const buckets = laps.reduce((map, lap) => {
    const key = lap.bucketTarget || "other";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(lap);
    return map;
  }, new Map());

  return [...buckets.entries()]
    .map(([key, bucketLaps]) => {
      const weighted = weightedLapStats(bucketLaps, componentType);
      return {
        key,
        label: key === "other" ? "Andere duur" : `${formatDurationLabel(Number(key))}`,
        count: bucketLaps.length,
        avgHr: weighted.avgHr,
        avgWatts: weighted.avgWatts,
        pace500Sec: weighted.pace500Sec,
      };
    })
    .sort((a, b) => {
      if (a.key === "other") return 1;
      if (b.key === "other") return -1;
      return Number(a.key) - Number(b.key);
    })
    .slice(0, 6);
}

function z2LapCompleteness(laps, componentType) {
  const usableCount = laps.filter(isUsableZ2ComponentLap).length;
  const knownMissing = laps.filter((lap) => lap.quality?.level === "known_missing").length;
  const excluded = laps.filter((lap) => lap.quality?.level === "excluded").length;
  const pct = laps.length ? Math.round((usableCount / laps.length) * 100) : 0;
  return {
    label: `${pct}% compleet`,
    detail: `${usableCount}/${laps.length} bruikbaar${knownMissing ? ` · ${knownMissing} bewust onbekend` : ""}${excluded ? ` · ${excluded} uitgesloten` : ""}`,
  };
}

function bestZ2ComponentLap(laps, componentType) {
  const usable = laps.filter((lap) => componentType === "bike_erg" ? lap.avgWatts : lap.pace500Sec);
  if (!usable.length) return null;
  return [...usable].sort((a, b) => {
    if (componentType === "bike_erg") return z2LapEfficiencyScore(b, componentType) - z2LapEfficiencyScore(a, componentType);
    return z2LapEfficiencyScore(a, componentType) - z2LapEfficiencyScore(b, componentType);
  })[0];
}

function z2LapEfficiencyScore(lap, componentType) {
  const hrPenalty = lap.avgHr ? lap.avgHr / 150 : 1;
  if (componentType === "bike_erg") return lap.avgWatts ? lap.avgWatts / hrPenalty : 0;
  return lap.pace500Sec ? lap.pace500Sec * hrPenalty : Number.POSITIVE_INFINITY;
}

function renderZ2ErgLapRow(lap, allLaps, componentType) {
  const comparison = z2LapComparison(lap, allLaps, componentType);
  return `
    <div class="z2-erg-lap-row" data-workout-id="${escapeHtml(lap.workoutId)}" role="button" tabindex="0">
      <span><strong>${formatDate(lap.date)}</strong><small>${escapeHtml(lap.workoutTitle)} · ${escapeHtml(lap.name)}</small></span>
      <span>${escapeHtml(lap.bucketLabel)}</span>
      <span>${formatSeconds(lap.durationSeconds)}</span>
      <span>${z2LapPrimaryMetric(lap, componentType)}</span>
      <span>${lap.avgHr ? `${Math.round(lap.avgHr)} / ${Math.round(lap.maxHr || lap.avgHr)}` : "-"}</span>
      <span>${escapeHtml(comparison)}</span>
    </div>
  `;
}

function z2LapPrimaryMetric(lap, componentType) {
  if (lap.metricUnavailable) return componentType === "bike_erg" ? "Geen wattage" : "Geen tempo";
  return componentType === "bike_erg" ? formatWatts(lap.avgWatts) : formatPace500(lap.pace500Sec);
}

function z2LapComparison(lap, allLaps, componentType) {
  const previous = allLaps
    .filter((candidate) => {
      if (candidate.workoutId === lap.workoutId && candidate.intervalIndex === lap.intervalIndex) return false;
      if (new Date(candidate.date) >= new Date(lap.date)) return false;
      if (candidate.bucketTarget !== lap.bucketTarget) return false;
      if (componentType === "bike_erg") return Boolean(candidate.avgWatts && lap.avgWatts);
      return Boolean(candidate.pace500Sec && lap.pace500Sec);
    })
    .slice(0, 8);

  if (!previous.length) return lap.metricUnavailable ? "Bewust zonder metric" : "Nieuwe referentie";

  const averages = weightedLapStats(previous, componentType);
  const metricDelta = componentType === "bike_erg"
    ? formatWattsDelta(lap.avgWatts, averages.avgWatts)
    : formatErg500Delta(lap.pace500Sec, averages.pace500Sec);
  const hrDelta = formatHrDelta(lap.avgHr, averages.avgHr);
  return `${metricDelta} · HR ${hrDelta}`;
}

function ergComponentStats(workouts = []) {
  const base = {
    ski_erg: emptyErgComponentStats(),
    row_erg: emptyErgComponentStats(),
    bike_erg: emptyErgComponentStats(),
  };

  workouts.forEach((workout) => {
    const workoutTypes = new Set();
    (workout.intervals || []).forEach((interval) => {
      const type = interval.exerciseType;
      if (!base[type] || !isZ2AnalysisWorkInterval(interval)) return;

      const lap = z2ComponentLapFromInterval(workout, interval, type);
      const stats = base[type];

      stats.laps += 1;
      if (!lap || !lap.analysisUsable) {
        if (lap?.quality?.level === "known_missing") stats.knownMissingLaps += 1;
        else stats.excludedLaps += 1;
        return;
      }

      const durationSeconds = numberOrZero(lap.durationSeconds);
      const distanceMeters = numberOrZero(lap.distanceMeters);
      const avgHr = validHr(lap.avgHr);
      const avgWatts = numberOrZero(lap.avgWatts);

      stats.usableLaps += 1;
      stats.durationSeconds += durationSeconds;
      stats.distanceMeters += distanceMeters;
      stats.maxHr = Math.max(stats.maxHr, validHr(lap.maxHr));
      stats.wattsWeightedTotal += avgWatts && durationSeconds ? avgWatts * durationSeconds : 0;
      stats.wattsWeight += avgWatts && durationSeconds ? durationSeconds : 0;
      stats.hrWeightedTotal += avgHr && durationSeconds ? avgHr * durationSeconds : 0;
      stats.hrWeight += avgHr && durationSeconds ? durationSeconds : 0;
      workoutTypes.add(type);
    });

    workoutTypes.forEach((type) => {
      base[type].sessions += 1;
    });
  });

  Object.values(base).forEach((stats) => {
    stats.avgHr = stats.hrWeight ? stats.hrWeightedTotal / stats.hrWeight : 0;
    stats.avgWatts = stats.wattsWeight ? stats.wattsWeightedTotal / stats.wattsWeight : 0;
    stats.pace500Sec = stats.durationSeconds && stats.distanceMeters
      ? stats.durationSeconds / (stats.distanceMeters / 500)
      : 0;
  });

  return base;
}

function emptyErgComponentStats() {
  return {
    sessions: 0,
    laps: 0,
    usableLaps: 0,
    excludedLaps: 0,
    knownMissingLaps: 0,
    durationSeconds: 0,
    distanceMeters: 0,
    avgHr: 0,
    maxHr: 0,
    avgWatts: 0,
    pace500Sec: 0,
    hrWeightedTotal: 0,
    hrWeight: 0,
    wattsWeightedTotal: 0,
    wattsWeight: 0,
  };
}

function ergIntervalDistance(interval) {
  const manualPace = manualPace500Text(interval);
  const manualDistance = manualPace ? distanceFromPace500(numberOrZero(interval.durationSeconds), manualPace) : 0;
  if (manualDistance) return manualDistance;
  const distance = numberOrZero(interval.distanceMeters);
  if (distance) return distance;
  return 0;
}

function renderErgComponentCard(type, stats, previousStats) {
  const isBike = type === "bike_erg";
  const label = intervalExerciseTypeLabels[type] || type;
  const primary = isBike
    ? (stats.avgWatts ? `${Math.round(stats.avgWatts)} W` : "-")
    : (stats.pace500Sec ? `${paceTextFromSeconds(stats.pace500Sec)}/500m` : "-");
  const delta = isBike
    ? formatErgWattsDelta(stats.avgWatts, previousStats.avgWatts)
    : formatErg500Delta(stats.pace500Sec, previousStats.pace500Sec);
  const distance = stats.distanceMeters ? `${(stats.distanceMeters / 1000).toFixed(1)} km` : "afstand -";
  const hr = stats.avgHr ? `${Math.round(stats.avgHr)} bpm` : "HR -";

  return `
    <article class="z2-erg-card">
      <div>
        <span>${label}</span>
        <strong>${primary}</strong>
        <small>${delta}</small>
      </div>
      <dl>
        <div><dt>Tijd</dt><dd>${stats.durationSeconds ? formatSeconds(stats.durationSeconds) : "-"}</dd></div>
        <div><dt>HR</dt><dd>${hr}${stats.maxHr ? ` / ${Math.round(stats.maxHr)}` : ""}</dd></div>
        <div><dt>Afstand</dt><dd>${distance}</dd></div>
        <div><dt>Laps</dt><dd>${stats.laps || "-"}</dd></div>
      </dl>
    </article>
  `;
}

function formatErg500Delta(current, previous) {
  if (!current || !previous) return "Geen vorige periode";
  const delta = current - previous;
  return `${formatSignedPace(delta).replace("/km", "/500m")} · ${delta <= 0 ? "sneller" : "langzamer"}`;
}

function formatErgWattsDelta(current, previous) {
  if (!current || !previous) return "Geen vorige periode";
  const delta = current - previous;
  if (!Math.round(delta)) return "Gelijk vermogen";
  return `${delta > 0 ? "+" : ""}${Math.round(delta)} W · ${delta >= 0 ? "hoger" : "lager"}`;
}

function renderZ2DataQualityPanel(groupKey, workouts) {
  const quality = z2DataQualitySummary(groupKey, workouts);
  if (!quality.total) return "";

  return `
    <article class="z2-quality-panel ${quality.usablePct >= 80 ? "is-good" : quality.usablePct >= 50 ? "is-warning" : "is-low"}">
      <div>
        <span>Datakwaliteit analyse</span>
        <strong>${quality.usablePct}% bruikbaar</strong>
        <small>${quality.summary}</small>
      </div>
      <div class="z2-quality-grid">
        <div><strong>${quality.usable}</strong><span>meegeteld</span></div>
        <div><strong>${quality.excluded}</strong><span>uitgesloten</span></div>
        <div><strong>${quality.knownMissing}</strong><span>bewust onbekend</span></div>
        <div><strong>${quality.total}</strong><span>totaal</span></div>
      </div>
    </article>
  `;
}

function z2DataQualitySummary(groupKey, workouts) {
  if (isErgComponentGroup(groupKey) || groupKey === "bike") {
    const componentType = z2ComponentTypeForGroup(groupKey);
    const laps = collectZ2ComponentLaps(workouts, componentType);
    const usable = laps.filter(isUsableZ2ComponentLap).length;
    const knownMissing = laps.filter((lap) => lap.quality?.level === "known_missing").length;
    const excluded = laps.filter((lap) => lap.quality?.level === "excluded").length;
    const topReasons = uniqueValues(laps
      .filter((lap) => !lap.analysisUsable)
      .flatMap((lap) => lap.quality?.reasons || []))
      .slice(0, 2);
    return {
      total: laps.length,
      usable,
      excluded,
      knownMissing,
      usablePct: laps.length ? Math.round((usable / laps.length) * 100) : 0,
      summary: topReasons.length
        ? `Niet meegeteld: ${topReasons.join(", ")}.`
        : "Alle relevante laps voldoen aan de analyse-regels.",
    };
  }

  const total = workouts.length;
  const usable = workouts.filter((workout) => paceSecondsPerKm(workout) && validHr(workout.avgHr)).length;
  const excluded = total - usable;
  return {
    total,
    usable,
    excluded,
    knownMissing: 0,
    usablePct: total ? Math.round((usable / total) * 100) : 0,
    summary: excluded ? "Run-analyse vraagt pace en realistische hartslag." : "Alle run-sessies hebben pace en HR.",
  };
}

function renderZ2TestZoneCard(groupKey, currentStats, workouts) {
  const zone = z2ZoneForGroup(groupKey);
  const zoneWorkouts = workoutsSinceTestDate(currentStats.workouts || workouts);
  const zoneStats = zoneWorkouts.length ? z2StatsForGroupWorkouts(zoneWorkouts, groupKey) : currentStats;
  const compliance = z2HrComplianceForGroup(groupKey, zoneWorkouts, zone);
  const z2 = zone.z2;
  const currentPace = zoneStats.paceSecPerKm;
  const currentSpeed = zoneStats.speedKmh;
  const currentHr = zoneStats.avgHr;
  const primaryValue = groupKey === "run"
    ? (currentPace ? formatPacePerKm(currentPace) : "-")
    : groupKey === "bike"
      ? formatWatts(zoneStats.avgWatts)
      : formatPace500(zoneStats.pace500Sec);
  const paceStatus = groupKey === "run" ? runPaceZoneStatus(currentPace) : zone.note;
  const hrStatus = z2HrZoneStatus(currentHr, zone);

  return `
    <article class="z2-zone-card">
      <div class="z2-zone-header">
        <div>
          <span>Nieuwe testzones · VO2max ${RUN_TEST_PROFILE.vo2Max}</span>
          <strong>${zone.label}: ${zone.paceLabel} · ${z2.hrMin}-${z2.hrMax} bpm</strong>
        </div>
        <small>Test ${formatDate(RUN_TEST_PROFILE.date)} · D1 ${zone.threshold1Hr} bpm · D2 ${zone.threshold2Hr} bpm · max aeroob ${zone.maxAerobicHr} bpm</small>
      </div>
      <div class="z2-zone-grid">
        <div>
          <span>Deze periode</span>
          <strong>${primaryValue} · ${currentHr ? `${Math.round(currentHr)} bpm` : "HR -"}</strong>
          <small>${paceStatus} · ${hrStatus}</small>
        </div>
        <div>
          <span>Binnen Z2 HR</span>
          <strong>${compliance.total ? `${Math.round((compliance.inZone / compliance.total) * 100)}%` : "-"}</strong>
          <small>${compliance.inZone}/${compliance.total} sessie(s) sinds ${formatDate(RUN_TEST_PROFILE.date)} binnen ${z2.hrMin}-${z2.hrMax} bpm</small>
        </div>
        <div>
          <span>Te hoog</span>
          <strong>${compliance.above}</strong>
          <small>Gemiddelde HR boven Z2; mogelijk Z3/te hard.</small>
        </div>
        <div>
          <span>Te laag</span>
          <strong>${compliance.below}</strong>
          <small>Gemiddelde HR onder Z2; eerder herstel/Z1.</small>
        </div>
      </div>
    </article>
  `;
}

function workoutsSinceTestDate(workouts) {
  const testDate = new Date(RUN_TEST_PROFILE.date);
  return workouts.filter((workout) => new Date(workout.date) >= testDate);
}

function z2ZoneForGroup(groupKey) {
  const offset = groupKey === "bike" ? -10 : 0;
  const base = RUN_TEST_PROFILE.zones.z2;
  const withOffset = (value) => value + offset;
  const label = groupKey === "bike"
    ? "BikeErg Z2"
    : groupKey === "ski_erg"
      ? "SkiErg Z2"
      : groupKey === "row_erg"
        ? "RowErg Z2"
      : "Z2 hardlopen";
  const note = groupKey === "bike"
    ? "BikeErg zones zijn 10 bpm lager dan de looptest"
    : isErgComponentGroup(groupKey)
      ? "Ski/Row gebruiken de loopzones als eerste proxy"
      : "tempo volgens looptest";

  return {
    label,
    note,
    paceLabel: groupKey === "run" ? `${base.paceSlow}-${base.paceFast}/km` : "HR gestuurd",
    threshold1Hr: withOffset(RUN_TEST_PROFILE.threshold1.hr),
    threshold2Hr: withOffset(RUN_TEST_PROFILE.threshold2.hr),
    maxAerobicHr: withOffset(RUN_TEST_PROFILE.maxAerobic.hr),
    z2: {
      ...base,
      hrMin: withOffset(base.hrMin),
      hrMax: withOffset(base.hrMax),
    },
  };
}

function z2HrCompliance(workouts, zone) {
  return workouts.reduce((summary, workout) => {
    const hr = validHr(workout.avgHr);
    if (!hr) return summary;
    summary.total += 1;
    if (hr < zone.z2.hrMin) summary.below += 1;
    else if (hr > zone.z2.hrMax) summary.above += 1;
    else summary.inZone += 1;
    return summary;
  }, { total: 0, inZone: 0, above: 0, below: 0 });
}

function z2HrComplianceForGroup(groupKey, workouts, zone) {
  if (!(isErgComponentGroup(groupKey) || groupKey === "bike")) {
    return z2HrCompliance(workouts, zone);
  }

  const componentType = z2ComponentTypeForGroup(groupKey);
  return collectZ2ComponentLaps(workouts, componentType)
    .filter(isUsableZ2ComponentLap)
    .reduce((summary, lap) => {
      const hr = validHr(lap.avgHr);
      if (!hr) return summary;
      summary.total += 1;
      if (hr < zone.z2.hrMin) summary.below += 1;
      else if (hr > zone.z2.hrMax) summary.above += 1;
      else summary.inZone += 1;
      return summary;
    }, { total: 0, inZone: 0, above: 0, below: 0 });
}

function runPaceZoneStatus(paceSecPerKm) {
  if (!paceSecPerKm) return "pace ontbreekt";
  if (paceSecPerKm > Z2_RUN_BASELINE.paceSlowSecPerKm) return "langzamer dan Z2-tempo";
  if (paceSecPerKm < Z2_RUN_BASELINE.paceFastSecPerKm) return "sneller dan Z2-tempo";
  return "tempo binnen Z2";
}

function z2HrZoneStatus(avgHr, zone) {
  if (!avgHr) return "HR ontbreekt";
  if (avgHr < zone.z2.hrMin) return "HR onder Z2";
  if (avgHr > zone.z2.hrMax) return "HR boven Z2";
  return "HR binnen Z2";
}

function renderZ2VisualSummary(group, workouts, currentStats) {
  if (!workouts.length) return "";

  const yearBackStats = z2YearBackStats(workouts, state.z2PeriodMonths, group.key);
  const yearBackText = z2YearBackText(group.key, currentStats, yearBackStats);
  const trendData = z2TrendData(workouts, group.key, state.z2PeriodMonths);
  const trendChart = renderZ2TrendChart(trendData, group.key);
  const trendUnit = trendData[0]?.source === "lap" ? "blok(ken)" : "maand(en)";

  return `
    <div class="z2-visual-grid">
      <article class="z2-chart-card">
        <div class="z2-chart-header">
          <div>
            <span>${state.z2PeriodMonths === 1 ? "1 maand trend" : `${state.z2PeriodMonths} maanden trend`}</span>
            <strong>${group.key === "run" ? "Pace + HR" : group.key === "bike" ? "Wattage + HR" : "/500m + HR"}</strong>
          </div>
          <small>${trendData.filter((point) => point.count).length} ${trendUnit} met data</small>
        </div>
        ${trendChart}
      </article>
      <article class="z2-chart-card">
        <div class="z2-chart-header">
          <div>
            <span>Jaar-terug check</span>
            <strong>${yearBackText.title}</strong>
          </div>
          <small>${state.z2PeriodMonths}m nu vs zelfde periode vorig jaar</small>
        </div>
        <p class="z2-chart-copy">${yearBackText.body}</p>
        <div class="z2-year-grid">
          ${renderZ2YearMetric("Nu", group.key, currentStats)}
          ${renderZ2YearMetric("Vorig jaar", group.key, yearBackStats)}
        </div>
      </article>
    </div>
  `;
}

function z2TrendData(workouts, groupKey, months = 12) {
  if (isErgComponentGroup(groupKey) || groupKey === "bike") {
    return z2ComponentTrend(workouts, groupKey, months);
  }
  return z2MonthlyTrend(workouts, groupKey, months);
}

function z2YearBackStats(workouts, months, groupKey) {
  const anchor = latestWorkoutDate(workouts) || new Date();
  const end = new Date(anchor);
  end.setFullYear(end.getFullYear() - 1);
  end.setDate(end.getDate() + 1);
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  return (isErgComponentGroup(groupKey) || groupKey === "bike")
    ? z2StatsForGroupWorkouts(workouts.filter((workout) => {
      const date = new Date(workout.date);
      return date >= start && date < end;
    }), groupKey)
    : z2StatsForDateRange(workouts, start, end);
}

function z2StatsForDateRange(workouts, start, end) {
  return z2StatsForWorkouts(workouts.filter((workout) => {
    const date = new Date(workout.date);
    return date >= start && date < end;
  }));
}

function z2YearBackText(groupKey, currentStats, yearBackStats) {
  if (!yearBackStats.count) {
    return {
      title: "Nog geen jaarbasis",
      body: "Er is in dezelfde periode vorig jaar nog geen vergelijkbare Z2-data gevonden.",
    };
  }

  if (groupKey === "run") {
    const paceDelta = currentStats.paceSecPerKm && yearBackStats.paceSecPerKm ? currentStats.paceSecPerKm - yearBackStats.paceSecPerKm : 0;
    const hrDelta = currentStats.avgHr && yearBackStats.avgHr ? currentStats.avgHr - yearBackStats.avgHr : 0;
    const isBetter = (paceDelta <= -5 && hrDelta <= 2) || (hrDelta <= -2 && paceDelta <= 5);
    return {
      title: isBetter ? "Beter dan vorig jaar" : "Vergelijk met nuance",
      body: `Ten opzichte van dezelfde periode vorig jaar: ${formatSignedPace(paceDelta)} en ${formatSignedNumber(hrDelta, "bpm")}.`,
    };
  }

  if (groupKey === "bike") {
    const wattsDelta = currentStats.avgWatts && yearBackStats.avgWatts ? currentStats.avgWatts - yearBackStats.avgWatts : 0;
    const hrDelta = currentStats.avgHr && yearBackStats.avgHr ? currentStats.avgHr - yearBackStats.avgHr : 0;
    return {
      title: wattsDelta >= 5 || hrDelta <= -2 ? "Beter dan vorig jaar" : "Vergelijk met nuance",
      body: `Ten opzichte van dezelfde periode vorig jaar: ${formatWattsDelta(currentStats.avgWatts, yearBackStats.avgWatts)} en ${formatSignedNumber(hrDelta, "bpm")}.`,
    };
  }

  const paceDelta = currentStats.pace500Sec && yearBackStats.pace500Sec ? currentStats.pace500Sec - yearBackStats.pace500Sec : 0;
  const hrDelta = currentStats.avgHr && yearBackStats.avgHr ? currentStats.avgHr - yearBackStats.avgHr : 0;
  return {
    title: paceDelta <= -2 || hrDelta <= -2 ? "Beter dan vorig jaar" : "Jaarbasis beschikbaar",
    body: `Ten opzichte van dezelfde periode vorig jaar: ${formatErg500Delta(currentStats.pace500Sec, yearBackStats.pace500Sec)} en ${formatSignedNumber(hrDelta, "bpm")}.`,
  };
}

function renderZ2YearMetric(label, groupKey, stats) {
  const primary = groupKey === "run"
    ? formatPacePerKm(stats.paceSecPerKm)
    : groupKey === "bike"
      ? formatWatts(stats.avgWatts)
      : formatPace500(stats.pace500Sec);
  return `
    <div>
      <span>${label}</span>
      <strong>${primary}</strong>
      <small>${stats.avgHr ? `${Math.round(stats.avgHr)} bpm` : "HR -"} · ${stats.count} sessie(s)</small>
    </div>
  `;
}

function z2MonthlyTrend(workouts, groupKey, months = 12) {
  const anchor = latestWorkoutDate(workouts) || new Date();
  const points = [];
  for (let index = months - 1; index >= 0; index -= 1) {
    const start = new Date(anchor.getFullYear(), anchor.getMonth() - index, 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() - index + 1, 1);
    const stats = (isErgComponentGroup(groupKey) || groupKey === "bike")
      ? z2StatsForGroupWorkouts(workouts.filter((workout) => {
        const date = new Date(workout.date);
        return date >= start && date < end;
      }), groupKey)
      : z2StatsForDateRange(workouts, start, end);
    const metric = groupKey === "run"
      ? stats.paceSecPerKm
      : groupKey === "bike"
        ? stats.avgWatts
        : stats.pace500Sec;
    points.push({
      label: start.toLocaleDateString("nl-NL", { month: "short" }),
      count: stats.count,
      metric,
      hr: stats.avgHr,
      load: stats.load,
      totalLoad: stats.totalLoad,
      volume: stats.totalDurationMin,
      distance: stats.totalDistanceKm,
    });
  }
  return points;
}

function z2ComponentTrend(workouts, groupKey, months = 12) {
  const componentType = z2ComponentTypeForGroup(groupKey);
  const anchor = latestWorkoutDate(workouts) || new Date();
  const end = new Date(anchor);
  end.setDate(end.getDate() + 1);
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  return collectZ2ComponentLaps(workouts, componentType)
    .filter(isUsableZ2ComponentLap)
    .filter((lap) => {
      const date = new Date(lap.date);
      return date >= start && date < end;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.startOffsetSeconds - b.startOffsetSeconds)
    .map((lap) => ({
      label: formatDate(lap.date),
      shortLabel: z2CompactDateLabel(lap.date),
      count: 1,
      source: "lap",
      workoutTitle: lap.workoutTitle,
      lapName: lap.name,
      bucketLabel: lap.bucketLabel,
      metric: groupKey === "bike" ? lap.avgWatts : lap.pace500Sec,
      hr: lap.avgHr,
      load: lap.load,
      totalLoad: lap.load,
      volume: lap.durationSeconds / 60,
      distance: lap.distanceMeters / 1000,
      durationSeconds: lap.durationSeconds,
    }));
}

function z2CompactDateLabel(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("nl-NL", { day: "2-digit", month: "short" }).replace(".", "");
}

function renderZ2TrendChart(points, groupKey) {
  const metricPoints = points.map((point) => point.metric).filter(Boolean);
  const hrPoints = points.map((point) => point.hr).filter(Boolean);
  const loadPoints = points.map((point) => point.load).filter(Boolean);
  const populatedPoints = points.filter((point) => point.count && (point.metric || point.hr || point.load || point.volume));
  if (metricPoints.length < 2) {
    const latest = populatedPoints[populatedPoints.length - 1];
    const metricLabel = groupKey === "run" ? "pace" : groupKey === "bike" ? "wattage" : "/500m";
    const dataUnit = points[0]?.source === "lap" ? "blok" : "maand";
    return `
      <div class="z2-chart-empty">
        <strong>${metricPoints.length ? "Nog geen trend" : "Metric ontbreekt"}</strong>
        <span>${metricPoints.length ? `Er is nu maar 1 ${dataUnit} met ${metricLabel}-data. Vanaf 2 punten tekenen we een echte trendlijn.` : `Er is wel data gevonden, maar nog geen bruikbare ${metricLabel}-waarde voor deze periode.`}</span>
        ${latest ? `<small>Laatste datapunt: ${escapeHtml(latest.label)} · ${z2TrendPrimaryValue(latest, groupKey)} · ${latest.hr ? `${Math.round(latest.hr)} bpm` : "HR -"}</small>` : ""}
      </div>
    `;
  }

  const width = 640;
  const height = 230;
  const padding = { top: 20, right: 22, bottom: 36, left: 42 };
  const metricRange = paddedRange(metricPoints);
  const hrRange = paddedRange(hrPoints.length ? hrPoints : [0, 1]);
  const loadRange = paddedRange(loadPoints.length ? loadPoints : [0, 1]);
  const xFor = (index) => padding.left + (index * ((width - padding.left - padding.right) / Math.max(points.length - 1, 1)));
  const yMetric = (value) => scaleToY(value, metricRange, height, padding, groupKey !== "bike");
  const yHr = (value) => scaleToY(value, hrRange, height, padding, false);
  const yLoad = (value) => scaleToY(value, loadRange, height, padding, false);
  const metricPath = svgPath(points, xFor, yMetric, "metric");
  const hrPath = svgPath(points, xFor, yHr, "hr");
  const loadPath = svgPath(points, xFor, yLoad, "load");
  const visible = state.z2VisibleMetrics;
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));

  return `
    <svg class="z2-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Z2 trendgrafiek">
      <line class="z2-axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" />
      <line class="z2-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" />
      ${points.map((point, index) => {
        const x = xFor(index);
        const barHeight = point.volume ? Math.max(4, Math.min(44, point.volume / 3)) : 0;
        const showLabel = index === 0 || index === points.length - 1 || index % labelEvery === 0;
        return `
          ${visible.volume ? `<rect class="z2-volume-bar" x="${x - 9}" y="${height - padding.bottom - barHeight}" width="18" height="${barHeight}" rx="3" data-z2-tooltip="${escapeHtml(z2TrendTooltip(point, groupKey))}" />` : ""}
          ${showLabel ? `<text class="z2-chart-label" x="${x}" y="${height - 12}">${escapeHtml(point.shortLabel || point.label)}</text>` : ""}
        `;
      }).join("")}
      ${visible.metric && metricPath ? `<path class="z2-metric-line" d="${metricPath}" />` : ""}
      ${visible.hr && hrPath ? `<path class="z2-hr-line" d="${hrPath}" />` : ""}
      ${visible.load && loadPath ? `<path class="z2-load-line" d="${loadPath}" />` : ""}
      ${points.map((point, index) => {
        const x = xFor(index);
        const tooltip = escapeHtml(z2TrendTooltip(point, groupKey));
        return `
          ${visible.metric && point.metric ? `<circle class="z2-metric-dot z2-chart-point" cx="${x}" cy="${yMetric(point.metric)}" r="7" tabindex="0" data-z2-tooltip="${tooltip}"></circle>` : ""}
          ${visible.hr && point.hr ? `<circle class="z2-hr-dot z2-chart-point" cx="${x}" cy="${yHr(point.hr)}" r="6" tabindex="0" data-z2-tooltip="${tooltip}"></circle>` : ""}
          ${visible.load && point.load ? `<circle class="z2-load-dot z2-chart-point" cx="${x}" cy="${yLoad(point.load)}" r="6" tabindex="0" data-z2-tooltip="${tooltip}"></circle>` : ""}
        `;
      }).join("")}
    </svg>
    <div class="z2-chart-legend">
      ${visible.metric ? `<span><i class="metric"></i>${groupKey === "run" ? "Pace" : groupKey === "bike" ? "Wattage" : "/500m"}</span>` : ""}
      ${visible.hr ? `<span><i class="hr"></i>Hartslag</span>` : ""}
      ${visible.load ? `<span><i class="load"></i>Load</span>` : ""}
      ${visible.volume ? `<span><i class="volume"></i>Volume</span>` : ""}
    </div>
    <div class="z2-chart-hover" data-z2-hover-panel>Hover over een punt om pace, HR, load en volume te zien.</div>
  `;
}

function z2TrendPrimaryValue(point, groupKey) {
  if (groupKey === "run") return formatPacePerKm(point.metric);
  if (groupKey === "bike") return formatWatts(point.metric);
  return formatPace500(point.metric);
}

function renderZ2RunEfficiencyChart(workouts) {
  const points = workouts
    .filter((workout) => paceSecondsPerKm(workout) && validHr(workout.avgHr))
    .slice(0, 60)
    .reverse();
  if (points.length < 3) return "";

  const width = 640;
  const height = 230;
  const padding = { top: 20, right: 22, bottom: 38, left: 44 };
  const paceRange = paddedRange(points.map((workout) => paceSecondsPerKm(workout)));
  const hrRange = paddedRange(points.map((workout) => validHr(workout.avgHr)));
  const xFor = (hr) => scaleLinear(hr, hrRange.min, hrRange.max, padding.left, width - padding.right);
  const yFor = (pace) => scaleLinear(pace, paceRange.min, paceRange.max, padding.top, height - padding.bottom);

  return `
    <article class="z2-chart-card z2-chart-card-wide">
      <div class="z2-chart-header">
        <div>
          <span>Efficiency map</span>
          <strong>Zelfde hartslag, sneller tempo</strong>
        </div>
        <small>Laatste ${points.length} Z2-runs</small>
      </div>
      <svg class="z2-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Z2 efficiency scatterplot">
        <line class="z2-axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" />
        <line class="z2-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" />
        <text class="z2-chart-label z2-axis-label" x="${padding.left}" y="${height - 12}">Lagere HR</text>
        <text class="z2-chart-label z2-axis-label" x="${width - padding.right}" y="${height - 12}">Hogere HR</text>
        <text class="z2-chart-label z2-axis-label" x="${padding.left + 4}" y="${padding.top + 10}">Sneller</text>
        <text class="z2-chart-label z2-axis-label" x="${padding.left + 4}" y="${height - padding.bottom - 8}">Langzamer</text>
        ${points.map((workout, index) => {
          const ageRatio = points.length <= 1 ? 1 : index / (points.length - 1);
          return `
            <circle class="z2-efficiency-dot z2-chart-point" style="opacity:${0.35 + (ageRatio * 0.65)}" cx="${xFor(validHr(workout.avgHr))}" cy="${yFor(paceSecondsPerKm(workout))}" r="${index === points.length - 1 ? 6 : 4}" tabindex="0" data-z2-tooltip="${escapeHtml(z2WorkoutTooltip(workout))}"></circle>
          `;
        }).join("")}
      </svg>
      <p class="z2-chart-copy">Punten die hoger en verder links liggen zijn gunstiger: sneller tempo bij lagere hartslag. Donkerder is recenter.</p>
      <div class="z2-chart-hover" data-z2-hover-panel>Hover over een punt om titel, pace, HR, load, afstand en duur te zien.</div>
    </article>
  `;
}

function z2TrendTooltip(point, groupKey) {
  const metric = groupKey === "run"
    ? formatPacePerKm(point.metric)
    : groupKey === "bike"
      ? formatWatts(point.metric)
      : formatPace500(point.metric);
  if (point.source === "lap") {
    return [
      `${point.label} · ${point.workoutTitle || "Training"}`,
      point.lapName ? `Blok: ${point.lapName} · ${point.bucketLabel || "-"}` : "",
      `${groupKey === "bike" ? "Wattage" : "/500m"}: ${metric}`,
      `HR: ${point.hr ? `${Math.round(point.hr)} bpm` : "-"}`,
      `Tijd: ${formatSeconds(point.durationSeconds)}`,
      `Afstand: ${point.distance ? `${point.distance.toFixed(2)} km` : "-"}`,
      `Load: ${point.load ? Math.round(point.load) : "-"}`,
    ].filter(Boolean).join("\n");
  }
  return [
    point.label,
    `${groupKey === "run" ? "Pace" : groupKey === "bike" ? "Wattage" : "/500m"}: ${metric}`,
    `HR: ${point.hr ? `${Math.round(point.hr)} bpm` : "-"}`,
    `Load: ${point.load ? Math.round(point.load) : "-"}`,
    `Totaal load: ${point.totalLoad ? Math.round(point.totalLoad) : "-"}`,
    `Volume: ${formatDuration(Math.round(point.volume || 0))}`,
    `Afstand: ${point.distance ? `${point.distance.toFixed(1)} km` : "-"}`,
    `Sessies: ${point.count}`,
  ].join("\n");
}

function z2WorkoutTooltip(workout) {
  return [
    `${formatDate(workout.date)} · ${workout.title}`,
    `Pace: ${paceForWorkout(workout)}`,
    `HR: ${validHr(workout.avgHr) || "-"} / ${validHr(workout.maxHr) || "-"}`,
    `Load: ${workout.load || "-"}`,
    `Afstand: ${formatDistance(workout)}`,
    `Duur: ${formatDuration(numberOrZero(workout.durationMin))}`,
  ].join("\n");
}

function paddedRange(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || Math.max(1, max * 0.08);
  return {
    min: min - spread * 0.12,
    max: max + spread * 0.12,
  };
}

function scaleToY(value, range, height, padding, invert = false) {
  if (!value) return height - padding.bottom;
  return invert
    ? scaleLinear(value, range.min, range.max, padding.top, height - padding.bottom)
    : scaleLinear(value, range.min, range.max, height - padding.bottom, padding.top);
}

function scaleLinear(value, inputMin, inputMax, outputMin, outputMax) {
  if (inputMax === inputMin) return (outputMin + outputMax) / 2;
  const ratio = (value - inputMin) / (inputMax - inputMin);
  return outputMin + ratio * (outputMax - outputMin);
}

function svgPath(points, xFor, yFor, key) {
  const commands = [];
  points.forEach((point, index) => {
    const value = point[key];
    if (!value) return;
    commands.push(`${commands.length ? "L" : "M"} ${xFor(index).toFixed(1)} ${yFor(value).toFixed(1)}`);
  });
  return commands.join(" ");
}

function z2MetricTooltip(point, groupKey) {
  const metric = groupKey === "run"
    ? formatPacePerKm(point.metric)
    : groupKey === "bike"
      ? formatWatts(point.metric)
      : formatPace500(point.metric);
  return `${point.label} · ${metric} · HR ${point.hr ? Math.round(point.hr) : "-"}`;
}

function z2PeriodStats(workouts, months, previousOffset = 0) {
  const anchor = latestWorkoutDate(workouts) || new Date();
  const end = new Date(anchor);
  end.setDate(end.getDate() + 1);
  end.setMonth(end.getMonth() - (months * previousOffset));
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);

  const periodWorkouts = workouts.filter((workout) => {
    const date = new Date(workout.date);
    return date >= start && date < end;
  });
  const durationMin = periodWorkouts.reduce((sum, workout) => sum + numberOrZero(workout.durationMin), 0);
  const distanceKm = periodWorkouts.reduce((sum, workout) => sum + numberOrZero(workout.distanceKm), 0);
  const paceValues = periodWorkouts.map((workout) => paceSecondsPerKm(workout)).filter(Boolean);
  const speedValues = periodWorkouts.map((workout) => speedKmh(workout)).filter(Boolean);

  return {
    workouts: periodWorkouts,
    count: periodWorkouts.length,
    durationMin,
    distanceKm,
    avgHr: average(periodWorkouts.map((workout) => validHr(workout.avgHr))),
    load: average(periodWorkouts.map((workout) => numberOrZero(workout.load))),
    totalLoad: periodWorkouts.reduce((sum, workout) => sum + numberOrZero(workout.load), 0),
    paceSecPerKm: average(paceValues),
    speedKmh: average(speedValues),
    skiPace500: averagePaceField(periodWorkouts, "skiPace500"),
    rowPace500: averagePaceField(periodWorkouts, "rowPace500"),
    bikePace500: averagePaceField(periodWorkouts, "bikePace500"),
  };
}

function z2GroupPeriodStats(workouts, months, previousOffset, groupKey) {
  const stats = z2PeriodStats(workouts, months, previousOffset);
  return (isErgComponentGroup(groupKey) || groupKey === "bike")
    ? { ...stats, ...z2StatsForGroupWorkouts(stats.workouts, groupKey), workouts: stats.workouts }
    : stats;
}

function latestWorkoutDate(workouts) {
  const timestamps = workouts
    .map((workout) => new Date(workout.date).getTime())
    .filter(Number.isFinite);
  return timestamps.length ? new Date(Math.max(...timestamps)) : null;
}

function paceSecondsPerKm(workout) {
  const fromText = secondsFromPaceText(String(workout.avgPace || "").replace("/km", ""));
  if (fromText) return fromText;
  const distance = numberOrZero(workout.distanceKm);
  const duration = numberOrZero(workout.durationMin);
  return distance && duration ? (duration * 60) / distance : 0;
}

function speedKmh(workout) {
  const distance = numberOrZero(workout.distanceKm);
  const duration = numberOrZero(workout.durationMin);
  return distance && duration ? distance / (duration / 60) : 0;
}

function averagePaceField(workouts, field) {
  return average(workouts.map((workout) => secondsFromPaceText(workout.rawPayload?.reviewContext?.z2Metrics?.[field])));
}

function z2ProgressVerdict(groupKey, currentStats, previousStats) {
  if (!currentStats.count) {
    return {
      tone: "is-neutral",
      title: "Nog geen data",
      detail: "Deze periode heeft nog geen vergelijkbare Z2-sessies.",
    };
  }

  if (!previousStats.count) {
    return {
      tone: "is-neutral",
      title: "Nieuwe baseline",
      detail: "Nog geen vorige periode voor een eerlijke vergelijking.",
    };
  }

  const hrDelta = currentStats.avgHr && previousStats.avgHr ? currentStats.avgHr - previousStats.avgHr : 0;
  const paceDelta = currentStats.paceSecPerKm && previousStats.paceSecPerKm
    ? currentStats.paceSecPerKm - previousStats.paceSecPerKm
    : 0;
  const isRunProgress = groupKey === "run"
    && ((paceDelta <= -Z2_ANALYSIS_RULES.runProgressPaceSec && hrDelta <= Z2_ANALYSIS_RULES.hrProgressBpm) || (hrDelta <= -Z2_ANALYSIS_RULES.hrProgressBpm && paceDelta <= Z2_ANALYSIS_RULES.runProgressPaceSec));
  const wattsDelta = currentStats.avgWatts && previousStats.avgWatts ? currentStats.avgWatts - previousStats.avgWatts : 0;
  const isBikeProgress = groupKey === "bike"
    && ((wattsDelta >= Z2_ANALYSIS_RULES.bikeProgressWatts && hrDelta <= Z2_ANALYSIS_RULES.hrProgressBpm) || hrDelta <= -Z2_ANALYSIS_RULES.hrProgressBpm);
  const isErgProgress = isErgComponentGroup(groupKey)
    && (hrDelta <= -Z2_ANALYSIS_RULES.hrProgressBpm || (currentStats.pace500Sec && previousStats.pace500Sec && currentStats.pace500Sec <= previousStats.pace500Sec - Z2_ANALYSIS_RULES.ergProgressPace500Sec));

  if (isRunProgress || isBikeProgress || isErgProgress) {
    const thresholdText = groupKey === "run"
      ? "minimaal 2 bpm lager of 5 sec/km sneller"
      : groupKey === "bike"
        ? "minimaal 2 bpm lager of 5 watt hoger"
        : "minimaal 2 bpm lager of 2 sec/500m sneller";
    return {
      tone: "is-good",
      title: "Progressie zichtbaar",
      detail: `Je haalt jouw drempel: ${thresholdText} bij vergelijkbare inspanning.`,
    };
  }

  const stableThresholdText = groupKey === "run"
    ? "2 bpm of 5 sec/km"
    : groupKey === "bike"
      ? "2 bpm of 5 watt"
      : "2 bpm of 2 sec/500m";
  return {
    tone: "is-neutral",
    title: "Stabiel",
    detail: `Nog geen duidelijke sprong volgens je drempel van ${stableThresholdText}.`,
  };
}

function ergPaceImproved(currentStats, previousStats) {
  return ["skiPace500", "rowPace500", "bikePace500"].some((field) => {
    const current = currentStats[field];
    const previous = previousStats[field];
    return current && previous && current <= previous - 2;
  });
}

function z2BaselineDelta(currentStats) {
  if (!currentStats.count || !currentStats.paceSecPerKm || !currentStats.avgHr) {
    return "Wordt gevuld zodra pace en HR beschikbaar zijn.";
  }

  return `${runPaceZoneStatus(currentStats.paceSecPerKm)} · ${z2HrZoneStatus(currentStats.avgHr, z2ZoneForGroup("run"))}`;
}

function formatPacePerKm(seconds) {
  return seconds ? `${paceTextFromSeconds(seconds)}/km` : "-";
}

function formatPace500(seconds) {
  return seconds ? `${paceTextFromSeconds(seconds)}/500m` : "-";
}

function formatPaceDelta(current, previous) {
  if (!current || !previous) return "Geen vorige periode";
  const delta = current - previous;
  const percentage = previous ? Math.abs((delta / previous) * 100).toFixed(1) : "0.0";
  return `${formatSignedPace(delta)} · ${delta <= 0 ? "sneller" : "langzamer"} (${percentage}%)`;
}

function formatSignedPace(seconds) {
  const rounded = Math.round(numberOrZero(seconds));
  if (!rounded) return "gelijk";
  const prefix = rounded > 0 ? "+" : "-";
  return `${prefix}${paceTextFromSeconds(Math.abs(rounded))}/km`;
}

function formatHrDelta(current, previous) {
  if (!current || !previous) return "Geen vorige periode";
  const delta = current - previous;
  const percentage = previous ? Math.abs((delta / previous) * 100).toFixed(1) : "0.0";
  return `${formatSignedNumber(delta, "bpm")} · ${delta <= 0 ? "lager" : "hoger"} (${percentage}%)`;
}

function formatSignedNumber(value, suffix = "") {
  const rounded = Math.round(numberOrZero(value));
  if (!rounded) return `0${suffix ? ` ${suffix}` : ""}`;
  return `${rounded > 0 ? "+" : ""}${rounded}${suffix ? ` ${suffix}` : ""}`;
}

function formatSpeed(value) {
  return value ? `${value.toFixed(1)} km/u` : "-";
}

function formatWatts(value) {
  return value ? `${Math.round(value)} W` : "-";
}

function formatWattsDelta(current, previous) {
  if (!current || !previous) return "Geen vorige periode";
  const delta = current - previous;
  const percentage = previous ? Math.abs((delta / previous) * 100).toFixed(1) : "0.0";
  if (!Math.round(delta)) return `0 W · gelijk (${percentage}%)`;
  return `${delta > 0 ? "+" : ""}${Math.round(delta)} W · ${delta >= 0 ? "hoger" : "lager"} (${percentage}%)`;
}

function formatSpeedDelta(current, previous) {
  if (!current || !previous) return "Geen vorige periode";
  const delta = current - previous;
  const percentage = previous ? Math.abs((delta / previous) * 100).toFixed(1) : "0.0";
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)} km/u · ${delta >= 0 ? "sneller" : "langzamer"} (${percentage}%)`;
}

function formatErgPaceSummary(stats) {
  const values = [
    stats.skiPace500 ? `Ski ${paceTextFromSeconds(stats.skiPace500)}` : "",
    stats.rowPace500 ? `Row ${paceTextFromSeconds(stats.rowPace500)}` : "",
    stats.bikePace500 ? `Bike ${paceTextFromSeconds(stats.bikePace500)}` : "",
  ].filter(Boolean);
  return values.length ? values.join(" · ") : "-";
}

function formatErgPaceDelta(currentStats, previousStats) {
  const values = [
    ["Ski", currentStats.skiPace500, previousStats.skiPace500],
    ["Row", currentStats.rowPace500, previousStats.rowPace500],
    ["Bike", currentStats.bikePace500, previousStats.bikePace500],
  ]
    .filter(([, current, previous]) => current && previous)
    .map(([label, current, previous]) => `${label} ${formatSignedPace(current - previous)}`);
  return values.length ? values.join(" · ") : "Vul /500m tempo's in voor vergelijking";
}

function renderZ2WorkoutRow(workout, groupKey) {
  const componentStats = z2UsesErgComponentMatching(workout, groupKey) ? z2StatsForGroupWorkouts([workout], groupKey) : null;
  const metricText = groupKey === "run"
    ? paceForWorkout(workout)
    : groupKey === "bike"
      ? componentStats?.avgWatts ? formatWatts(componentStats.avgWatts) : "BikeErg"
      : `${intervalExerciseTypeLabels[groupKey]} ${formatPace500(componentStats?.pace500Sec)}`;
  return `
    <div class="z2-row ${workout.id === state.selectedWorkoutId ? "is-selected" : ""}" data-workout-id="${escapeHtml(workout.id)}" role="button" tabindex="0">
      <span><strong>${formatDate(workout.date)}</strong><small>${escapeHtml(workout.title)}</small></span>
      <span>${formatDuration(Math.round(componentStats?.durationMin || numberOrZero(workout.durationMin)))}</span>
      <span>${componentStats?.distanceKm ? `${componentStats.distanceKm.toFixed(2)} km` : formatDistance(workout)}</span>
      <span>HR ${validHr(workout.avgHr) || "-"} / ${validHr(workout.maxHr) || "-"}</span>
      <span>${metricText}</span>
    </div>
  `;
}

function average(values) {
  const usable = values.filter((value) => Number.isFinite(value) && value > 0);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : 0;
}

function detailRow(label, value) {
  return `<div class="detail-row"><strong>${label}</strong><span>${value}</span></div>`;
}

function optionalDetailRow(label, value, required = false) {
  if (!required && isEmptyDisplayValue(value)) return "";
  return detailRow(escapeHtml(label), escapeHtml(value));
}

function isEmptyDisplayValue(value) {
  return value === null
    || value === undefined
    || value === ""
    || value === "-"
    || value === "0"
    || value === 0;
}

function renderIntervalComparison(selected, previous) {
  const intervals = selected.intervals || [];

  if (!intervals.length) {
    els.intervalComparison.innerHTML = `<p class="empty-state">Deze training heeft nog geen intervalblokken. Voeg bij een 5x1km-training de losse kilometers toe om blok voor blok te vergelijken.</p>`;
    return;
  }

  const previousWithIntervals = previous.filter((workout) => workout.intervals?.length);
  els.intervalComparison.innerHTML = `
    <div class="interval-table">
      <div class="interval-table-row interval-table-head">
        <strong>Blok</strong>
        <strong>Onderdeel</strong>
        <strong>Doel</strong>
        <strong>Afstand</strong>
        <strong>Tijd</strong>
        <strong>Pace</strong>
        <strong>HR</strong>
        <strong>Vorige gem.</strong>
      </div>
      ${intervals.map((interval, index) => {
        const previousMatches = matchingPreviousIntervals(interval, index, previousWithIntervals);
        const previousAvgHr = average(previousMatches.map((item) => validHr(item.avgHr)));
        const previousPace = average(previousMatches.map((item) => numberOrZero(item.durationSeconds)));
        const distanceKm = interval.distanceMeters ? (interval.distanceMeters / 1000).toFixed(2) : "-";

        return `
          <div class="interval-table-row">
            <span>${interval.name || `Blok ${interval.intervalIndex}`}</span>
            <span>
              <select class="compact-select interval-exercise-select" data-interval-index="${interval.intervalIndex}" aria-label="Onderdeel voor ${interval.name || `blok ${interval.intervalIndex}`}">
                ${Object.entries(intervalExerciseTypeLabels).map(([value, label]) => `<option value="${value}" ${value === (interval.exerciseType || "") ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </span>
            <span>
              <select class="compact-select interval-goal-select" data-interval-index="${interval.intervalIndex}" aria-label="Doel voor ${interval.name || `blok ${interval.intervalIndex}`}">
                ${Object.entries(effortGoalLabels).map(([value, label]) => `<option value="${value}" ${value === (interval.effortGoal || "") ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </span>
            <span>${distanceKm === "-" ? "-" : `${distanceKm} km`}</span>
            <span>${formatSeconds(interval.durationSeconds)}</span>
            <span>${paceForInterval(interval)}</span>
            <span>${validHr(interval.avgHr) || "-"} / ${validHr(interval.maxHr) || "-"}</span>
            <span>${previousMatches.length ? `${formatSeconds(previousPace)} · HR ${Math.round(previousAvgHr) || "-"}` : "-"}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function matchingPreviousIntervals(interval, index, previousWithIntervals) {
  if (interval.exerciseType || interval.effortGoal) {
    return previousWithIntervals
      .flatMap((workout) => workout.intervals || [])
      .filter((candidate) => {
        if (interval.exerciseType && candidate.exerciseType !== interval.exerciseType) return false;
        if (interval.effortGoal && candidate.effortGoal !== interval.effortGoal) return false;
        const distanceA = numberOrZero(interval.distanceMeters);
        const distanceB = numberOrZero(candidate.distanceMeters);
        const durationA = numberOrZero(interval.durationSeconds);
        const durationB = numberOrZero(candidate.durationSeconds);
        const distanceMatches = distanceA && distanceB
          ? Math.abs(distanceA - distanceB) <= Math.max(25, distanceA * 0.05)
          : false;
        const durationMatches = durationA && durationB
          ? Math.abs(durationA - durationB) <= Math.max(10, durationA * 0.1)
          : false;
        return distanceMatches || durationMatches || (!distanceA && !durationA);
      });
  }

  return previousWithIntervals
    .map((workout) => workout.intervals[index])
    .filter(Boolean);
}

function renderSegmentAnalysis(selected, previous) {
  const segments = selected.segments || [];

  if (!segments.length) {
    els.segmentAnalysis.innerHTML = `<p class="empty-state">Deze workout heeft nog geen HYROX-onderdelen. Voeg stations toe zoals Run, SkiErg, Sled push of Wall balls om stationtijden en zwakke punten te zien.</p>`;
    return;
  }

  const runSegments = segments.filter((segment) => segment.segmentType === "run");
  const stationSegments = segments.filter((segment) => segment.segmentType !== "run" && segment.segmentType !== "rest" && segment.segmentType !== "transition");
  const totalRunSeconds = runSegments.reduce((sum, segment) => sum + numberOrZero(segment.durationSeconds), 0);
  const totalStationSeconds = stationSegments.reduce((sum, segment) => sum + numberOrZero(segment.durationSeconds), 0);
  const totalRunMeters = runSegments.reduce((sum, segment) => sum + numberOrZero(segment.distanceMeters), 0);
  const avgStationRpe = average(stationSegments.map((segment) => numberOrZero(segment.rpe)));
  const previousByType = previous.flatMap((workout) => workout.segments || []);

  els.segmentAnalysis.innerHTML = `
    <div class="analysis-summary">
      <div class="summary-card">
        <strong>${segments.length} onderdeel(en)</strong>
        <span>${stationSegments.length} station(s), ${runSegments.length} runblok(ken).</span>
      </div>
      <div class="summary-card">
        <strong>${formatSeconds(totalRunSeconds)}</strong>
        <span>Runtijd · ${totalRunMeters ? `${(totalRunMeters / 1000).toFixed(2)} km` : "afstand onbekend"}</span>
      </div>
      <div class="summary-card">
        <strong>${formatSeconds(totalStationSeconds)}</strong>
        <span>Stationtijd exclusief runs, rust en transities.</span>
      </div>
      <div class="summary-card">
        <strong>${avgStationRpe ? avgStationRpe.toFixed(1) : "-"}</strong>
        <span>Gemiddelde station-RPE.</span>
      </div>
    </div>
    <div class="segment-table">
      <div class="segment-table-row segment-table-head">
        <strong>Onderdeel</strong>
        <strong>Tijd</strong>
        <strong>Afstand/Reps</strong>
        <strong>Power/Gewicht</strong>
        <strong>HR/RPE</strong>
        <strong>Vorige gem.</strong>
      </div>
      ${segments.map((segment) => {
        const previousMatches = previousByType.filter((item) => item.segmentType === segment.segmentType);
        const previousSeconds = average(previousMatches.map((item) => numberOrZero(item.durationSeconds)));
        const distanceOrReps = [
          segment.distanceMeters ? `${segment.distanceMeters} m` : "",
          segment.sets ? `${segment.sets} sets` : "",
          segment.reps ? `${segment.reps} reps` : "",
          paceForSegment(segment) !== "-" ? paceForSegment(segment) : "",
        ].filter(Boolean).join(" · ") || "-";
        const powerOrWeight = [
          segment.avgWatts ? `${segment.avgWatts} W` : "",
          segment.weightKg ? `${segment.weightKg} kg` : "",
        ].filter(Boolean).join(" · ") || "-";
        const hrRpe = [
          segment.avgHr ? `HR ${segment.avgHr}${segment.maxHr ? `/${segment.maxHr}` : ""}` : "",
          segment.rpe ? `RPE ${segment.rpe}` : "",
        ].filter(Boolean).join(" · ") || "-";

        return `
          <div class="segment-table-row">
            <span><strong>${segmentTypeLabels[segment.segmentType] || segment.segmentType}</strong><small>${segment.name || "-"}</small></span>
            <span>${formatSeconds(segment.durationSeconds)}</span>
            <span>${distanceOrReps}</span>
            <span>${powerOrWeight}</span>
            <span>${hrRpe}</span>
            <span>${previousMatches.length ? formatSeconds(previousSeconds) : "-"}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderWorkoutDetail() {
  if (!els.workoutDetailContent) return;

  const selected = state.workouts.find((workout) => workout.id === state.selectedWorkoutId);
  if (!selected) {
    els.workoutDetailContent.innerHTML = `<p class="empty-state">Selecteer een workout om details te zien.</p>`;
    return;
  }

  const z2Group = getZ2Groups().find((group) => group.workouts.some((workout) => workout.id === selected.id));
  const family = workoutAnalysisFamily(selected);
  els.workoutDetailContent.innerHTML = `
    <section class="workout-detail-hero">
      <div>
        <span>${formatDate(selected.date)} · ${sportLabels[selected.sport] || selected.sport} · ${escapeHtml(selected.workoutType || "general")}</span>
        <strong>${escapeHtml(selected.title)}</strong>
        <small>${selected.startTime || "Geen starttijd"} · bron ${escapeHtml(selected.source || "-")}</small>
      </div>
      <div>
        <span>Training load</span>
        <strong>${selected.load || "-"}</strong>
        <small>Gem. HR ${validHr(selected.avgHr) || "-"} · max HR ${validHr(selected.maxHr) || "-"}</small>
      </div>
    </section>

    ${renderSourceDetection(selected)}

    ${renderWorkoutDetailDataCheckControls(selected)}

    ${renderWorkoutDetailMetrics(selected)}

    ${family === "strength" ? "" : renderWorkoutAnalysisModel(selected)}
    ${z2Group ? renderZ2SelectedWorkoutDetail(z2Group, z2Group.workouts, selected) : ""}
    ${shouldShowWorkoutIntervals(selected) ? renderWorkoutDetailIntervals(selected) : ""}
    ${shouldShowWorkoutSegments(selected) ? renderWorkoutDetailSegments(selected) : ""}
    ${selected.notes ? `<section class="workout-detail-note"><strong>Notitie</strong><p>${escapeHtml(selected.notes)}</p></section>` : ""}
  `;
}

function renderWorkoutDetailDataCheckControls(workout) {
  const reviewContext = workout.rawPayload?.reviewContext || {};
  const currentFamily = reviewContext.overrideAnalysisFamily || workoutAnalysisFamily(workout);
  const options = [
    ["", "Automatisch bepalen"],
    ["z2", "Z2"],
    ["threshold", "Threshold"],
    ["vo2max", "VO2 max"],
    ["hyrox", "HYROX"],
    ["strength", "Kracht"],
    ["recovery", "Herstel"],
    ["general", "Algemeen / niet analyseren"],
    ["excluded", "Uitsluiten van analyse"],
  ];

  return `
    <section class="workout-detail-controls">
      <div>
        <span>Datacheck correctie</span>
        <strong>Snel aanpassen</strong>
        <small>Gebruik dit als een workout verkeerd onder VO2, threshold, Z2 of HYROX staat.</small>
      </div>
      <label>
        <span>Gem. HR</span>
        <input data-detail-workout-field="avgHr" type="number" min="35" max="230" step="1" value="${validHr(workout.avgHr) || ""}" placeholder="145" />
      </label>
      <label>
        <span>Analyse type</span>
        <select data-detail-workout-field="analysisFamily">
          ${options.map(([value, label]) => `<option value="${value}" ${currentFamily === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <button class="primary-button compact-button" type="button" data-detail-save-workout-context>Opslaan</button>
    </section>
  `;
}

function renderWorkoutDetailMetrics(workout) {
  const rows = [
    ["Duur", workout.durationMin ? formatDuration(numberOrZero(workout.durationMin)) : "", workout.durationMin ? `${workout.durationMin} min totaal` : ""],
    ["Afstand", numberOrZero(workout.distanceKm) ? formatDistance(workout) : "", workout.elevationGain ? `${workout.elevationGain} hm` : ""],
    ["Tempo", paceForWorkout(workout), "Gemiddeld over totale workout"],
    ["Hartslag", validHr(workout.avgHr) || validHr(workout.maxHr) ? `${validHr(workout.avgHr) || "-"} / ${validHr(workout.maxHr) || "-"}` : "", "Gemiddeld / max"],
    ["Load", workout.load || "", "Bron: Intervals.icu/Strava of TrainIQ proxy"],
  ].filter(([, value]) => !isEmptyDisplayValue(value));

  if (!rows.length) return "";

  return `
    <section class="workout-detail-grid">
      ${rows.map(([label, value, meta]) => workoutDetailMetric(label, value, meta || "")).join("")}
    </section>
  `;
}

function shouldShowWorkoutIntervals(workout) {
  const intervals = workout.intervals || [];
  if (!intervals.length) return false;
  if (workoutAnalysisFamily(workout) !== "strength") return true;
  return intervals.some((interval) => (
    !isTransitionInterval(interval)
    && (
      numberOrZero(interval.distanceMeters)
      || secondsPerKmForInterval(interval)
      || ["ski_erg", "row_erg", "bike_erg", "run"].includes(interval.exerciseType)
    )
  ));
}

function shouldShowWorkoutSegments(workout) {
  const segments = workout.segments || [];
  if (!segments.length) return false;
  return segments.some((segment) => (
    segment.name
    || segment.segmentType
    || numberOrZero(segment.durationSeconds)
    || numberOrZero(segment.distanceMeters)
    || numberOrZero(segment.reps)
    || numberOrZero(segment.weightKg)
    || numberOrZero(segment.avgWatts)
    || numberOrZero(segment.rpe)
    || segment.notes
  ));
}

function renderSourceDetection(workout) {
  const sourceType = sourceActivityTypeText(workout);
  const isGarminCardioLike = isCardioWorkoutImport(workout);
  return `
    <section class="workout-detail-source ${isGarminCardioLike ? "is-cardio" : ""}">
      <div>
        <span>Bronherkenning</span>
        <strong>${escapeHtml(sourceType.label)}</strong>
        <small>${escapeHtml(sourceType.detail)}</small>
      </div>
      <div>
        <span>Interpretatie</span>
        <strong>${isGarminCardioLike ? "Garmin cardio / Strava Workout" : "Normale import"}</strong>
        <small>${isGarminCardioLike ? "Gebruik de lap-editor hieronder om SkiErg, RowErg, BikeErg, warming-up, herstel en doelen te labelen." : "Geen speciale cardio-editor nodig, maar laps blijven wel aanpasbaar."}</small>
      </div>
    </section>
  `;
}

function sourceActivityTypeText(workout) {
  const activity = workout.rawPayload?.strava_activity || workout.rawPayload?.raw?.strava_activity || {};
  const sportType = activity.sport_type || activity.type || activity.workout_type || "";
  const device = activity.device_name || activity.gear?.name || "";
  const uploadId = activity.upload_id || activity.external_id || workout.externalId || "";
  return {
    label: sportType ? `Origineel type: ${sportType}` : `Workout type: ${workout.workoutType || "-"}`,
    detail: [
      `TrainIQ sport: ${sportLabels[workout.sport] || workout.sport || "-"}`,
      device ? `Device: ${device}` : "",
      uploadId ? `Bron ID: ${uploadId}` : "",
    ].filter(Boolean).join(" · ") || "Geen extra bronmetadata gevonden.",
  };
}

function isCardioWorkoutImport(workout) {
  const activity = workout.rawPayload?.strava_activity || {};
  const sourceType = String(activity.sport_type || activity.type || workout.workoutType || "").toLowerCase();
  const title = String(workout.title || "").toLowerCase();
  return workout.source === "strava"
    && (sourceType.includes("workout") || workout.workoutType === "workout")
    && (workout.intervals || []).length
    && (title.includes("ski") || title.includes("bike") || title.includes("erg") || workout.sport === "strength");
}

function workoutDetailMetric(label, value, meta) {
  return `
    <article class="z2-progress-card">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
      <small>${escapeHtml(meta)}</small>
    </article>
  `;
}

function renderWorkoutAnalysisModel(workout) {
  const metrics = analysisMetricsForWorkout(workout);
  const familyDetail = renderFamilySpecificAnalysis(metrics);

  return `
    <section class="workout-detail-section">
      <div class="workout-detail-section-header">
        <div>
          <strong>Analysemodel</strong>
          <span>Transparante proxy op basis van je huidige data. Geen medische of blessurediagnose.</span>
        </div>
      </div>
      <div class="z2-quality-grid analysis-model-grid">
        <div><span>Prikkel</span><strong>${escapeHtml(metrics.familyLabel)}</strong><small>${escapeHtml(modelSourceText(metrics.family))}</small></div>
        <div><span>Load</span><strong>${metrics.load || "-"}</strong><small>TrainIQ load score</small></div>
        <div><span>Analysekwaliteit</span><strong>${escapeHtml(metrics.quality.label)}</strong><small>${escapeHtml(metrics.confidence)} betrouwbaarheid</small></div>
        <div><span>Vergelijking</span><strong>${comparableWorkoutCount(workout, metrics.family)}</strong><small>Zelfde analyse-familie</small></div>
      </div>
      ${["strength", "hyrox"].includes(metrics.family) ? renderWorkoutRpeEditor(workout) : ""}
      ${renderAnalysisQualityDetail(metrics.quality)}
      ${familyDetail}
    </section>
  `;
}

function renderWorkoutRpeEditor(workout) {
  const sessionRpe = workoutSessionRpe(workout);
  return `
    <div class="analysis-rpe-editor">
      <label>
        <span>Sessie RPE</span>
        <input class="workout-analysis-input" data-workout-analysis-field="sessionRpe" type="number" min="1" max="10" step="0.5" value="${sessionRpe || ""}" placeholder="Bijv. 8" />
      </label>
      <div>
        <strong>${sessionRpe ? `RPE ${sessionRpe}` : "Nog geen RPE"}</strong>
        <small>Voor kracht/HYROX gebruikt de load score deze RPE samen met de duur.</small>
      </div>
    </div>
  `;
}

function renderAnalysisQualityDetail(quality) {
  const messages = [...(quality.reasons || []), ...(quality.missing || [])];
  const blockIssues = (quality.blocks || []).filter((block) => block.status !== "bruikbaar");
  if (!messages.length && !blockIssues.length) {
    return `<div class="analysis-model-note is-good"><strong>Bruikbaar</strong><span>Deze training heeft genoeg basisdata voor het huidige analysemodel.</span></div>`;
  }

  return `
    <div class="analysis-model-note ${quality.status === "excluded" ? "is-muted" : ""}">
      <strong>${escapeHtml(quality.label)}</strong>
      ${messages.map((message) => `<span>${escapeHtml(message)}</span>`).join("")}
      ${blockIssues.slice(0, 4).map((block) => `<span>${escapeHtml(block.name)}: ${escapeHtml(block.status)}${block.missing?.length ? ` (${escapeHtml(block.missing.join(", "))})` : ""}</span>`).join("")}
      ${blockIssues.length > 4 ? `<span>${blockIssues.length - 4} extra blok(ken) met aandachtspunt.</span>` : ""}
    </div>
  `;
}

function renderFamilySpecificAnalysis(metrics) {
  if (metrics.vo2) {
    const vo2 = metrics.vo2;
    return `
      <div class="analysis-model-note">
        <strong>VO2max model</strong>
        <span>${vo2.reps || 0} werkblok(ken) · ${formatDuration(Math.round(vo2.durationSeconds / 60))} werktijd · ${vo2.distanceMeters ? `${(vo2.distanceMeters / 1000).toFixed(2)} km` : "afstand -"}</span>
        <span>Gemiddelde werkpace ${vo2.avgPace ? formatPacePerKm(vo2.avgPace) : "-"} · verval ${vo2.decaySeconds ? `${formatSignedPace(vo2.decaySeconds)} (${vo2.decayPct.toFixed(1)}%)` : "-"}</span>
      </div>
    `;
  }

  if (metrics.threshold) {
    const threshold = metrics.threshold;
    return `
      <div class="analysis-model-note">
        <strong>Threshold model</strong>
        <span>${threshold.reps || 0} werkblok(ken) · ${formatDuration(Math.round(threshold.durationSeconds / 60))} werktijd · ${threshold.distanceMeters ? `${(threshold.distanceMeters / 1000).toFixed(2)} km` : "afstand -"}</span>
        <span>Gemiddelde werkpace ${threshold.avgPace ? formatPacePerKm(threshold.avgPace) : "-"} · spreiding ${threshold.paceSpread ? `${Math.round(threshold.paceSpread)} sec/km` : "-"} · variatie ${threshold.variationPct ? `${threshold.variationPct.toFixed(1)}%` : "-"}</span>
      </div>
    `;
  }

  return `
    <div class="analysis-model-note">
      <strong>Basis load model</strong>
      <span>Deze training telt mee in de loadgrafiek. Specifieke kwaliteitsanalyse verschijnt zodra hij Z2, VO2max, threshold of HYROX-structuur heeft.</span>
    </div>
  `;
}

function modelSourceText(family) {
  if (family === "z2") return "Aerobe efficiency";
  if (family === "vo2max") return "Interval repeatability";
  if (family === "threshold") return "Pace stability";
  if (family === "hyrox") return "HYROX state";
  if (family === "strength") return "Duur/RPE proxy";
  return "Load proxy";
}

function comparableWorkoutCount(workout, family) {
  return sortedWorkouts().filter((candidate) => candidate.id !== workout.id && workoutAnalysisFamily(candidate) === family).length;
}

function renderWorkoutDetailIntervals(workout) {
  const intervals = workout.intervals || [];
  if (!intervals.length) {
    return `<section class="workout-detail-section"><strong>Intervalblokken</strong><p class="empty-state">Geen intervalblokken opgeslagen voor deze workout.</p></section>`;
  }
  const outputHeader = workout.sport === "running" || intervals.some((interval) => interval.exerciseType === "run")
    ? "Pace / km"
    : "ERG tempo";

  return `
    <section class="workout-detail-section">
      <div class="workout-detail-section-header">
        <div>
          <strong>Intervalblokken</strong>
          <span>Label Garmin/Strava cardio-laps als SkiErg, RowErg, BikeErg, warming-up, herstel of cooling-down.</span>
        </div>
      </div>
      ${renderWorkoutDetailBulkTools(workout)}
      <div class="workout-detail-table">
        <div class="workout-detail-row workout-detail-row-edit workout-detail-head">
          <span>Blok</span>
          <span>Onderdeel</span>
          <span>Rol</span>
          <span>Doel</span>
          <span>Tijd</span>
          <span>Gem HR</span>
          <span>Max HR</span>
          <span>${outputHeader}</span>
          <span>Afstand</span>
          <span>Actie</span>
        </div>
        ${intervals.map((interval) => renderWorkoutDetailIntervalRow(interval)).join("")}
      </div>
    </section>
  `;
}

function renderWorkoutDetailBulkTools(workout) {
  const reviewContext = workout.rawPayload?.reviewContext || {};
  return `
    <div class="workout-detail-bulk-tools">
      <div class="workout-detail-bulk-grid">
        <label>
          <span>Alle werk-laps onderdeel</span>
          <select data-detail-bulk-field="exerciseType">
            ${Object.entries(intervalExerciseTypeLabels).map(([value, label]) => `<option value="${value}" ${value === "bike_erg" ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Alle werk-laps doel</span>
          <select data-detail-bulk-field="effortGoal">
            ${Object.entries(effortGoalLabels).map(([value, label]) => `<option value="${value}" ${value === "z2" ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Avg watt voor alle laps</span>
          <input data-detail-bulk-field="avgWatts" type="number" min="0" step="1" placeholder="Bijv. 185" />
        </label>
        <label>
          <span>Avg /500m voor alle laps</span>
          <input data-detail-bulk-field="avgPace500" placeholder="Bijv. 2:05" inputmode="numeric" />
        </label>
      </div>
      <div class="workout-detail-bulk-actions">
        <button class="ghost-button compact-button" type="button" data-detail-bulk-apply>Toepassen op alle werk-laps</button>
        <button class="ghost-button compact-button" type="button" data-detail-bulk-missing>Geen split/tempo/watt data voor deze workout</button>
        <button class="primary-button compact-button" type="button" data-detail-mark-complete>${reviewContext.dataCheckStatus === "complete" ? "Verwerkt" : "Workout verwerken"}</button>
      </div>
    </div>
  `;
}

function renderWorkoutDetailIntervalRow(interval) {
  const isTransition = isTransitionInterval(interval);
  const metricUnavailable = Boolean(interval.rawPayload?.metricUnavailable);
  const nameField = `
    <label>
      <span>Naam</span>
      <input class="detail-interval-input" data-detail-interval-field="name" value="${escapeHtml(interval.name || `Lap ${interval.intervalIndex || "-"}`)}" />
    </label>
  `;
  const exerciseField = `
    <label>
      <span>Onderdeel</span>
      <select class="detail-interval-input" data-detail-interval-field="exerciseType">
        ${Object.entries(intervalExerciseTypeLabels).map(([value, label]) => `<option value="${value}" ${value === (interval.exerciseType || "") ? "selected" : ""}>${label}</option>`).join("")}
      </select>
    </label>
  `;
  if (isTransition) {
    return `
      <div class="workout-detail-row workout-detail-row-edit is-transition" data-detail-interval-index="${interval.intervalIndex}">
        ${nameField}
        ${exerciseField}
        <button class="ghost-button compact-button danger-button" type="button" data-detail-delete-lap>Verwijder ronde</button>
      </div>
    `;
  }

  const effortField = isTransition ? "" : `
    <label>
      <span>Doel</span>
      <select class="detail-interval-input" data-detail-interval-field="effortGoal">
        ${Object.entries(effortGoalLabels).map(([value, label]) => `<option value="${value}" ${value === (interval.effortGoal || "") ? "selected" : ""}>${label}</option>`).join("")}
      </select>
    </label>
  `;
  const timeField = `
    <label>
      <span>Tijd</span>
      <input class="detail-interval-input" data-detail-interval-field="durationSeconds" value="${formatSeconds(interval.durationSeconds)}" inputmode="numeric" />
    </label>
  `;
  let outputField = "";
  if (interval.exerciseType === "bike_erg") {
    outputField = `
      <label>
        <span>Avg watt</span>
        <input class="detail-interval-input" data-detail-interval-field="avgWatts" type="number" min="0" step="1" value="${metricUnavailable ? "" : wattsForInterval(interval) || ""}" placeholder="180" ${metricUnavailable ? "disabled" : ""} />
      </label>
      <span><strong>${metricUnavailable ? "Geen data" : wattsForInterval(interval) ? `${wattsForInterval(interval)} W` : "-"}</strong><small>${interval.distanceMeters ? `${interval.distanceMeters} m` : "afstand -"}</small></span>
    `;
  } else if (interval.exerciseType === "run") {
    outputField = `
      <label>
        <span>Pace /km</span>
        <input class="detail-interval-input" data-detail-interval-field="avgPace" value="${metricUnavailable || paceForInterval(interval) === "-" ? "" : paceForInterval(interval).replace("/km", "")}" placeholder="3:55" inputmode="numeric" ${metricUnavailable ? "disabled" : ""} />
      </label>
      <label>
        <span>Afstand m</span>
        <input class="detail-interval-input" data-detail-interval-field="distanceMeters" type="number" min="0" step="1" value="${numberOrZero(interval.distanceMeters) || ""}" placeholder="1000" ${metricUnavailable ? "disabled" : ""} />
      </label>
      <span><strong>${metricUnavailable ? "Geen data" : paceForInterval(interval)}</strong><small>${interval.distanceMeters ? `${interval.distanceMeters} m` : "afstand -"}</small></span>
    `;
  } else {
    outputField = `
      <label>
        <span>Avg /500m</span>
        <input class="detail-interval-input" data-detail-interval-field="avgPace500" value="${metricUnavailable ? "" : pace500ForInterval(interval)}" placeholder="2:05" inputmode="numeric" ${metricUnavailable ? "disabled" : ""} />
      </label>
      <span><strong>${metricUnavailable ? "Geen data" : interval.distanceMeters ? `${interval.distanceMeters} m` : "-"}</strong><small>${metricUnavailable ? "bewust onbekend" : paceForInterval(interval)}</small></span>
    `;
  }
  const actionButtons = `
    <div class="workout-detail-actions-cell">
      <button class="ghost-button compact-button" type="button" data-detail-no-metric>${metricUnavailable ? "Data toch invullen" : "Geen splitdata"}</button>
      <button class="ghost-button compact-button danger-button" type="button" data-detail-delete-lap>Verwijder ronde</button>
    </div>
  `;
  const hrField = `
    <label>
      <span>Gem HR</span>
      <input class="detail-interval-input" data-detail-interval-field="avgHr" type="number" min="0" step="1" value="${validHr(interval.avgHr) || ""}" placeholder="145" />
    </label>
    <label>
      <span>Max HR</span>
      <input class="detail-interval-input" data-detail-interval-field="maxHr" type="number" min="0" step="1" value="${validHr(interval.maxHr) || ""}" placeholder="165" />
    </label>
  `;
  const metrics = `${effortField}${timeField}${hrField}${outputField}${actionButtons}`;

  return `
    <div class="workout-detail-row workout-detail-row-edit" data-detail-interval-index="${interval.intervalIndex}">
      ${nameField}
      ${exerciseField}
      <label>
        <span>Rol</span>
        <select class="detail-interval-input" data-detail-interval-field="lapRole">
          ${Object.entries(lapRoleLabels).map(([value, label]) => `<option value="${value}" ${value === (interval.lapRole || "work") ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      ${metrics}
    </div>
  `;
}

function isTransitionInterval(interval) {
  return interval.lapRole === "transition" || interval.exerciseType === "transition";
}

function renderWorkoutDetailSegments(workout) {
  const segments = workout.segments || [];
  if (!segments.length) {
    return `<section class="workout-detail-section"><strong>Stations / kracht</strong><p class="empty-state">Geen stations of krachtblokken opgeslagen voor deze workout.</p></section>`;
  }

  return `
    <section class="workout-detail-section">
      <strong>Stations / kracht</strong>
      <div class="workout-detail-table">
        <div class="workout-detail-row workout-detail-head">
          <span>Onderdeel</span>
          <span>Tijd</span>
          <span>Afstand/reps</span>
          <span>Power/kg</span>
          <span>HR/RPE</span>
          <span>Notitie</span>
        </div>
        ${segments.map((segment) => {
          const distanceOrReps = [
            segment.distanceMeters ? `${segment.distanceMeters} m` : "",
            segment.sets ? `${segment.sets} sets` : "",
            segment.reps ? `${segment.reps} reps` : "",
            paceForSegment(segment) !== "-" ? paceForSegment(segment) : "",
          ].filter(Boolean).join(" · ") || "-";
          const powerOrWeight = [
            segment.avgWatts ? `${segment.avgWatts} W` : "",
            segment.weightKg ? `${segment.weightKg} kg` : "",
          ].filter(Boolean).join(" · ") || "-";
          const hrRpe = [
            segment.avgHr ? `HR ${segment.avgHr}${segment.maxHr ? `/${segment.maxHr}` : ""}` : "",
            segment.rpe ? `RPE ${segment.rpe}` : "",
          ].filter(Boolean).join(" · ") || "-";
          return `
            <div class="workout-detail-row">
              <span>${escapeHtml(segment.name || segmentTypeLabels[segment.segmentType] || segment.segmentType || "-")}</span>
              <span>${formatSeconds(segment.durationSeconds)}</span>
              <span>${distanceOrReps}</span>
              <span>${powerOrWeight}</span>
              <span>${hrRpe}</span>
              <span>${escapeHtml(segment.notes || "-")}</span>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderQuality() {
  const audits = sortedWorkouts().map((workout) => ({
    workout,
    issues: auditWorkout(workout),
  }));
  const missingStravaLaps = getMissingStravaLapWorkoutsThrough("2026-06-10");
  const processed = audits.filter((item) => isQualityRelevantWorkout(item.workout) && isWorkoutReviewProcessed(item.workout));
  const focusIssueCodes = new Set(["generated_title", "missing_duration", "missing_detail", "missing_hr", "missing_lap_hr"]);
  const flagged = audits.filter((item) => (
    isQualityRelevantWorkout(item.workout)
    && item.issues.some((issue) => focusIssueCodes.has(issue.code))
    && !isWorkoutReviewProcessed(item.workout)
  ));
  const high = flagged.filter((item) => item.issues.some((issue) => issue.severity === "high"));
  const medium = flagged.filter((item) => item.issues.some((issue) => issue.severity === "medium") && !item.issues.some((issue) => issue.severity === "high"));
  const missingHr = flagged.filter((item) => item.issues.some((issue) => issue.code === "missing_hr"));
  const missingLapHr = flagged.filter((item) => item.issues.some((issue) => issue.code === "missing_lap_hr"));
  const missingDetail = flagged.filter((item) => item.issues.some((issue) => issue.code === "missing_detail"));

  const qualityCards = [
    { value: state.workouts.length, label: "Workouts totaal.", always: true },
    { value: flagged.length, label: "Workouts die controle nodig hebben." },
    { value: processed.length, label: "Workouts verwerkt." },
    { value: high.length, label: "Hoge prioriteit." },
    { value: missingHr.length, label: "Workouts zonder hartslagdata." },
    { value: missingLapHr.length, label: "Workouts met ontbrekende lap-HR." },
    { value: missingDetail.length, label: "Zonder FIT/GPX/API-detaildata." },
    { value: medium.length, label: "Middelmatige twijfelgevallen." },
    {
      value: missingStravaLaps.length,
      label: "Relevante Z2 Strava-workouts van 10 juni en ouder zonder laps.",
      action: missingStravaLaps.length ? `<button class="ghost-button compact-button" type="button" data-strava-repair-missing-laps>Herstel volgende 30</button>` : "",
    },
  ].filter((card) => card.always || numberOrZero(card.value));

  els.qualitySummary.innerHTML = qualityCards.map((card) => `
    <div class="summary-card">
      <strong>${card.value}</strong>
      <span>${escapeHtml(card.label)}</span>
      ${card.action || ""}
    </div>
  `).join("");

  renderZ2ErgDataGaps();
  renderVo2DataCheck();
  renderThresholdDataCheck();
  renderBulkCategorySuggestions();

  if (!flagged.length) {
    els.qualityList.innerHTML = `<p class="empty-state">Geen open dataproblemen gevonden. Gebruik de specifieke VO2/Threshold/ERG blokken hierboven als je detaildata wilt aanvullen.</p>`;
    return;
  }

  els.qualityList.innerHTML = flagged
    .slice(0, 120)
    .map(({ workout, issues }) => {
      const reviewContext = workout.rawPayload?.reviewContext || {};
      return `
      <article class="quality-item ${issues.some((issue) => issue.severity === "high") ? "is-high" : ""}" data-workout-id="${escapeHtml(workout.id)}">
        <div class="quality-heading">
          <span>Training</span>
          <strong>${escapeHtml(workout.title || "Training zonder titel")}</strong>
          <small>${formatDate(workout.date)} · ${sportLabels[workout.sport] || workout.sport} · ${workout.source || "manual"}</small>
        </div>
        <div class="issue-list">
          ${issues
            .filter((issue) => focusIssueCodes.has(issue.code))
            .map((issue) => `<span class="issue-pill ${issue.severity}">${escapeHtml(issue.label)}</span>`)
            .join("")}
        </div>
        <div class="quality-editor">
          <label class="wide-field">Titel
            <input data-quality-field="title" value="${escapeHtml(workout.title || "")}" placeholder="Titel van training" />
          </label>
          <label>Sport
            <select data-quality-field="sport">
              ${Object.entries(sportLabels).map(([value, label]) => `<option value="${value}" ${workout.sport === value ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          <label>Type / doel
            <input data-quality-field="workoutType" value="${escapeHtml(workout.workoutType || "general")}" placeholder="z2, threshold, hyrox, kracht" />
          </label>
          <label>Trainingsdoel
            <select data-quality-field="trainingGoal">
              ${Object.entries(reviewGoalLabels).map(([value, label]) => `<option value="${value}" ${reviewContext.trainingGoal === value ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          <label>Reviewstatus
            <select data-quality-field="reviewStatus">
              ${Object.entries(reviewStatusLabels).map(([value, label]) => `<option value="${value}" ${(reviewContext.reviewStatus || "needs_review") === value ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          <label>Duur min
            <input data-quality-field="durationMin" type="number" min="0" step="1" value="${numberOrZero(workout.durationMin) || ""}" placeholder="45" />
          </label>
          <label>Afstand km
            <input data-quality-field="distanceKm" type="number" min="0" step="0.01" value="${numberOrZero(workout.distanceKm) || ""}" placeholder="8.50" />
          </label>
          <label>Gem HR
            <input data-quality-field="avgHr" type="number" min="0" step="1" value="${numberOrZero(workout.avgHr) || ""}" placeholder="145" />
          </label>
          <label>Max HR
            <input data-quality-field="maxHr" type="number" min="0" step="1" value="${numberOrZero(workout.maxHr) || ""}" placeholder="172" />
          </label>
          <label class="wide-field">Notitie
            <input data-quality-field="notes" value="${escapeHtml(workout.notes || "")}" placeholder="Bijvoorbeeld: ERG zone 2, treadmill, ontbrekende GPS" />
          </label>
          <label class="wide-field">Workout structuur
            <textarea data-quality-field="structureText" rows="3" placeholder="Bijvoorbeeld: 4 rondes: 5 min Z2, 2 min under, 1 min over, 2 min easy">${escapeHtml(reviewContext.structureText || "")}</textarea>
          </label>
          <label class="wide-field">Warming-up
            <textarea data-quality-field="warmupText" rows="2" placeholder="Bijvoorbeeld: 10 min easy + drills">${escapeHtml(reviewContext.warmupText || "")}</textarea>
          </label>
          <label class="wide-field">Cooling-down
            <textarea data-quality-field="cooldownText" rows="2" placeholder="Bijvoorbeeld: 8 min easy uitlopen/uitfietsen">${escapeHtml(reviewContext.cooldownText || "")}</textarea>
          </label>
        </div>
        <div class="quality-actions">
          <button class="primary-button" type="button" data-quality-save>Opslaan</button>
          <button class="primary-button" type="button" data-quality-mark-complete>Verwerken</button>
          ${issues.some((issue) => issue.code === "missing_lap_hr") && canRefreshStravaLaps(workout)
            ? `<button class="ghost-button" type="button" data-strava-refresh-laps>Laps opnieuw ophalen</button>`
            : ""}
          <button class="ghost-button" type="button" data-quality-view>Analyse openen</button>
        </div>
      </article>
    `;
    })
    .join("");
}

function isQualityRelevantWorkout(workout) {
  return isZ2Workout(workout)
    || isVo2DataCheckWorkout(workout)
    || Boolean(thresholdProfileForWorkout(workout))
    || isTrueHyroxWorkout(workout)
    || generatedWorkoutTitle(workout);
}

function getMissingStravaLapWorkoutsThrough(dateKey = "2026-06-10") {
  return sortedWorkouts()
    .filter((workout) => {
      return workout.source === "strava"
        && Boolean(stravaActivityIdForWorkout(workout))
        && workout.date <= dateKey
        && isZ2Workout(workout)
        && isStravaLapRepairRelevantWorkout(workout)
        && !workout.rawPayload?.lapRepairNotFound
        && !(workout.intervals || []).length;
    });
}

function isStravaLapRepairRelevantWorkout(workout) {
  const title = String(workout.title || "").toLowerCase();
  const type = String(workout.workoutType || "").toLowerCase();
  const sport = String(workout.sport || "").toLowerCase();
  const category = String(workout.rawPayload?.reviewContext?.bulkCategory || "").toLowerCase();
  const haystack = `${title} ${type} ${sport} ${category}`;
  const relevant = /(run|hardloop|ride|rit|bike|fiets|erg|ski|row|z2|threshold|treshold|drempel|vo2|interval|tempo|recovery|shakeout|over under|over-under|hyrox|compromised)/.test(haystack);
  const irrelevantStrength = /(upper|lower|fullbody|full body|legday|kracht|strength|rehab)/.test(haystack)
    && !/(run|hardloop|ride|rit|bike|fiets|erg|ski|row|hyrox|compromised)/.test(haystack);
  return relevant && !irrelevantStrength;
}

function renderBulkCategorySuggestions() {
  if (!els.qualityBulkCategories) return;

  const reviewableWorkouts = state.workouts.filter((workout) => (
    (isZ2Workout(workout) || isVo2DataCheckWorkout(workout) || thresholdProfileForWorkout(workout))
    && !isWorkoutReviewProcessed(workout)
  ));
  const buckets = reviewableWorkouts.reduce((groups, workout) => {
    const category = categorizeWorkoutForBulk(workout);
    if (!groups.has(category.key)) {
      groups.set(category.key, {
        ...category,
        workouts: [],
        examples: new Set(),
        subgroups: new Map(),
      });
    }
    const group = groups.get(category.key);
    group.workouts.push(workout);
    if (workout.title && group.examples.size < 5) group.examples.add(workout.title);
    const subgroupKey = bulkSubgroupKey(workout);
    if (!group.subgroups.has(subgroupKey)) {
      group.subgroups.set(subgroupKey, {
        title: workout.title || "Zonder titel",
        count: 0,
        dates: [],
        meta: new Set(),
      });
    }
    const subgroup = group.subgroups.get(subgroupKey);
    subgroup.count += 1;
    subgroup.dates.push(workout.date);
    subgroup.meta.add(`${sportLabels[workout.sport] || workout.sport || "Onbekend"} · ${workout.workoutType || "general"}`);
    return groups;
  }, new Map());

  const categories = Array.from(buckets.values())
    .sort((a, b) => b.workouts.length - a.workouts.length);

  if (!categories.length) {
    els.qualityBulkCategories.innerHTML = `<p class="empty-state">Nog geen workouts om te clusteren.</p>`;
    return;
  }

  els.qualityBulkCategories.innerHTML = categories
    .map((category) => `
      <article class="bulk-category-card">
        <div>
          <span>${escapeHtml(category.label)}</span>
          <strong>${category.workouts.length} workout(s)</strong>
          <small>Voorstel: ${escapeHtml(category.suggestedGoal)} · ${escapeHtml(category.suggestedSport)}</small>
          ${category.structure ? `<p>${escapeHtml(category.structure)}</p>` : ""}
        </div>
        ${renderBulkSubgroups(category)}
        ${approvedBulkCategoryKeys.has(category.key) ? `
          <button class="ghost-button bulk-apply-button" type="button" data-bulk-category="${escapeHtml(category.key)}">
            Verwerk deze categorie
          </button>
        ` : ""}
      </article>
    `)
    .join("");
}

function renderZ2ErgDataGaps() {
  if (!els.z2ErgDataGaps) return;

  const gaps = getZ2ErgBikeDataGaps();
  if (!gaps.length) {
    els.z2ErgDataGaps.innerHTML = `<p class="empty-state">Geen ontbrekende SkiErg, RowErg of BikeErg Z2-data gevonden.</p>`;
    return;
  }

  els.z2ErgDataGaps.innerHTML = `
    <div class="z2-gap-summary">
      <strong>${gaps.length}</strong>
      <span>sessies om aan te vullen. Gebruik datum + titel om de juiste foto/split terug te vinden.</span>
    </div>
    ${gaps.map((gap) => `
      <article class="z2-gap-item" data-workout-id="${escapeHtml(gap.workout.id)}">
        <div>
          <strong>${escapeHtml(gap.workout.title || "Training zonder titel")}</strong>
          <small>${formatDate(gap.workout.date)} · ${gap.workout.startTime || "geen starttijd"} · ${sportLabels[gap.workout.sport] || gap.workout.sport} · ${gap.workout.source || "manual"}</small>
        </div>
        <ul>
          ${gap.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
        </ul>
        ${renderZ2GapLapPreview(gap.workout)}
        ${renderInlineAvgHrEditor(gap.workout)}
        ${canRefreshStravaLaps(gap.workout) ? `<button class="ghost-button compact-button" type="button" data-strava-refresh-laps>Laps opnieuw ophalen</button>` : ""}
        <button class="primary-button compact-button" type="button" data-quality-mark-complete>Verwerken</button>
        <button class="ghost-button compact-button" type="button" data-quality-view>Openen</button>
      </article>
    `).join("")}
  `;
}

function renderVo2DataCheck() {
  if (!els.vo2DataCheck) return;

  const allItems = getVo2CleanupWorkouts();
  const items = allItems.filter((item) => item.status === "open" || item.status === "usable");
  const later = allItems.filter((item) => item.status === "later");
  const excluded = allItems.filter((item) => item.status === "excluded");
  if (!items.length) {
    els.vo2DataCheck.innerHTML = `
      <p class="empty-state">Geen open VO2-cleanup workouts. ${later.length ? `${later.length} staat op later.` : ""} ${excluded.length ? `${excluded.length} uitgesloten en verborgen.` : ""}</p>
      ${renderVo2CleanupSecondaryLists(later)}
    `;
    return;
  }

  els.vo2DataCheck.innerHTML = `
    <div class="z2-gap-summary">
      <strong>${items.length}</strong>
      <span>open VO2-workout(s) om klaar te zetten voor analyse. ${later.length ? `${later.length} later` : ""}${later.length && excluded.length ? " · " : ""}${excluded.length ? `${excluded.length} uitgesloten en verborgen` : ""}</span>
    </div>
    ${items.map((item) => renderVo2CleanupItem(item)).join("")}
    ${renderVo2CleanupSecondaryLists(later)}
  `;
}

function renderVo2CleanupItem(item, compact = false) {
  const isInactive = item.status === "later" || item.status === "excluded";
  return `
    <article class="z2-gap-item ${item.status === "usable" ? "is-ready" : ""}" data-workout-id="${escapeHtml(item.workout.id)}">
      <div>
        <strong>${escapeHtml(item.workout.title || "Training zonder titel")}</strong>
        <small>${formatDate(item.workout.date)} · ${item.workout.startTime || "geen starttijd"} · ${sportLabels[item.workout.sport] || item.workout.sport} · ${item.workout.source || "manual"}</small>
        <small>${escapeHtml(item.profile.label)} · ${item.metrics.reps || 0} ${item.kind === "threshold" ? "blok(ken)" : "rep(s)"} · ${item.metrics.avgPace ? formatPacePerKm(item.metrics.avgPace) : "pace -"}</small>
      </div>
      ${compact ? "" : `
        <ul>
          ${item.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
        </ul>
        ${renderVo2LapPreview(item.workout)}
        ${renderInlineAvgHrEditor(item.workout)}
      `}
      <div class="quality-actions">
        ${canRefreshStravaLaps(item.workout) ? `<button class="ghost-button compact-button" type="button" data-strava-refresh-laps>Laps opnieuw ophalen</button>` : ""}
        ${isInactive ? `<button class="primary-button compact-button" type="button" data-quality-reopen>Terug naar open</button>` : `
          <button class="primary-button compact-button" type="button" data-quality-mark-complete>Compleet</button>
          <button class="ghost-button compact-button" type="button" data-quality-later>Later</button>
          <button class="ghost-button compact-button danger-button" type="button" data-quality-exclude>Uitsluiten</button>
        `}
        <button class="ghost-button compact-button" type="button" data-quality-view>Openen</button>
      </div>
    </article>
  `;
}

function renderVo2CleanupSecondaryLists(later, label = "VO2") {
  return `
    ${later.length ? `
      <details class="z2-collapsible-list">
        <summary><span><strong>Later bekijken</strong><small>${later.length} ${escapeHtml(label)}-workout(s)</small></span><b>Open</b></summary>
        <div class="z2-gap-list">${later.map((item) => renderVo2CleanupItem(item, true)).join("")}</div>
      </details>
    ` : ""}
  `;
}

function renderThresholdDataCheck() {
  if (!els.thresholdDataCheck) return;

  const allItems = getThresholdCleanupWorkouts();
  const items = allItems.filter((item) => item.status === "open" || item.status === "usable");
  const later = allItems.filter((item) => item.status === "later");
  const excluded = allItems.filter((item) => item.status === "excluded");
  if (!items.length) {
    els.thresholdDataCheck.innerHTML = `
      <p class="empty-state">Geen open threshold-cleanup workouts. ${later.length ? `${later.length} staat op later.` : ""} ${excluded.length ? `${excluded.length} uitgesloten en verborgen.` : ""}</p>
      ${renderVo2CleanupSecondaryLists(later, "Threshold")}
    `;
    return;
  }

  els.thresholdDataCheck.innerHTML = `
    <div class="z2-gap-summary">
      <strong>${items.length}</strong>
      <span>open threshold-workout(s) om klaar te zetten voor analyse. ${later.length ? `${later.length} later` : ""}${later.length && excluded.length ? " · " : ""}${excluded.length ? `${excluded.length} uitgesloten en verborgen` : ""}</span>
    </div>
    ${items.map((item) => renderVo2CleanupItem(item)).join("")}
    ${renderVo2CleanupSecondaryLists(later, "Threshold")}
  `;
}

function renderInlineAvgHrEditor(workout) {
  return `
    <div class="inline-hr-editor">
      <span>Gem. HR</span>
      <input data-inline-avg-hr type="number" min="35" max="230" step="1" value="${validHr(workout.avgHr) || ""}" placeholder="145" />
      <button class="ghost-button compact-button" type="button" data-save-inline-avg-hr>HR opslaan</button>
    </div>
  `;
}

function getVo2DataCheckWorkouts() {
  return sortedWorkouts()
    .filter((workout) => isVo2DataCheckWorkout(workout) && !isWorkoutDataCheckComplete(workout) && !isWorkoutExcludedFromAnalysis(workout))
    .map((workout) => {
      const profile = vo2ProfileForWorkout(workout);
      const reasons = vo2DataCheckReasons(workout);
      return reasons.length && profile ? { workout, profile, reasons } : null;
    })
    .filter(Boolean);
}

function getVo2CleanupWorkouts() {
  return sortedWorkouts()
    .filter((workout) => vo2ProfileForWorkout(workout, { includeExcluded: true }))
    .map((workout) => {
      const profile = vo2ProfileForWorkout(workout, { includeExcluded: true });
      const reasons = vo2DataCheckReasons(workout);
      const metrics = vo2SessionMetrics(workout);
      return profile ? {
        kind: "vo2",
        workout,
        profile,
        reasons,
        metrics,
        status: vo2CleanupStatus(workout, metrics, reasons),
      } : null;
    })
    .filter(Boolean);
}

function vo2CleanupStatus(workout, metrics, reasons) {
  const context = workout.rawPayload?.reviewContext || {};
  if (isWorkoutExcludedFromAnalysis(workout)) return "excluded";
  if (context.reviewStatus === "later" || context.dataCheckStatus === "later") return "later";
  if (isWorkoutDataCheckComplete(workout)) return "complete";
  if (metrics.reps && metrics.avgPace && numberOrZero(metrics.durationSeconds) && !reasons.length) return "usable";
  return "open";
}

function isWorkoutExcludedFromAnalysis(workout) {
  const context = workout.rawPayload?.reviewContext || {};
  return Boolean(context.excludeFromAnalysis || context.reviewStatus === "excluded" || context.dataCheckStatus === "excluded");
}

function getThresholdDataCheckWorkouts() {
  return sortedWorkouts()
    .filter((workout) => thresholdProfileForWorkout(workout) && !isWorkoutDataCheckComplete(workout))
    .map((workout) => {
      const profile = thresholdProfileForWorkout(workout);
      const reasons = thresholdDataCheckReasons(workout);
      return reasons.length && profile ? { workout, profile, reasons } : null;
    })
    .filter(Boolean);
}

function getThresholdCleanupWorkouts() {
  return sortedWorkouts()
    .filter((workout) => thresholdProfileForWorkout(workout, { includeExcluded: true }))
    .map((workout) => {
      const profile = thresholdProfileForWorkout(workout, { includeExcluded: true });
      const reasons = thresholdDataCheckReasons(workout);
      const metrics = thresholdSessionMetrics(workout);
      return profile ? {
        kind: "threshold",
        workout,
        profile,
        reasons,
        metrics,
        status: vo2CleanupStatus(workout, metrics, reasons),
      } : null;
    })
    .filter(Boolean);
}

function isVo2DataCheckWorkout(workout) {
  return Boolean(vo2ProfileForWorkout(workout));
}

function vo2ProfileForWorkout(workout, options = {}) {
  const context = workout.rawPayload?.reviewContext || {};
  const override = String(context.overrideAnalysisFamily || "").toLowerCase();
  if (override && override !== "vo2max") return null;
  if (!options.includeExcluded && (context.excludeFromAnalysis || context.reviewStatus === "excluded" || context.dataCheckStatus === "excluded")) return null;
  const title = String(workout.title || "").toLowerCase();
  const type = String(workout.workoutType || "").toLowerCase();
  const goal = String(context.trainingGoal || "").toLowerCase();
  const category = String(context.bulkCategory || "").toLowerCase();
  const structure = String(context.structureText || "").toLowerCase();
  const haystack = `${title} ${type} ${goal} ${category} ${structure}`;
  const hasVo2Signal = /(vo2|v02|vo2max|vo2 max|norwegian|norweigan|4x4|4\s*x\s*4|4x1k|4\s*x\s*1k|4x1km|4\s*x\s*1km)/.test(haystack)
    || /(deload).*(interval)/.test(haystack)
    || goal === "vo2max"
    || category === "vo2max"
    || type === "vo2max";

  if (!hasVo2Signal) return null;
  if (isZ2Workout(workout)) return null;
  if (/hyrox|stations|wedstrijd|race|compromised|compromissed/.test(haystack) && !/(vo2|v02|vo2max|vo2 max)/.test(haystack)) return null;
  if (/threshold|treshold|drempel|tempo/.test(haystack) && !/(vo2|v02|vo2max|vo2 max|norwegian|norweigan|4x4|4\s*x\s*4|4x\s*4|4\s*min|4['’])/.test(haystack)) return null;
  if (/(upper|lower|fullbody|full body|legday|kracht|strength|rehab)/.test(haystack) && !/(run|hardloop|interval|vo2|v02|norwegian|norweigan|4x4|4\s*x\s*4|4x1k|4\s*x\s*1k)/.test(haystack)) return null;

  if (/(4x1k|4\s*x\s*1k|4x1km|4\s*x\s*1km)/.test(haystack)) {
    return {
      key: "vo2_4x1km",
      label: "4x1km VO2max",
      expectedWorkBlocks: 4,
      targetDistanceMeters: 1000,
      distanceMarginMeters: 200,
      helper: "Vergelijken op pace en verval per kilometerblok. HR later optioneel.",
    };
  }

  if (/(norwegian|norweigan|4x4|4\s*x\s*4|4x\s*4|4\s*min|4['’]\s*blok|4\s*minute)/.test(haystack)) {
    return {
      key: "vo2_4x4",
      label: "Norwegian 4x4",
      expectedWorkBlocks: 4,
      targetDurationSeconds: 240,
      durationMarginSeconds: 60,
      helper: "Vergelijken op 4 minuten werkblokken: pace/power en verval. HR later optioneel.",
    };
  }

  if (/(deload interval)/.test(haystack)) {
    return {
      key: "vo2_deload",
      label: "Deload VO2max",
      expectedWorkBlocks: 0,
      helper: "Bewust lichtere VO2-prikkel. Wel apart houden van normale VO2-referenties.",
    };
  }

  if (
    goal === "vo2max"
    || category === "vo2max"
    || type === "vo2max"
    || /(vo2|v02|vo2max|vo2 max)/.test(haystack)
  ) {
    return {
      key: "vo2_general",
      label: "VO2max algemeen",
      expectedWorkBlocks: 0,
      helper: "Exacte structuur eerst controleren voordat deze in de analyse meedraait.",
    };
  }

  return null;
}

function thresholdProfileForWorkout(workout, options = {}) {
  const context = workout.rawPayload?.reviewContext || {};
  const override = String(context.overrideAnalysisFamily || "").toLowerCase();
  if (override && override !== "threshold") return null;
  if (!options.includeExcluded && (context.excludeFromAnalysis || context.reviewStatus === "excluded" || context.dataCheckStatus === "excluded")) return null;
  const title = String(workout.title || "").toLowerCase();
  const type = String(workout.workoutType || "").toLowerCase();
  const goal = String(context.trainingGoal || "").toLowerCase();
  const category = String(context.bulkCategory || "").toLowerCase();
  const structure = String(context.structureText || "").toLowerCase();
  const haystack = `${title} ${type} ${goal} ${category} ${structure}`;
  const titleLooksGenerated = generatedWorkoutTitle(workout);
  const explicitThresholdTitle = /(threshold|treshold|drempel|\btempo\b|tempo run|5k tempo|6k tempo|7k tempo|over under|over-under|over\/under|under over|under-over)/.test(title);
  const explicitThresholdContext = goal === "threshold"
    || category === "threshold"
    || type === "threshold"
    || explicitThresholdTitle;

  if (isZ2Workout(workout) || vo2ProfileForWorkout(workout)) return null;
  if (titleLooksGenerated && !explicitThresholdTitle) return null;
  if (/hyrox|stations|wedstrijd|race|compromised|compromissed/.test(haystack) && !/(threshold|treshold|drempel|tempo|over under|over-under|over\/under)/.test(haystack)) return null;
  if (/(upper|lower|fullbody|full body|legday|kracht|strength|rehab)/.test(haystack) && !/(run|hardloop|interval|threshold|treshold|drempel|tempo)/.test(haystack)) return null;

  if (/(over under|over-under|over\/under|under over|under-over)/.test(haystack) && /(threshold|treshold|drempel)/.test(haystack)) {
    return {
      key: "threshold_over_under",
      label: "Threshold over/under",
      helper: "Apart houden van Z2 under/overs. Vergelijk vooral pace per over/under-blok en totaalgevoel.",
    };
  }

  if (/(threshold|treshold|drempel)/.test(haystack)) {
    return {
      key: "threshold",
      label: "Threshold / drempel",
      helper: "Z4/drempelprikkel. Vergelijk pace, blokduur en verval over meerdere sessies.",
    };
  }

  if (/\btempo\b|tempo run|5k tempo|6k tempo|7k tempo/.test(haystack)) {
    return {
      key: "tempo_threshold",
      label: "Tempo / threshold",
      helper: "Tempo-run behandelen als threshold totdat jij hem anders labelt.",
    };
  }

  return null;
}

function generatedWorkoutTitle(workout) {
  const title = String(workout?.title || "").trim();
  const externalId = String(workout?.externalId || "").trim();
  return !title
    || title === "Training"
    || /^Training\s+\d+$/i.test(title)
    || /^Run\s+\d+$/i.test(title)
    || /^Fietsrit\s+\d+$/i.test(title)
    || /^Krachttraining\s+\d+$/i.test(title)
    || Boolean(externalId && title === externalId);
}

function vo2DataCheckReasons(workout) {
  const profile = vo2ProfileForWorkout(workout);
  const intervals = (workout.intervals || []).filter((interval) => !isTransitionInterval(interval));
  const workIntervals = intervals.filter((interval) => isVo2WorkInterval(interval));
  const reasons = [];

  if (!intervals.length) {
    reasons.push("Geen laps/blokken opgeslagen. Haal Strava/FIT-laps op of voeg blokken handmatig toe.");
  }
  if (intervals.length && !workIntervals.length) {
    reasons.push("Er zijn laps, maar nog geen werkblokken gemarkeerd.");
  }

  const missingPaceOrDistance = workIntervals.filter((interval) => paceForInterval(interval) === "-" && !numberOrZero(interval.distanceMeters)).length;
  if (missingPaceOrDistance) reasons.push(`${missingPaceOrDistance} werkblok(ken) zonder pace/afstand.`);

  const matchedWorkBlocks = vo2MatchedWorkBlocks(workIntervals, profile);
  if (profile?.expectedWorkBlocks && matchedWorkBlocks.length < profile.expectedWorkBlocks) {
    reasons.push(`${profile.label} verwacht ${profile.expectedWorkBlocks} passende werkblokken; nu ${matchedWorkBlocks.length}.`);
  }

  if (workIntervals.length && profile?.key === "vo2_general") {
    const hasFourMinuteSignal = workIntervals.some((interval) => {
      const duration = numberOrZero(interval.durationSeconds);
      return duration >= 180 && duration <= 320;
    });
    const hasKmSignal = workIntervals.some((interval) => {
      const distance = numberOrZero(interval.distanceMeters);
      return distance >= 800 && distance <= 1300;
    });
    if (!hasFourMinuteSignal && !hasKmSignal) {
      reasons.push("Structuur nog onbekend: label of dit 4x4, 1km-reps of een andere VO2-prikkel is.");
    }
  }

  return uniqueValues(reasons);
}

function thresholdDataCheckReasons(workout) {
  const intervals = (workout.intervals || []).filter((interval) => !isTransitionInterval(interval));
  const workIntervals = intervals.filter((interval) => isIntensityWorkInterval(interval, "threshold"));
  const reasons = [];

  if (!intervals.length) {
    reasons.push("Geen laps/blokken opgeslagen. Voeg blokken toe of haal detaildata op.");
  }
  if (intervals.length && !workIntervals.length) {
    reasons.push("Er zijn laps, maar nog geen threshold-werkblokken gemarkeerd.");
  }
  const missingPaceOrDistance = workIntervals.filter((interval) => paceForInterval(interval) === "-" && !numberOrZero(interval.distanceMeters)).length;
  if (missingPaceOrDistance) reasons.push(`${missingPaceOrDistance} werkblok(ken) zonder pace/afstand.`);

  if (!reasons.length && !workIntervals.some((interval) => interval.effortGoal === "threshold")) {
    reasons.push("Controleer of de werkblokken als Threshold gelabeld moeten worden.");
  }

  return uniqueValues(reasons);
}

function isVo2WorkInterval(interval) {
  return isIntensityWorkInterval(interval, "vo2");
}

function vo2MatchedWorkBlocks(workIntervals, profile) {
  if (!profile) return [];
  if (profile.targetDurationSeconds) {
    const margin = profile.durationMarginSeconds || 45;
    return workIntervals.filter((interval) => {
      const duration = numberOrZero(interval.durationSeconds);
      return duration >= profile.targetDurationSeconds - margin && duration <= profile.targetDurationSeconds + margin;
    });
  }
  if (profile.targetDistanceMeters) {
    const margin = profile.distanceMarginMeters || 150;
    return workIntervals.filter((interval) => {
      const distance = numberOrZero(interval.distanceMeters);
      return distance >= profile.targetDistanceMeters - margin && distance <= profile.targetDistanceMeters + margin;
    });
  }
  return workIntervals;
}

function renderVo2LapPreview(workout) {
  const intervals = (workout.intervals || []).slice(0, 10);
  if (!intervals.length) return `<p class="z2-gap-laps-empty">Geen laps opgeslagen bij deze workout.</p>`;

  const remaining = Math.max(0, (workout.intervals || []).length - intervals.length);
  return `
    <div class="z2-gap-laps" aria-label="VO2max laps in deze workout">
      ${intervals.map((interval) => `
        <div class="z2-gap-lap">
          <strong>${escapeHtml(interval.name || `Lap ${interval.intervalIndex || "-"}`)}</strong>
          <span>${escapeHtml(lapRoleLabels[interval.lapRole || "work"] || "Werkblok")}</span>
          <span>${formatSeconds(interval.durationSeconds)}</span>
          <span>${formatLapDistance(interval)}</span>
          <span>${paceForInterval(interval)}</span>
          <span>HR ${validHr(interval.avgHr) || "-"} / ${validHr(interval.maxHr) || "-"}</span>
        </div>
      `).join("")}
      ${remaining ? `<small class="z2-gap-laps-more">+${remaining} extra lap(s), open de workout voor alles.</small>` : ""}
    </div>
  `;
}

function canRefreshStravaLaps(workout) {
  return workout?.source === "strava" && Boolean(stravaActivityIdForWorkout(workout));
}

function stravaActivityIdForWorkout(workout) {
  const candidates = [
    workout?.externalId,
    workout?.rawPayload?.strava_activity?.id,
    workout?.rawPayload?.stravaActivity?.id,
    workout?.rawPayload?.activity?.id,
  ];
  return String(candidates.find((value) => /^\d+$/.test(String(value || ""))) || "");
}

function renderZ2GapLapPreview(workout) {
  const intervals = (workout.intervals || []).slice(0, 8);
  if (!intervals.length) {
    return `<p class="z2-gap-laps-empty">Geen laps opgeslagen bij deze workout.</p>`;
  }

  const remaining = Math.max(0, (workout.intervals || []).length - intervals.length);
  return `
    <div class="z2-gap-laps" aria-label="Laps in deze workout">
      ${intervals.map((interval) => `
        <div class="z2-gap-lap">
          <strong>${escapeHtml(interval.name || `Lap ${interval.intervalIndex || "-"}`)}</strong>
          <span>${escapeHtml(intervalExerciseTypeLabels[interval.exerciseType] || "Nog kiezen")}</span>
          <span>${escapeHtml(lapRoleLabels[interval.lapRole || "work"] || "Werkblok")}</span>
          <span>${formatSeconds(interval.durationSeconds)}</span>
          <span>${formatLapDistance(interval)}</span>
          <span>${formatLapOutput(interval)}</span>
          <span>HR ${validHr(interval.avgHr) || "-"} / ${validHr(interval.maxHr) || "-"}</span>
        </div>
      `).join("")}
      ${remaining ? `<small class="z2-gap-laps-more">+${remaining} extra lap(s), open de workout voor alles.</small>` : ""}
    </div>
  `;
}

function formatLapDistance(interval) {
  const distance = numberOrZero(interval.distanceMeters);
  return distance ? `${distance} m` : "afstand -";
}

function formatLapOutput(interval) {
  if (interval.exerciseType === "bike_erg") {
    const watts = wattsForInterval(interval);
    return watts ? `${watts} W` : "W -";
  }
  if (["ski_erg", "row_erg"].includes(interval.exerciseType)) {
    const pace500 = pace500ForInterval(interval);
    return pace500 ? `${pace500}/500m` : "/500m -";
  }
  return paceForInterval(interval);
}

function getZ2ErgBikeDataGaps() {
  const z2Workouts = sortedWorkouts().filter((workout) => (
    isZ2Workout(workout)
    && !isWorkoutDataCheckComplete(workout)
    && !isBikeOnlyWorkout(workout)
  ));
  return z2Workouts
    .map((workout) => {
      const reasons = expectedErgComponentsForWorkout(workout)
        .flatMap((componentType) => z2ErgComponentReasons(workout, componentType));
      if (!reasons.length) return null;
      return { workout, reasons: uniqueValues(reasons) };
    })
    .filter(Boolean);
}

function isWorkoutDataCheckComplete(workout) {
  const reviewContext = workout.rawPayload?.reviewContext || {};
  return reviewContext.dataCheckStatus === "complete" || reviewContext.reviewStatus === "confirmed";
}

function expectedErgComponentsForWorkout(workout) {
  const category = String(workout.rawPayload?.reviewContext?.bulkCategory || "").toLowerCase();
  const type = String(workout.workoutType || "").toLowerCase();
  const title = String(workout.title || "").toLowerCase();
  const structure = String(workout.rawPayload?.reviewContext?.structureText || "").toLowerCase();
  const classificationText = `${title} ${type} ${category}`;
  const detailText = `${classificationText} ${structure}`;
  const expected = new Set();

  if (category === "erg_z2" || type === "erg_z2" || /(erg|ski\s*->\s*row|ski.*row)/.test(classificationText)) {
    expected.add("ski_erg");
    expected.add("row_erg");
  }
  if (hasErgComponent(workout, "ski_erg")) expected.add("ski_erg");
  if (hasErgComponent(workout, "row_erg")) expected.add("row_erg");
  if (
    hasErgComponent(workout, "bike_erg")
    || category === "bike_z2"
    || (type === "z2" && workout.sport === "cycling")
    || /(bike|bikeerg|bike erg|fiets)/.test(classificationText)
  ) {
    expected.add("bike_erg");
  }
  if (!expected.size && /(ski|row|bike|erg)/.test(detailText)) {
    if (/(ski|skierg|ski erg)/.test(detailText)) expected.add("ski_erg");
    if (/(row|rowerg|row erg)/.test(detailText)) expected.add("row_erg");
    if (/(bike|bikeerg|bike erg|fiets)/.test(classificationText)) expected.add("bike_erg");
  }

  return [...expected];
}

function z2ErgComponentReasons(workout, componentType) {
  const label = intervalExerciseTypeLabels[componentType] || componentType;
  const intervals = (workout.intervals || []).filter((interval) => interval.exerciseType === componentType);
  const workIntervals = intervals.filter(isZ2AnalysisWorkInterval);
  const reasons = [];

  if (!intervals.length) {
    reasons.push(`Nog geen laps gelabeld als ${label}.`);
  } else if (!workIntervals.length) {
    reasons.push(`${label} heeft geen werkblokken die meetellen voor Z2-analyse.`);
  }

  const suspiciousDistances = intervals
    .map((interval) => numberOrZero(interval.distanceMeters))
    .filter((distance) => distance > 0 && distance <= 100);
  if (suspiciousDistances.length) {
    reasons.push(`Verdachte afstand in lap(s): ${suspiciousDistances.map((distance) => `${distance}m`).join(", ")}.`);
  }

  if (componentType === "bike_erg") {
    const hasWatts = workIntervals.some((interval) => wattsForInterval(interval) || interval.rawPayload?.metricUnavailable);
    if (!hasWatts) reasons.push("BikeErg wattage ontbreekt nog.");
  } else {
    const hasPace = workIntervals.some((interval) => pace500ForInterval(interval) || interval.rawPayload?.metricUnavailable);
    if (!hasPace) reasons.push(`${label} /500m tempo ontbreekt nog.`);
  }

  const lapHrSummary = lapHrQualitySummary({ intervals: workIntervals });
  if (lapHrSummary.total) {
    reasons.push(`${label} heeft ${lapHrSummary.total} werkblok(ken) met ontbrekende of onlogische HR.`);
  }

  const qualityIssues = workIntervals
    .map((interval) => z2ComponentLapFromInterval(workout, interval, componentType))
    .filter((lap) => lap && !lap.analysisUsable && lap.quality?.level !== "known_missing")
    .flatMap((lap) => lap.quality?.reasons || []);
  uniqueValues(qualityIssues).forEach((issue) => {
    reasons.push(`${label} analysekwaliteit: ${issue}.`);
  });

  const title = String(workout.title || "").toLowerCase();
  if (workout.sport === "running" && /(erg|ski|row|bike)/.test(title)) {
    reasons.push("Deze ERG-sessie stond waarschijnlijk vroeger als hardlopen geregistreerd.");
  }

  return reasons;
}

function isZ2AnalysisWorkInterval(interval) {
  if (isTransitionInterval(interval)) return false;
  if (["warmup", "cooldown", "recovery"].includes(interval.lapRole)) return false;
  return true;
}

function lapHrQualitySummary(workout) {
  const summary = {
    missingAvg: 0,
    missingMax: 0,
    impossiblePair: 0,
    total: 0,
  };

  (workout.intervals || [])
    .filter(isZ2AnalysisWorkInterval)
    .forEach((interval) => {
      const avgHr = validHr(interval.avgHr);
      const maxHr = validHr(interval.maxHr);
      const missingAvg = !avgHr;
      const missingMax = !maxHr;
      const impossiblePair = Boolean(avgHr && maxHr && avgHr > maxHr);

      if (missingAvg) summary.missingAvg += 1;
      if (missingMax) summary.missingMax += 1;
      if (impossiblePair) summary.impossiblePair += 1;
      if (missingAvg || missingMax || impossiblePair) summary.total += 1;
    });

  return summary;
}

function bulkSubgroupKey(workout) {
  const title = String(workout.title || "Zonder titel")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return title || workout.id;
}

function renderBulkSubgroups(category) {
  const subgroups = Array.from(category.subgroups.values())
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "nl"));

  return `
    <details class="bulk-subgroups" open>
      <summary>Sub-bulks (${subgroups.length})</summary>
      <ul>
        ${subgroups.map((subgroup) => `
          <li>
            <strong>${subgroup.count}x ${escapeHtml(subgroup.title)}</strong>
            <span>${escapeHtml(formatSubgroupDateRange(subgroup.dates))} · ${escapeHtml(Array.from(subgroup.meta).slice(0, 2).join(" / "))}</span>
          </li>
        `).join("")}
      </ul>
    </details>
  `;
}

function formatSubgroupDateRange(dates = []) {
  const cleanDates = dates.filter(Boolean).sort();
  if (!cleanDates.length) return "Geen datum";
  const first = cleanDates[0];
  const last = cleanDates[cleanDates.length - 1];
  return first === last ? formatDate(first) : `${formatDate(first)} - ${formatDate(last)}`;
}

function categorizeWorkoutForBulk(workout) {
  const title = String(workout.title || "").toLowerCase();
  const type = String(workout.workoutType || "").toLowerCase();
  const sport = String(workout.sport || "").toLowerCase();
  const haystack = `${title} ${type} ${sport}`;
  const titleHasOverUnder = /\b(under|over)\b|u\/o|u-o/.test(title);

  if (/(maastricht|utrecht|berlijn|berlin|rotterdam|\bsim\b)/.test(haystack)) {
    return bulkCategory(
      "hyrox_race",
      "HYROX wedstrijd / sim",
      "Race",
      "HYROX",
      "Stad of sim in titel: markeren als HYROX wedstrijd/simulatie. Exacte stations later controleren.",
    );
  }

  if (/(snowboard|snowboarden|davos|klosters|parsenn|jakobshorn|bochtjes|zicht)/.test(haystack)) {
    return bulkCategory(
      "other_sport_snowboard",
      "Other sport: snowboard",
      "Other sport",
      "Snowboard",
      "Niet meenemen in HYROX/running analyse. Apart bewaren als recreatieve/andere sport.",
    );
  }

  if (/(hike|hiken|middaghike|wandeling)/.test(haystack)) {
    return bulkCategory(
      "other_sport_hike",
      "Other sport: hike",
      "Other sport",
      "Hike",
      "Niet meenemen in HYROX/running analyse. Apart bewaren als hike/wandelen.",
    );
  }

  if (/hockey/.test(haystack)) {
    return bulkCategory(
      "other_sport_hockey",
      "Other sport: hockey",
      "Other sport",
      "Hockey",
      "Niet meenemen in HYROX/running analyse. Apart bewaren als hockey.",
    );
  }

  if (/kleine prikkel/.test(haystack)) {
    return bulkCategory(
      "hyrox_pre_race",
      "Kleine prikkel",
      "HYROX pre-race",
      "HYROX",
      "Kleine wedstrijdprikkel voor race. Intensiteit waarschijnlijk kort en scherp.",
    );
  }

  if (/(shakeout|shake-out)/.test(haystack)) {
    return bulkCategory(
      "shakeout",
      "Shakeout",
      "Z2 + strides",
      "Hardlopen",
      "Rustige Z2-prikkel met strides. Geen zware intervalstructuur.",
    );
  }

  if (/eerste loopje/.test(haystack) && /(hamstring|scheurtje)/.test(haystack)) {
    return bulkCategory(
      "return_to_run",
      "Return to run",
      "Nog kiezen",
      "Hardlopen",
      "Eerste loopje na hamstringblessure. Bewust niet onder kracht/rehab bulk verwerken.",
    );
  }

  if (/(hamstring|fysio|rehab|scheurtje)/.test(haystack)) {
    return bulkCategory(
      "rehab",
      "Kracht / rehab",
      "Rehab",
      "Kracht/Rehab",
      "Blessure/fysio/rehab sessie. Apart houden van normale krachttraining en running performance.",
    );
  }

  if (/(lowe body|lower body|legday|legg+s+|\blegs\b|fullbody|full body|upper body)/.test(haystack)) {
    return bulkCategory(
      "strength",
      "Kracht",
      "Kracht",
      "Kracht",
      "Lower/upper/fullbody/legday krachttraining.",
    );
  }

  if (/(hiit rustig|hiit sesh|hiit)/.test(haystack)) {
    return bulkCategory(
      "hiit_hyrox_strength",
      "HIIT / HYROX-kracht",
      "Nog kiezen",
      "HYROX/Kracht",
      "HIIT-achtige sessie. Eerst beoordelen of dit kracht, HYROX of mixed conditioning was.",
    );
  }

  if (/compromi[sz]ed/.test(haystack)) {
    return bulkCategory(
      "compromised_running",
      "Compromised running",
      "Threshold / HYROX style",
      "HYROX",
      "Eerst hardlopen, daarna direct 2 min station. Volgorde stations: 3x sled -> burpees -> lunges -> wall balls.",
    );
  }

  if (/(easy bike|z2 bike|zone 2 bike|bike z2|fiets)/.test(haystack) && /(wb|wall ?balls?)/.test(haystack)) {
    return bulkCategory(
      "easy_bike_wallballs",
      "Easy bike + wall balls",
      "Z2 + wall balls",
      "Bike + HYROX",
      "Rustige fietsronde(s) in Z2 met korte wall-ball ronde(s). Geen vaste warming-up/cooling-down.",
    );
  }

  if (titleHasOverUnder && /threshold|treshold|drempel/.test(title)) {
    return bulkCategory(
      "threshold_under_overs",
      "Threshold over/under",
      "Threshold",
      "Hardlopen/ERG",
      "2 min over / 2 min onder zonder pauze. Grotendeels Z4/threshold-prikkel.",
    );
  }

  if (titleHasOverUnder) {
    return bulkCategory(
      "z2_under_overs",
      "Z2 under/overs",
      "Z2 under/overs",
      "Alleen titelmatch",
      "Alleen als over/under letterlijk in de titel staat. Onder = bovenkant Z2, over = onderkant Z3.",
    );
  }

  if (/(vo2|v02|vo2max|vo2 max)/.test(haystack)) {
    return bulkCategory(
      "vo2max",
      "VO2max",
      "VO2max",
      sportLabels[workout.sport] || workout.sport || "Onbekend",
      "VO2max-prikkel. Exacte reps/duur later per workout controleren.",
    );
  }

  if (/(deload interval|norwegian|norweigan|4x\s*1k|4\s*x\s*1k|4['’]\s*blok|4\s*min|4\s*minute)/.test(haystack)) {
    return bulkCategory(
      "vo2max",
      "VO2max",
      "VO2max",
      sportLabels[workout.sport] || workout.sport || "Onbekend",
      "VO2max-prikkel: Norwegian/4 minuten blokken/4x1km/deload interval.",
    );
  }

  if (/(tempo|5k tempo|6k tempo|7k tempo|tempo run)/.test(haystack)) {
    return bulkCategory(
      "threshold",
      "Threshold / tempo",
      "Threshold",
      sportLabels[workout.sport] || workout.sport || "Onbekend",
      "Tempo-run: behandelen als threshold/drempel-prikkel.",
    );
  }

  if (/(treshold|threshold|drempel|treshold run|threshold run)/.test(haystack)) {
    return bulkCategory(
      "threshold",
      "Threshold / drempel",
      "Threshold",
      sportLabels[workout.sport] || workout.sport || "Onbekend",
      "Z4/threshold-prikkel. Bij runs markeren als threshold hardlopen.",
    );
  }

  if (/(treadmill hill|hill sprint|hill sprints|hill endurance|heuvel|sprint)/.test(haystack)) {
    return bulkCategory(
      "run_hill_sprints",
      "Run hill/sprints",
      "Sprints",
      "Hardlopen",
      "Hill/sprint/endurance treadmill prikkel. Hieronder vallen ook treadmill hill sprints en treadmill hill endurance.",
    );
  }

  if (/(progressive|endurance|long run|duurloop|enduramce)/.test(haystack)) {
    return bulkCategory(
      "run_endurance_progressive",
      "Run endurance / progressive",
      "Endurance",
      "Hardlopen",
      "Duur/progressive/endurance run. Waarschijnlijk Z2-Z3, exacte intensiteit later controleren.",
    );
  }

  if (/(erg|skierg|rowerg|ski erg|row erg)/.test(haystack) && /(zone 2|z2|duur|easy)/.test(haystack)) {
    return bulkCategory(
      "erg_z2",
      "ERG zone 2",
      "Z2",
      "Ski -> Row -> Bike",
      "Altijd eerst SkiErg, daarna RowErg, daarna Bike. Blokken vaak 7,5 / 15 / 20-25 min. Korte rondes kunnen wissels zijn.",
    );
  }

  if (/(ski|row|erg)/.test(haystack) && /interval/.test(haystack)) {
    return bulkCategory(
      "erg_intervals",
      "Ski/Row/ERG intervals",
      "Interval",
      "Ski -> Row",
      "ERG-intervallen; meestal starten met ski. Exacte blokken later uit titel/context halen.",
    );
  }

  if (/(recovery|herstel|easy)/.test(haystack)) {
    return bulkCategory(
      "z2_general",
      "Z2 / recovery",
      "Z2",
      sportLabels[workout.sport] || workout.sport || "Onbekend",
      "Recovery/herstel/easy sessie. Behandelen als rustige Z2.",
    );
  }

  if (/(easy bike|z2 bike|zone 2 bike|bike|fiets|cycling|ride)/.test(haystack) || workout.sport === "cycling") {
    return bulkCategory(
      "bike_z2",
      "Bike/fiets Z2",
      "Z2",
      "Fietsen",
      "Rustig fietsen in Z2. Meestal geen warming-up of cooling-down.",
    );
  }

  if (/(recovery run|easy run|z2 run|zone 2 run|duur|zone 2|z2|easy)/.test(haystack)) {
    return bulkCategory(
      "z2_general",
      "Z2 / recovery",
      "Z2",
      sportLabels[workout.sport] || workout.sport || "Onbekend",
      "Rustige Z2/recovery-prikkel. Meestal geen vaste warming-up/cooling-down.",
    );
  }

  if (/(hyrox sesh|hyrox|race sim|stations|wall ball|sled|sandbag|farmer)/.test(haystack)) {
    return bulkCategory(
      "hyrox",
      "HYROX / stations",
      "HYROX Z4",
      "HYROX",
      "HYROX sessie. Voornaamste intensiteit waarschijnlijk Z4; stations later waar nodig specificeren.",
    );
  }

  if (/(interval|intervallen|tempo|track run|5k tempo|6k tempo|7k tempo|4x|5x|6x|8x|10x|20x|\d+\s*x\s*\d+)/.test(haystack)) {
    return bulkCategory(
      "run_intervals",
      "Run intervals / tempo",
      "Interval",
      sportLabels[workout.sport] || workout.sport || "Onbekend",
      "Intervaltraining. Exacte prikkel bepalen op basis van titel: VO2max, drempel of ERG.",
    );
  }

  if (/(upper|lower|fullbody|full body|strength|kracht|gym|deadlift|squat|bench)/.test(haystack) || workout.sport === "strength") {
    return bulkCategory(
      "strength",
      "Kracht",
      "Kracht",
      "Kracht",
      "Upper/lower/fullbody en gym-krachttraining. Compromised running valt hier bewust niet onder.",
    );
  }

  if (/(run|loop|hardloop)/.test(haystack) || workout.sport === "running") {
    return bulkCategory(
      "run_general",
      "Run algemeen",
      "Nog kiezen",
      "Hardlopen",
      "Nog handmatig beoordelen. Alles met threshold/treshold run wordt apart als threshold geclusterd.",
    );
  }

  return bulkCategory(
    "other",
    "Onzeker / nieuw blok",
    "Nog kiezen",
    sportLabels[workout.sport] || workout.sport || "Onbekend",
    "Niet zeker genoeg voor bulk. Deze apart bewaren voor handmatige review.",
  );
}

function bulkCategory(key, label, suggestedGoal, suggestedSport, structure = "") {
  return { key, label, suggestedGoal, suggestedSport, structure };
}

function isWorkoutReviewProcessed(workout) {
  const reviewContext = workout.rawPayload?.reviewContext || {};
  const reviewStatus = reviewContext.reviewStatus || "";
  return reviewStatus === "context_added"
    || reviewStatus === "confirmed"
    || reviewStatus === "later"
    || reviewStatus === "excluded"
    || reviewContext.dataCheckStatus === "later"
    || reviewContext.dataCheckStatus === "excluded"
    || approvedBulkCategoryKeys.has(reviewContext.bulkCategory);
}

function bulkCategoryUpdate(categoryKey) {
  const updates = {
    hyrox_race: {
      sport: "hyrox",
      workoutType: "hyrox_race",
      trainingGoal: "race_pace",
      structureText: "HYROX wedstrijd/simulatie. Exacte station-indeling later controleren.",
    },
    hyrox_pre_race: {
      sport: "hyrox",
      workoutType: "hyrox_pre_race",
      trainingGoal: "hyrox",
      structureText: "Kleine HYROX-prikkel voor wedstrijd. Kort en scherp, exacte onderdelen later controleren.",
    },
    easy_bike_wallballs: {
      sport: "cycling",
      workoutType: "z2_wallballs",
      trainingGoal: "z2",
      structureText: "Rustige fietsronde(s) in Z2 met korte wall-ball ronde(s). Wall balls apart labelen waar laps/segmenten duidelijk zijn.",
    },
    shakeout: {
      sport: "running",
      workoutType: "shakeout",
      trainingGoal: "z2",
      structureText: "Shakeout: rustige Z2-prikkel met strides.",
    },
    run_hill_sprints: {
      sport: "running",
      workoutType: "hill_sprints",
      trainingGoal: "other",
      structureText: "Treadmill hill/sprint/endurance prikkel. Exacte blokken later per workout controleren.",
    },
    run_endurance_progressive: {
      sport: "running",
      workoutType: "endurance",
      trainingGoal: "z2",
      structureText: "Endurance/progressive run. Duurprikkel, waarschijnlijk Z2-Z3; exacte intensiteit later controleren.",
    },
    return_to_run: {
      sport: "running",
      workoutType: "return_to_run",
      trainingGoal: "recovery",
      structureText: "Return-to-run na hamstringblessure. Rustige herstart, apart houden van normale run-performance.",
    },
    rehab: {
      sport: "strength",
      workoutType: "rehab",
      trainingGoal: "strength",
      structureText: "Blessure/fysio/rehab sessie. Apart houden van normale krachttraining en running performance.",
    },
    other_sport_snowboard: {
      workoutType: "other_sport_snowboard",
      trainingGoal: "other",
      structureText: "Snowboard/recreatieve andere sport. Niet meenemen in HYROX/running analyse.",
    },
    other_sport_hike: {
      workoutType: "other_sport_hike",
      trainingGoal: "other",
      structureText: "Hike/wandelen. Niet meenemen in HYROX/running analyse.",
    },
    other_sport_hockey: {
      workoutType: "other_sport_hockey",
      trainingGoal: "other",
      structureText: "Hockey. Niet meenemen in HYROX/running analyse.",
    },
    threshold_under_overs: {
      workoutType: "threshold_under_overs",
      trainingGoal: "threshold",
      structureText: "2 min over / 2 min onder zonder pauze. Over = boven threshold/Z4, onder = net onder threshold.",
    },
    erg_intervals: {
      sport: "hyrox",
      workoutType: "erg_intervals",
      trainingGoal: "other",
      structureText: "Ski/Row/ERG-intervallen. Meestal starten met SkiErg; exacte blokken later uit titel/context halen.",
    },
    compromised_running: {
      sport: "hyrox",
      workoutType: "compromised_running",
      trainingGoal: "hyrox",
      structureText: "Eerst hardlopen, daarna direct 2 min station. Stationsvolgorde: 3x sled -> burpees -> lunges -> wall balls.",
    },
    bike_z2: {
      sport: "cycling",
      workoutType: "z2",
      trainingGoal: "z2",
      structureText: "Rustig fietsen in Z2. Meestal geen vaste warming-up of cooling-down.",
    },
    erg_z2: {
      sport: "hyrox",
      workoutType: "erg_z2",
      trainingGoal: "z2",
      structureText: "ERG Z2: altijd SkiErg -> RowErg -> Bike. Blokken vaak 7,5 / 15 / 20-25 min; korte rondes kunnen wissels zijn.",
    },
    vo2max: {
      workoutType: "vo2max",
      trainingGoal: "vo2max",
      structureText: "VO2max-prikkel. Exacte reps, pauzes en apparaat/onderdeel later per workout controleren.",
    },
    threshold: {
      workoutType: "threshold",
      trainingGoal: "threshold",
      structureText: "Threshold/drempel-prikkel, meestal Z4. Bij runs markeren als threshold hardlopen.",
    },
    hyrox: {
      sport: "hyrox",
      workoutType: "hyrox",
      trainingGoal: "hyrox",
      structureText: "HYROX/stationsessie. Voornaamste intensiteit waarschijnlijk Z4; stations later specificeren.",
    },
    z2_general: {
      workoutType: "z2",
      trainingGoal: "z2",
      structureText: "Rustige Z2/recovery-prikkel. Meestal geen vaste warming-up/cooling-down.",
    },
    z2_under_overs: {
      sport: "running",
      workoutType: "z2_under_overs",
      trainingGoal: "z2_under_overs",
      structureText: "Z2 under/overs alleen als over/under letterlijk in de titel staat. Onder = bovenkant Z2, over = onderkant Z3.",
    },
    run_intervals: {
      sport: "running",
      workoutType: "run_intervals",
      trainingGoal: "other",
      structureText: "Run interval/tempo restcategorie. Exacte verdeling later controleren als dit toch VO2max of threshold blijkt.",
    },
    run_general: {
      sport: "running",
      workoutType: "run_general",
      trainingGoal: "other",
      structureText: "Algemene hardlooptraining zonder duidelijker patroon. Later eventueel verfijnen naar Z2, threshold, VO2max of race.",
    },
    hiit_hyrox_strength: {
      sport: "hyrox",
      workoutType: "hiit_hyrox_strength",
      trainingGoal: "hyrox",
      structureText: "HIIT/mixed conditioning. Later controleren of dit vooral kracht, HYROX of mixed conditioning was.",
    },
    strength: {
      sport: "strength",
      workoutType: "strength",
      trainingGoal: "strength",
      structureText: "Krachttraining: upper/lower/fullbody/gym. Compromised running valt hier niet onder.",
    },
  };

  return updates[categoryKey] || null;
}

function applyBulkUpdateToWorkout(workout, categoryKey) {
  const update = bulkCategoryUpdate(categoryKey);
  if (!update) return workout;

  const now = new Date().toISOString();
  return {
    ...workout,
    sport: update.sport || workout.sport,
    workoutType: update.workoutType || workout.workoutType,
    rawPayload: {
      ...(workout.rawPayload || {}),
      reviewContext: {
        ...((workout.rawPayload || {}).reviewContext || {}),
        trainingGoal: update.trainingGoal || "",
        reviewStatus: "context_added",
        structureText: update.structureText || "",
        warmupText: update.warmupText || "",
        cooldownText: update.cooldownText || "",
        bulkCategory: categoryKey,
        updatedAt: now,
      },
    },
    updatedAt: now,
  };
}

function updateQualitySaveStatus(message, tone = "idle") {
  if (!els.qualitySaveStatus) return;
  els.qualitySaveStatus.innerHTML = message
    ? `<div class="summary-card ${tone === "error" ? "is-error" : ""}"><strong>${escapeHtml(message)}</strong><span>${tone === "ready" ? "Deze correctie is verwerkt." : "Controleer daarna of de workout uit de lijst verdwijnt."}</span></div>`
    : "";
}

async function refreshWorkoutLapsFromStrava(workoutId) {
  const workout = state.workouts.find((item) => item.id === workoutId);
  const activityId = stravaActivityIdForWorkout(workout);
  if (!workout || !activityId) {
    updateQualitySaveStatus("Deze workout heeft geen directe Strava activity ID om laps op te halen.", "error");
    return;
  }

  try {
    updateQualitySaveStatus(`${workout.title || "Workout"} wordt opnieuw uit Strava opgehaald...`);
    const user = await ensureSupabaseUser();
    if (!user) throw new Error("Login eerst bij Supabase.");

    const { importStravaActivity, loadSupabaseWorkouts } = await loadSupabaseModule();
    const { result, error } = await importStravaActivity(activityId);
    if (error) throw error;

    const { workouts, error: loadError } = await loadSupabaseWorkouts();
    if (loadError) throw loadError;

    state.workouts = normalizeAppWorkouts(workouts);
    saveWorkouts(state.workouts);
    render();
    updateQualitySaveStatus(`${result?.laps || 0} lap(s) opnieuw uit Strava opgehaald voor ${workout.title || "de workout"}.`, "ready");
  } catch (error) {
    updateQualitySaveStatus(`Laps ophalen mislukt: ${error.message}`, "error");
  }
}

async function repairMissingStravaLapsThrough(dateKey = "2026-06-10") {
  const allTargets = getMissingStravaLapWorkoutsThrough(dateKey);
  const targets = allTargets.slice(0, 30);
  if (!targets.length) {
    updateQualitySaveStatus(`Geen Strava-workouts van ${formatDate(dateKey)} en ouder zonder laps gevonden.`, "ready");
    return;
  }

  try {
    const user = await ensureSupabaseUser();
    if (!user) throw new Error("Login eerst bij Supabase.");

    const { importStravaActivity, loadSupabaseWorkouts } = await loadSupabaseModule();
    const notFoundIds = new Set();
    let imported = 0;
    let lapTotal = 0;
    const failed = [];
    const notFound = [];

    for (const [index, workout] of targets.entries()) {
      updateQualitySaveStatus(`Laps herstellen ${index + 1}/${targets.length}: ${workout.title || workout.externalId}...`);
      const activityId = stravaActivityIdForWorkout(workout);
      const { result, error } = await importStravaActivity(activityId);
      if (error) {
        const label = `${workout.title || workout.externalId} (${formatDate(workout.date)})`;
        if (/(record|resource) not found/i.test(error.message)) {
          notFound.push(label);
          notFoundIds.add(workout.id);
        } else {
          failed.push(`${label}: ${error.message}`);
        }
        continue;
      }
      imported += 1;
      lapTotal += numberOrZero(result?.laps);
    }

    const { workouts, error: loadError } = await loadSupabaseWorkouts();
    if (loadError) throw loadError;

    state.workouts = normalizeAppWorkouts(workouts);
    if (notFoundIds.size) {
      state.workouts = state.workouts.map((workout) => notFoundIds.has(workout.id)
        ? {
            ...workout,
            rawPayload: {
              ...(workout.rawPayload || {}),
              lapRepairNotFound: true,
              lapRepairNotFoundAt: new Date().toISOString(),
            },
          }
        : workout);
    }
    saveWorkouts(state.workouts);
    render();

    const problemParts = [
      notFound.length ? `${notFound.length} niet gevonden in Strava API; eerste: ${notFound[0]}` : "",
      failed.length ? `${failed.length} mislukt; eerste: ${failed[0]}` : "",
      allTargets.length > targets.length ? `${allTargets.length - targets.length} blijven over voor een volgende klik` : "",
    ].filter(Boolean);
    const message = `${imported}/${targets.length} relevante workout(s) geprobeerd met ${lapTotal} lap(s) hersteld.${problemParts.length ? ` ${problemParts.join(" ")}` : ""}`;
    updateQualitySaveStatus(message, problemParts.length ? "error" : "ready");
  } catch (error) {
    updateQualitySaveStatus(`Bulk herstel mislukt: ${error.message}`, "error");
  }
}

function auditWorkout(workout) {
  const issues = [];
  const rawPayload = workout.rawPayload || {};
  const title = String(workout.title || "");
  const lowerTitle = title.toLowerCase();
  const duration = numberOrZero(workout.durationMin);
  const distance = numberOrZero(workout.distanceKm);
  const avgHr = validHr(workout.avgHr);
  const maxHr = validHr(workout.maxHr);
  const hasDetailData = Boolean(
    rawPayload.importType === "fit"
      || rawPayload.importType === "gpx"
      || rawPayload.importType === "strava_api"
      || rawPayload.fileName,
  );

  if (!title || title === "Training" || /^Run \d+$/.test(title) || /^Fietsrit \d+$/.test(title) || /^Krachttraining \d+$/.test(title)) {
    issues.push({ code: "generated_title", label: "Titel lijkt gegenereerd", severity: "medium" });
  }

  if (!duration) {
    issues.push({ code: "missing_duration", label: "Geen duur", severity: "high" });
  }

  if (!avgHr && !maxHr) {
    issues.push({ code: "missing_hr", label: "Geen HR", severity: workout.source === "strava" ? "medium" : "low" });
  }

  const lapHrSummary = isZ2Workout(workout) ? lapHrQualitySummary(workout) : { total: 0 };
  if (lapHrSummary.total) {
    const parts = [
      lapHrSummary.missingAvg ? `${lapHrSummary.missingAvg} zonder gem HR` : "",
      lapHrSummary.missingMax ? `${lapHrSummary.missingMax} zonder max HR` : "",
      lapHrSummary.impossiblePair ? `${lapHrSummary.impossiblePair} avg > max` : "",
    ].filter(Boolean);
    issues.push({
      code: "missing_lap_hr",
      label: `${lapHrSummary.total} lap(s) HR check: ${parts.join(", ")}`,
      severity: workout.source === "strava" ? "medium" : "low",
    });
  }

  if (workout.sport === "running" && duration >= 10 && distance < 0.5) {
    issues.push({ code: "low_distance_run", label: "Run met bijna geen afstand", severity: "high" });
  }

  if (workout.sport === "cycling" && duration >= 20 && distance < 2) {
    issues.push({ code: "low_distance_ride", label: "Rit met bijna geen afstand", severity: "high" });
  }

  if (distance > 0 && duration > 0) {
    const paceSeconds = duration * 60 / distance;
    if (workout.sport === "running" && (paceSeconds < 120 || paceSeconds > 900)) {
      issues.push({ code: "odd_pace", label: "Tempo lijkt onrealistisch", severity: "medium" });
    }
  }

  if (lowerTitle.includes("erg") && workout.sport === "running") {
    issues.push({ code: "erg_as_running", label: "ERG staat als hardlopen", severity: "medium" });
  }

  if ((lowerTitle.includes("run") || lowerTitle.includes("loop")) && workout.sport === "strength" && distance > 1) {
    issues.push({ code: "run_as_strength", label: "Run lijkt als kracht opgeslagen", severity: "medium" });
  }

  if (workout.source === "strava" && !hasDetailData) {
    issues.push({ code: "missing_detail", label: "Alleen CSV/API samenvatting", severity: "low" });
  }

  if (workout.workoutType === "gpx_import" && !avgHr && !maxHr) {
    issues.push({ code: "gpx_without_hr", label: "GPX zonder HR", severity: "low" });
  }

  return issues;
}

function createIntervalRow(index = 1) {
  const row = document.createElement("div");
  row.className = "interval-row";
  row.innerHTML = `
    <input name="intervalName" placeholder="${index} km" aria-label="Intervalnaam" />
    <input name="intervalDistanceKm" type="number" min="0" step="0.01" placeholder="1.00" aria-label="Intervalafstand kilometer" />
    <input name="intervalDuration" placeholder="3:55" aria-label="Intervaltijd" />
    <input name="intervalAvgPace" placeholder="3:55/km" aria-label="Intervalpace" />
    <input name="intervalAvgHr" type="number" min="0" step="1" placeholder="160" aria-label="Interval gemiddelde hartslag" />
    <input name="intervalMaxHr" type="number" min="0" step="1" placeholder="172" aria-label="Interval maximale hartslag" />
    <button class="icon-button remove-interval-button" type="button" aria-label="Verwijder interval">x</button>
  `;
  return row;
}

function addIntervalRow(shouldFocus = false) {
  const row = createIntervalRow(els.intervalRows.children.length + 1);
  els.intervalRows.append(row);
  if (shouldFocus) row.querySelector("input")?.focus();
}

function resetIntervalRows() {
  els.intervalRows.innerHTML = "";
  addIntervalRow();
}

function createSegmentRow(index = 1) {
  const row = document.createElement("div");
  row.className = "segment-row";
  row.innerHTML = `
    <div class="row-card-header">
      <select name="segmentType" aria-label="Onderdeeltype">
        ${Object.entries(segmentTypeLabels).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}
      </select>
      <input name="segmentName" placeholder="Onderdeel ${index}" aria-label="Onderdeelnaam" />
      <button class="icon-button remove-segment-button" type="button" aria-label="Verwijder onderdeel">x</button>
    </div>
    <div class="row-card-grid">
      <label>Tijd<input name="segmentDuration" placeholder="4:10" aria-label="Onderdeeltijd" /></label>
      <label>Afstand m<input name="segmentDistanceMeters" type="number" min="0" step="1" placeholder="1000" aria-label="Onderdeelafstand meter" /></label>
      <label>Reps<input name="segmentReps" type="number" min="0" step="1" placeholder="100" aria-label="Onderdeel reps" /></label>
      <label>Kg<input name="segmentWeightKg" type="number" min="0" step="0.5" placeholder="152" aria-label="Onderdeel gewicht kilogram" /></label>
      <label>Watts<input name="segmentAvgWatts" type="number" min="0" step="1" placeholder="215" aria-label="Onderdeel gemiddeld wattage" /></label>
      <label>RPE<input name="segmentRpe" type="number" min="0" max="10" step="0.5" placeholder="8" aria-label="Onderdeel RPE" /></label>
      <label>Gem HR<input name="segmentAvgHr" type="number" min="0" step="1" placeholder="165" aria-label="Onderdeel gemiddelde hartslag" /></label>
      <label>Max HR<input name="segmentMaxHr" type="number" min="0" step="1" placeholder="178" aria-label="Onderdeel maximale hartslag" /></label>
      <label class="wide-field">Notitie<input name="segmentNotes" placeholder="Notitie" aria-label="Onderdeelnotitie" /></label>
    </div>
  `;
  return row;
}

function addSegmentRow(shouldFocus = false) {
  const row = createSegmentRow(els.segmentRows.children.length + 1);
  els.segmentRows.append(row);
  if (shouldFocus) {
    row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    row.querySelector("select")?.focus();
  }
}

function resetSegmentRows() {
  els.segmentRows.innerHTML = "";
  addSegmentRow();
}

function createStrengthRow(index = 1) {
  const row = document.createElement("div");
  row.className = "strength-row";
  row.innerHTML = `
    <div class="row-card-header">
      <input name="strengthName" placeholder="Oefening ${index}" aria-label="Krachtoefening" />
      <button class="icon-button remove-strength-button" type="button" aria-label="Verwijder oefening">x</button>
    </div>
    <div class="row-card-grid">
      <label>Sets<input name="strengthSets" type="number" min="0" step="1" placeholder="4" /></label>
      <label>Reps<input name="strengthReps" type="number" min="0" step="1" placeholder="8" /></label>
      <label>Kg<input name="strengthWeightKg" type="number" min="0" step="0.5" placeholder="100" /></label>
      <label>RPE<input name="strengthRpe" type="number" min="0" max="10" step="0.5" placeholder="8" /></label>
      <label class="wide-field">Notitie<input name="strengthNotes" placeholder="Tempo, rust, techniek..." /></label>
    </div>
  `;
  return row;
}

function addStrengthRow(shouldFocus = false) {
  const row = createStrengthRow(els.strengthRows.children.length + 1);
  els.strengthRows.append(row);
  if (shouldFocus) {
    row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    row.querySelector("input")?.focus();
  }
}

function resetStrengthRows() {
  els.strengthRows.innerHTML = "";
  addStrengthRow();
}

function getSupabaseConfig() {
  try {
    const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
    return stored ? { ...DEFAULT_SUPABASE_CONFIG, ...JSON.parse(stored) } : DEFAULT_SUPABASE_CONFIG;
  } catch {
    return DEFAULT_SUPABASE_CONFIG;
  }
}

function saveSupabaseConfig(config) {
  const cleanConfig = {
    url: String(config.url || "").trim(),
    anonKey: String(config.anonKey || "").trim(),
  };
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(cleanConfig));
  return cleanConfig;
}

function hasSupabaseConfig() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

function renderSupabaseConfig() {
  const config = getSupabaseConfig();
  els.supabaseUrlInput.value = config.url || "";
  els.supabaseAnonKeyInput.value = config.anonKey || "";
  if (els.authSupabaseUrlInput) els.authSupabaseUrlInput.value = config.url || "";
  if (els.authSupabaseAnonKeyInput) els.authSupabaseAnonKeyInput.value = config.anonKey || "";
  updateSupabaseStatus(
    hasSupabaseConfig() ? "Config opgeslagen. Login om te syncen." : "Vul je Supabase URL en anon key in.",
    hasSupabaseConfig() ? "ready" : "idle",
  );
}

function updateAuthStatus(message, tone = "idle") {
  if (!els.authStatus) return;
  els.authStatus.innerHTML = message
    ? `<div class="summary-card ${tone === "error" ? "is-error" : ""}"><strong>${escapeHtml(message)}</strong><span>${tone === "ready" ? "Je sessie is actief." : "Gebruik je Supabase-account voor toegang."}</span></div>`
    : "";
}

function setAuthGate(user = state.supabaseUser) {
  if (TEMP_DISABLE_AUTH_GATE) {
    if (els.authScreen) els.authScreen.hidden = true;
    if (els.appShell) els.appShell.hidden = false;
    document.body.classList.add("is-authenticated");
    document.body.classList.remove("is-auth-required");
    return;
  }

  const isLoggedIn = Boolean(user);
  if (els.authScreen) els.authScreen.hidden = isLoggedIn;
  if (els.appShell) els.appShell.hidden = !isLoggedIn;
  document.body.classList.toggle("is-authenticated", isLoggedIn);
  document.body.classList.toggle("is-auth-required", !isLoggedIn);
}

function updateSupabaseStatus(message, tone = "idle") {
  els.supabaseStatus.innerHTML = `<div class="summary-card"><strong>${message}</strong><span>${state.supabaseUser?.email || "Nog geen actieve Supabase-sessie."}</span></div>`;
  els.supabaseStatusBadge.textContent = tone === "ready" ? "Klaar" : tone === "error" ? "Actie nodig" : "Niet gekoppeld";
  els.supabaseStatusBadge.classList.toggle("is-ready", tone === "ready");
  els.supabaseStatusBadge.classList.toggle("is-error", tone === "error");
}

function updateStravaStatus(message, detail = "Koppel eerst Supabase en daarna Strava.", tone = "idle") {
  els.stravaStatus.innerHTML = `<div class="summary-card"><strong>${message}</strong><span>${detail}</span></div>`;
  els.stravaStatusBadge.textContent = tone === "ready" ? "Gekoppeld" : tone === "error" ? "Actie nodig" : "Niet gekoppeld";
  els.stravaStatusBadge.classList.toggle("is-ready", tone === "ready");
  els.stravaStatusBadge.classList.toggle("is-error", tone === "error");
}

function updateIntervalsStatus(message, detail = "", tone = "idle") {
  if (!els.intervalsStatus) return;
  els.intervalsStatus.innerHTML = `<div class="summary-card"><strong>${message}</strong><span>${detail}</span></div>`;
  if (!els.intervalsStatusBadge) return;
  els.intervalsStatusBadge.textContent = tone === "ready" ? "Werkend" : tone === "error" ? "Actie nodig" : "Niet getest";
  els.intervalsStatusBadge.classList.toggle("is-ready", tone === "ready");
  els.intervalsStatusBadge.classList.toggle("is-error", tone === "error");
}

function syncLoginHelpText() {
  return TEMP_DISABLE_AUTH_GATE
    ? "De app staat tijdelijk zonder inlogscherm open, maar sync gebruikt nog steeds Supabase Auth. Login links bij E-mail login en probeer daarna opnieuw."
    : "Login eerst bij Supabase en probeer daarna opnieuw.";
}

function explainSyncError(error) {
  const message = String(error?.message || error || "Onbekende fout.");
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "Geen verbinding met de Supabase Edge Function. Controleer of je bent ingelogd, of de Supabase URL/key kloppen en of de Edge Function gedeployed is.";
  }
  return message;
}

async function requireSupabaseUserForSync(target = "both") {
  const user = await ensureSupabaseUser();
  updateSupabaseStatus(
    user ? "Ingelogd bij Supabase." : "Config opgeslagen. Login om te syncen.",
    user ? "ready" : "idle",
  );

  if (user) return user;

  const title = "Login nodig voor sync.";
  const detail = syncLoginHelpText();
  if (target === "strava" || target === "both") updateStravaStatus(title, detail, "error");
  if (target === "intervals" || target === "both") updateIntervalsStatus(title, detail, "error");
  return null;
}

async function loadSupabaseModule() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase config ontbreekt. Vul eerst URL en anon key in.");
  }

  return import("./data/supabaseWorkoutStore.js");
}

async function refreshSupabaseUser() {
  if (!hasSupabaseConfig()) {
    state.supabaseUser = null;
    setAuthGate(null);
    updateAuthStatus("Vul eerst je Supabase-configuratie in.", "idle");
    return;
  }

  try {
    const { getCurrentUser } = await loadSupabaseModule();
    const { user, error } = await getCurrentUser();
    if (error) throw error;
    state.supabaseUser = user;
    if (state.passwordRecoveryMode) {
      setAuthGate(null);
      if (els.authResetPanel) els.authResetPanel.hidden = false;
      updateAuthStatus("Kies een nieuw wachtwoord om je account te herstellen.", "idle");
      updateSupabaseStatus("Wachtwoordherstel actief.", user ? "ready" : "idle");
      return;
    }
    setAuthGate(state.passwordRecoveryMode ? null : user);
    updateAuthStatus(
      state.passwordRecoveryMode
        ? "Kies een nieuw wachtwoord om je account te herstellen."
        : user ? `Ingelogd als ${user.email}.` : "Log in met e-mail en wachtwoord.",
      user && !state.passwordRecoveryMode ? "ready" : "idle",
    );
    updateSupabaseStatus(
      user ? "Ingelogd bij Supabase." : "Config opgeslagen. Login om te syncen.",
      user ? "ready" : "idle",
    );
    if (user) refreshStravaStatus();
  } catch (error) {
    state.supabaseUser = null;
    setAuthGate(null);
    updateAuthStatus(error.message, "error");
    updateSupabaseStatus(error.message, "error");
  }
}

async function ensureSupabaseUser() {
  const { getCurrentUser } = await loadSupabaseModule();
  const { user, error } = await getCurrentUser();
  if (error) throw error;
  state.supabaseUser = user;
  setAuthGate(user);
  return user;
}

async function refreshStravaStatus() {
  try {
    const user = await requireSupabaseUserForSync("strava");
    if (!user) {
      updateStravaStatus("Nog geen Supabase-sessie.", syncLoginHelpText(), "idle");
      return;
    }

    const { getStravaDataSource } = await loadSupabaseModule();
    const { dataSource, error } = await getStravaDataSource();
    if (error) throw error;

    if (!dataSource) {
      updateStravaStatus("Strava is nog niet gekoppeld.", "Klik op Strava koppelen zodra de Edge Functions gedeployed zijn.", "idle");
      return;
    }

    const athlete = dataSource.provider_profile?.firstname
      ? `${dataSource.provider_profile.firstname} ${dataSource.provider_profile.lastname || ""}`.trim()
      : `Athlete ${dataSource.external_account_id}`;
    const lastSync = dataSource.last_sync_at ? `Laatste sync: ${formatDate(dataSource.last_sync_at.slice(0, 10))}.` : "Nog geen activity import.";
    const detail = dataSource.last_error || `${athlete} · ${lastSync} Scope: ${dataSource.provider_scope || "-"}`;
    updateStravaStatus("Strava gekoppeld.", detail, dataSource.last_error ? "error" : "ready");
  } catch (error) {
    updateStravaStatus(explainSyncError(error), "Controleer of de Strava migration en Edge Functions klaar staan.", "error");
  }
}

async function handleStravaConnect() {
  try {
    const user = await requireSupabaseUserForSync("strava");
    if (!user) return;

    updateStravaStatus("Strava autorisatie wordt voorbereid...", "Je wordt zo naar Strava gestuurd.", "idle");
    const { getStravaAuthUrl } = await loadSupabaseModule();
    const { url, error } = await getStravaAuthUrl();
    if (error) throw error;
    if (!url) throw new Error("Geen Strava autorisatie-url ontvangen.");
    window.location.href = url;
  } catch (error) {
    updateStravaStatus(explainSyncError(error), "Controleer Supabase login, secrets en Edge Functions.", "error");
  }
}

async function handleStravaSyncNow(mode = "recent") {
  try {
    const user = await requireSupabaseUserForSync("strava");
    if (!user) return;

    const isHistory = mode === "history";
    updateStravaStatus(
      isHistory ? "Strava historie-sync draait..." : "Strava sync draait...",
      isHistory ? `Ik haal de volgende ${STRAVA_HISTORY_BATCH_SIZE} oudere activiteiten op.` : "Ik haal je recente activiteiten en laps op.",
      "idle",
    );
    const { syncStravaNow, loadSupabaseWorkouts } = await loadSupabaseModule();
    const syncOutcome = isHistory
      ? await syncStravaHistoryInBatches(syncStravaNow)
      : await syncStravaRecent(syncStravaNow);
    if (syncOutcome.error) throw syncOutcome.error;
    const result = syncOutcome.result;

    const { workouts, error: loadError } = await loadSupabaseWorkouts();
    if (loadError) throw loadError;

    const cleanCloudWorkouts = normalizeAppWorkouts(workouts);
    state.workouts = cleanCloudWorkouts;
    saveWorkouts(state.workouts);
    persistAutoFilledBikeHr();
    state.selectedWorkoutId = state.workouts[0]?.id || null;
    render();
    updateStravaStatus(
      isHistory ? "Strava historie-sync klaar." : "Strava sync klaar.",
      isHistory
        ? `${result?.imported || 0} activiteit(en) verwerkt, ${result?.laps || 0} lap(s) opgeslagen. Klik later opnieuw voor de volgende batch.`
        : `${result?.imported || 0} activiteit(en) verwerkt, ${result?.laps || 0} lap(s) opgeslagen.`,
      "ready",
    );
  } catch (error) {
    updateStravaStatus(explainSyncError(error), "Controleer je Strava permissies en probeer opnieuw.", "error");
  }
}

async function handleDailySync() {
  try {
    const user = await requireSupabaseUserForSync("both");
    if (!user) return;

    updateStravaStatus("Dagelijkse sync gestart...", "Stap 1/3: Strava workouts en laps ophalen.", "idle");
    const { syncStravaNow, syncIntervalsIcuSummary, loadSupabaseWorkouts } = await loadSupabaseModule();
    const strava = await syncStravaRecent(syncStravaNow);
    if (strava.error) throw strava.error;

    updateStravaStatus("Dagelijkse sync loopt...", "Stap 2/3: Intervals.icu load en summary koppelen.", "idle");
    const intervals = await syncIntervalsIcuSummary({ days: 30, limit: 80 });
    if (intervals.error) throw intervals.error;

    updateStravaStatus("Dagelijkse sync loopt...", "Stap 3/3: bijgewerkte cloud-data laden.", "idle");
    const { workouts, error: loadError } = await loadSupabaseWorkouts();
    if (loadError) throw loadError;

    state.workouts = normalizeAppWorkouts(workouts);
    saveWorkouts(state.workouts);
    persistAutoFilledBikeHr();
    state.selectedWorkoutId = state.workouts[0]?.id || null;
    localStorage.setItem("trainiq-last-daily-sync", new Date().toISOString().slice(0, 10));
    render();

    updateStravaStatus(
      "Dagelijkse sync klaar.",
      `Strava: ${strava.result?.imported || 0} activiteit(en), ${strava.result?.laps || 0} lap(s). Intervals.icu: ${intervals.result?.updated || 0}/${intervals.result?.matched || 0} workout(s) verrijkt met load/summary.`,
      "ready",
    );
  } catch (error) {
    const detail = explainSyncError(error);
    updateStravaStatus("Dagelijkse sync mislukt.", detail, "error");
    updateIntervalsStatus("Dagelijkse sync mislukt.", detail, "error");
  }
}


async function handleIntervalsTest() {
  try {
    const user = await requireSupabaseUserForSync("intervals");
    if (!user) return;

    updateIntervalsStatus("Intervals.icu verbinding testen...", "Supabase haalt server-side data op met je secret.");
    const { testIntervalsIcuConnection } = await loadSupabaseModule();
    const { result, error } = await testIntervalsIcuConnection();
    if (error) throw error;

    const first = result?.activities?.first;
    const detailParts = [
      `Athlete ${result?.athleteId || "-"}`,
      `${result?.activities?.count || 0} activiteit(en) laatste 30 dagen`,
      result?.activities?.endpoint ? `Route ${result.activities.endpoint}` : "",
      first?.name ? `Laatste: ${first.name}` : "",
      first?.load ? `Load ${first.load}` : "",
    ].filter(Boolean);

    updateIntervalsStatus(
      result?.ok ? "Intervals.icu verbinding werkt." : "Intervals.icu gaf nog geen bruikbare data terug.",
      detailParts.join(" · ") || "Geen activiteitdetails teruggekregen.",
      result?.ok ? "ready" : "error",
    );
  } catch (error) {
    updateIntervalsStatus("Intervals.icu test mislukt.", explainSyncError(error), "error");
  }
}

async function handleIntervalsPreview() {
  try {
    const user = await requireSupabaseUserForSync("intervals");
    if (!user) return;

    updateIntervalsStatus("Intervals.icu preview ophalen...", "Ik toon alleen hoe de data gemapt zou worden. Er wordt niets opgeslagen.");
    const { previewIntervalsIcuImport } = await loadSupabaseModule();
    const { result, error } = await previewIntervalsIcuImport({ previewLimit: 8, days: 30 });
    if (error) throw error;

    const preview = result?.activities?.preview || [];
    if (!preview.length) {
      updateIntervalsStatus("Geen preview-data gevonden.", "De verbinding werkt mogelijk wel, maar de gekozen route gaf geen activiteiten terug.", "error");
      return;
    }

    els.intervalsStatus.innerHTML = `
      <div class="summary-card">
        <strong>Preview: zo zouden ${preview.length} Intervals.icu activiteit(en) binnenkomen.</strong>
        <span>Route ${escapeHtml(result.activities.endpoint || "-")} · er is niets opgeslagen.</span>
      </div>
      <div class="quality-list">
        ${preview.map((workout) => `
          <details class="intervals-preview-item">
            <summary class="quality-item">
              <div>
                <strong>${escapeHtml(workout.title || "Training")}</strong>
                <small>${escapeHtml(workout.date || "-")} · ${escapeHtml(workout.sport || "-")} · ${escapeHtml(workout.workoutType || "-")}</small>
              </div>
              <div>
                <strong>${workout.intervalsLoad ? `${workout.intervalsLoad} load` : "load -"}</strong>
                <small>${workout.durationMin || "-"} min · ${workout.distanceKm || "-"} km · HR ${workout.avgHr || "-"}</small>
              </div>
              <div>
                <strong>${escapeHtml(workout.externalId || "geen id")}</strong>
                <small>Klik voor mapping${workout.avgWatts ? ` · ${workout.avgWatts} W` : ""}</small>
              </div>
            </summary>
            <div class="intervals-preview-detail">
              <div>
                <span>TrainIQ mapping</span>
                <strong>${escapeHtml(workout.title || "Training")}</strong>
                <small>source: intervals_icu · externalId: ${escapeHtml(workout.externalId || "-")}</small>
              </div>
              <div class="analysis-model-grid">
                <div><span>Datum</span><strong>${escapeHtml(workout.date || "-")}</strong><small>Workout date</small></div>
                <div><span>Sport</span><strong>${escapeHtml(workout.sport || "-")}</strong><small>Genormaliseerd</small></div>
                <div><span>Type</span><strong>${escapeHtml(workout.workoutType || "-")}</strong><small>Afgeleid uit titel/sport</small></div>
                <div><span>Duur</span><strong>${workout.durationMin || "-"}</strong><small>minuten</small></div>
                <div><span>Afstand</span><strong>${workout.distanceKm || "-"}</strong><small>km</small></div>
                <div><span>Gem HR</span><strong>${workout.avgHr || "-"}</strong><small>bpm</small></div>
                <div><span>Watt</span><strong>${workout.avgWatts || "-"}</strong><small>indien aanwezig</small></div>
                <div><span>Load</span><strong>${workout.intervalsLoad || "-"}</strong><small>Intervals.icu</small></div>
                <div><span>Laps</span><strong>${workout.intervalCount || 0}</strong><small>${escapeHtml(workout.intervalSource || "geen bron")} · ${escapeHtml(workout.detailStatus || "detailstatus -")}</small></div>
              </div>
              ${renderIntervalsPreviewLaps(workout)}
              <div>
                <span>Ruwe velden uit Intervals.icu</span>
                <div class="intervals-raw-grid">
                  ${Object.entries(workout.rawSample || {}).map(([key, value]) => `
                    <code><b>${escapeHtml(key)}</b><span>${escapeHtml(value)}</span></code>
                  `).join("")}
                </div>
              </div>
            </div>
          </details>
        `).join("")}
      </div>
    `;
    if (els.intervalsStatusBadge) {
      els.intervalsStatusBadge.textContent = "Preview";
      els.intervalsStatusBadge.classList.add("is-ready");
      els.intervalsStatusBadge.classList.remove("is-error");
    }
  } catch (error) {
    updateIntervalsStatus("Intervals.icu preview mislukt.", explainSyncError(error), "error");
  }
}

function renderIntervalsPreviewLaps(workout) {
  const laps = workout.intervals || [];
  if (!laps.length) {
    return `
      <div class="intervals-preview-laps">
        <span>Laps / intervals</span>
        <p class="empty-state">${escapeHtml(workout.detailError || "Geen laps/intervallen gevonden in de Intervals.icu detailresponse.")}</p>
        ${renderIntervalsArrayOptions(workout)}
      </div>
    `;
  }

  return `
    <div class="intervals-preview-laps">
      <span>Laps / intervals uit ${escapeHtml(workout.intervalSource || "onbekende bron")}</span>
      ${renderIntervalsArrayOptions(workout)}
      <div class="intensity-rep-table">
        <div class="intensity-rep-row intensity-rep-head intervals-lap-row">
          <span>Lap</span>
          <span>Tijd</span>
          <span>Afstand</span>
          <span>Pace/km</span>
          <span>HR</span>
          <span>Watt</span>
        </div>
        ${laps.map((lap) => `
          <div class="intensity-rep-row intervals-lap-row">
            <span><strong>${escapeHtml(lap.name || `Lap ${lap.index}`)}</strong><small>${escapeHtml(lap.type || `#${lap.index}`)}</small></span>
            <span>${formatSeconds(lap.durationSeconds)}</span>
            <span>${lap.distanceMeters ? `${Math.round(lap.distanceMeters)} m` : "-"}</span>
            <span>${escapeHtml(lap.pacePerKm || "-")}</span>
            <span>${lap.avgHr || "-"}${lap.maxHr ? ` / ${lap.maxHr}` : ""}</span>
            <span>${lap.watts || "-"}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderIntervalsArrayOptions(workout) {
  const options = workout.intervalArrayOptions || [];
  if (!options.length) return "";
  return `
    <div class="interval-source-options">
      ${options.map((option) => `<code>${escapeHtml(option.name)}: ${option.count}</code>`).join("")}
    </div>
  `;
}

async function syncStravaRecent(syncStravaNow) {
  return syncStravaNow({ mode: "recent", limit: STRAVA_RECENT_SYNC_SIZE });
}

async function syncStravaHistoryInBatches(syncStravaNow) {
  const page = getStravaHistoryPage();
  const totals = {
    imported: 0,
    laps: 0,
    checked: 0,
    mode: "history",
  };

  updateStravaStatus(
    "Strava historie-sync draait...",
    `Batch pagina ${page}: ${STRAVA_HISTORY_BATCH_SIZE} activiteiten ophalen en opslaan.`,
    "idle",
  );
  const { result, error } = await syncStravaNow({
    mode: "history",
    startPage: page,
    pageSize: STRAVA_HISTORY_BATCH_SIZE,
    maxPages: 1,
    maxActivities: STRAVA_HISTORY_BATCH_SIZE,
  });
  if (error) return { result: totals, error };

  totals.imported += result?.imported || 0;
  totals.laps += result?.laps || 0;
  totals.checked += result?.checked || 0;

  if ((result?.checked || 0) >= STRAVA_HISTORY_BATCH_SIZE) {
    localStorage.setItem(STRAVA_HISTORY_PAGE_KEY, String(page + 1));
  }

  return { result: totals, error: null };
}

function getStravaHistoryPage() {
  const page = Number(localStorage.getItem(STRAVA_HISTORY_PAGE_KEY));
  return Number.isFinite(page) && page > 0 ? page : 1;
}

async function handleIntervalExerciseChange(event) {
  const analysisInput = event.target.closest(".workout-analysis-input");
  if (analysisInput) {
    await handleWorkoutAnalysisFieldChange(analysisInput);
    return;
  }

  const detailInput = event.target.closest(".detail-interval-input");
  if (detailInput) {
    await handleWorkoutDetailIntervalChange(detailInput);
    return;
  }

  const select = event.target.closest(".interval-exercise-select, .interval-goal-select");
  if (!select) return;

  const selected = state.workouts.find((workout) => workout.id === state.selectedWorkoutId) || sortedWorkouts()[0];
  if (!selected) return;

  const intervalIndex = numberOrZero(select.dataset.intervalIndex);
  const updatedWorkout = {
    ...selected,
    intervals: (selected.intervals || []).map((interval) => {
      if (interval.intervalIndex !== intervalIndex) return interval;
      return {
        ...interval,
        exerciseType: select.classList.contains("interval-exercise-select") ? select.value : interval.exerciseType,
        effortGoal: select.classList.contains("interval-goal-select") ? select.value : interval.effortGoal,
      };
    }),
    updatedAt: new Date().toISOString(),
  };

  state.workouts = state.workouts.map((workout) => workout.id === updatedWorkout.id ? updatedWorkout : workout);
  saveWorkouts(state.workouts);
  render();

  try {
    if (hasSupabaseConfig()) {
      const user = await ensureSupabaseUser();
      if (user) {
        const { saveSupabaseWorkout } = await loadSupabaseModule();
        const { error } = await saveSupabaseWorkout(updatedWorkout);
        if (error) throw error;
      }
    }
  } catch (error) {
    updateStravaStatus("Onderdeel lokaal opgeslagen.", `Cloud-update lukte niet: ${error.message}`, "error");
  }
}

async function handleWorkoutAnalysisFieldChange(input) {
  const selected = state.workouts.find((workout) => workout.id === state.selectedWorkoutId);
  if (!selected) return;

  const field = input.dataset.workoutAnalysisField;
  const value = input.value.trim();
  if (field !== "sessionRpe") return;

  const nextReviewContext = {
    ...((selected.rawPayload || {}).reviewContext || {}),
    sessionRpe: numberOrZero(value) || "",
    updatedAt: new Date().toISOString(),
  };
  const updatedWorkout = {
    ...selected,
    rawPayload: {
      ...(selected.rawPayload || {}),
      reviewContext: nextReviewContext,
    },
    updatedAt: new Date().toISOString(),
  };

  await persistWorkoutUpdate(updatedWorkout, "Analyse-RPE lokaal opgeslagen.");
}

async function handleWorkoutDetailIntervalChange(input) {
  const row = input.closest("[data-detail-interval-index]");
  const selected = state.workouts.find((workout) => workout.id === state.selectedWorkoutId);
  if (!selected || !row) return;

  const intervalIndex = numberOrZero(row.dataset.detailIntervalIndex);
  const field = input.dataset.detailIntervalField;
  const value = input.value.trim();
  const useStandardBikeLapDistance = usesStravaBikeLapDistance(selected);
  const updatedWorkout = {
    ...selected,
    intervals: (selected.intervals || []).map((interval) => {
      if (interval.intervalIndex !== intervalIndex) return interval;
      const nextExerciseType = field === "exerciseType" ? value : interval.exerciseType;
      const nextDuration = field === "durationSeconds" ? normalizeDetailDuration(value) : interval.durationSeconds;
      const nextValue = field === "durationSeconds"
        ? nextDuration
        : ["distanceMeters", "avgWatts", "avgHr", "maxHr"].includes(field)
          ? Math.round(numberOrZero(value))
          : field === "avgPace" && value && value !== "-"
            ? value.includes("/km") ? value : `${value}/km`
            : value;
      let nextDistance = interval.distanceMeters;
      if (field === "avgPace500") {
        nextDistance = distanceFromPace500(nextDuration, value);
      } else if (field === "avgWatts") {
        nextDistance = useStandardBikeLapDistance && nextExerciseType === "bike_erg"
          ? STRAVA_BIKE_LAP_DISTANCE_METERS
          : distanceFromErgWatts(nextDuration, nextValue);
      } else if (field === "durationSeconds" && manualPace500Text(interval)) {
        nextDistance = distanceFromPace500(nextDuration, manualPace500Text(interval));
      } else if (field === "durationSeconds" && interval.rawPayload?.manualWatts) {
        nextDistance = useStandardBikeLapDistance && nextExerciseType === "bike_erg"
          ? STRAVA_BIKE_LAP_DISTANCE_METERS
          : distanceFromErgWatts(nextDuration, interval.rawPayload.manualWatts);
      } else if (field === "distanceMeters") {
        nextDistance = nextValue;
      }
      if (useStandardBikeLapDistance && nextExerciseType === "bike_erg") {
        nextDistance = STRAVA_BIKE_LAP_DISTANCE_METERS;
      }
      const nextRawPayload = {
        ...(interval.rawPayload || {}),
        ...(field === "avgPace500" ? { manualPace500: value } : {}),
        ...(field === "avgWatts" ? { manualWatts: nextValue, estimatedDistanceFromWatts: true } : {}),
        ...(useStandardBikeLapDistance && nextExerciseType === "bike_erg" ? { standardBikeLapDistanceMeters: STRAVA_BIKE_LAP_DISTANCE_METERS } : {}),
      };
      const nextInterval = {
        ...interval,
        ...(field === "avgPace500" || field === "avgWatts" ? {} : { [field]: nextValue }),
        distanceMeters: nextDistance,
        avgPace: field === "avgPace"
          ? nextValue
          : ["durationSeconds", "distanceMeters", "avgPace500", "avgWatts", "exerciseType"].includes(field) || (useStandardBikeLapDistance && nextExerciseType === "bike_erg")
            ? ""
            : interval.avgPace,
        rawPayload: nextRawPayload,
      };
      if (field === "exerciseType" && nextValue === "transition") {
        nextInterval.lapRole = "transition";
      }
      if (field === "exerciseType" && nextValue !== "transition" && interval.lapRole === "transition") {
        nextInterval.lapRole = "work";
      }
      if (field === "lapRole" && nextValue === "transition") {
        nextInterval.exerciseType = "transition";
      }

      if (!isTransitionInterval(nextInterval)) return nextInterval;

      const { manualPace500, manualWatts, ...transitionRawPayload } = nextRawPayload;
      return {
        ...nextInterval,
        exerciseType: "transition",
        lapRole: "transition",
        effortGoal: "",
        distanceMeters: 0,
        avgPace: "",
        rawPayload: transitionRawPayload,
      };
    }),
    updatedAt: new Date().toISOString(),
  };

  await persistWorkoutUpdate(updatedWorkout, "Lap lokaal opgeslagen.");
}

async function handleWorkoutDetailContextSave(button) {
  const selected = state.workouts.find((workout) => workout.id === state.selectedWorkoutId);
  const section = button.closest(".workout-detail-controls");
  if (!selected || !section) return;

  const avgHrValue = section.querySelector('[data-detail-workout-field="avgHr"]')?.value;
  const analysisFamily = section.querySelector('[data-detail-workout-field="analysisFamily"]')?.value || "";
  const avgHr = validHr(avgHrValue);
  const now = new Date().toISOString();
  const reviewContext = {
    ...((selected.rawPayload || {}).reviewContext || {}),
    updatedAt: now,
  };

  if (analysisFamily) {
    reviewContext.overrideAnalysisFamily = analysisFamily;
    reviewContext.trainingGoal = trainingGoalForAnalysisFamily(analysisFamily, reviewContext.trainingGoal);
    reviewContext.dataCheckStatus = analysisFamily === "excluded" ? "excluded" : "in_progress";
    reviewContext.reviewStatus = analysisFamily === "excluded" ? "excluded" : "needs_review";
    reviewContext.excludeFromAnalysis = analysisFamily === "excluded";
  } else {
    delete reviewContext.overrideAnalysisFamily;
    delete reviewContext.excludeFromAnalysis;
    if (reviewContext.dataCheckStatus === "excluded") delete reviewContext.dataCheckStatus;
    if (reviewContext.reviewStatus === "excluded") reviewContext.reviewStatus = "needs_review";
  }

  if (avgHr) {
    reviewContext.avgHrFilledFromWorkoutDetail = true;
  }

  const updatedWorkout = applyAnalysisFamilyToWorkout({
    ...selected,
    ...(avgHr ? { avgHr } : {}),
    rawPayload: {
      ...(selected.rawPayload || {}),
      reviewContext,
    },
    updatedAt: now,
  }, analysisFamily);

  await persistWorkoutUpdate(updatedWorkout, "Workout analyse-type en/of gemiddelde HR opgeslagen.");
}

function trainingGoalForAnalysisFamily(family, fallback = "") {
  return {
    z2: "z2",
    threshold: "threshold",
    vo2max: "vo2max",
    hyrox: "hyrox",
    strength: "strength",
    recovery: "recovery",
    general: fallback || "other",
    excluded: fallback || "other",
  }[family] || fallback || "";
}

function applyAnalysisFamilyToWorkout(workout, family) {
  const updates = {
    z2: { workoutType: "z2" },
    threshold: { workoutType: "threshold" },
    vo2max: { workoutType: "vo2max" },
    hyrox: { sport: "hyrox", workoutType: "hyrox" },
    strength: { sport: "strength", workoutType: "strength" },
    recovery: { workoutType: "recovery" },
  }[family] || {};

  return {
    ...workout,
    ...updates,
  };
}

async function handleWorkoutDetailBulkApply(button) {
  const selected = state.workouts.find((workout) => workout.id === state.selectedWorkoutId);
  const tools = button.closest(".workout-detail-bulk-tools");
  if (!selected || !tools) return;

  const fieldValue = (field) => tools.querySelector(`[data-detail-bulk-field="${field}"]`)?.value?.trim() || "";
  const exerciseType = fieldValue("exerciseType");
  const effortGoal = fieldValue("effortGoal");
  const avgWatts = Math.round(numberOrZero(fieldValue("avgWatts")));
  const avgPace500 = fieldValue("avgPace500");
  const useStandardBikeLapDistance = usesStravaBikeLapDistance(selected);

  const updatedWorkout = {
    ...selected,
    workoutType: effortGoal === "z2" && selected.workoutType !== "erg_z2" ? "z2" : selected.workoutType,
    intervals: (selected.intervals || []).map((interval) => {
      if (isTransitionInterval(interval)) return interval;
      const durationSeconds = numberOrZero(interval.durationSeconds);
      const nextExerciseType = exerciseType || interval.exerciseType;
      const isStandardBikeLap = useStandardBikeLapDistance && nextExerciseType === "bike_erg";
      const nextRawPayload = { ...(interval.rawPayload || {}) };
      delete nextRawPayload.metricUnavailable;
      delete nextRawPayload.metricUnavailableReason;

      let distanceMeters = interval.distanceMeters;
      if (isStandardBikeLap) {
        nextRawPayload.standardBikeLapDistanceMeters = STRAVA_BIKE_LAP_DISTANCE_METERS;
        distanceMeters = STRAVA_BIKE_LAP_DISTANCE_METERS;
      }
      if (avgWatts) {
        nextRawPayload.manualWatts = avgWatts;
        nextRawPayload.estimatedDistanceFromWatts = true;
        distanceMeters = isStandardBikeLap
          ? STRAVA_BIKE_LAP_DISTANCE_METERS
          : distanceFromErgWatts(durationSeconds, avgWatts) || distanceMeters;
      }
      if (avgPace500) {
        nextRawPayload.manualPace500 = avgPace500;
        distanceMeters = isStandardBikeLap
          ? STRAVA_BIKE_LAP_DISTANCE_METERS
          : distanceFromPace500(durationSeconds, avgPace500) || distanceMeters;
      }

      return {
        ...interval,
        exerciseType: nextExerciseType,
        lapRole: interval.lapRole || "work",
        effortGoal: effortGoal || interval.effortGoal,
        distanceMeters,
        avgPace: avgPace500 || isStandardBikeLap ? "" : interval.avgPace,
        rawPayload: nextRawPayload,
      };
    }),
    rawPayload: {
      ...(selected.rawPayload || {}),
      reviewContext: {
        ...((selected.rawPayload || {}).reviewContext || {}),
        trainingGoal: effortGoal || ((selected.rawPayload || {}).reviewContext || {}).trainingGoal,
        updatedAt: new Date().toISOString(),
      },
    },
    updatedAt: new Date().toISOString(),
  };

  await persistWorkoutUpdate(updatedWorkout, "Bulk edit lokaal opgeslagen.");
}

async function handleWorkoutDetailAllMetricsUnavailable() {
  const selected = state.workouts.find((workout) => workout.id === state.selectedWorkoutId);
  if (!selected) return;

  const updatedWorkout = {
    ...selected,
    intervals: (selected.intervals || []).map((interval) => {
      if (isTransitionInterval(interval)) return interval;
      const { manualPace500, manualWatts, estimatedDistanceFromWatts, ...rawPayload } = interval.rawPayload || {};
      return {
        ...interval,
        rawPayload: {
          ...rawPayload,
          metricUnavailable: true,
          metricUnavailableReason: "Geen split/tempo/watt data beschikbaar",
        },
      };
    }),
    updatedAt: new Date().toISOString(),
  };

  await persistWorkoutUpdate(updatedWorkout, "Splitdata als onbekend gemarkeerd.");
}

async function handleWorkoutDetailMetricUnavailable(button) {
  const row = button.closest("[data-detail-interval-index]");
  const selected = state.workouts.find((workout) => workout.id === state.selectedWorkoutId);
  if (!selected || !row) return;

  const intervalIndex = numberOrZero(row.dataset.detailIntervalIndex);
  const updatedWorkout = {
    ...selected,
    intervals: (selected.intervals || []).map((interval) => {
      if (interval.intervalIndex !== intervalIndex) return interval;
      const isUnavailable = Boolean(interval.rawPayload?.metricUnavailable);
      const { manualPace500, manualWatts, estimatedDistanceFromWatts, metricUnavailable, metricUnavailableReason, ...rawPayload } = interval.rawPayload || {};
      return {
        ...interval,
        rawPayload: isUnavailable
          ? rawPayload
          : {
            ...rawPayload,
            metricUnavailable: true,
            metricUnavailableReason: "Geen split/tempo/watt data beschikbaar",
          },
      };
    }),
    updatedAt: new Date().toISOString(),
  };

  await persistWorkoutUpdate(updatedWorkout, "Lapstatus lokaal opgeslagen.");
}

async function handleWorkoutDetailDeleteLap(button) {
  const row = button.closest("[data-detail-interval-index]");
  const selected = state.workouts.find((workout) => workout.id === state.selectedWorkoutId);
  if (!selected || !row) return;

  const intervalIndex = numberOrZero(row.dataset.detailIntervalIndex);
  const remainingIntervals = (selected.intervals || [])
    .filter((interval) => interval.intervalIndex !== intervalIndex)
    .map((interval, index) => ({
      ...interval,
      intervalIndex: index + 1,
      name: /^Lap\s+\d+$/i.test(String(interval.name || "")) ? `Lap ${index + 1}` : interval.name,
    }));

  const updatedWorkout = {
    ...selected,
    intervals: remainingIntervals,
    rawPayload: {
      ...(selected.rawPayload || {}),
      reviewContext: {
        ...((selected.rawPayload || {}).reviewContext || {}),
        dataCheckStatus: "in_progress",
        updatedAt: new Date().toISOString(),
      },
    },
    updatedAt: new Date().toISOString(),
  };

  await persistWorkoutUpdate(updatedWorkout, "Ronde verwijderd.");
}

async function handleWorkoutDetailMarkComplete() {
  const selected = state.workouts.find((workout) => workout.id === state.selectedWorkoutId);
  if (!selected) return;

  await markWorkoutDataCheckComplete(selected);
}

async function handleQualityMarkComplete(event) {
  const item = event.target.closest("[data-workout-id]");
  const selected = state.workouts.find((workout) => workout.id === item?.dataset.workoutId);
  if (!selected) return;

  await markWorkoutDataCheckComplete(selected);
}

async function handleQualityStatusAction(event, status) {
  const item = event.target.closest("[data-workout-id]");
  const selected = state.workouts.find((workout) => workout.id === item?.dataset.workoutId);
  if (!selected) return;

  const now = new Date().toISOString();
  const currentContext = (selected.rawPayload || {}).reviewContext || {};
  const reviewContext = {
    ...currentContext,
    updatedAt: now,
  };
  let message = "Datacheck-status bijgewerkt.";

  if (status === "later") {
    reviewContext.reviewStatus = "later";
    reviewContext.dataCheckStatus = "later";
    delete reviewContext.excludeFromAnalysis;
    message = "Workout naar later gezet.";
  }

  if (status === "excluded") {
    reviewContext.reviewStatus = "excluded";
    reviewContext.dataCheckStatus = "excluded";
    reviewContext.excludeFromAnalysis = true;
    reviewContext.excludedFromAnalysisAt = now;
    message = "Workout uitgesloten van analyse.";
  }

  if (status === "open") {
    reviewContext.reviewStatus = "needs_review";
    delete reviewContext.dataCheckStatus;
    delete reviewContext.excludeFromAnalysis;
    delete reviewContext.excludedFromAnalysisAt;
    delete reviewContext.dataCheckCompletedAt;
    message = "Workout teruggezet naar open datacheck.";
  }

  const updatedWorkout = {
    ...selected,
    rawPayload: {
      ...(selected.rawPayload || {}),
      reviewContext,
    },
    updatedAt: now,
  };

  await persistWorkoutUpdate(updatedWorkout, message);
}

async function handleInlineAvgHrSave(event) {
  event.preventDefault();
  event.stopPropagation();

  const button = event.target.closest("[data-save-inline-avg-hr]");
  const item = button?.closest("[data-workout-id]");
  if (!item) return;
  const selected = state.workouts.find((workout) => workout.id === item.dataset.workoutId);
  if (!selected) return;

  const input = item.querySelector("[data-inline-avg-hr]");
  const avgHr = validHr(input?.value);
  if (!avgHr) {
    updateQualitySaveStatus("Vul een geldige gemiddelde hartslag in.", "error");
    return;
  }

  const now = new Date().toISOString();
  const updatedWorkout = {
    ...selected,
    avgHr,
    rawPayload: {
      ...(selected.rawPayload || {}),
      reviewContext: {
        ...((selected.rawPayload || {}).reviewContext || {}),
        avgHrFilledFromDataCheck: true,
        dataCheckStatus: selected.rawPayload?.reviewContext?.dataCheckStatus || "in_progress",
        updatedAt: now,
      },
    },
    updatedAt: now,
  };

  await persistWorkoutUpdate(updatedWorkout, `Gemiddelde hartslag opgeslagen: ${avgHr} bpm.`);
}

async function markWorkoutDataCheckComplete(selected) {
  const now = new Date().toISOString();
  const updatedWorkout = {
    ...selected,
    rawPayload: {
      ...(selected.rawPayload || {}),
      reviewContext: {
        ...((selected.rawPayload || {}).reviewContext || {}),
        reviewStatus: "confirmed",
        dataCheckStatus: "complete",
        dataCheckCompletedAt: now,
        updatedAt: now,
      },
    },
    updatedAt: now,
  };

  await persistWorkoutUpdate(updatedWorkout, "Workout verwerkt en uit datacheck gehaald.");
}

async function persistWorkoutUpdate(updatedWorkout, localMessage = "Workout lokaal opgeslagen.") {
  const analyzedWorkout = withAnalysisSnapshot(updatedWorkout);
  state.workouts = state.workouts.map((workout) => workout.id === analyzedWorkout.id ? analyzedWorkout : workout);
  state.selectedWorkoutId = analyzedWorkout.id;
  saveWorkouts(state.workouts);
  renderWorkoutDetail();
  renderWorkoutList();
  renderZ2Analysis();
  renderIntensityAnalysis();
  renderLoadAnalysis();
  renderQuality();
  updateQualitySaveStatus(localMessage, "ready");

  try {
    if (!hasSupabaseConfig()) return;
    const user = await ensureSupabaseUser();
    if (!user) return;

    const { saveSupabaseWorkout } = await loadSupabaseModule();
    const { error } = await saveSupabaseWorkout(analyzedWorkout);
    if (error) throw error;
    updateQualitySaveStatus("Workout lokaal en in Supabase opgeslagen.", "ready");
  } catch (error) {
    updateStravaStatus(localMessage, `Cloud-update lukte niet: ${error.message}`, "error");
    updateQualitySaveStatus(`${localMessage} Cloud-update lukte niet: ${error.message}`, "error");
  }
}

function normalizeDetailDuration(value) {
  const text = String(value || "").trim();
  if (!text) return 0;
  const parts = text.split(":").map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) return parts[0] * 60 + parts[1];
  if (parts.length === 3 && parts.every(Number.isFinite)) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return numberOrZero(text);
}

async function handleQualityWorkoutSave(event) {
  const item = event.target.closest("[data-workout-id]");
  if (!item) return;

  const selected = state.workouts.find((workout) => workout.id === item.dataset.workoutId);
  if (!selected) return;

  const fieldValue = (name) => item.querySelector(`[data-quality-field="${name}"]`)?.value ?? "";
  const nextTitle = fieldValue("title").trim() || selected.title || "Training";
  const nextWorkoutType = fieldValue("workoutType").trim() || "general";
  const nextSport = fieldValue("sport") || selected.sport || "running";
  const nextDuration = numberOrZero(fieldValue("durationMin"));
  const nextDistance = numberOrZero(fieldValue("distanceKm"));
  const nextAvgHr = numberOrZero(fieldValue("avgHr"));
  const nextMaxHr = numberOrZero(fieldValue("maxHr"));
  const nextNotes = fieldValue("notes").trim();
  const nextTrainingGoal = fieldValue("trainingGoal");
  const nextReviewStatus = fieldValue("reviewStatus") || "needs_review";
  const nextStructureText = fieldValue("structureText").trim();
  const nextWarmupText = fieldValue("warmupText").trim();
  const nextCooldownText = fieldValue("cooldownText").trim();

  const updatedWorkout = {
    ...selected,
    title: nextTitle,
    sport: nextSport,
    workoutType: nextWorkoutType,
    durationMin: nextDuration,
    distanceKm: nextDistance,
    avgHr: nextAvgHr,
    maxHr: nextMaxHr,
    notes: nextNotes,
    rawPayload: {
      ...(selected.rawPayload || {}),
      reviewContext: {
        ...((selected.rawPayload || {}).reviewContext || {}),
        trainingGoal: nextTrainingGoal,
        reviewStatus: nextReviewStatus,
        structureText: nextStructureText,
        warmupText: nextWarmupText,
        cooldownText: nextCooldownText,
        updatedAt: new Date().toISOString(),
      },
    },
    updatedAt: new Date().toISOString(),
  };

  state.workouts = state.workouts.map((workout) => workout.id === updatedWorkout.id ? updatedWorkout : workout);
  state.selectedWorkoutId = updatedWorkout.id;
  saveWorkouts(state.workouts);
  updateQualitySaveStatus("Workout lokaal opgeslagen.", "ready");
  render();

  try {
    if (!hasSupabaseConfig()) return;
    const user = await ensureSupabaseUser();
    if (!user) return;

    const { saveSupabaseWorkout } = await loadSupabaseModule();
    const { error } = await saveSupabaseWorkout(updatedWorkout);
    if (error) throw error;
    updateQualitySaveStatus("Workout lokaal en in Supabase opgeslagen.", "ready");
  } catch (error) {
    updateQualitySaveStatus(`Lokaal opgeslagen, cloud-save mislukte: ${error.message}`, "error");
  }
}

async function handleZ2MetricChange(event) {
  const input = event.target.closest("[data-z2-metric]");
  if (!input) return;

  const row = input.closest("[data-workout-id]");
  const selected = state.workouts.find((workout) => workout.id === row?.dataset.workoutId);
  if (!selected) return;

  const metricKey = input.dataset.z2Metric;
  const value = input.value.trim();
  const now = new Date().toISOString();
  const updatedWorkout = {
    ...selected,
    rawPayload: {
      ...(selected.rawPayload || {}),
      reviewContext: {
        ...((selected.rawPayload || {}).reviewContext || {}),
        z2Metrics: {
          ...(((selected.rawPayload || {}).reviewContext || {}).z2Metrics || {}),
          [metricKey]: value,
        },
        updatedAt: now,
      },
    },
    updatedAt: now,
  };

  state.workouts = state.workouts.map((workout) => workout.id === updatedWorkout.id ? updatedWorkout : workout);
  saveWorkouts(state.workouts);
  renderZ2Analysis();

  try {
    if (!hasSupabaseConfig()) return;
    const user = await ensureSupabaseUser();
    if (!user) return;

    const { saveSupabaseWorkout } = await loadSupabaseModule();
    const { error } = await saveSupabaseWorkout(updatedWorkout);
    if (error) throw error;
  } catch (error) {
    updateSupabaseStatus(`Z2 tempo lokaal opgeslagen, cloud-save mislukte: ${error.message}`, "error");
  }
}

function handleZ2ChartTooltip(event) {
  const point = event.target.closest("[data-z2-tooltip]");
  const chartCard = event.target.closest(".z2-chart-card");
  const panel = chartCard?.querySelector("[data-z2-hover-panel]");
  if (!point || !panel) return;

  panel.innerHTML = escapeHtml(point.dataset.z2Tooltip || "").replace(/\n/g, "<br>");
  panel.classList.add("is-active");
}

function clearZ2ChartTooltip(event) {
  const chartCard = event.target.closest(".z2-chart-card");
  const panel = chartCard?.querySelector("[data-z2-hover-panel]");
  if (!panel) return;

  panel.classList.remove("is-active");
}

function openQualityWorkoutAnalysis(event) {
  const item = event.target.closest("[data-workout-id]");
  if (!item) return;

  state.selectedWorkoutId = item.dataset.workoutId;
  state.workoutDetailReturnView = "quality";
  renderWorkoutDetail();
  setView("workoutDetail");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function handleBulkCategoryApply(event) {
  const button = event.target.closest("[data-bulk-category]");
  if (!button) return;

  const categoryKey = button.dataset.bulkCategory;
  const update = bulkCategoryUpdate(categoryKey);
  if (!update || !approvedBulkCategoryKeys.has(categoryKey)) return;

  const matchingIds = new Set(
    state.workouts
      .filter((workout) => categorizeWorkoutForBulk(workout).key === categoryKey)
      .map((workout) => workout.id),
  );
  if (!matchingIds.size) {
    updateQualitySaveStatus("Geen workouts gevonden voor deze categorie.", "error");
    return;
  }

  const updatedWorkouts = [];
  state.workouts = state.workouts.map((workout) => {
    if (!matchingIds.has(workout.id)) return workout;
    const updatedWorkout = applyBulkUpdateToWorkout(workout, categoryKey);
    updatedWorkouts.push(updatedWorkout);
    return updatedWorkout;
  });

  saveWorkouts(state.workouts);
  render();
  updateQualitySaveStatus(`${updatedWorkouts.length} workout(s) lokaal verwerkt voor ${categoryKey}.`, "ready");

  try {
    if (!hasSupabaseConfig()) return;
    const user = await ensureSupabaseUser();
    if (!user) return;

    const { saveSupabaseWorkouts } = await loadSupabaseModule();
    const { error } = await saveSupabaseWorkouts(updatedWorkouts);
    if (error) throw error;
    updateQualitySaveStatus(`${updatedWorkouts.length} workout(s) lokaal en in Supabase verwerkt.`, "ready");
  } catch (error) {
    updateQualitySaveStatus(`Bulk lokaal verwerkt, cloud-save mislukte: ${error.message}`, "error");
  }
}

function handleStravaCallbackResult() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("strava");
  if (!status) return;

  const message = params.get("message") || "";
  if (status === "connected") {
    updateStravaStatus("Strava gekoppeld.", "Klik op Status ophalen om de koppeling te controleren.", "ready");
    refreshStravaStatus();
  } else {
    updateStravaStatus(
      "Strava koppelen mislukt.",
      message || "Controleer de Authorization Callback Domain in je Strava Developer App.",
      "error",
    );
  }

  window.history.replaceState({}, "", window.location.pathname);
}

async function handleSupabaseLogin() {
  const email = els.supabaseEmailInput.value.trim();
  if (!email) {
    updateSupabaseStatus("Vul eerst je e-mailadres in.", "error");
    return;
  }

  try {
    updateSupabaseStatus("Magic link wordt verstuurd...", "idle");
    const { signInWithEmail } = await loadSupabaseModule();
    const { error } = await signInWithEmail(email);
    if (error) throw error;
    updateSupabaseStatus("Magic link verstuurd. Check je e-mail en open de link.", "ready");
  } catch (error) {
    updateSupabaseStatus(error.message, "error");
  }
}

async function handleAuthPasswordLogin(event) {
  event.preventDefault();
  const email = els.authEmailInput.value.trim();
  const password = els.authPasswordInput.value;

  if (!hasSupabaseConfig()) {
    updateAuthStatus("Sla eerst je Supabase-configuratie op.", "error");
    return;
  }
  if (!email || !password) {
    updateAuthStatus("Vul je e-mail en wachtwoord in.", "error");
    return;
  }

  try {
    updateAuthStatus("Inloggen...", "idle");
    const { signInWithPassword } = await loadSupabaseModule();
    const { user, error } = await signInWithPassword(email, password);
    if (error) throw error;
    state.supabaseUser = user;
    state.passwordRecoveryMode = false;
    setAuthGate(user);
    updateAuthStatus(`Ingelogd als ${user?.email || email}.`, "ready");
    updateSupabaseStatus("Ingelogd bij Supabase.", "ready");
    await handleSupabaseDownload();
    refreshStravaStatus();
  } catch (error) {
    state.supabaseUser = null;
    setAuthGate(null);
    updateAuthStatus(error.message, "error");
  }
}

async function handleAuthSignUp() {
  const email = els.authEmailInput.value.trim();
  const password = els.authPasswordInput.value;

  if (!hasSupabaseConfig()) {
    updateAuthStatus("Sla eerst je Supabase-configuratie op.", "error");
    return;
  }
  if (!email || !password) {
    updateAuthStatus("Vul je e-mail en wachtwoord in.", "error");
    return;
  }
  if (password.length < 8) {
    updateAuthStatus("Gebruik minimaal 8 tekens voor je wachtwoord.", "error");
    return;
  }

  try {
    updateAuthStatus("Account wordt aangemaakt...", "idle");
    const { signUpWithPassword } = await loadSupabaseModule();
    const { user, session, error } = await signUpWithPassword(email, password);
    if (error) throw error;

    if (session && user) {
      state.supabaseUser = user;
      state.passwordRecoveryMode = false;
      setAuthGate(user);
      updateAuthStatus(`Account aangemaakt en ingelogd als ${user.email || email}.`, "ready");
      updateSupabaseStatus("Ingelogd bij Supabase.", "ready");
      await handleSupabaseDownload();
      return;
    }

    updateAuthStatus("Account aangemaakt. Check je e-mail om je account te bevestigen en log daarna in.", "ready");
  } catch (error) {
    updateAuthStatus(error.message, "error");
  }
}

async function handleAuthForgotPassword() {
  const email = els.authEmailInput.value.trim();
  if (!hasSupabaseConfig()) {
    updateAuthStatus("Sla eerst je Supabase-configuratie op.", "error");
    return;
  }
  if (!email) {
    updateAuthStatus("Vul eerst je e-mailadres in.", "error");
    return;
  }

  try {
    updateAuthStatus("Resetmail wordt verstuurd...", "idle");
    const { resetPasswordForEmail } = await loadSupabaseModule();
    const { error } = await resetPasswordForEmail(email);
    if (error) throw error;
    updateAuthStatus("Resetmail verstuurd. Check je e-mail.", "ready");
  } catch (error) {
    updateAuthStatus(error.message, "error");
  }
}

function handleAuthFaceId() {
  updateAuthStatus("Face ID werkt via je opgeslagen wachtwoord/passkey op iPhone. Kies het wachtwoordveld en gebruik iCloud Sleutelhanger. Een echte passkey-login kunnen we later toevoegen.", "idle");
  els.authPasswordInput?.focus();
}

function handleAuthSaveConfig() {
  const config = saveSupabaseConfig({
    url: els.authSupabaseUrlInput.value,
    anonKey: els.authSupabaseAnonKeyInput.value,
  });
  els.supabaseUrlInput.value = config.url;
  els.supabaseAnonKeyInput.value = config.anonKey;
  state.supabaseUser = null;
  setAuthGate(null);
  updateAuthStatus("Config opgeslagen. Je kunt nu inloggen.", "ready");
  updateSupabaseStatus("Config opgeslagen. Login om te syncen.", "ready");
}

async function handleAuthUpdatePassword() {
  const password = els.authNewPasswordInput.value;
  if (!password || password.length < 8) {
    updateAuthStatus("Gebruik minimaal 8 tekens voor je nieuwe wachtwoord.", "error");
    return;
  }

  try {
    updateAuthStatus("Nieuw wachtwoord wordt opgeslagen...", "idle");
    const { updatePassword } = await loadSupabaseModule();
    const { user, error } = await updatePassword(password);
    if (error) throw error;
    state.supabaseUser = user;
    state.passwordRecoveryMode = false;
    if (els.authResetPanel) els.authResetPanel.hidden = true;
    setAuthGate(user);
    updateAuthStatus("Wachtwoord opgeslagen.", "ready");
    updateSupabaseStatus("Ingelogd bij Supabase.", "ready");
    window.history.replaceState({}, "", window.location.pathname);
    await handleSupabaseDownload();
  } catch (error) {
    updateAuthStatus(error.message, "error");
  }
}

function detectPasswordRecovery() {
  const combined = `${window.location.search} ${window.location.hash}`;
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const type = params.get("type") || hashParams.get("type") || "";
  const hasRecoveryToken = type === "recovery"
    || combined.includes("type=recovery")
    || combined.includes("type%3Drecovery")
    || params.has("code")
    || hashParams.has("access_token");
  if (!hasRecoveryToken) return;
  state.passwordRecoveryMode = true;
  if (els.authResetPanel) els.authResetPanel.hidden = false;
  setAuthGate(null);
  updateAuthStatus("Kies een nieuw wachtwoord om je account te herstellen.", "idle");
}

async function handleSupabaseSignOut() {
  try {
    const { signOut } = await loadSupabaseModule();
    const { error } = await signOut();
    if (error) throw error;
    state.supabaseUser = null;
    setAuthGate(null);
    updateAuthStatus("Uitgelogd.", "idle");
    updateSupabaseStatus("Uitgelogd bij Supabase.", "idle");
  } catch (error) {
    updateSupabaseStatus(error.message, "error");
  }
}

async function handleSupabaseUpload() {
  try {
    updateSupabaseStatus("Lokale workouts worden geupload...", "idle");
    state.workouts = normalizeAppWorkouts(state.workouts);
    saveWorkouts(state.workouts);
    const { saveSupabaseWorkouts } = await loadSupabaseModule();
    const { workouts, error } = await saveSupabaseWorkouts(state.workouts);
    if (error) throw error;
    updateSupabaseStatus(`${workouts.length} workout(s) naar Supabase geschreven.`, "ready");
  } catch (error) {
    updateSupabaseStatus(error.message, "error");
  }
}

async function handleSupabaseDownload() {
  try {
    updateSupabaseStatus("Cloud workouts worden opgehaald...", "idle");
    const { loadSupabaseWorkouts } = await loadSupabaseModule();
    const { workouts, error } = await loadSupabaseWorkouts();
    if (error) throw error;
    const cleanCloudWorkouts = normalizeAppWorkouts(workouts);
    state.workouts = cleanCloudWorkouts;
    saveWorkouts(state.workouts);
    state.selectedWorkoutId = state.workouts[0]?.id || null;
    render();
    updateSupabaseStatus(`${state.workouts.length} workout(s) uit Supabase geladen.`, "ready");
  } catch (error) {
    updateSupabaseStatus(error.message, "error");
  }
}

async function persistAutoFilledBikeHr() {
  const workoutsToPersist = state.workouts.filter((workout) => {
    if (!isBikeOnlyWorkout(workout)) return false;
    return (workout.intervals || []).some((interval) => (
      interval.rawPayload?.hrFilledFromWorkoutAverage
      || interval.rawPayload?.maxHrFilledFromWorkout
    ));
  });

  if (!workoutsToPersist.length || !hasSupabaseConfig()) return;

  try {
    const user = await ensureSupabaseUser();
    if (!user) return;
    const { saveSupabaseWorkouts } = await loadSupabaseModule();
    await saveSupabaseWorkouts(workoutsToPersist);
  } catch {
    // Local correction stays available; cloud sync can retry via normal upload.
  }
}

function render() {
  renderDashboard();
  renderWorkoutList();
  renderCalendar();
  renderAnalysisOptions();
  renderAnalysis();
  renderWorkoutDetail();
  renderQuality();
}

function addWorkout(formData) {
  const { workout, workouts } = createManualWorkout(formData, state.workouts);
  state.workouts = workouts;
  state.selectedWorkoutId = workout.id;
  state.selectedDate = workout.date;
  state.calendarMonth = dateFromKey(workout.date);
  render();
}

function parseCsv(text) {
  const rows = parseCsvRows(text);
  const [headers = [], ...records] = rows;
  if (!headers.length) return [];

  return records
    .filter((row) => row.some(Boolean))
    .map((row) => headers.reduce((record, header, index) => {
      record[header] = row[index] || "";
      return record;
    }, {}));
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === "\"" && quoted && nextChar === "\"") {
      value += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(value.trim());
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value.trim());
    rows.push(row);
  }

  return rows;
}

function parseGpxWorkout(text, fileName = "activity.gpx") {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) throw new Error("Dit GPX-bestand kon niet gelezen worden.");

  const points = [...doc.querySelectorAll("trkpt")].map((point) => {
    const timeText = point.querySelector("time")?.textContent || "";
    return {
      lat: numberOrZero(point.getAttribute("lat")),
      lon: numberOrZero(point.getAttribute("lon")),
      ele: numberOrZero(point.querySelector("ele")?.textContent),
      time: timeText ? new Date(timeText) : null,
      hr: extractGpxNumber(point, "hr"),
      cadence: extractGpxNumber(point, "cad"),
    };
  }).filter((point) => point.lat && point.lon);

  if (!points.length) throw new Error("Geen trackpunten gevonden in dit GPX-bestand.");

  const firstTimedPoint = points.find((point) => point.time && !Number.isNaN(point.time.getTime()));
  const lastTimedPoint = [...points].reverse().find((point) => point.time && !Number.isNaN(point.time.getTime()));
  const startDate = firstTimedPoint?.time || new Date();
  const durationSeconds = firstTimedPoint && lastTimedPoint
    ? Math.max(0, Math.round((lastTimedPoint.time - firstTimedPoint.time) / 1000))
    : 0;
  const distanceMeters = Math.round(totalTrackDistance(points));
  const elevations = points.map((point) => point.ele).filter((ele) => ele > 0);
  const elevationGain = elevationGainMeters(elevations);
  const heartRates = points.map((point) => validHr(point.hr)).filter(Boolean);
  const externalId = gpxExternalId(fileName, startDate);

  return {
    id: `strava-${externalId}`,
    source: "strava",
    externalId,
    date: startDate.toISOString().slice(0, 10),
    startTime: startDate.toTimeString().slice(0, 5),
    sport: "running",
    title: doc.querySelector("trk name")?.textContent || fileName.replace(/\.gpx$/i, ""),
    workoutType: "gpx_import",
    durationMin: durationSeconds ? Math.round(durationSeconds / 60) : 0,
    distanceKm: distanceMeters / 1000,
    avgHr: heartRates.length ? Math.round(average(heartRates)) : 0,
    maxHr: heartRates.length ? Math.max(...heartRates) : 0,
    avgPace: paceFromSecondsAndMeters(durationSeconds, distanceMeters),
    elevationGain,
    notes: `Geimporteerd uit GPX (${points.length} trackpunten).`,
    rawPayload: {
      importType: "gpx",
      fileName,
      pointCount: points.length,
      hasHeartRate: Boolean(heartRates.length),
    },
  };
}

async function parseFitWorkoutFromFile(file, buffer) {
  const fitBuffer = file.name.toLowerCase().endsWith(".gz")
    ? await decompressGzip(buffer)
    : buffer;
  return parseFitWorkout(fitBuffer, file.name);
}

async function decompressGzip(buffer) {
  if (!("DecompressionStream" in window)) {
    throw new Error("Deze browser ondersteunt het uitpakken van .gz nog niet. Pak het bestand eerst uit naar .fit en upload die.");
  }

  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

function parseFitWorkout(buffer, fileName = "activity.fit") {
  const view = new DataView(buffer);
  const headerSize = view.getUint8(0);
  const dataSize = view.getUint32(4, true);
  const signature = String.fromCharCode(
    view.getUint8(8),
    view.getUint8(9),
    view.getUint8(10),
    view.getUint8(11),
  );

  if (headerSize < 12 || signature !== ".FIT") {
    throw new Error("Dit FIT-bestand kon niet gelezen worden.");
  }

  const definitions = new Map();
  const records = [];
  const sessions = [];
  const laps = [];
  let offset = headerSize;
  const endOffset = headerSize + dataSize;

  while (offset < endOffset) {
    const header = view.getUint8(offset);
    offset += 1;

    if (header & 0x80) continue;

    const localType = header & 0x0f;
    const isDefinition = Boolean(header & 0x40);
    const hasDeveloperFields = Boolean(header & 0x20);

    if (isDefinition) {
      const parsed = parseFitDefinition(view, offset, hasDeveloperFields);
      definitions.set(localType, parsed.definition);
      offset = parsed.offset;
      continue;
    }

    const definition = definitions.get(localType);
    if (!definition) throw new Error("FIT-data bevat records zonder definitie.");
    const parsed = parseFitDataRecord(view, offset, definition);
    offset = parsed.offset;
    if (definition.globalMessageNumber === 20) records.push(parsed.values);
    if (definition.globalMessageNumber === 19) laps.push(parsed.values);
    if (definition.globalMessageNumber === 18) sessions.push(parsed.values);
  }

  if (!records.length) throw new Error("Geen meetpunten gevonden in dit FIT-bestand.");

  const timedRecords = records.filter((record) => record.timestamp);
  const session = sessions[0] || {};
  const first = timedRecords[0] || records[0];
  const last = timedRecords[timedRecords.length - 1] || records[records.length - 1];
  const startDate = session.startTime || first.timestamp || new Date();
  const recordDurationSeconds = first.timestamp && last.timestamp
    ? Math.max(0, Math.round((last.timestamp - first.timestamp) / 1000))
    : 0;
  const durationSeconds = session.totalTimerTime || session.totalElapsedTime || recordDurationSeconds;
  const distanceMeters = session.totalDistance
    || Math.max(...records.map((record) => numberOrZero(record.distance)), 0)
    || Math.round(totalTrackDistance(records.filter((record) => record.lat && record.lon)));
  const elevations = records.map((record) => record.altitude).filter((altitude) => altitude > 0);
  const heartRates = records.map((record) => validHr(record.heartRate)).filter(Boolean);
  const externalId = fitExternalId(fileName, startDate);
  const sport = mapFitSport(session.sport, session.subSport);
  const workoutType = mapFitWorkoutType(session.sport, session.subSport);
  const title = fitTitle(fileName, sport, workoutType);
  const elevationGain = session.totalAscent || elevationGainMeters(elevations);
  const intervals = fitLapsToIntervals(laps);

  return {
    id: `strava-${externalId}`,
    source: "strava",
    externalId,
    date: startDate.toISOString().slice(0, 10),
    startTime: startDate.toTimeString().slice(0, 5),
    sport,
    title,
    workoutType,
    durationMin: durationSeconds ? Math.round(durationSeconds / 60) : 0,
    distanceKm: distanceMeters / 1000,
    avgHr: validHr(session.avgHr) || (heartRates.length ? Math.round(average(heartRates)) : 0),
    maxHr: validHr(session.maxHr) || (heartRates.length ? Math.max(...heartRates) : 0),
    avgPace: paceFromSecondsAndMeters(durationSeconds, distanceMeters),
    elevationGain,
    intervals,
    notes: `Geimporteerd uit FIT (${records.length} meetpunten${intervals.length ? `, ${intervals.length} laps` : ""}).`,
    rawPayload: {
      importType: "fit",
      fileName,
      recordCount: records.length,
      sessionCount: sessions.length,
      lapCount: laps.length,
      fitSport: session.sport || 0,
      fitSubSport: session.subSport || 0,
      hasHeartRate: Boolean(heartRates.length),
    },
  };
}

function parseFitDefinition(view, offset, hasDeveloperFields) {
  offset += 1;
  const littleEndian = view.getUint8(offset) === 0;
  offset += 1;
  const globalMessageNumber = view.getUint16(offset, littleEndian);
  offset += 2;
  const fieldCount = view.getUint8(offset);
  offset += 1;
  const fields = [];

  for (let index = 0; index < fieldCount; index += 1) {
    fields.push({
      fieldNumber: view.getUint8(offset),
      size: view.getUint8(offset + 1),
      baseType: view.getUint8(offset + 2),
    });
    offset += 3;
  }

  if (hasDeveloperFields) {
    const developerFieldCount = view.getUint8(offset);
    offset += 1 + developerFieldCount * 3;
  }

  return {
    offset,
    definition: {
      littleEndian,
      globalMessageNumber,
      fields,
    },
  };
}

function parseFitDataRecord(view, offset, definition) {
  const values = {};

  for (const field of definition.fields) {
    const value = readFitField(view, offset, field, definition.littleEndian);
    if (definition.globalMessageNumber === 20) {
      applyFitRecordField(values, field.fieldNumber, value);
    }
    if (definition.globalMessageNumber === 19) {
      applyFitLapField(values, field.fieldNumber, value);
    }
    if (definition.globalMessageNumber === 18) {
      applyFitSessionField(values, field.fieldNumber, value);
    }
    offset += field.size;
  }

  return { offset, values };
}

function readFitField(view, offset, field, littleEndian) {
  const baseType = field.baseType & 0x1f;
  if (field.size === 1) return view.getUint8(offset);
  if (field.size === 2) {
    if (baseType === 0x01) return view.getInt16(offset, littleEndian);
    return view.getUint16(offset, littleEndian);
  }
  if (field.size === 4) {
    if (baseType === 0x07) return view.getInt32(offset, littleEndian);
    if (baseType === 0x08) return view.getUint32(offset, littleEndian);
    if (baseType === 0x0d) return view.getUint32(offset, littleEndian);
    return view.getInt32(offset, littleEndian);
  }
  return 0;
}

function applyFitRecordField(values, fieldNumber, value) {
  if (fieldNumber === 253) values.timestamp = fitTimestampToDate(value);
  if (fieldNumber === 0) values.lat = semicirclesToDegrees(value);
  if (fieldNumber === 1) values.lon = semicirclesToDegrees(value);
  if (fieldNumber === 2) values.altitude = value / 5 - 500;
  if (fieldNumber === 3) values.heartRate = value;
  if (fieldNumber === 5) values.distance = value / 100;
  if (fieldNumber === 6) values.speed = value / 1000;
  if (fieldNumber === 7) values.power = value;
  if (fieldNumber === 73) values.speed = value / 1000;
  if (fieldNumber === 78) values.altitude = value / 5 - 500;
}

function applyFitLapField(values, fieldNumber, value) {
  if (fieldNumber === 253) values.timestamp = fitTimestampToDate(value);
  if (fieldNumber === 2) values.startTime = fitTimestampToDate(value);
  if (fieldNumber === 7) values.totalElapsedTime = value / 1000;
  if (fieldNumber === 8) values.totalTimerTime = value / 1000;
  if (fieldNumber === 9) values.totalDistance = value / 100;
  if (fieldNumber === 13) values.avgSpeed = value / 1000;
  if (fieldNumber === 14) values.maxSpeed = value / 1000;
  if (fieldNumber === 15) values.avgHr = validHr(value);
  if (fieldNumber === 16) values.maxHr = validHr(value);
  if (fieldNumber === 17) values.avgCadence = value;
  if (fieldNumber === 18) values.maxCadence = value;
  if (fieldNumber === 19) values.avgPower = value;
  if (fieldNumber === 20) values.maxPower = value;
  if (fieldNumber === 21) values.totalAscent = value;
  if (fieldNumber === 22) values.totalDescent = value;
}

function fitLapsToIntervals(laps = []) {
  if (!Array.isArray(laps) || !laps.length) return [];

  const sortedLaps = [...laps]
    .filter((lap) => numberOrZero(lap.totalTimerTime || lap.totalElapsedTime) || numberOrZero(lap.totalDistance))
    .sort((a, b) => {
      const aTime = a.startTime instanceof Date ? a.startTime.getTime() : 0;
      const bTime = b.startTime instanceof Date ? b.startTime.getTime() : 0;
      return aTime - bTime;
    });
  const firstStart = sortedLaps.find((lap) => lap.startTime instanceof Date)?.startTime;

  return sortedLaps.map((lap, index) => {
    const durationSeconds = Math.round(numberOrZero(lap.totalTimerTime || lap.totalElapsedTime));
    const distanceMeters = Math.round(numberOrZero(lap.totalDistance));
    const avgPower = Math.round(numberOrZero(lap.avgPower));
    const maxPower = Math.round(numberOrZero(lap.maxPower));
    const avgCadence = Math.round(numberOrZero(lap.avgCadence));
    const maxCadence = Math.round(numberOrZero(lap.maxCadence));
    const startOffsetSeconds = firstStart && lap.startTime instanceof Date
      ? Math.max(0, Math.round((lap.startTime - firstStart) / 1000))
      : 0;
    return {
      intervalIndex: index + 1,
      name: `Lap ${index + 1}`,
      exerciseType: "",
      lapRole: "work",
      effortGoal: "",
      startOffsetSeconds,
      durationSeconds,
      distanceMeters,
      avgHr: Math.round(validHr(lap.avgHr)),
      maxHr: Math.round(validHr(lap.maxHr)),
      avgPace: paceFromSecondsAndMeters(durationSeconds, distanceMeters),
      rawPayload: {
        fitLap: lap,
        ...(avgPower ? { avg_watts: avgPower } : {}),
        ...(maxPower ? { max_watts: maxPower } : {}),
        ...(avgCadence ? { avg_cadence: avgCadence } : {}),
        ...(maxCadence ? { max_cadence: maxCadence } : {}),
      },
    };
  });
}

function applyFitSessionField(values, fieldNumber, value) {
  if (fieldNumber === 253) values.timestamp = fitTimestampToDate(value);
  if (fieldNumber === 2) values.startTime = fitTimestampToDate(value);
  if (fieldNumber === 5) values.sport = value;
  if (fieldNumber === 6) values.subSport = value;
  if (fieldNumber === 7) values.totalElapsedTime = value / 1000;
  if (fieldNumber === 8) values.totalTimerTime = value / 1000;
  if (fieldNumber === 9) values.totalDistance = value / 100;
  if (fieldNumber === 16) values.avgHr = validHr(value);
  if (fieldNumber === 17) values.maxHr = validHr(value);
  if (fieldNumber === 21) values.totalAscent = value;
}

function mapFitSport(sport, subSport) {
  if (sport === 1) return "running";
  if (sport === 2) return "cycling";
  if (sport === 4) return "strength";
  if (sport === 37 || subSport === 62) return "strength";
  return "running";
}

function mapFitWorkoutType(sport, subSport) {
  if (sport === 4 || sport === 37) return "strength";
  if (subSport === 62) return "fitness";
  if (sport === 1) return "run";
  if (sport === 2) return "ride";
  return "fit_import";
}

function fitTitle(fileName, sport, workoutType) {
  const idFromName = fileName.match(/(\d{6,})/)?.[1];
  const baseName = fileName.replace(/\.fit(\.gz)?$/i, "");
  if (!idFromName) return baseName;
  if (workoutType === "strength") return `Krachttraining ${idFromName}`;
  if (workoutType === "fitness") return `Fitness ${idFromName}`;
  if (sport === "cycling") return `Fietsrit ${idFromName}`;
  return `Run ${idFromName}`;
}

function fitTimestampToDate(timestamp) {
  if (!timestamp) return null;
  return new Date((timestamp + 631065600) * 1000);
}

function semicirclesToDegrees(value) {
  if (!value) return 0;
  return value * 180 / 2 ** 31;
}

function fitExternalId(fileName, startDate) {
  const idFromName = fileName.match(/(\d{6,})/)?.[1];
  if (idFromName) return idFromName;
  const safeName = fileName.replace(/\.fit(\.gz)?$/i, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `fit-${safeName}-${startDate.toISOString()}`;
}

function extractGpxNumber(point, localName) {
  const candidates = [...point.getElementsByTagName("*")];
  const match = candidates.find((node) => node.localName?.toLowerCase() === localName);
  return numberOrZero(match?.textContent);
}

function gpxExternalId(fileName, startDate) {
  const idFromName = fileName.match(/(\d{6,})/)?.[1];
  if (idFromName) return idFromName;
  const safeName = fileName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `gpx-${safeName}-${startDate.toISOString()}`;
}

function totalTrackDistance(points) {
  return points.reduce((sum, point, index) => {
    if (!index) return sum;
    return sum + haversineMeters(points[index - 1], point);
  }, 0);
}

function haversineMeters(a, b) {
  const earthRadius = 6371000;
  const dLat = degreesToRadians(b.lat - a.lat);
  const dLon = degreesToRadians(b.lon - a.lon);
  const lat1 = degreesToRadians(a.lat);
  const lat2 = degreesToRadians(b.lat);
  const angle = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(angle), Math.sqrt(1 - angle));
}

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function elevationGainMeters(elevations) {
  return Math.round(elevations.reduce((gain, elevation, index) => {
    if (!index) return gain;
    return gain + Math.max(0, elevation - elevations[index - 1]);
  }, 0));
}

function paceFromSecondsAndMeters(seconds, meters) {
  if (!seconds || !meters) return "";
  const secondsPerKm = seconds / (meters / 1000);
  const minutes = Math.floor(secondsPerKm / 60);
  const remainder = Math.round(secondsPerKm % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}/km`;
}

async function importDataFiles(files) {
  const fileList = Array.from(files || []);
  if (!fileList.length) return;

  let importedCount = 0;
  const kinds = new Set();
  const importMessages = [];
  const fileSummaries = [];

  for (const file of fileList) {
    try {
      els.importStatus.innerHTML = `<div class="summary-card"><strong>Import bezig...</strong><span>${file.name} wordt gelezen.</span></div>`;
      const contents = await readImportFile(file);
      const importedResult = await importFileContents(file, contents);
      state.workouts = normalizeAppWorkouts(importedResult.workouts);
      saveWorkouts(state.workouts);
      importedCount += importedResult.imported.length;
      kinds.add(importedResult.kind);
      fileSummaries.push(importedResult.summary || `${file.name}: ${importedResult.kind || "bestand"} verwerkt`);
      state.selectedWorkoutId = importedResult.imported[0]?.id || state.selectedWorkoutId;
      state.selectedDate = importedResult.imported[0]?.date || state.selectedDate;
      state.calendarMonth = state.selectedDate ? dateFromKey(state.selectedDate) : state.calendarMonth;
      if (importedResult.message) importMessages.push(importedResult.message);
    } catch (error) {
      els.importStatus.innerHTML = `<div class="summary-card"><strong>Import deels mislukt</strong><span>${file.name}: ${error.message}</span></div>`;
      return;
    }
  }

  render();
  const detail = [
    `${[...kinds].join(", ")} lokaal dedupe-opgeslagen.`,
    ...fileSummaries,
    ...importMessages,
    "Cloud upload wordt geprobeerd als je bent ingelogd.",
  ].join(" ");
  els.importStatus.innerHTML = `<div class="summary-card"><strong>${importedCount} workout(s) verwerkt</strong><span>${escapeHtml(detail)}</span></div>`;
  await uploadImportedWorkouts(importedCount, importMessages, fileSummaries);
}

function readImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result || ""));
    reader.addEventListener("error", () => reject(new Error(`${file.name} kon niet gelezen worden.`)));
    if (isBinaryActivityFile(file)) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}

function isBinaryActivityFile(file) {
  const name = file.name.toLowerCase();
  return name.endsWith(".fit") || name.endsWith(".fit.gz");
}

async function importFileContents(file, contents) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".gpx")) {
    const workout = parseGpxWorkout(String(contents || ""), file.name);
    const result = importWorkouts([workout], state.workouts);
    return { ...result, kind: "GPX" };
  }

  if (name.endsWith(".fit") || name.endsWith(".fit.gz")) {
    const workout = await parseFitWorkoutFromFile(file, contents);
    return importFitWorkoutWithMatching(workout, state.workouts);
  }

  const records = parseCsv(String(contents || ""));
  const result = importCsvWorkouts(records, state.workouts);
  return { ...result, kind: "CSV" };
}

function importFitWorkoutWithMatching(fitWorkout, currentWorkouts) {
  const match = findBestFitWorkoutMatch(fitWorkout, currentWorkouts);
  if (!match || match.score < 70 || !(fitWorkout.intervals || []).length) {
    const result = importWorkouts([fitWorkout], currentWorkouts);
    return {
      ...result,
      kind: "FIT",
      summary: fitImportSummary(fitWorkout, match, false),
      message: match
        ? `FIT niet gekoppeld: beste match ${match.score}/100 (${match.workout.title})`
        : "FIT als losse workout",
    };
  }

  const updatedWorkout = mergeFitLapsIntoWorkout(match.workout, fitWorkout, match);
  const workouts = sortWorkoutsByDate(currentWorkouts.map((workout) => workout.id === updatedWorkout.id ? updatedWorkout : workout));
  saveWorkouts(workouts);
  return {
    imported: [updatedWorkout],
    workouts,
    kind: "FIT gekoppeld",
    summary: fitImportSummary(fitWorkout, match, true),
    message: `${fitWorkout.intervals.length} laps gekoppeld aan ${updatedWorkout.title}`,
  };
}

function fitImportSummary(fitWorkout, match, linked) {
  const lapText = `${(fitWorkout.intervals || []).length} lap(s)`;
  const fileName = fitWorkout.rawPayload?.fileName || "FIT";
  const dateText = fitWorkout.date ? formatDate(fitWorkout.date) : "datum onbekend";
  const matchText = match ? `beste match ${match.score}/100: ${match.workout.title}` : "geen bestaande match";
  return `${fileName}: ${lapText}, ${dateText}, ${linked ? "gekoppeld" : "niet gekoppeld"} (${matchText}).`;
}

function findBestFitWorkoutMatch(fitWorkout, workouts) {
  const candidates = workouts
    .map((workout) => ({
      workout,
      score: fitWorkoutMatchScore(fitWorkout, workout),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}

function fitWorkoutMatchScore(fitWorkout, candidate) {
  if (!fitWorkout?.date || !candidate?.date || fitWorkout.date !== candidate.date) return 0;

  let score = 35;
  const startDiff = timeDiffMinutes(fitWorkout.startTime, candidate.startTime);
  if (startDiff !== null) {
    if (startDiff <= 5) score += 30;
    else if (startDiff <= 15) score += 22;
    else if (startDiff <= 45) score += 10;
    else score -= 20;
  }

  const durationScore = metricSimilarityScore(numberOrZero(fitWorkout.durationMin), numberOrZero(candidate.durationMin), 0.12, 25);
  score += durationScore;

  const distanceScore = metricSimilarityScore(numberOrZero(fitWorkout.distanceKm), numberOrZero(candidate.distanceKm), 0.1, 20);
  score += distanceScore;

  const hrScore = metricSimilarityScore(validHr(fitWorkout.avgHr), validHr(candidate.avgHr), 0.08, 10);
  score += hrScore;

  if (fitWorkout.sport && candidate.sport && fitWorkout.sport === candidate.sport) score += 10;
  if ((candidate.intervals || []).length) score -= 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function metricSimilarityScore(sourceValue, targetValue, tolerancePct, maxScore) {
  if (!sourceValue || !targetValue) return 0;
  const deltaPct = Math.abs(sourceValue - targetValue) / sourceValue;
  if (deltaPct > tolerancePct * 2) return 0;
  return Math.round(Math.max(0, 1 - (deltaPct / tolerancePct)) * maxScore);
}

function timeDiffMinutes(timeA, timeB) {
  const minutesA = minutesFromTimeText(timeA);
  const minutesB = minutesFromTimeText(timeB);
  if (minutesA === null || minutesB === null) return null;
  const direct = Math.abs(minutesA - minutesB);
  return Math.min(direct, 1440 - direct);
}

function minutesFromTimeText(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function mergeFitLapsIntoWorkout(existingWorkout, fitWorkout, match) {
  const existingReview = existingWorkout.rawPayload?.reviewContext || {};
  const fitIntervals = mergeFitIntervalsWithExistingLabels(existingWorkout, fitWorkout);

  return {
    ...existingWorkout,
    avgHr: validHr(fitWorkout.avgHr) || validHr(existingWorkout.avgHr) || 0,
    maxHr: validHr(fitWorkout.maxHr) || validHr(existingWorkout.maxHr) || 0,
    distanceKm: numberOrZero(fitWorkout.distanceKm) || numberOrZero(existingWorkout.distanceKm),
    durationMin: numberOrZero(fitWorkout.durationMin) || numberOrZero(existingWorkout.durationMin),
    avgPace: fitWorkout.avgPace || existingWorkout.avgPace,
    intervals: fitIntervals,
    rawPayload: {
      ...(existingWorkout.rawPayload || {}),
      reviewContext: {
        ...existingReview,
        dataCheckStatus: existingReview.dataCheckStatus === "complete" ? "complete" : "in_progress",
        fitHrImportedAt: new Date().toISOString(),
      },
      fitLapSource: {
        fileName: fitWorkout.rawPayload?.fileName || "",
        externalId: fitWorkout.externalId || "",
        lapCount: fitIntervals.length,
        matchScore: match.score,
        linkedAt: new Date().toISOString(),
      },
    },
    notes: existingWorkout.notes || fitWorkout.notes,
    updatedAt: new Date().toISOString(),
  };
}

function mergeFitIntervalsWithExistingLabels(existingWorkout, fitWorkout) {
  const existingIntervals = existingWorkout.intervals || [];
  const fitIntervals = fitWorkout.intervals || [];
  const sameLapCount = existingIntervals.length && existingIntervals.length === fitIntervals.length;

  return fitIntervals.map((fitInterval, index) => {
    const existing = sameLapCount ? existingIntervals[index] : findClosestExistingInterval(fitInterval, existingIntervals);
    const hasExistingLabel = existing && (
      existing.effortGoal
      || (existing.exerciseType && existing.exerciseType !== "run")
      || (existing.lapRole && !["", "work"].includes(existing.lapRole))
    );
    const labeled = hasExistingLabel
      ? mergeFitIntervalWithExistingLabel(existing, fitInterval)
      : autoLabelImportedFitInterval(existingWorkout, fitInterval, index, fitIntervals.length);
    return {
      ...labeled,
      intervalIndex: index + 1,
      rawPayload: {
        ...(labeled.rawPayload || {}),
        fitLinkedFromFile: fitWorkout.rawPayload?.fileName || "",
      },
    };
  });
}

function findClosestExistingInterval(fitInterval, existingIntervals) {
  if (!existingIntervals.length) return null;
  const fitDuration = numberOrZero(fitInterval.durationSeconds);
  const fitDistance = numberOrZero(fitInterval.distanceMeters);
  return existingIntervals
    .map((interval) => {
      const durationDelta = fitDuration && interval.durationSeconds ? Math.abs(fitDuration - numberOrZero(interval.durationSeconds)) : 9999;
      const distanceDelta = fitDistance && interval.distanceMeters ? Math.abs(fitDistance - numberOrZero(interval.distanceMeters)) / 5 : 9999;
      return { interval, score: durationDelta + distanceDelta };
    })
    .sort((a, b) => a.score - b.score)[0]?.interval || null;
}

function mergeFitIntervalWithExistingLabel(existing, fitInterval) {
  return {
    ...fitInterval,
    name: existing.name || fitInterval.name,
    exerciseType: existing.exerciseType || fitInterval.exerciseType || "run",
    lapRole: existing.lapRole || fitInterval.lapRole || "work",
    effortGoal: existing.effortGoal || fitInterval.effortGoal || "",
    rawPayload: {
      ...(fitInterval.rawPayload || {}),
      preservedLabelFromExistingLap: true,
      previousIntervalIndex: existing.intervalIndex || "",
    },
  };
}

function autoLabelImportedFitInterval(workout, interval, index, total) {
  const pace = secondsPerKmForInterval(interval);
  const isThresholdWorkout = Boolean(thresholdProfileForWorkout(workout, { includeExcluded: true }));
  const isVo2Workout = Boolean(vo2ProfileForWorkout(workout, { includeExcluded: true }));
  const isFirst = index === 0;
  const isLast = index === total - 1;
  let lapRole = interval.lapRole || "work";
  let effortGoal = interval.effortGoal || "";

  if (isThresholdWorkout) {
    if (pace >= 250 && pace <= 285) {
      lapRole = "work";
      effortGoal = "threshold";
    } else if (isFirst) {
      lapRole = "warmup";
      effortGoal = "z2";
    } else if (isLast) {
      lapRole = "cooldown";
      effortGoal = "z2";
    } else {
      lapRole = "recovery";
      effortGoal = "recovery";
    }
  }

  if (isVo2Workout) {
    if (pace >= 225 && pace <= 248) {
      lapRole = "work";
      effortGoal = "vo2max";
    } else if (isFirst) {
      lapRole = "warmup";
      effortGoal = "z2";
    } else if (isLast) {
      lapRole = "cooldown";
      effortGoal = "z2";
    } else {
      lapRole = "recovery";
      effortGoal = "recovery";
    }
  }

  return {
    ...interval,
    exerciseType: interval.exerciseType || "run",
    lapRole,
    effortGoal,
    rawPayload: {
      ...(interval.rawPayload || {}),
      autoLabeledFromFitImport: Boolean(isThresholdWorkout || isVo2Workout),
    },
  };
}

async function uploadImportedWorkouts(importedCount, importMessages = [], fileSummaries = []) {
  if (!importedCount || !hasSupabaseConfig()) return;

  try {
    const user = await ensureSupabaseUser();
    if (!user) return;

    const { saveSupabaseWorkouts } = await loadSupabaseModule();
    const { error } = await saveSupabaseWorkouts(state.workouts);
    if (error) throw error;

    const detail = [
      "Opgeslagen in Supabase. Bestaande externe ID's zijn bijgewerkt, niet dubbel toegevoegd.",
      ...fileSummaries,
      ...importMessages,
    ].join(" ");
    els.importStatus.innerHTML = `<div class="summary-card"><strong>${importedCount} workout(s) verwerkt</strong><span>${escapeHtml(detail)}</span></div>`;
  } catch (error) {
    const detail = [
      `Cloud upload lukte niet: ${error.message}`,
      ...fileSummaries,
      ...importMessages,
    ].join(" ");
    els.importStatus.innerHTML = `<div class="summary-card"><strong>${importedCount} workout(s) lokaal verwerkt</strong><span>${escapeHtml(detail)}</span></div>`;
  }
}

function setView(viewId) {
  els.views.forEach((view) => view.classList.toggle("is-visible", view.id === viewId));
  els.navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === viewId));
}

function bindEvents() {
  els.navItems.forEach((item) => {
    item.addEventListener("click", () => setView(item.dataset.view));
  });

  els.workoutDetailBackButton?.addEventListener("click", () => {
    setView(state.workoutDetailReturnView || "analysis");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  els.workoutDetailContent?.addEventListener("change", (event) => {
    handleIntervalExerciseChange(event);
  });

  els.workoutDetailContent?.addEventListener("click", (event) => {
    const contextSaveButton = event.target.closest("[data-detail-save-workout-context]");
    if (contextSaveButton) {
      handleWorkoutDetailContextSave(contextSaveButton);
      return;
    }

    const bulkApplyButton = event.target.closest("[data-detail-bulk-apply]");
    if (bulkApplyButton) {
      handleWorkoutDetailBulkApply(bulkApplyButton);
      return;
    }

    if (event.target.closest("[data-detail-bulk-missing]")) {
      handleWorkoutDetailAllMetricsUnavailable();
      return;
    }

    if (event.target.closest("[data-detail-mark-complete]")) {
      handleWorkoutDetailMarkComplete();
      return;
    }

    const noMetricButton = event.target.closest("[data-detail-no-metric]");
    if (noMetricButton) {
      handleWorkoutDetailMetricUnavailable(noMetricButton);
      return;
    }

    const deleteLapButton = event.target.closest("[data-detail-delete-lap]");
    if (deleteLapButton) {
      handleWorkoutDetailDeleteLap(deleteLapButton);
    }
  });

  els.seedButton.addEventListener("click", () => {
    state.workouts = resetWorkouts();
    state.selectedWorkoutId = state.workouts[0].id;
    state.selectedDate = state.workouts[0].date;
    state.calendarMonth = dateFromKey(state.selectedDate);
    render();
  });

  els.workoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedDate = els.workoutForm.elements.date.value;
    addWorkout(new FormData(event.currentTarget));
    event.currentTarget.reset();
    els.workoutForm.elements.date.value = selectedDate;
    resetIntervalRows();
    resetSegmentRows();
    resetStrengthRows();
  });

  els.addIntervalButton.addEventListener("click", () => {
    addIntervalRow(true);
  });

  els.intervalRows.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-interval-button");
    if (!removeButton) return;

    removeButton.closest(".interval-row").remove();
    if (!els.intervalRows.children.length) resetIntervalRows();
  });

  els.addSegmentButton.addEventListener("click", () => {
    addSegmentRow(true);
  });

  els.segmentRows.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-segment-button");
    if (!removeButton) return;

    removeButton.closest(".segment-row").remove();
    if (!els.segmentRows.children.length) resetSegmentRows();
  });

  els.addStrengthButton.addEventListener("click", () => {
    addStrengthRow(true);
  });

  els.strengthRows.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-strength-button");
    if (!removeButton) return;

    removeButton.closest(".strength-row").remove();
    if (!els.strengthRows.children.length) resetStrengthRows();
  });

  els.calendarToggle.addEventListener("click", () => {
    state.calendarOpen = !state.calendarOpen;
    state.selectedDate = els.workoutForm.elements.date.value || state.selectedDate || toDateKey(new Date());
    state.calendarMonth = dateFromKey(state.selectedDate);
    renderCalendar();
  });

  els.prevMonthButton.addEventListener("click", () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  els.nextMonthButton.addEventListener("click", () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  els.calendarGrid.addEventListener("click", (event) => {
    const dayButton = event.target.closest("[data-date]");
    if (!dayButton) return;

    state.selectedDate = dayButton.dataset.date;
    state.calendarMonth = dateFromKey(state.selectedDate);
    els.workoutForm.elements.date.value = state.selectedDate;
    renderCalendar();
  });

  els.workoutForm.elements.date.addEventListener("change", (event) => {
    state.selectedDate = event.target.value || state.selectedDate;
    state.calendarMonth = state.selectedDate ? dateFromKey(state.selectedDate) : state.calendarMonth;
    renderCalendar();
  });

  els.sportFilter.addEventListener("change", (event) => {
    state.sportFilter = event.target.value;
    renderWorkoutList();
  });

  els.workoutList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-workout-id]");
    if (!item) return;

    state.selectedWorkoutId = item.dataset.workoutId;
    state.workoutDetailReturnView = "workouts";
    renderWorkoutDetail();
    setView("workoutDetail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  els.qualityList.addEventListener("click", (event) => {
    const refreshButton = event.target.closest("[data-strava-refresh-laps]");
    if (refreshButton) {
      const item = refreshButton.closest("[data-workout-id]");
      if (item) refreshWorkoutLapsFromStrava(item.dataset.workoutId);
      return;
    }

    if (event.target.closest("[data-quality-mark-complete]")) {
      handleQualityMarkComplete(event);
      return;
    }

    if (event.target.closest("[data-quality-save]")) {
      handleQualityWorkoutSave(event);
      return;
    }

    if (event.target.closest("[data-quality-view]")) {
      openQualityWorkoutAnalysis(event);
    }
  });

  els.qualitySummary?.addEventListener("click", (event) => {
    if (event.target.closest("[data-strava-repair-missing-laps]")) {
      repairMissingStravaLapsThrough("2026-06-10");
    }
  });

  els.z2ErgDataGaps?.addEventListener("click", (event) => {
    if (event.target.closest("[data-save-inline-avg-hr]")) {
      handleInlineAvgHrSave(event);
      return;
    }

    if (event.target.closest("[data-strava-refresh-laps]")) {
      const item = event.target.closest("[data-workout-id]");
      if (item) refreshWorkoutLapsFromStrava(item.dataset.workoutId);
      return;
    }

    if (event.target.closest("[data-quality-mark-complete]")) {
      handleQualityMarkComplete(event);
      return;
    }

    if (event.target.closest("[data-quality-later]")) {
      handleQualityStatusAction(event, "later");
      return;
    }

    if (event.target.closest("[data-quality-exclude]")) {
      handleQualityStatusAction(event, "excluded");
      return;
    }

    if (event.target.closest("[data-quality-reopen]")) {
      handleQualityStatusAction(event, "open");
      return;
    }

    if (event.target.closest("[data-quality-view]")) {
      openQualityWorkoutAnalysis(event);
    }
  });

  els.vo2DataCheck?.addEventListener("click", (event) => {
    if (event.target.closest("[data-save-inline-avg-hr]")) {
      handleInlineAvgHrSave(event);
      return;
    }

    if (event.target.closest("[data-strava-refresh-laps]")) {
      const item = event.target.closest("[data-workout-id]");
      if (item) refreshWorkoutLapsFromStrava(item.dataset.workoutId);
      return;
    }

    if (event.target.closest("[data-quality-mark-complete]")) {
      handleQualityMarkComplete(event);
      return;
    }

    if (event.target.closest("[data-quality-later]")) {
      handleQualityStatusAction(event, "later");
      return;
    }

    if (event.target.closest("[data-quality-exclude]")) {
      handleQualityStatusAction(event, "excluded");
      return;
    }

    if (event.target.closest("[data-quality-reopen]")) {
      handleQualityStatusAction(event, "open");
      return;
    }

    if (event.target.closest("[data-quality-view]")) {
      openQualityWorkoutAnalysis(event);
    }
  });

  els.thresholdDataCheck?.addEventListener("click", (event) => {
    if (event.target.closest("[data-save-inline-avg-hr]")) {
      handleInlineAvgHrSave(event);
      return;
    }

    if (event.target.closest("[data-strava-refresh-laps]")) {
      const item = event.target.closest("[data-workout-id]");
      if (item) refreshWorkoutLapsFromStrava(item.dataset.workoutId);
      return;
    }

    if (event.target.closest("[data-quality-mark-complete]")) {
      handleQualityMarkComplete(event);
      return;
    }

    if (event.target.closest("[data-quality-later]")) {
      handleQualityStatusAction(event, "later");
      return;
    }

    if (event.target.closest("[data-quality-exclude]")) {
      handleQualityStatusAction(event, "excluded");
      return;
    }

    if (event.target.closest("[data-quality-reopen]")) {
      handleQualityStatusAction(event, "open");
      return;
    }

    if (event.target.closest("[data-quality-view]")) {
      openQualityWorkoutAnalysis(event);
    }
  });

  els.qualityBulkCategories.addEventListener("click", (event) => {
    if (event.target.closest("[data-bulk-category]")) {
      handleBulkCategoryApply(event);
    }
  });

  els.analysisWorkoutSelect.addEventListener("change", (event) => {
    state.selectedWorkoutId = event.target.value;
    render();
  });

  els.analysisTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-analysis-tab]");
    if (!button) return;
    state.analysisTab = button.dataset.analysisTab;
    renderAnalysis();
  });

  els.z2Analysis.addEventListener("change", (event) => {
    const toggle = event.target.closest("[data-z2-metric-toggle]");
    if (toggle) {
      state.z2VisibleMetrics[toggle.dataset.z2MetricToggle] = toggle.checked;
      renderZ2Analysis();
      return;
    }

    handleZ2MetricChange(event);
  });

  els.z2Analysis.addEventListener("mouseover", handleZ2ChartTooltip);
  els.z2Analysis.addEventListener("focusin", handleZ2ChartTooltip);
  els.z2Analysis.addEventListener("mouseout", clearZ2ChartTooltip);
  els.z2Analysis.addEventListener("focusout", clearZ2ChartTooltip);

  els.z2Analysis.addEventListener("click", (event) => {
    const tabButton = event.target.closest("[data-z2-tab]");
    if (tabButton) {
      state.z2AnalysisTab = tabButton.dataset.z2Tab;
      renderZ2Analysis();
      return;
    }

    const periodButton = event.target.closest("[data-z2-period]");
    if (periodButton) {
      state.z2PeriodMonths = Number(periodButton.dataset.z2Period) || 3;
      renderZ2Analysis();
      return;
    }

    const pageButton = event.target.closest("[data-z2-page]");
    if (pageButton) {
      const [groupKey, page] = pageButton.dataset.z2Page.split(":");
      state.z2WorkoutPages[groupKey] = Number(page) || 1;
      renderZ2Analysis();
      return;
    }

    const row = event.target.closest(".z2-row[data-workout-id], .z2-erg-lap-row[data-workout-id]");
    if (row && !event.target.closest("input, select, textarea")) {
      state.selectedWorkoutId = row.dataset.workoutId;
      state.workoutDetailReturnView = "analysis";
      renderWorkoutDetail();
      setView("workoutDetail");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  els.intensityAnalysis?.addEventListener("click", (event) => {
    const row = event.target.closest("[data-workout-id]");
    if (!row) return;

    state.selectedWorkoutId = row.dataset.workoutId;
    state.workoutDetailReturnView = "analysis";
    renderWorkoutDetail();
    setView("workoutDetail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  els.loadAnalysis?.addEventListener("click", (event) => {
    const row = event.target.closest("[data-workout-id]");
    if (!row) return;

    state.selectedWorkoutId = row.dataset.workoutId;
    state.workoutDetailReturnView = "analysis";
    renderWorkoutDetail();
    setView("workoutDetail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  els.z2Analysis.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target.closest(".z2-row[data-workout-id], .z2-erg-lap-row[data-workout-id]");
    if (!row) return;

    event.preventDefault();
    state.selectedWorkoutId = row.dataset.workoutId;
    state.workoutDetailReturnView = "analysis";
    renderWorkoutDetail();
    setView("workoutDetail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  els.intervalComparison.addEventListener("change", (event) => {
    handleIntervalExerciseChange(event);
  });

  els.csvInput.addEventListener("change", (event) => {
    importDataFiles(event.target.files);
    event.target.value = "";
  });

  els.supabaseConfigForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const config = saveSupabaseConfig({
      url: els.supabaseUrlInput.value,
      anonKey: els.supabaseAnonKeyInput.value,
    });
    if (els.authSupabaseUrlInput) els.authSupabaseUrlInput.value = config.url;
    if (els.authSupabaseAnonKeyInput) els.authSupabaseAnonKeyInput.value = config.anonKey;
    state.supabaseUser = null;
    setAuthGate(null);
    updateAuthStatus("Config opgeslagen. Log opnieuw in.", "ready");
    updateSupabaseStatus("Supabase config opgeslagen. Login om te syncen.", "ready");
  });

  els.authForm?.addEventListener("submit", handleAuthPasswordLogin);
  els.authSignUpButton?.addEventListener("click", handleAuthSignUp);
  els.authForgotPasswordButton?.addEventListener("click", handleAuthForgotPassword);
  els.authFaceIdButton?.addEventListener("click", handleAuthFaceId);
  els.authSaveConfigButton?.addEventListener("click", handleAuthSaveConfig);
  els.authUpdatePasswordButton?.addEventListener("click", handleAuthUpdatePassword);

  els.supabaseLoginButton.addEventListener("click", () => {
    handleSupabaseLogin();
  });

  els.supabaseSignOutButton.addEventListener("click", () => {
    handleSupabaseSignOut();
  });

  els.supabaseUploadButton.addEventListener("click", () => {
    handleSupabaseUpload();
  });

  els.supabaseDownloadButton.addEventListener("click", () => {
    handleSupabaseDownload();
  });

  els.stravaConnectButton.addEventListener("click", () => {
    handleStravaConnect();
  });

  els.stravaRefreshButton.addEventListener("click", () => {
    refreshStravaStatus();
  });

  els.stravaSyncNowButton.addEventListener("click", () => {
    handleStravaSyncNow("recent");
  });

  els.stravaSyncHistoryButton.addEventListener("click", () => {
    handleStravaSyncNow("history");
  });

  els.dailySyncButton?.addEventListener("click", handleDailySync);

  els.intervalsTestButton?.addEventListener("click", handleIntervalsTest);
  els.intervalsPreviewButton?.addEventListener("click", handleIntervalsPreview);

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-save-inline-avg-hr]")) {
      handleInlineAvgHrSave(event);
    }
  });
}

function init() {
  state.workouts = normalizeAppWorkouts(state.workouts);
  saveWorkouts(state.workouts);
  persistAutoFilledBikeHr();
  const today = new Date().toISOString().slice(0, 10);
  els.workoutForm.elements.date.value = today;
  state.selectedDate = today;
  state.calendarMonth = dateFromKey(today);
  state.selectedWorkoutId = sortedWorkouts()[0]?.id || null;
  resetIntervalRows();
  resetSegmentRows();
  resetStrengthRows();
  bindEvents();
  renderSupabaseConfig();
  setAuthGate(null);
  detectPasswordRecovery();
  refreshSupabaseUser();
  updateStravaStatus("Strava nog niet gekoppeld.");
  handleStravaCallbackResult();
  render();
}

init();
