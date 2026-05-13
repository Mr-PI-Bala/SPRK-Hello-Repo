const canvas = document.querySelector("#soccer-canvas");
const ctx = canvas.getContext("2d");
const homeTeamInput = document.querySelector("#home-team");
const awayTeamInput = document.querySelector("#away-team");
const saveTeamsButton = document.querySelector("#save-teams");
const clockLabel = document.querySelector("#clock-label");
const scoreboardInline = document.querySelector("#scoreboard-inline");
const lastGoalLabel = document.querySelector("#last-goal");
const matchStatus = document.querySelector("#match-status");
const startMatchButton = document.querySelector("#start-match");
const pauseMatchButton = document.querySelector("#pause-match");
const wasdNameInput = document.querySelector("#wasd-name");
const wasdTeamSelect = document.querySelector("#wasd-team");
const wasdColorInput = document.querySelector("#wasd-color");
const wasdAvatarSelect = document.querySelector("#wasd-avatar");
const joinWasdButton = document.querySelector("#join-wasd");
const wasdStatus = document.querySelector("#wasd-status");
const arrowNameInput = document.querySelector("#arrow-name");
const arrowTeamSelect = document.querySelector("#arrow-team");
const arrowColorInput = document.querySelector("#arrow-color");
const arrowAvatarSelect = document.querySelector("#arrow-avatar");
const joinArrowButton = document.querySelector("#join-arrow");
const arrowStatus = document.querySelector("#arrow-status");
const rosterList = document.querySelector("#roster-list");
const liveSummary = document.querySelector("#live-summary");
const resetMatchButton = document.querySelector("#reset-match");
const eventLog = document.querySelector("#event-log");
const baselinePanel = document.querySelector("#baselinePanel");
const baselineStatusNote = document.querySelector("#baselineStatusNote");
const searchParams = new URLSearchParams(window.location.search);
const testModeEnabled = searchParams.get("test") === "1";

const deviceId = (() => {
  const existing = window.localStorage.getItem("sprk-soccer-device-id");
  if (existing) return existing;
  const next = `device-${Math.random().toString(16).slice(2, 10)}`;
  window.localStorage.setItem("sprk-soccer-device-id", next);
  return next;
})();

const slotBindings = {
  wasd: {
    moveUp: "w",
    moveDown: "s",
    moveLeft: "a",
    moveRight: "d",
    turnLeft: "z",
    turnRight: "x",
    kick: " ",
  },
  arrows: {
    moveUp: "arrowup",
    moveDown: "arrowdown",
    moveLeft: "arrowleft",
    moveRight: "arrowright",
    turnLeft: "pageup",
    turnRight: "pagedown",
    kick: "enter",
  },
};

const teamColors = {
  home: "#38bdf8",
  away: "#facc15",
};

const localPlayers = {
  wasd: { playerId: null, keys: new Set(), lastPayloadSignature: "", activeRequest: false, pendingSend: false },
  arrows: { playerId: null, keys: new Set(), lastPayloadSignature: "", activeRequest: false, pendingSend: false },
};

let world = {
  field: { width: 980, height: 620, goalWidth: 170 },
  teams: { home: "Blue", away: "Gold" },
  score: { home: 0, away: 0 },
  matchSeconds: 0,
  lastGoal: "",
  running: false,
  ball: { x: 490, y: 310, vx: 0, vy: 0 },
  players: [],
};

function syncInputValue(input, value) {
  if (document.activeElement !== input) {
    input.value = value;
  }
}

function formatClock(seconds) {
  const whole = Math.floor(seconds);
  const mins = String(Math.floor(whole / 60)).padStart(2, "0");
  const secs = String(whole % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function renderRoster() {
  rosterList.innerHTML = "";
  const players = [...world.players].sort((a, b) => {
    if (a.team !== b.team) return a.team.localeCompare(b.team);
    return a.name.localeCompare(b.name);
  });

  if (players.length === 0) {
    liveSummary.textContent = world.running
      ? "Match is live. Waiting for players to join."
      : "Waiting for players to join.";
    return;
  }

  liveSummary.textContent = `${world.teams.home} ${world.score.home} : ${world.score.away} ${world.teams.away} | ${players.length} players on the field.`;
  players.forEach((player) => {
    const item = document.createElement("li");
    const localTag = Object.values(localPlayers).some((entry) => entry.playerId === player.id) ? " (this device)" : "";
    item.innerHTML = `<span>${player.name}${localTag}<small>${player.scheme} / ${player.team}</small></span><strong>${Math.round(player.angle)}deg</strong>`;
    rosterList.appendChild(item);
  });
}

function renderWorld() {
  const { width, height, goalWidth } = world.field;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = "#0b6e37";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d7f5df";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 80, 0, Math.PI * 2);
  ctx.stroke();

  const goalTop = height / 2 - goalWidth / 2;
  ctx.strokeRect(0, goalTop, 28, goalWidth);
  ctx.strokeRect(width - 28, goalTop, 28, goalWidth);

  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.arc(world.ball.x, world.ball.y, 12, 0, Math.PI * 2);
  ctx.fill();

  world.players.forEach((player) => {
    const color = player.color || teamColors[player.team] || "#f8fafc";
    const angle = (player.angle * Math.PI) / 180;

    if (player.avatar === "rectangle") {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.fillRect(-10, -20, 20, 40);
      ctx.strokeStyle = "#031018";
      ctx.lineWidth = 3;
      ctx.strokeRect(-10, -20, 20, 40);
      ctx.restore();
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#031018";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + Math.cos(angle) * 24, player.y + Math.sin(angle) * 24);
      ctx.stroke();
    }

    ctx.fillStyle = "#031018";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(player.name, player.x, player.y - 26);
  });
}

function renderState() {
  syncInputValue(homeTeamInput, world.teams.home);
  syncInputValue(awayTeamInput, world.teams.away);
  scoreboardInline.textContent = `${world.teams.home} ${world.score.home} : ${world.score.away} ${world.teams.away}`;
  clockLabel.textContent = formatClock(world.matchSeconds);
  lastGoalLabel.textContent = world.lastGoal || "No goals yet.";
  matchStatus.textContent = world.running
    ? "Match is live. Join players and play toward the opposite goal."
    : "Paused. Press Start Match when both sides are ready.";
  renderRoster();
  renderWorld();
}

async function loadState() {
  const payload = await SPRK.requestJson("/api/state");
  world = payload.state || payload;
  renderState();
}

async function refreshEvents() {
  const payload = await SPRK.requestJson("/api/events");
  SPRK.renderEvents(eventLog, payload);
}

async function refreshWorld() {
  await Promise.all([loadState(), refreshEvents()]);
}

function inputPayload(binding, keys) {
  return {
    moveX: (keys.has(binding.moveRight) ? 1 : 0) - (keys.has(binding.moveLeft) ? 1 : 0),
    moveY: (keys.has(binding.moveDown) ? 1 : 0) - (keys.has(binding.moveUp) ? 1 : 0),
    turnDirection: (keys.has(binding.turnRight) ? 1 : 0) - (keys.has(binding.turnLeft) ? 1 : 0),
    kickPressed: keys.has(binding.kick),
  };
}

async function joinPlayer(slot) {
  const isWasd = slot === "wasd";
  const payload = {
    deviceId,
    scheme: slot,
    team: isWasd ? wasdTeamSelect.value : arrowTeamSelect.value,
    name: isWasd ? wasdNameInput.value : arrowNameInput.value,
    color: isWasd ? wasdColorInput.value : arrowColorInput.value,
    avatar: isWasd ? wasdAvatarSelect.value : arrowAvatarSelect.value,
  };
  const response = await SPRK.postJson("/api/join", payload);
  localPlayers[slot].playerId = response.playerId;
  localPlayers[slot].lastPayloadSignature = "";
  if (isWasd) {
    wasdStatus.textContent = `${payload.name} joined ${payload.team}. Move with WASD, turn with Z/X, kick with Space.`;
  } else {
    arrowStatus.textContent = `${payload.name} joined ${payload.team}. Move with arrows, turn with PageUp/PageDown, kick with Enter.`;
  }
  await refreshWorld();
}

async function saveTeams() {
  await SPRK.postJson("/api/teams", {
    home: homeTeamInput.value,
    away: awayTeamInput.value,
  });
  await SPRK.postJson("/api/events", {
    kind: "frontend",
    message: `Updated team names to ${homeTeamInput.value} and ${awayTeamInput.value}.`,
  });
  await refreshWorld();
}

async function setMatchRunning(running) {
  await SPRK.postJson("/api/match", { action: running ? "start" : "pause" });
  await refreshWorld();
}

async function resetMatch() {
  await SPRK.deleteJson("/api/state");
  await refreshWorld();
}

async function flushInput(slot) {
  const player = localPlayers[slot];
  if (!player.playerId) return;
  if (player.activeRequest) return;

  const payload = inputPayload(slotBindings[slot], player.keys);
  const payloadSignature = JSON.stringify(payload);
  if (payloadSignature === player.lastPayloadSignature) return;

  player.lastPayloadSignature = payloadSignature;
  player.activeRequest = true;

  try {
    const response = await fetch("/api/input", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerId: player.playerId,
        ...payload,
      }),
    });

    if (response.status === 404) {
      player.playerId = null;
      player.lastPayloadSignature = "";
      return;
    }
  } finally {
    player.activeRequest = false;
    if (player.pendingSend) {
      player.pendingSend = false;
      void flushInput(slot);
    }
  }
}

function queueInputSend(slot) {
  const player = localPlayers[slot];
  if (!player.playerId) return;
  if (player.activeRequest) {
    player.pendingSend = true;
    return;
  }
  void flushInput(slot);
}

function normalizeKey(event) {
  if (event.key === " ") return " ";
  return event.key.toLowerCase();
}

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function releaseLocalControls() {
  Object.entries(localPlayers).forEach(([slot, player]) => {
    if (player.keys.size > 0) {
      player.keys.clear();
      player.lastPayloadSignature = "__released__";
      queueInputSend(slot);
    }
  });
}

function collectKey(event, isDown) {
  if (isTypingTarget(event.target)) {
    return;
  }
  const key = normalizeKey(event);
  Object.entries(slotBindings).forEach(([slot, binding]) => {
    const tracked = new Set(Object.values(binding));
    if (tracked.has(key)) {
      const alreadyTracked = localPlayers[slot].keys.has(key);
      if (isDown) {
        localPlayers[slot].keys.add(key);
      } else {
        localPlayers[slot].keys.delete(key);
      }
      if (alreadyTracked !== isDown) {
        queueInputSend(slot);
      }
      event.preventDefault();
    }
  });
}

joinWasdButton.addEventListener("click", () => joinPlayer("wasd"));
joinArrowButton.addEventListener("click", () => joinPlayer("arrows"));
saveTeamsButton.addEventListener("click", saveTeams);
startMatchButton.addEventListener("click", () => setMatchRunning(true));
pauseMatchButton.addEventListener("click", () => setMatchRunning(false));
resetMatchButton.addEventListener("click", resetMatch);

window.addEventListener("keydown", (event) => collectKey(event, true));
window.addEventListener("keyup", (event) => collectKey(event, false));
window.addEventListener("blur", releaseLocalControls);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    releaseLocalControls();
  }
});

SPRK.setupTabs({
  tabs: [
    { button: document.querySelector("#scoreboardTab"), panel: document.querySelector("#scorePanel") },
    { button: document.querySelector("#xrayTab"), panel: document.querySelector("#xrayPanel") },
    { button: document.querySelector("#baselineTab"), panel: baselinePanel },
  ],
});

SPRK.loadBaselineStatus("/_shared/generated/baseline-status.json", baselinePanel, baselineStatusNote);
refreshWorld();
window.setInterval(refreshWorld, 220);

if (testModeEnabled) {
  window.__sprkTest = {
    async joinForTest(name, team, scheme = "wasd") {
      const response = await SPRK.postJson("/api/join", { deviceId, scheme, name, team });
      localPlayers[scheme].playerId = response.playerId;
      localPlayers[scheme].lastPayloadSignature = "";
      await refreshWorld();
      return response.playerId;
    },
    async getState() {
      const payload = await SPRK.requestJson("/api/state");
      return payload.state || payload;
    },
    async startMatch() {
      await SPRK.postJson("/api/match", { action: "start" });
      await refreshWorld();
    },
    async sendInput(playerId, payload) {
      await fetch("/api/input", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId,
          ...payload,
        }),
      });
    },
    async goalForTest(team) {
      await SPRK.postJson("/api/test", { action: "goal", team });
      await refreshWorld();
    },
  };
}
