import { numberOrZero, sportLabels } from "./data/workoutModel.js";
import {
  createManualWorkout,
  importCsvWorkouts,
  importWorkouts,
  loadWorkouts as loadStoredWorkouts,
  resetWorkouts,
  saveWorkouts,
  sortWorkoutsByDate,
} from "./data/workoutStore.js";

const state = {
  workouts: loadStoredWorkouts(),
  selectedWorkoutId: null,
  sportFilter: "all",
  calendarOpen: false,
  calendarMonth: null,
  selectedDate: null,
  supabaseUser: null,
};

const SUPABASE_CONFIG_KEY = "trainiq-supabase-config";
const STRAVA_HISTORY_PAGE_KEY = "trainiq-strava-history-page";
const STRAVA_HISTORY_BATCH_SIZE = 15;

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
  analysisSummary: document.querySelector("#analysisSummary"),
  comparisonTable: document.querySelector("#comparisonTable"),
  intervalComparison: document.querySelector("#intervalComparison"),
  segmentAnalysis: document.querySelector("#segmentAnalysis"),
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
  stravaStatus: document.querySelector("#stravaStatus"),
  stravaStatusBadge: document.querySelector("#stravaStatusBadge"),
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
  bike_erg: "Bike",
  strength: "Kracht",
  rest: "Rust",
  transition: "Transitie",
  other: "Overig",
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

function formatSeconds(seconds) {
  const totalSeconds = Math.round(numberOrZero(seconds));
  if (!totalSeconds) return "-";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const rest = String(totalSeconds % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

function paceForInterval(interval) {
  if (interval.avgPace) return interval.avgPace;
  if (!interval.durationSeconds || !interval.distanceMeters) return "-";
  const secondsPerKm = Math.round(interval.durationSeconds / (interval.distanceMeters / 1000));
  return `${Math.floor(secondsPerKm / 60)}:${String(secondsPerKm % 60).padStart(2, "0")}/km`;
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
    els.latestWorkout.innerHTML = [
      detailRow("Datum", formatDate(latest.date)),
      detailRow("Starttijd", latest.startTime || "-"),
      detailRow("Sport", sportLabels[latest.sport]),
      detailRow("Tempo", paceForWorkout(latest)),
      detailRow("Gem. HR", latest.avgHr || "-"),
      detailRow("Max HR", latest.maxHr || "-"),
      detailRow("Load", latest.load || "-"),
      detailRow("Hoogtemeters", latest.elevationGain ? `${latest.elevationGain} m` : "-"),
      detailRow("Intervaltype", latest.intervalFamily || "-"),
      detailRow("Repduur", latest.repDurationSeconds ? formatSeconds(latest.repDurationSeconds) : "-"),
      detailRow("Kwaliteitsvolume", latest.qualityVolumeMeters ? `${latest.qualityVolumeMeters} m` : "-"),
      detailRow("Kwaliteitstijd", latest.qualityDurationSeconds ? formatSeconds(latest.qualityDurationSeconds) : "-"),
      detailRow("HYROX onderdelen", latest.segments?.length || "-"),
      detailRow("Notitie", latest.notes || "-"),
    ].join("");
  }

  renderSportDistribution(workouts, totalDuration);
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
    : sortedWorkouts().filter((workout) => workout.sport === state.sportFilter);

  if (!filtered.length) {
    els.workoutList.innerHTML = `<p class="empty-state">Geen workouts voor dit filter.</p>`;
    return;
  }

  els.workoutList.innerHTML = filtered
    .map((workout) => `
      <button class="workout-item ${workout.id === state.selectedWorkoutId ? "is-selected" : ""}" type="button" data-workout-id="${workout.id}">
        <strong>${workout.title}</strong>
        <span>${formatDate(workout.date)} · ${sportLabels[workout.sport]} · ${workout.workoutType}</span>
        <span>${formatDuration(numberOrZero(workout.durationMin))} · ${paceForWorkout(workout)} · HR ${workout.avgHr || "-"} / ${workout.maxHr || "-"} · load ${workout.load || "-"}${workout.intervalFamily ? ` · ${workout.repCount}x ${workout.intervalFamily}` : ""}</span>
      </button>
    `)
    .join("");
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

  if (!selected) {
    els.analysisSummary.innerHTML = `<p class="empty-state">Voeg workouts toe om te vergelijken.</p>`;
    els.comparisonTable.innerHTML = "";
    els.intervalComparison.innerHTML = "";
    els.segmentAnalysis.innerHTML = "";
    return;
  }

  const similar = sortedWorkouts()
    .filter((workout) => workout.sport === selected.sport && workout.workoutType.toLowerCase() === selected.workoutType.toLowerCase())
    .slice(0, 8);
  const previous = similar.filter((workout) => workout.id !== selected.id);
  const avgHrDelta = previous.length
    ? Math.round(numberOrZero(selected.avgHr) - average(previous.map((workout) => numberOrZero(workout.avgHr))))
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
      <strong>${previous.length ? `${previous.length} vergelijkbare training(en)` : "Nog geen vergelijkingsgroep"}</strong>
      <span>${previous.length ? "Zelfde sport en type. Dit wordt later slimmer met afstand, blokken en zones." : "Voeg meer trainingen met hetzelfde type toe om progressie te zien."}</span>
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
    .map((workout) => `
      <div class="table-row">
        <strong>${formatDate(workout.date)}</strong>
        <span>${workout.title}</span>
        <span>${paceForWorkout(workout)}</span>
        <span>HR ${workout.avgHr || "-"} / ${workout.maxHr || "-"}</span>
        <span>Load ${workout.load || "-"}</span>
      </div>
    `)
    .join("");

  renderIntervalComparison(selected, previous);
  renderSegmentAnalysis(selected, previous);
}

function average(values) {
  const usable = values.filter((value) => Number.isFinite(value) && value > 0);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : 0;
}

function detailRow(label, value) {
  return `<div class="detail-row"><strong>${label}</strong><span>${value}</span></div>`;
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
        const previousAvgHr = average(previousMatches.map((item) => numberOrZero(item.avgHr)));
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
            <span>${interval.avgHr || "-"} / ${interval.maxHr || "-"}</span>
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
    return stored ? JSON.parse(stored) : { url: "", anonKey: "" };
  } catch {
    return { url: "", anonKey: "" };
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
  updateSupabaseStatus(
    hasSupabaseConfig() ? "Config opgeslagen. Login om te syncen." : "Vul je Supabase URL en anon key in.",
    hasSupabaseConfig() ? "ready" : "idle",
  );
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

async function loadSupabaseModule() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase config ontbreekt. Vul eerst URL en anon key in.");
  }

  return import("./data/supabaseWorkoutStore.js");
}

async function refreshSupabaseUser() {
  if (!hasSupabaseConfig()) {
    state.supabaseUser = null;
    return;
  }

  try {
    const { getCurrentUser } = await loadSupabaseModule();
    const { user, error } = await getCurrentUser();
    if (error) throw error;
    state.supabaseUser = user;
    updateSupabaseStatus(
      user ? "Ingelogd bij Supabase." : "Config opgeslagen. Login om te syncen.",
      user ? "ready" : "idle",
    );
    if (user) refreshStravaStatus();
  } catch (error) {
    state.supabaseUser = null;
    updateSupabaseStatus(error.message, "error");
  }
}

async function ensureSupabaseUser() {
  const { getCurrentUser } = await loadSupabaseModule();
  const { user, error } = await getCurrentUser();
  if (error) throw error;
  state.supabaseUser = user;
  return user;
}

async function refreshStravaStatus() {
  try {
    const user = await ensureSupabaseUser();
    updateSupabaseStatus(
      user ? "Ingelogd bij Supabase." : "Config opgeslagen. Login om te syncen.",
      user ? "ready" : "idle",
    );

    if (!state.supabaseUser) {
      updateStravaStatus("Nog geen Supabase-sessie.", "Login eerst met je magic link.", "idle");
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
    updateStravaStatus(error.message, "Controleer of de Strava migration en Edge Functions klaar staan.", "error");
  }
}

async function handleStravaConnect() {
  try {
    const user = await ensureSupabaseUser();
    if (!user) {
      updateStravaStatus("Nog geen Supabase-sessie.", "Login eerst met je magic link.", "error");
      return;
    }

    updateStravaStatus("Strava autorisatie wordt voorbereid...", "Je wordt zo naar Strava gestuurd.", "idle");
    const { getStravaAuthUrl } = await loadSupabaseModule();
    const { url, error } = await getStravaAuthUrl();
    if (error) throw error;
    if (!url) throw new Error("Geen Strava autorisatie-url ontvangen.");
    window.location.href = url;
  } catch (error) {
    updateStravaStatus(error.message, "Controleer Supabase login, secrets en Edge Functions.", "error");
  }
}

async function handleStravaSyncNow(mode = "recent") {
  try {
    const user = await ensureSupabaseUser();
    if (!user) {
      updateStravaStatus("Nog geen Supabase-sessie.", "Login eerst met je magic link.", "error");
      return;
    }

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

    state.workouts = sortWorkoutsByDate(workouts);
    saveWorkouts(state.workouts);
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
    updateStravaStatus(error.message, "Controleer je Strava permissies en probeer opnieuw.", "error");
  }
}

async function syncStravaRecent(syncStravaNow) {
  return syncStravaNow({ mode: "recent", limit: 10 });
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

async function handleSupabaseSignOut() {
  try {
    const { signOut } = await loadSupabaseModule();
    const { error } = await signOut();
    if (error) throw error;
    state.supabaseUser = null;
    updateSupabaseStatus("Uitgelogd bij Supabase.", "idle");
  } catch (error) {
    updateSupabaseStatus(error.message, "error");
  }
}

async function handleSupabaseUpload() {
  try {
    updateSupabaseStatus("Lokale workouts worden geupload...", "idle");
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
    state.workouts = sortWorkoutsByDate(workouts);
    saveWorkouts(state.workouts);
    state.selectedWorkoutId = state.workouts[0]?.id || null;
    render();
    updateSupabaseStatus(`${workouts.length} workout(s) uit Supabase geladen.`, "ready");
  } catch (error) {
    updateSupabaseStatus(error.message, "error");
  }
}

function render() {
  renderDashboard();
  renderWorkoutList();
  renderCalendar();
  renderAnalysisOptions();
  renderAnalysis();
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
  const heartRates = points.map((point) => point.hr).filter((hr) => hr > 0);
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
  }

  if (!records.length) throw new Error("Geen meetpunten gevonden in dit FIT-bestand.");

  const timedRecords = records.filter((record) => record.timestamp);
  const first = timedRecords[0] || records[0];
  const last = timedRecords[timedRecords.length - 1] || records[records.length - 1];
  const startDate = first.timestamp || new Date();
  const durationSeconds = first.timestamp && last.timestamp
    ? Math.max(0, Math.round((last.timestamp - first.timestamp) / 1000))
    : 0;
  const distanceMeters = Math.max(...records.map((record) => numberOrZero(record.distance)), 0)
    || Math.round(totalTrackDistance(records.filter((record) => record.lat && record.lon)));
  const elevations = records.map((record) => record.altitude).filter((altitude) => altitude > 0);
  const heartRates = records.map((record) => record.heartRate).filter((hr) => hr > 0);
  const externalId = fitExternalId(fileName, startDate);

  return {
    id: `strava-${externalId}`,
    source: "strava",
    externalId,
    date: startDate.toISOString().slice(0, 10),
    startTime: startDate.toTimeString().slice(0, 5),
    sport: "running",
    title: fileName.replace(/\.fit(\.gz)?$/i, ""),
    workoutType: "fit_import",
    durationMin: durationSeconds ? Math.round(durationSeconds / 60) : 0,
    distanceKm: distanceMeters / 1000,
    avgHr: heartRates.length ? Math.round(average(heartRates)) : 0,
    maxHr: heartRates.length ? Math.max(...heartRates) : 0,
    avgPace: paceFromSecondsAndMeters(durationSeconds, distanceMeters),
    elevationGain: elevationGainMeters(elevations),
    notes: `Geimporteerd uit FIT (${records.length} meetpunten).`,
    rawPayload: {
      importType: "fit",
      fileName,
      recordCount: records.length,
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
  if (fieldNumber === 73) values.speed = value / 1000;
  if (fieldNumber === 78) values.altitude = value / 5 - 500;
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

  for (const file of fileList) {
    try {
      els.importStatus.innerHTML = `<div class="summary-card"><strong>Import bezig...</strong><span>${file.name} wordt gelezen.</span></div>`;
      const contents = await readImportFile(file);
      const importedResult = await importFileContents(file, contents);
      state.workouts = importedResult.workouts;
      importedCount += importedResult.imported.length;
      kinds.add(importedResult.kind);
      state.selectedWorkoutId = importedResult.imported[0]?.id || state.selectedWorkoutId;
      state.selectedDate = importedResult.imported[0]?.date || state.selectedDate;
      state.calendarMonth = state.selectedDate ? dateFromKey(state.selectedDate) : state.calendarMonth;
    } catch (error) {
      els.importStatus.innerHTML = `<div class="summary-card"><strong>Import deels mislukt</strong><span>${file.name}: ${error.message}</span></div>`;
      return;
    }
  }

  render();
  els.importStatus.innerHTML = `<div class="summary-card"><strong>${importedCount} workout(s) verwerkt</strong><span>${[...kinds].join(", ")} lokaal dedupe-opgeslagen. Cloud upload wordt geprobeerd als je bent ingelogd.</span></div>`;
  await uploadImportedWorkouts(importedCount);
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
    const result = importWorkouts([workout], state.workouts);
    return { ...result, kind: "FIT" };
  }

  const records = parseCsv(String(contents || ""));
  const result = importCsvWorkouts(records, state.workouts);
  return { ...result, kind: "CSV" };
}

async function uploadImportedWorkouts(importedCount) {
  if (!importedCount || !hasSupabaseConfig()) return;

  try {
    const user = await ensureSupabaseUser();
    if (!user) return;

    const { saveSupabaseWorkouts } = await loadSupabaseModule();
    const { error } = await saveSupabaseWorkouts(state.workouts);
    if (error) throw error;

    els.importStatus.innerHTML = `<div class="summary-card"><strong>${importedCount} workout(s) verwerkt</strong><span>Opgeslagen in Supabase. Bestaande externe ID's zijn bijgewerkt, niet dubbel toegevoegd.</span></div>`;
  } catch (error) {
    els.importStatus.innerHTML = `<div class="summary-card"><strong>${importedCount} workout(s) lokaal verwerkt</strong><span>Cloud upload lukte niet: ${error.message}</span></div>`;
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
    setView("analysis");
    render();
  });

  els.analysisWorkoutSelect.addEventListener("change", (event) => {
    state.selectedWorkoutId = event.target.value;
    render();
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
    saveSupabaseConfig({
      url: els.supabaseUrlInput.value,
      anonKey: els.supabaseAnonKeyInput.value,
    });
    state.supabaseUser = null;
    updateSupabaseStatus("Supabase config opgeslagen. Login om te syncen.", "ready");
  });

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
}

function init() {
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
  refreshSupabaseUser();
  updateStravaStatus("Strava nog niet gekoppeld.");
  handleStravaCallbackResult();
  render();
}

init();
