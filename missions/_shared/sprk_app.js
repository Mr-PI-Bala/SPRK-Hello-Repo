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

  function setupTabs(tabConfig) {
    const tabs = tabConfig.tabs || [];
    tabs.forEach((tab) => {
      tab.button.addEventListener("click", () => {
        tabs.forEach((item) => {
          const isActive = item === tab;
          item.button.classList.toggle("active", isActive);
          item.button.setAttribute("aria-selected", String(isActive));
          item.panel.classList.toggle("hidden", !isActive);
        });
      });
    });
  }

  async function loadBaselineStatus(url, panel, statusLine) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      const summary = await response.json();
      const checksMarkup = (summary.checks || []).map((group) => {
        const items = (group.checks || []).map((item) => `<li>${item}</li>`).join("");
        return `<section class="baseline-group"><h3>${group.mission}</h3><ul>${items}</ul></section>`;
      }).join("");
      const testsMarkup = (summary.tests || []).map((testCase) => (
        `<li><span>${testCase.title}</span><strong class="${testCase.status === "passed" ? "passed" : "failed"}">${testCase.status}</strong></li>`
      )).join("");

      panel.innerHTML = `
        <div class="baseline-summary-grid">
          <div class="baseline-card"><span>Status</span><strong class="${summary.status === "passed" ? "passed" : "failed"}">${summary.status.toUpperCase()}</strong></div>
          <div class="baseline-card"><span>Runner</span><strong>${summary.runner}</strong></div>
          <div class="baseline-card"><span>Tests</span><strong>${summary.passed}/${summary.total}</strong></div>
          <div class="baseline-card"><span>Updated</span><strong>${summary.generatedAtLabel}</strong></div>
        </div>
        <p class="baseline-policy">${summary.baselinePolicy}</p>
        <p class="baseline-links">Detailed summary: <code>/_shared/generated/baseline-status.html</code><br>Playwright report: <code>${summary.htmlReportPath}</code></p>
        <section class="baseline-section"><h3>What Was Validated</h3>${checksMarkup}</section>
        <section class="baseline-section"><h3>Latest Test Results</h3><ol class="feed-list">${testsMarkup}</ol></section>
      `;
      if (statusLine) {
        statusLine.textContent = `${summary.baselineName}: ${summary.passed}/${summary.total} tests passed.`;
      }
    } catch (error) {
      panel.innerHTML = `
        <p class="baseline-policy">Baseline status is not available yet.</p>
        <p class="baseline-links">Run the local baseline suite from the repo root to generate it.</p>
      `;
      if (statusLine) {
        statusLine.textContent = "Baseline status has not been generated yet.";
      }
    }
  }

  return {
    unlockSound,
    playSound,
    requestJson,
    postJson,
    deleteJson,
    renderScores,
    renderEvents,
    setupTabs,
    loadBaselineStatus,
  };
})();
