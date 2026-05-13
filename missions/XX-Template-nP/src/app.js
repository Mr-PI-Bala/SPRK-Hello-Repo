const playerNameInput = document.querySelector("#player-name");
const soundSelect = document.querySelector("#sound-select");
const missionStatus = document.querySelector("#mission-status");
const starterCount = document.querySelector("#starter-count");
const starterNote = document.querySelector("#starter-note");
const runActionButton = document.querySelector("#run-action");
const addPointButton = document.querySelector("#add-point");
const resetTemplateButton = document.querySelector("#reset-template");
const clearSharedButton = document.querySelector("#clear-shared");
const scoreList = document.querySelector("#score-list");
const eventLog = document.querySelector("#event-log");
const baselinePanel = document.querySelector("#baselinePanel");
const baselineStatusNote = document.querySelector("#baselineStatusNote");

const scoreboardTab = document.querySelector("#scoreboardTab");
const xrayTab = document.querySelector("#xrayTab");
const baselineTab = document.querySelector("#baselineTab");
const scorePanel = document.querySelector("#scorePanel");
const xrayPanel = document.querySelector("#xrayPanel");

const DEFAULT_STATE = {
  mission: "Template Mission",
  status: "Ready",
  actionCount: 0,
  note: "Replace this card with your mission's main interaction.",
};

let missionState = { ...DEFAULT_STATE };

function renderState() {
  missionStatus.textContent = missionState.status;
  starterCount.textContent = `Starter actions: ${missionState.actionCount}`;
  starterNote.textContent = missionState.note;
}

function scoreMarkup(score) {
  const detail = score.detail ? `<small>${score.detail}</small>` : "";
  return `<span>${score.name}${detail}</span><strong>${score.points}</strong>`;
}

async function refreshScores() {
  const payload = await SPRK.requestJson("/api/scores");
  SPRK.renderScores(scoreList, payload, scoreMarkup);
}

async function refreshEvents() {
  const payload = await SPRK.requestJson("/api/events");
  SPRK.renderEvents(eventLog, payload);
}

async function refreshShared() {
  await Promise.all([refreshScores(), refreshEvents()]);
}

async function loadState() {
  const payload = await SPRK.requestJson("/api/state");
  missionState = { ...DEFAULT_STATE, ...(payload.state || {}) };
  renderState();
}

async function saveState(nextState) {
  missionState = { ...missionState, ...nextState };
  const payload = await SPRK.postJson("/api/state", missionState);
  missionState = { ...DEFAULT_STATE, ...(payload.state || missionState) };
  renderState();
}

async function logEvent(message, kind = "frontend") {
  await SPRK.postJson("/api/events", { kind, message });
  await refreshEvents();
}

async function runStarterAction() {
  SPRK.unlockSound();
  const nextCount = Number(missionState.actionCount) + 1;
  await saveState({
    status: "Starter Action Ran",
    actionCount: nextCount,
    note: `Starter action ${nextCount} ran. Replace this with your real mission rule, animation, or game loop.`,
  });
  SPRK.playSound(soundSelect.value);
  await logEvent(`${playerNameInput.value} ran starter action ${nextCount}.`);
}

async function addSharedPoint() {
  SPRK.unlockSound();
  const points = Number(missionState.actionCount) + 1;
  await SPRK.postJson("/api/scores", {
    name: playerNameInput.value,
    points,
    detail: `Template checkpoint ${points}`,
    sound: soundSelect.value,
  });
  SPRK.playSound(soundSelect.value);
  await logEvent(`${playerNameInput.value} added a shared template score.`);
  await refreshScores();
}

async function resetTemplate() {
  await SPRK.deleteJson("/api/state");
  missionState = { ...DEFAULT_STATE };
  renderState();
  await logEvent(`${playerNameInput.value} reset the template state.`, "state");
}

async function clearSharedBoard() {
  await SPRK.deleteJson("/api/scores");
  await logEvent(`${playerNameInput.value} cleared the shared template board.`, "scoreboard");
  await refreshScores();
}

runActionButton.addEventListener("click", runStarterAction);
addPointButton.addEventListener("click", addSharedPoint);
resetTemplateButton.addEventListener("click", resetTemplate);
clearSharedButton.addEventListener("click", clearSharedBoard);

SPRK.setupTabs({
  tabs: [
    { button: scoreboardTab, panel: scorePanel },
    { button: xrayTab, panel: xrayPanel },
    { button: baselineTab, panel: baselinePanel },
  ],
});

Promise.all([
  loadState(),
  refreshShared(),
  SPRK.loadBaselineStatus("/_shared/generated/baseline-status.json", baselinePanel, baselineStatusNote),
]).catch((error) => {
  missionStatus.textContent = "Offline";
  starterNote.textContent = `Template load failed: ${error.message}`;
});
