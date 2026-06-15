import { numberOrZero, sportLabels } from "./data/workoutModel.js";
import {
  createManualWorkout,
  importCsvWorkouts,
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
        <strong>Afstand</strong>
        <strong>Tijd</strong>
        <strong>Pace</strong>
        <strong>HR</strong>
        <strong>Vorige gem.</strong>
      </div>
      ${intervals.map((interval, index) => {
        const previousMatches = previousWithIntervals
          .map((workout) => workout.intervals[index])
          .filter(Boolean);
        const previousAvgHr = average(previousMatches.map((item) => numberOrZero(item.avgHr)));
        const previousPace = average(previousMatches.map((item) => numberOrZero(item.durationSeconds)));
        const distanceKm = interval.distanceMeters ? (interval.distanceMeters / 1000).toFixed(2) : "-";

        return `
          <div class="interval-table-row">
            <span>${interval.name || `Blok ${interval.intervalIndex}`}</span>
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

function addIntervalRow() {
  els.intervalRows.append(createIntervalRow(els.intervalRows.children.length + 1));
}

function resetIntervalRows() {
  els.intervalRows.innerHTML = "";
  addIntervalRow();
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
  } catch (error) {
    state.supabaseUser = null;
    updateSupabaseStatus(error.message, "error");
  }
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
  const [headerLine, ...rows] = text.trim().split(/\r?\n/);
  if (!headerLine) return [];

  const headers = headerLine.split(",").map((header) => header.trim());

  return rows
    .filter(Boolean)
    .map((row) => {
      const values = row.split(",").map((value) => value.trim());
      return headers.reduce((record, header, index) => {
        record[header] = values[index] || "";
        return record;
      }, {});
    });
}

function importCsv(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const records = parseCsv(String(reader.result || ""));
    const { imported, workouts } = importCsvWorkouts(records, state.workouts);
    state.workouts = workouts;
    state.selectedWorkoutId = imported[0]?.id || state.selectedWorkoutId;
    state.selectedDate = imported[0]?.date || state.selectedDate;
    state.calendarMonth = state.selectedDate ? dateFromKey(state.selectedDate) : state.calendarMonth;
    render();
    els.importStatus.innerHTML = `<div class="summary-card"><strong>${imported.length} workout(s) geimporteerd</strong><span>CSV is lokaal opgeslagen in deze browser.</span></div>`;
  });
  reader.readAsText(file);
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
  });

  els.addIntervalButton.addEventListener("click", () => {
    addIntervalRow();
  });

  els.intervalRows.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-interval-button");
    if (!removeButton) return;

    removeButton.closest(".interval-row").remove();
    if (!els.intervalRows.children.length) resetIntervalRows();
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

  els.csvInput.addEventListener("change", (event) => {
    importCsv(event.target.files[0]);
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
}

function init() {
  const today = new Date().toISOString().slice(0, 10);
  els.workoutForm.elements.date.value = today;
  state.selectedDate = today;
  state.calendarMonth = dateFromKey(today);
  state.selectedWorkoutId = sortedWorkouts()[0]?.id || null;
  resetIntervalRows();
  bindEvents();
  renderSupabaseConfig();
  refreshSupabaseUser();
  render();
}

init();
