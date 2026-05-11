/*
  ReactionRace game logic

  Big idea:
  1. The player starts a round.
  2. The app waits for a random amount of time.
  3. The button turns green.
  4. The player taps as fast as possible.
  5. The app sends the score to server.py.
  6. server.py sends back the shared classroom scoreboard.

  Simple flow:

  browser -> app.js -> server.py -> shared scoreboard -> browser

  Vocabulary:
  - "frontend" means this browser page.
  - "backend" means server.py.
  - "API" means a URL that JavaScript uses to talk to the backend.
  - "state" means what mode the round is currently in.
*/

// These constants connect JavaScript to the HTML elements.
// The names are intentionally long so students can read what each one means.
const playerNameInput = document.querySelector("#playerName");
const saveNameButton = document.querySelector("#saveNameButton");
const raceButton = document.querySelector("#raceButton");
const roundStatus = document.querySelector("#roundStatus");
const roundMessage = document.querySelector("#roundMessage");
const bestTime = document.querySelector("#bestTime");
const scoreboardStatus = document.querySelector("#scoreboardStatus");
const scoreList = document.querySelector("#scoreList");
const clearButton = document.querySelector("#clearButton");

// This API path points to the backend in server.py.
// Because it starts with "/", it uses the same Codespaces or laptop host link
// that opened index.html.
const scoreboardApiUrl = "/api/scores";
const scoreboardRefreshMs = 2000;

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
  Shows whether the shared scoreboard backend is working.
*/
function setScoreboardStatus(message) {
  scoreboardStatus.textContent = message;
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

  server.py already sends sorted scores, but sorting again here keeps the
  frontend easy to understand and safe if that backend changes later.
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
  Asks server.py for the latest shared classroom scoreboard.
*/
async function loadSharedScores() {
  try {
    const response = await fetch(scoreboardApiUrl);
    const data = await response.json();
    scores = data.scores || [];
    setScoreboardStatus("Shared scoreboard connected.");
    renderScores();
  } catch (error) {
    setScoreboardStatus("Shared scoreboard offline. Run python server.py, then reload.");
    console.log("ReactionRace: scoreboard API is not available yet.", error);
  }
}

/*
  Sends one reaction score to server.py.

  The backend stores the score and returns the updated shared scoreboard.
*/
async function saveSharedScore(score) {
  const response = await fetch(scoreboardApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(score)
  });

  const data = await response.json();
  scores = data.scores || [];
  renderScores();
}

/*
  Clears the shared classroom scoreboard.

  This affects everyone connected to the same server.py backend.
*/
async function clearSharedScores() {
  const response = await fetch(scoreboardApiUrl, {
    method: "DELETE"
  });

  const data = await response.json();
  scores = data.scores || [];
  renderScores();
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
async function recordTap() {
  const reactionTime = Math.round(performance.now() - startTime);

  roundState = "idle";
  setButton("Start Round", "idle");
  setMessage("Saving", `${playerName} reacted in ${reactionTime} ms. Updating the shared scoreboard.`);

  try {
    await saveSharedScore({
      name: playerName,
      time: reactionTime
    });
    setMessage("Result", `${playerName} reacted in ${reactionTime} ms.`);
    setScoreboardStatus("Shared scoreboard updated for everyone on this backend.");
  } catch (error) {
    setMessage("Backend Needed", "Score was not saved. Run python server.py and reload.");
    setScoreboardStatus("Shared scoreboard offline. This device cannot see other players yet.");
    console.log("ReactionRace: could not save score.", error);
  }
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
clearButton.addEventListener("click", async () => {
  try {
    await clearSharedScores();
    setMessage("Ready", "Shared scoreboard cleared. Start a new round.");
    setScoreboardStatus("Shared scoreboard cleared for everyone on this backend.");
  } catch (error) {
    setMessage("Backend Needed", "Could not clear scores. Run python server.py and reload.");
    setScoreboardStatus("Shared scoreboard offline.");
    console.log("ReactionRace: could not clear scores.", error);
  }
});

// Load the shared scoreboard when the page first opens.
loadSharedScores();

// Refresh the shared scoreboard so each device can see scores from other
// devices without needing to reload the page.
window.setInterval(loadSharedScores, scoreboardRefreshMs);
