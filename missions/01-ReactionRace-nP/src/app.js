const playerNameInput = document.querySelector("#playerName");
const saveNameButton = document.querySelector("#saveNameButton");
const raceButton = document.querySelector("#raceButton");
const roundStatus = document.querySelector("#roundStatus");
const roundMessage = document.querySelector("#roundMessage");
const bestTime = document.querySelector("#bestTime");
const scoreList = document.querySelector("#scoreList");
const clearButton = document.querySelector("#clearButton");

let playerName = "Maya-SPRK";
let roundState = "idle";
let startTime = 0;
let timerId = null;
let scores = [];

playerNameInput.value = playerName;

function setMessage(status, message) {
  roundStatus.textContent = status;
  roundMessage.textContent = message;
}

function setButton(label, state) {
  raceButton.textContent = label;
  raceButton.dataset.state = state;
}

function updateBestTime() {
  if (scores.length === 0) {
    bestTime.textContent = "Best: none yet";
    return;
  }

  const best = scores.reduce((winner, score) => {
    return score.time < winner.time ? score : winner;
  }, scores[0]);

  bestTime.textContent = `Best: ${best.name} ${best.time} ms`;
}

function renderScores() {
  scoreList.innerHTML = "";

  const sortedScores = [...scores].sort((a, b) => a.time - b.time);

  sortedScores.forEach((score) => {
    const item = document.createElement("li");
    item.innerHTML = `<span>${score.name}</span><strong>${score.time} ms</strong>`;
    scoreList.appendChild(item);
  });

  updateBestTime();
}

function startRound() {
  roundState = "waiting";
  setButton("Wait...", "waiting");
  setMessage("Wait", "Do not tap yet. Wait for green.");

  const delay = 1200 + Math.floor(Math.random() * 2400);

  timerId = window.setTimeout(() => {
    roundState = "ready";
    startTime = performance.now();
    setButton("Tap Now!", "ready");
    setMessage("Go", "Tap now.");
  }, delay);
}

function recordTap() {
  const reactionTime = Math.round(performance.now() - startTime);
  scores.push({
    name: playerName,
    time: reactionTime
  });

  roundState = "idle";
  setButton("Start Round", "idle");
  setMessage("Result", `${playerName} reacted in ${reactionTime} ms.`);
  renderScores();
}

function handleEarlyTap() {
  window.clearTimeout(timerId);
  roundState = "idle";
  setButton("Start Round", "idle");
  setMessage("Too Early", "You tapped before green. Try again.");
}

raceButton.addEventListener("click", () => {
  if (roundState === "idle") {
    startRound();
    return;
  }

  if (roundState === "waiting") {
    handleEarlyTap();
    return;
  }

  if (roundState === "ready") {
    recordTap();
  }
});

saveNameButton.addEventListener("click", () => {
  const nextName = playerNameInput.value.trim();
  playerName = nextName || "Maya-SPRK";
  playerNameInput.value = playerName;
  setMessage("Ready", `Player name set to ${playerName}.`);
});

clearButton.addEventListener("click", () => {
  scores = [];
  renderScores();
  setMessage("Ready", "Scoreboard cleared. Start a new round.");
});

renderScores();
