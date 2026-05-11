/*
  ReactionRace game logic

  Big idea:
  1. The player starts a round.
  2. The app waits for a random amount of time.
  3. The button turns green.
  4. The player taps as fast as possible.
  5. The app records the reaction time and updates the scoreboard.

  Simple flow:

  idle -> waiting -> ready -> result -> idle

  Vocabulary:
  - "state" means what mode the round is currently in.
  - "timer" means code that runs later after waiting.
  - "score" means one saved result for one player tap.
*/

// These constants connect JavaScript to the HTML elements.
// The names are intentionally long so students can read what each one means.
const playerNameInput = document.querySelector("#playerName");
const saveNameButton = document.querySelector("#saveNameButton");
const raceButton = document.querySelector("#raceButton");
const roundStatus = document.querySelector("#roundStatus");
const roundMessage = document.querySelector("#roundMessage");
const bestTime = document.querySelector("#bestTime");
const scoreList = document.querySelector("#scoreList");
const clearButton = document.querySelector("#clearButton");

// These variables are the app memory.
// They change while the player uses the page.
let playerName = "Maya-SPRK";
let roundState = "idle";
let startTime = 0;
let timerId = null;
let scores = [];

playerNameInput.value = playerName;

/*
  Shows short status text to the player.

  Example:
  setMessage("Wait", "Do not tap yet. Wait for green.")
*/
function setMessage(status, message) {
  roundStatus.textContent = status;
  roundMessage.textContent = message;
}

/*
  Changes the big game button.

  The label is what students see.
  The state is used by CSS to change button color.
*/
function setButton(label, state) {
  raceButton.textContent = label;
  raceButton.dataset.state = state;
}

/*
  Finds the fastest score so far and displays it.

  Lower reaction time is better because it means the player tapped faster.
*/
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

/*
  Redraws the scoreboard from the scores array.

  We sort a copy of the scores so the fastest result appears first.
*/
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

/*
  Starts one reaction round.

  The app does not turn green immediately. It waits a random delay so the
  player cannot predict exactly when to tap.
*/
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

/*
  Saves a successful tap after the button turns green.

  performance.now() gives a very precise timestamp.
  Reaction time = current time - time when the button turned green.
*/
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

/*
  Handles a tap that happens before the button turns green.

  This cancels the waiting timer and resets the round.
*/
function handleEarlyTap() {
  window.clearTimeout(timerId);
  roundState = "idle";
  setButton("Start Round", "idle");
  setMessage("Too Early", "You tapped before green. Try again.");
}

// This is the main game click handler.
// It checks the current round state and chooses what should happen next.
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

// This lets each student choose a name for the scoreboard.
saveNameButton.addEventListener("click", () => {
  const nextName = playerNameInput.value.trim();
  playerName = nextName || "Maya-SPRK";
  playerNameInput.value = playerName;
  setMessage("Ready", `Player name set to ${playerName}.`);
});

// This gives the class a clean scoreboard for the next test round.
clearButton.addEventListener("click", () => {
  scores = [];
  renderScores();
  setMessage("Ready", "Scoreboard cleared. Start a new round.");
});

// Draw the empty scoreboard when the page first opens.
renderScores();
