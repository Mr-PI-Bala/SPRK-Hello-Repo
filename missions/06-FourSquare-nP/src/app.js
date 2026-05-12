const playerNameInput = document.querySelector("#player-name");
const soundSelect = document.querySelector("#sound-select");
const squareBoard = document.querySelector("#square-board");
const roundLabel = document.querySelector("#round-label");
const nextRoundButton = document.querySelector("#next-round");
const clearBoardButton = document.querySelector("#clear-board");
const scoreList = document.querySelector("#score-list");
const eventLog = document.querySelector("#event-log");
const baselinePanel = document.querySelector("#baselinePanel");
const baselineStatusNote = document.querySelector("#baselineStatusNote");

const squareNames = ["A", "B", "C", "D"];
let roomState = { squares: { A: "", B: "", C: "", D: "" }, round: 1 };

async function log(message) {
  await SPRK.postJson("/api/events", { message, mission: "FourSquare" });
  await refreshShared();
}

async function saveState(nextState) {
  roomState = nextState;
  await SPRK.postJson("/api/state", roomState);
  renderBoard();
}

async function claimSquare(square) {
  SPRK.unlockSound();
  const squares = { ...roomState.squares, [square]: playerNameInput.value || "Player" };
  await saveState({ ...roomState, squares });
  SPRK.playSound(soundSelect.value);
  await log(`${playerNameInput.value} claimed square ${square}.`);
}

async function winRally(square) {
  const winner = roomState.squares[square] || playerNameInput.value || "FourSquare Player";
  await SPRK.postJson("/api/scores", {
    name: winner,
    points: 1,
    detail: `Won round ${roomState.round} from square ${square}`,
    sound: soundSelect.value,
  });
  SPRK.playSound("level");
  await log(`${winner} won a FourSquare rally from square ${square}.`);
}

async function nextRound() {
  const nextState = { ...roomState, round: Number(roomState.round || 1) + 1 };
  await saveState(nextState);
  SPRK.playSound("coin");
  await log(`FourSquare moved to round ${nextState.round}.`);
}

async function clearBoard() {
  const nextState = { ...roomState, squares: { A: "", B: "", C: "", D: "" } };
  await saveState(nextState);
  await log("FourSquare board cleared.");
}

function renderBoard() {
  roundLabel.textContent = `Round ${roomState.round || 1}`;
  squareBoard.innerHTML = "";
  for (const square of squareNames) {
    const tile = document.createElement("article");
    tile.className = "square-tile";
    tile.innerHTML = `
      <h2>${square}</h2>
      <p>${roomState.squares?.[square] || "Open square"}</p>
      <div class="square-actions">
        <button data-claim="${square}">Claim</button>
        <button data-win="${square}">Win Rally</button>
      </div>
    `;
    squareBoard.append(tile);
  }
}

async function loadState() {
  const payload = await SPRK.requestJson("/api/state");
  const state = payload.state || payload;
  roomState = {
    squares: { A: "", B: "", C: "", D: "", ...(state.squares || {}) },
    round: Number(state.round || 1),
  };
  renderBoard();
}

async function refreshShared() {
  const scores = await SPRK.requestJson("/api/scores");
  SPRK.renderScores(scoreList, scores);
  const events = await SPRK.requestJson("/api/events");
  SPRK.renderEvents(eventLog, events);
}

squareBoard.addEventListener("click", (event) => {
  const claim = event.target.dataset.claim;
  const win = event.target.dataset.win;
  if (claim) claimSquare(claim);
  if (win) winRally(win);
});
nextRoundButton.addEventListener("click", nextRound);
clearBoardButton.addEventListener("click", clearBoard);

SPRK.setupTabs({
  tabs: [
    { button: document.querySelector("#scoreboardTab"), panel: document.querySelector("#scorePanel") },
    { button: document.querySelector("#xrayTab"), panel: document.querySelector("#xrayPanel") },
    { button: document.querySelector("#baselineTab"), panel: baselinePanel },
  ],
});
SPRK.loadBaselineStatus("/_shared/generated/baseline-status.json", baselinePanel, baselineStatusNote);
loadState();
refreshShared();
setInterval(loadState, 4000);
setInterval(refreshShared, 5000);
