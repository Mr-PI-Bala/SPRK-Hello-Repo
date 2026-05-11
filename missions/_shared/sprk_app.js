/*
  Shared frontend helpers for SPRK missions.

  Mission-specific files call these helpers so each mission can focus on its
  own game rules instead of repeating sound, tabs, scores, and X-Ray code.
*/

const SPRK = (() => {
  let audioContext = null;
  let previousRanks = new Map();

  function unlockSound() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  }

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

  function playSound(sound) {
    const selectedSound = sound || "spark";
    if (selectedSound === "chime" || selectedSound === "coin") {
      playTone(660, 0.12, "sine");
      window.setTimeout(() => playTone(880, 0.14, "sine"), 110);
      return;
    }
    if (selectedSound === "laser" || selectedSound === "zap") {
      playTone(920, 0.08, "sawtooth");
      window.setTimeout(() => playTone(420, 0.12, "sawtooth"), 80);
      return;
    }
    if (selectedSound === "pop") {
      playTone(260, 0.08, "square");
      return;
    }
    if (selectedSound === "drum" || selectedSound === "level") {
      playTone(120, 0.1, "triangle");
      window.setTimeout(() => playTone(520, 0.12, "triangle"), 95);
      return;
    }
    playTone(520, 0.09, "triangle");
    window.setTimeout(() => playTone(780, 0.12, "triangle"), 90);
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    return response.json();
  }

  async function postJson(url, body) {
    return requestJson(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  }

  async function deleteJson(url) {
    return requestJson(url, {
      method: "DELETE"
    });
  }

  function renderScores(scoreList, payload, formatter) {
    const scores = Array.isArray(payload) ? payload : payload.scores || [];
    scoreList.innerHTML = "";
    const nextRanks = new Map();
    let soundToPlay = null;

    scores.forEach((score, index) => {
      nextRanks.set(score.id, index);
      const item = document.createElement("li");
      item.innerHTML = formatter
        ? formatter(score)
        : `<span>${score.name}</span><strong>${score.points}</strong>`;

      const oldRank = previousRanks.get(score.id);
      if (oldRank === undefined) {
        item.classList.add("score-new");
        soundToPlay = soundToPlay || score.sound;
      } else if (oldRank > index) {
        item.classList.add("score-up");
        soundToPlay = soundToPlay || score.sound;
      }

      if (index === 0) {
        item.classList.add("score-leader");
      }

      scoreList.appendChild(item);
    });

    if (soundToPlay) {
      playSound(soundToPlay);
    }

    previousRanks = nextRanks;
  }

  function renderEvents(eventList, payload) {
    const events = Array.isArray(payload) ? payload : payload.events || [];
    const lines = events.slice().reverse().map((event) => (
      `${event.time} ${event.kind}: ${event.message}`
    ));

    if (eventList.tagName === "PRE") {
      eventList.textContent = lines.join("\n");
      return;
    }

    eventList.innerHTML = "";
    lines.forEach((line) => {
      const item = document.createElement("li");
      item.textContent = line;
      eventList.appendChild(item);
    });
  }

  function setupTabs(scoreboardTab, xrayTab, scorePanel, xrayPanel) {
    if (!scoreboardTab) {
      const buttons = document.querySelectorAll(".tab-button");
      const panels = document.querySelectorAll(".tab-panel");
      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          buttons.forEach((item) => item.classList.toggle("active", item === button));
          panels.forEach((panel) => panel.classList.toggle("active", panel.id === button.dataset.tab));
        });
      });
      return;
    }

    function showPanel(panelName) {
      const showXray = panelName === "xray";
      scorePanel.classList.toggle("hidden", showXray);
      xrayPanel.classList.toggle("hidden", !showXray);
      scoreboardTab.classList.toggle("active", !showXray);
      xrayTab.classList.toggle("active", showXray);
      scoreboardTab.setAttribute("aria-selected", String(!showXray));
      xrayTab.setAttribute("aria-selected", String(showXray));
    }

    scoreboardTab.addEventListener("click", () => showPanel("scores"));
    xrayTab.addEventListener("click", () => showPanel("xray"));
  }

  return {
    unlockSound,
    playSound,
    requestJson,
    postJson,
    deleteJson,
    renderScores,
    renderEvents,
    setupTabs
  };
})();
