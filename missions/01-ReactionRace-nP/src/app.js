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
const soundChoice = document.querySelector("#soundChoice");
const saveNameButton = document.querySelector("#saveNameButton");
const raceButton = document.querySelector("#raceButton");
const roundStatus = document.querySelector("#roundStatus");
const roundMessage = document.querySelector("#roundMessage");
const bestTime = document.querySelector("#bestTime");
const scoreboardStatus = document.querySelector("#scoreboardStatus");
const scoreboardTab = document.querySelector("#scoreboardTab");
const xrayTab = document.querySelector("#xrayTab");
const baselineTab = document.querySelector("#baselineTab");
const scorePanel = document.querySelector("#scorePanel");
const xrayPanel = document.querySelector("#xrayPanel");
const baselinePanel = document.querySelector("#baselinePanel");
const baselineStatusNote = document.querySelector("#baselineStatusNote");
const scoreList = document.querySelector("#scoreList");
const eventList = document.querySelector("#eventList");
const clearButton = document.querySelector("#clearButton");

// This API path points to the backend in server.py.
// Because it starts with "/", it uses the same Codespaces or laptop host link
// that opened index.html.
const scoreboardApiUrl = "/api/scores";
const eventsApiUrl = "/api/events";
const scoreboardRefreshMs = 2000;
const eventRefreshMs = 2000;
const searchParams = new URLSearchParams(window.location.search);
const testModeEnabled = searchParams.get("test") === "1";

// These variables are the app memory.
// They change while the player uses the page.
let playerName = "Maya-SPRK";
let roundState = "idle";
let startTime = 0;
let timerId = null;
let scores = [];
let previousScoreRanks = new Map();
let audioContext = null;

playerNameInput.value = playerName;

/*
  Turns on browser sound after a student interacts with the page.

  Browsers block surprise sound. That is why we create AudioContext only after
  the player clicks a button or saves a name.
*/
function unlockSound() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

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
  Plays one short sound using the Web Audio API.

  Students can make new sounds by changing frequency, duration, or oscillator
  type. Common oscillator types are "sine", "square", "triangle", and
  "sawtooth".
*/
function playTone(frequency, duration, type = "sine") {
  if (!audioContext) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  volume.gain.setValueAtTime(0.001, audioContext.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
  volume.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

/*
  Plays the sound chosen by the player who earned the score.

  This teaches a useful pattern:
  data from the backend can control what the frontend plays or animates.
*/
function playPlayerSound(score) {
  const sound = score.sound || "spark";

  if (sound === "chime") {
    playTone(660, 0.12, "sine");
    window.setTimeout(() => playTone(880, 0.14, "sine"), 110);
    return;
  }

  if (sound === "laser") {
    playTone(920, 0.08, "sawtooth");
    window.setTimeout(() => playTone(420, 0.12, "sawtooth"), 80);
    return;
  }

  if (sound === "pop") {
    playTone(260, 0.08, "square");
    return;
  }

  if (sound === "drum") {
    playTone(120, 0.1, "triangle");
    return;
  }

  playTone(520, 0.09, "triangle");
  window.setTimeout(() => playTone(780, 0.12, "triangle"), 90);
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
  const nextScoreRanks = new Map();
  let soundToPlay = null;

  sortedScores.forEach((score, index) => {
    nextScoreRanks.set(score.id, index);
    const item = document.createElement("li");
    item.innerHTML = `<span>${score.name}</span><strong>${score.time} ms</strong>`;

    const oldRank = previousScoreRanks.get(score.id);
    if (oldRank === undefined) {
      item.classList.add("score-new");
      soundToPlay = soundToPlay || score;
    } else if (oldRank > index) {
      item.classList.add("score-up");
      soundToPlay = soundToPlay || score;
    }

    if (index === 0) {
      item.classList.add("score-leader");
    }

    scoreList.appendChild(item);
  });

  if (soundToPlay) {
    playPlayerSound(soundToPlay);
  }

  previousScoreRanks = nextScoreRanks;
  updateBestTime();
}

/*
  Redraws the X-Ray Vision event list.

  These events come from server.py, so students can see backend activity that
  would otherwise be hidden in the terminal.
*/
function renderEvents(events) {
  eventList.innerHTML = "";

  events.slice().reverse().forEach((event) => {
    const item = document.createElement("li");
    item.textContent = `${event.time} ${event.kind}: ${event.message}`;
    eventList.appendChild(item);
  });
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
  Asks server.py for backend events for the X-Ray Vision panel.
*/
async function loadBackendEvents() {
  try {
    const response = await fetch(eventsApiUrl);
    const data = await response.json();
    renderEvents(data.events || []);
  } catch (error) {
    renderEvents([
      {
        time: "--:--:--",
        kind: "offline",
        message: "Backend events are not available yet."
      }
    ]);
    console.log("ReactionRace: backend events are not available yet.", error);
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
  unlockSound();
  const reactionTime = Math.round(performance.now() - startTime);
  await recordKnownTap(reactionTime);
}

async function recordKnownTap(reactionTime) {
  unlockSound();

  roundState = "idle";
  setButton("Start Round", "idle");
  setMessage("Saving", `${playerName} reacted in ${reactionTime} ms. Updating the shared scoreboard.`);

  try {
    await saveSharedScore({
      name: playerName,
      time: reactionTime,
      sound: soundChoice.value
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

function forceReadyRound(reactionTime = 150) {
  window.clearTimeout(timerId);
  roundState = "ready";
  startTime = performance.now() - reactionTime;
  setButton("Tap Now!", "ready");
  setMessage("Go", "Tap now.");
}

// This is the main game click handler.
// It checks the current round state and chooses what should happen next.
raceButton.addEventListener("click", () => {
  unlockSound();

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
  unlockSound();
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
SPRK.setupTabs({
  tabs: [
    { button: scoreboardTab, panel: scorePanel },
    { button: xrayTab, panel: xrayPanel },
    { button: baselineTab, panel: baselinePanel },
  ],
});
SPRK.loadBaselineStatus("/_shared/generated/baseline-status.json", baselinePanel, baselineStatusNote);
loadSharedScores();
loadBackendEvents();

// Refresh the shared scoreboard so each device can see scores from other
// devices without needing to reload the page.
window.setInterval(loadSharedScores, scoreboardRefreshMs);
window.setInterval(loadBackendEvents, eventRefreshMs);

if (testModeEnabled) {
  window.__sprkTest = {
    forceReadyRound,
    recordKnownTap,
  };
}
