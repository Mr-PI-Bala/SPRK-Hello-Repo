/*
  Mission 10: Space Invaders dimensional shift.

  The mission keeps one game state object for all views. The renderer changes
  camera rules, but aliens, bunkers, score, wave, and player health stay shared.
*/

const canvas = document.querySelector("#invader-canvas");
const ctx = canvas.getContext("2d");
const playerNameInput = document.querySelector("#player-name");
const soundSelect = document.querySelector("#sound-select");
const modeLabel = document.querySelector("#mode-label");
const scoreLabel = document.querySelector("#score-label");
const waveLabel = document.querySelector("#wave-label");
const livesLabel = document.querySelector("#lives-label");
const alienCountLabel = document.querySelector("#alien-count");
const fleetSpeedLabel = document.querySelector("#fleet-speed");
const bunkerStatusLabel = document.querySelector("#bunker-status");
const missionStatus = document.querySelector("#mission-status");
const liveSummary = document.querySelector("#live-summary");
const startGameButton = document.querySelector("#start-game");
const dimensionShiftButton = document.querySelector("#dimension-shift");
const fpsShiftButton = document.querySelector("#fps-shift");
const resetGameButton = document.querySelector("#reset-game");
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

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TOTAL_ALIENS = 55;
const PLAYER_LIMIT_X = 390;
const PLAYER_START_Z = 180;
const TWO_D_BUNKER_Y = 500;
const BUNKER_CELL_SIZE = 12;
const BUNKER_ROWS = 4;
const BUNKER_COLS = 7;

const ALIEN_TYPES = {
  squid: {
    label: "Squid",
    points: 30,
    color: "#b388ff",
    matrix: [
      "00111100",
      "01111110",
      "11011011",
      "11111111",
      "00100100",
      "01011010",
      "10000001",
      "01000010",
    ],
  },
  crab: {
    label: "Crab",
    points: 20,
    color: "#67e8f9",
    matrix: [
      "00100100",
      "01011010",
      "11111111",
      "10111101",
      "11111111",
      "00100100",
      "01000010",
      "10000001",
    ],
  },
  octopus: {
    label: "Octopus",
    points: 10,
    color: "#7cff71",
    matrix: [
      "00111100",
      "01111110",
      "11111111",
      "11011011",
      "11111111",
      "00100100",
      "01011010",
      "10100101",
    ],
  },
};

const MODE_LABELS = {
  "2d": "2D Classic",
  lateral3d: "3D Rail",
  fps: "FPS Climax",
};

const keys = new Set();
const runtime = {
  running: false,
  lastFrame: 0,
  playerCooldown: 0,
  enemyFireTimer: 1.4,
  playerShots: [],
  enemyShots: [],
  particles: [],
  stars: Array.from({ length: 70 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    speed: 8 + Math.random() * 24,
  })),
  transition: null,
  saveTimer: null,
};

let gameState = createDefaultState();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function alienTypeForRow(row) {
  if (row === 0) return "squid";
  if (row <= 2) return "crab";
  return "octopus";
}

function createAlienFleet(wave = 1) {
  const aliens = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 11; col += 1) {
      const type = alienTypeForRow(row);
      aliens.push({
        id: `w${wave}-r${row}-c${col}`,
        row,
        col,
        type,
        points: ALIEN_TYPES[type].points,
        alive: true,
        x: -330 + col * 66,
        y: 118 + row * 48,
        z: -920 + row * 72,
      });
    }
  }
  return aliens;
}

function createBunkerCells() {
  const cells = [];
  for (let row = 0; row < BUNKER_ROWS; row += 1) {
    for (let col = 0; col < BUNKER_COLS; col += 1) {
      const roundedTop = row === 0 && (col === 0 || col === BUNKER_COLS - 1);
      const cannonSlot = row === BUNKER_ROWS - 1 && col >= 2 && col <= 4;
      cells.push(!(roundedTop || cannonSlot));
    }
  }
  return cells;
}

function createBunkers() {
  return [-300, -100, 100, 300].map((x, index) => ({
    id: `bunker-${index + 1}`,
    x,
    y: TWO_D_BUNKER_Y,
    z: -110,
    cells: createBunkerCells(),
  }));
}

function createDefaultState() {
  return {
    mission: "Space Invaders: Dimensional Shift",
    status: "Ready",
    mode: "2d",
    score: 0,
    wave: 1,
    lives: 3,
    aliensDestroyed: 0,
    player: {
      x: 0,
      z: PLAYER_START_Z,
      yaw: 0,
      pitch: 0,
    },
    fleet: {
      direction: 1,
      stepTimer: 0,
      beatIndex: 0,
    },
    aliens: createAlienFleet(1),
    bunkers: createBunkers(),
    mystery: {
      active: false,
      x: -520,
      direction: 1,
      timer: 8,
      points: 100,
    },
    lastEvent: "Defend Earth.",
  };
}

function normalizeState(rawState) {
  const fallback = createDefaultState();
  const raw = rawState || {};
  const next = {
    ...fallback,
    ...raw,
    player: { ...fallback.player, ...(raw.player || {}) },
    fleet: { ...fallback.fleet, ...(raw.fleet || {}) },
    mystery: { ...fallback.mystery, ...(raw.mystery || {}) },
  };

  next.aliens = Array.isArray(raw.aliens) && raw.aliens.length === TOTAL_ALIENS
    ? raw.aliens
    : createAlienFleet(Number(raw.wave || fallback.wave));
  next.bunkers = Array.isArray(raw.bunkers) && raw.bunkers.length === 4
    ? raw.bunkers
    : createBunkers();
  next.mode = ["2d", "lateral3d", "fps"].includes(next.mode) ? next.mode : "2d";
  next.score = Number(next.score || 0);
  next.wave = Number(next.wave || 1);
  next.lives = Number(next.lives || 3);
  next.aliensDestroyed = Number(next.aliensDestroyed || 0);
  return next;
}

function publicState() {
  return clone(gameState);
}

function aliveAliens() {
  return gameState.aliens.filter((alien) => alien.alive);
}

function aliveAlienCount() {
  return aliveAliens().length;
}

function bunkerCellCount() {
  return gameState.bunkers.reduce((total, bunker) => (
    total + bunker.cells.filter(Boolean).length
  ), 0);
}

function maxBunkerCells() {
  return createBunkers().reduce((total, bunker) => (
    total + bunker.cells.filter(Boolean).length
  ), 0);
}

function bunkerPercent() {
  return Math.round((bunkerCellCount() / maxBunkerCells()) * 100);
}

function fleetIntervalSeconds() {
  const alive = Math.max(1, aliveAlienCount());
  return Math.max(0.12, 0.08 + 0.8 * (alive / TOTAL_ALIENS));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wrapAngle(angle) {
  let wrapped = angle;
  while (wrapped > Math.PI) wrapped -= Math.PI * 2;
  while (wrapped < -Math.PI) wrapped += Math.PI * 2;
  return wrapped;
}

function modeScore(mode) {
  if (mode === "fps") return 2;
  if (mode === "lateral3d") return 1;
  return 0;
}

function currentViewBlend() {
  if (!runtime.transition) {
    return modeScore(gameState.mode);
  }
  const from = modeScore(runtime.transition.from);
  const to = modeScore(runtime.transition.to);
  return from + (to - from) * runtime.transition.progress;
}

function scoreMarkup(score) {
  const detail = score.detail ? `<small>${score.detail}</small>` : "";
  return `<span>${score.name}${detail}</span><strong>${score.points}</strong>`;
}

async function refreshScores() {
  const payload = await SPRK.requestJson("/api/scores");
  const scores = payload.scores || [];
  if (scores.length === 0) {
    scoreList.innerHTML = `<li><span>${playerNameInput.value}<small>${MODE_LABELS[gameState.mode]} / Wave ${gameState.wave}</small></span><strong>${gameState.score}</strong></li>`;
    return;
  }
  SPRK.renderScores(scoreList, payload, scoreMarkup);
}

async function refreshEvents() {
  const payload = await SPRK.requestJson("/api/events");
  SPRK.renderEvents(eventLog, payload);
}

async function logEvent(message, kind = "mission") {
  gameState.lastEvent = message;
  await SPRK.postJson("/api/events", { kind, message });
  await refreshEvents();
}

async function saveState() {
  const payload = await SPRK.postJson("/api/state", publicState());
  gameState = normalizeState(payload.state || gameState);
  renderHud();
}

function queueSave() {
  if (runtime.saveTimer) {
    window.clearTimeout(runtime.saveTimer);
  }
  runtime.saveTimer = window.setTimeout(() => {
    void saveState();
  }, 120);
}

async function loadState() {
  const payload = await SPRK.requestJson("/api/state");
  gameState = normalizeState(payload.state);
  renderHud();
}

function renderHud() {
  const alive = aliveAlienCount();
  modeLabel.textContent = MODE_LABELS[gameState.mode];
  scoreLabel.textContent = `Score ${String(gameState.score).padStart(4, "0")}`;
  waveLabel.textContent = `Wave ${gameState.wave}`;
  livesLabel.textContent = `Lives ${gameState.lives}`;
  alienCountLabel.textContent = `${alive} alien${alive === 1 ? "" : "s"} remain`;
  fleetSpeedLabel.textContent = `Fleet beat ${fleetIntervalSeconds().toFixed(2)}s`;
  bunkerStatusLabel.textContent = `Bunkers ${bunkerPercent()}%`;
  missionStatus.textContent = gameState.status;
  liveSummary.textContent = `${MODE_LABELS[gameState.mode]} | ${alive}/55 aliens | ${bunkerPercent()}% bunker cover | ${gameState.lastEvent}`;
}

async function recordScore(detail) {
  if (gameState.score <= 0) {
    await refreshScores();
    return;
  }

  await SPRK.postJson("/api/scores", {
    name: playerNameInput.value,
    points: gameState.score,
    detail,
    sound: soundSelect.value,
  });
  await refreshScores();
}

function addParticles(x, y, color, count = 10) {
  for (let index = 0; index < count; index += 1) {
    runtime.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 160,
      vy: (Math.random() - 0.5) * 160,
      life: 0.45 + Math.random() * 0.35,
      color,
    });
  }
}

function projectRail(x, z, y = 45) {
  const cameraZ = 260;
  const cameraY = 88;
  const focal = 520;
  const depth = cameraZ - z;
  if (depth <= 18) return null;
  return {
    x: WIDTH / 2 + (x - gameState.player.x * 0.35) * focal / depth,
    y: HEIGHT * 0.36 + (cameraY - y) * focal / depth,
    scale: focal / depth,
    depth,
  };
}

function projectFps(x, z, y = 45) {
  const dx = x - gameState.player.x;
  const dz = z - gameState.player.z;
  const cos = Math.cos(-gameState.player.yaw);
  const sin = Math.sin(-gameState.player.yaw);
  const rx = dx * cos - dz * sin;
  const rz = dx * sin + dz * cos;
  const depth = -rz;
  if (depth <= 20) return null;
  const focal = 620;
  return {
    x: WIDTH / 2 + rx * focal / depth,
    y: HEIGHT / 2 + (52 - y) * focal / depth + gameState.player.pitch * 520,
    scale: focal / depth,
    depth,
  };
}

function drawStarfield(speedScale = 1) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#dff7ff";
  runtime.stars.forEach((star) => {
    ctx.globalAlpha = 0.45 + (star.speed / 64);
    ctx.fillRect(star.x, star.y, 2, 2);
    if (runtime.running) {
      star.y += star.speed * speedScale * 0.008;
      if (star.y > HEIGHT) {
        star.y = 0;
        star.x = Math.random() * WIDTH;
      }
    }
  });
  ctx.globalAlpha = 1;
}

function drawAlienIcon(x, y, type, pixelSize, alpha = 1) {
  const config = ALIEN_TYPES[type];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = config.color;
  const matrix = config.matrix;
  const offsetX = x - matrix[0].length * pixelSize / 2;
  const offsetY = y - matrix.length * pixelSize / 2;
  matrix.forEach((line, row) => {
    [...line].forEach((cell, col) => {
      if (cell === "1") {
        ctx.fillRect(offsetX + col * pixelSize, offsetY + row * pixelSize, pixelSize, pixelSize);
      }
    });
  });
  ctx.restore();
}

function drawVoxelAlien(alien, point, alpha = 1) {
  const size = clamp(point.scale * 10, 2.5, 10);
  drawAlienIcon(point.x, point.y, alien.type, size, alpha);
  ctx.save();
  ctx.globalAlpha = alpha * 0.32;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(point.x + size * 2.2, point.y - size * 3.8, size * 0.8, size * 6);
  ctx.restore();
}

function drawBunkers2D(alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  gameState.bunkers.forEach((bunker) => {
    const startX = WIDTH / 2 + bunker.x - (BUNKER_COLS * BUNKER_CELL_SIZE) / 2;
    const startY = bunker.y;
    bunker.cells.forEach((alive, index) => {
      if (!alive) return;
      const col = index % BUNKER_COLS;
      const row = Math.floor(index / BUNKER_COLS);
      ctx.fillStyle = "#1df25b";
      ctx.fillRect(startX + col * BUNKER_CELL_SIZE, startY + row * BUNKER_CELL_SIZE, BUNKER_CELL_SIZE - 1, BUNKER_CELL_SIZE - 1);
    });
  });
  ctx.restore();
}

function drawBunkers3D(projector, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  gameState.bunkers.forEach((bunker) => {
    bunker.cells.forEach((alive, index) => {
      if (!alive) return;
      const col = index % BUNKER_COLS;
      const row = Math.floor(index / BUNKER_COLS);
      const cellX = bunker.x + (col - 3) * 13;
      const cellY = 16 + (BUNKER_ROWS - row) * 8;
      const point = projector(cellX, bunker.z, cellY);
      if (!point) return;
      const size = clamp(point.scale * 11, 2, 12);
      ctx.fillStyle = "#1df25b";
      ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
    });
  });
  ctx.restore();
}

function drawPlayer2D() {
  const x = WIDTH / 2 + gameState.player.x;
  const y = 622;
  ctx.fillStyle = "#1df25b";
  ctx.fillRect(x - 26, y + 8, 52, 16);
  ctx.fillRect(x - 10, y - 12, 20, 24);
  ctx.fillRect(x - 4, y - 28, 8, 18);
}

function drawPlayerRail() {
  const x = WIDTH / 2;
  const y = HEIGHT - 78;
  ctx.fillStyle = "#1df25b";
  ctx.beginPath();
  ctx.moveTo(x, y - 50);
  ctx.lineTo(x - 42, y + 18);
  ctx.lineTo(x + 42, y + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0b2414";
  ctx.fillRect(x - 10, y - 62, 20, 54);
}

function drawWeaponFps() {
  ctx.fillStyle = "rgba(29, 242, 91, 0.72)";
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 + 82, HEIGHT);
  ctx.lineTo(WIDTH / 2 + 18, HEIGHT - 138);
  ctx.lineTo(WIDTH / 2 + 148, HEIGHT - 56);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#d7ffe4";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 22, HEIGHT / 2);
  ctx.lineTo(WIDTH / 2 - 6, HEIGHT / 2);
  ctx.moveTo(WIDTH / 2 + 6, HEIGHT / 2);
  ctx.lineTo(WIDTH / 2 + 22, HEIGHT / 2);
  ctx.moveTo(WIDTH / 2, HEIGHT / 2 - 22);
  ctx.lineTo(WIDTH / 2, HEIGHT / 2 - 6);
  ctx.moveTo(WIDTH / 2, HEIGHT / 2 + 6);
  ctx.lineTo(WIDTH / 2, HEIGHT / 2 + 22);
  ctx.stroke();
}

function drawMysteryShip2D(alpha = 1) {
  if (!gameState.mystery.active) return;
  const x = WIDTH / 2 + gameState.mystery.x;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ff3b4f";
  ctx.fillRect(x - 28, 54, 56, 10);
  ctx.fillRect(x - 18, 42, 36, 14);
  ctx.fillRect(x - 8, 34, 16, 8);
  ctx.restore();
}

function drawRunway(alpha = 1, blend = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "rgba(103, 232, 249, 0.45)";
  ctx.lineWidth = 1;
  const horizon = HEIGHT * (0.34 + (1 - blend) * 0.12);
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = "rgba(103, 232, 249, 0.3)";
  for (let index = 0; index < 18; index += 1) {
    const z = 210 - index * 90;
    const left = projectRail(-430, z, 0);
    const right = projectRail(430, z, 0);
    if (left && right) {
      ctx.beginPath();
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.stroke();
    }
  }
  for (let lane = -4; lane <= 4; lane += 1) {
    const near = projectRail(lane * 105, 210, 0);
    const far = projectRail(lane * 105, -1280, 0);
    if (near && far) {
      ctx.beginPath();
      ctx.moveTo(near.x, near.y);
      ctx.lineTo(far.x, far.y);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = "rgba(29, 242, 91, 0.42)";
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(WIDTH, horizon);
  ctx.stroke();
  ctx.restore();
}

function draw2DScene(alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  drawStarfield(0.2);
  ctx.strokeStyle = "#1df25b";
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 24, WIDTH - 44, HEIGHT - 48);
  drawMysteryShip2D(alpha);
  gameState.aliens.forEach((alien) => {
    if (alien.alive) {
      drawAlienIcon(WIDTH / 2 + alien.x, alien.y, alien.type, 4, alpha);
    }
  });
  drawBunkers2D(alpha);
  drawPlayer2D();
  runtime.playerShots.filter((shot) => shot.type === "classic").forEach((shot) => {
    ctx.fillStyle = "#d7ffe4";
    ctx.fillRect(WIDTH / 2 + shot.x - 2, shot.y - 12, 4, 18);
  });
  runtime.enemyShots.filter((shot) => shot.type === "classic").forEach((shot) => {
    ctx.fillStyle = "#ff3b4f";
    ctx.fillRect(WIDTH / 2 + shot.x - 2, shot.y, 4, 16);
  });
  ctx.restore();
}

function drawRailScene(alpha = 1, blend = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  drawRunway(alpha, blend);
  drawBunkers3D(projectRail, alpha);
  const sortedAliens = aliveAliens().sort((a, b) => a.z - b.z);
  sortedAliens.forEach((alien) => {
    const point = projectRail(alien.x, alien.z, 58);
    if (point) drawVoxelAlien(alien, point, alpha);
  });
  runtime.playerShots.filter((shot) => shot.type === "rail").forEach((shot) => {
    const point = projectRail(shot.x, shot.z, 46);
    if (!point) return;
    ctx.fillStyle = "#d7ffe4";
    ctx.beginPath();
    ctx.arc(point.x, point.y, clamp(point.scale * 7, 2, 8), 0, Math.PI * 2);
    ctx.fill();
  });
  runtime.enemyShots.filter((shot) => shot.type === "rail").forEach((shot) => {
    const point = projectRail(shot.x, shot.z, 42);
    if (!point) return;
    ctx.fillStyle = "#ff3b4f";
    ctx.beginPath();
    ctx.arc(point.x, point.y, clamp(point.scale * 8, 2, 9), 0, Math.PI * 2);
    ctx.fill();
  });
  drawPlayerRail();
  ctx.restore();
}

function drawFpsScene(alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#05020f");
  gradient.addColorStop(0.5, "#08111f");
  gradient.addColorStop(1, "#030712");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawBunkers3D(projectFps, alpha);
  const sortedAliens = aliveAliens().sort((a, b) => {
    const da = Math.hypot(a.x - gameState.player.x, a.z - gameState.player.z);
    const db = Math.hypot(b.x - gameState.player.x, b.z - gameState.player.z);
    return db - da;
  });
  sortedAliens.forEach((alien) => {
    const point = projectFps(alien.x, alien.z, 62 + (alien.row === 0 ? 18 : 0));
    if (!point || point.x < -80 || point.x > WIDTH + 80 || point.y < -80 || point.y > HEIGHT + 80) return;
    drawVoxelAlien(alien, point, alpha);
  });
  runtime.enemyShots.forEach((shot) => {
    const point = projectFps(shot.x, shot.z, 42);
    if (!point) return;
    ctx.fillStyle = "#ff3b4f";
    ctx.beginPath();
    ctx.arc(point.x, point.y, clamp(point.scale * 9, 2, 11), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "rgba(103, 232, 249, 0.18)";
  ctx.fillRect(0, HEIGHT * 0.62, WIDTH, HEIGHT * 0.38);
  drawWeaponFps();
  ctx.restore();
}

function drawDimensionalBlend(blend) {
  draw2DScene(1 - blend * 0.45);
  ctx.save();
  ctx.globalAlpha = blend;
  drawRunway(blend, blend);
  drawBunkers3D(projectRail, blend);
  gameState.aliens.forEach((alien) => {
    if (!alien.alive) return;
    const point = projectRail(alien.x, alien.z, 58);
    if (!point) return;
    const screenX = WIDTH / 2 + alien.x + (point.x - (WIDTH / 2 + alien.x)) * blend;
    const screenY = alien.y + (point.y - alien.y) * blend;
    drawAlienIcon(screenX, screenY, alien.type, 4 + (clamp(point.scale * 10, 2.5, 10) - 4) * blend, blend);
  });
  ctx.restore();
}

function drawParticles(dt) {
  runtime.particles = runtime.particles.filter((particle) => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    if (particle.life <= 0) return false;
    ctx.globalAlpha = clamp(particle.life, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 3, 3);
    ctx.globalAlpha = 1;
    return true;
  });
}

function drawScene(dt = 0) {
  const blend = currentViewBlend();
  if (runtime.transition && runtime.transition.from === "2d" && runtime.transition.to === "lateral3d") {
    drawDimensionalBlend(runtime.transition.progress);
  } else if (blend < 0.5) {
    draw2DScene(1);
  } else if (blend < 1.5) {
    drawRailScene(1, clamp(blend, 0, 1));
  } else if (runtime.transition && runtime.transition.from === "lateral3d" && runtime.transition.to === "fps") {
    drawRailScene(1 - runtime.transition.progress, 1);
    drawFpsScene(runtime.transition.progress);
  } else {
    drawFpsScene(1);
  }
  drawParticles(dt);
}

function damageBunkerCell(bunker, cellIndex, source) {
  if (!bunker || !bunker.cells[cellIndex]) return false;
  bunker.cells[cellIndex] = false;
  gameState.status = `${source} carved bunker cover.`;
  gameState.lastEvent = gameState.status;
  return true;
}

function hitBunker2D(x, y, source) {
  for (const bunker of gameState.bunkers) {
    const left = bunker.x - (BUNKER_COLS * BUNKER_CELL_SIZE) / 2;
    const top = bunker.y;
    const col = Math.floor((x - left) / BUNKER_CELL_SIZE);
    const row = Math.floor((y - top) / BUNKER_CELL_SIZE);
    if (col < 0 || col >= BUNKER_COLS || row < 0 || row >= BUNKER_ROWS) continue;
    const index = row * BUNKER_COLS + col;
    if (damageBunkerCell(bunker, index, source)) {
      addParticles(WIDTH / 2 + x, y, "#1df25b", 6);
      queueSave();
      void logEvent(gameState.status, "bunker");
      return true;
    }
  }
  return false;
}

function hitBunkerRail(x, z, source) {
  for (const bunker of gameState.bunkers) {
    if (Math.abs(z - bunker.z) > 24 || Math.abs(x - bunker.x) > 55) continue;
    const liveIndex = bunker.cells.findIndex(Boolean);
    if (liveIndex >= 0 && damageBunkerCell(bunker, liveIndex, source)) {
      const point = projectRail(x, z, 28) || { x: WIDTH / 2, y: HEIGHT / 2 };
      addParticles(point.x, point.y, "#1df25b", 7);
      queueSave();
      void logEvent(gameState.status, "bunker");
      return true;
    }
  }
  return false;
}

function applyAlienDestruction(alien, source) {
  alien.alive = false;
  gameState.score += alien.points;
  gameState.aliensDestroyed += 1;
  const message = `${ALIEN_TYPES[alien.type].label} destroyed for ${alien.points} points by ${source}.`;
  gameState.status = message;
  gameState.lastEvent = message;
  const point = gameState.mode === "2d"
    ? { x: WIDTH / 2 + alien.x, y: alien.y }
    : (gameState.mode === "fps" ? projectFps(alien.x, alien.z, 62) : projectRail(alien.x, alien.z, 62));
  if (point) addParticles(point.x, point.y, ALIEN_TYPES[alien.type].color, 14);
  if (aliveAlienCount() === 0) {
    startNextWave();
  }
  renderHud();
  return message;
}

async function destroyAlien(alien, source = "cannon") {
  if (!alien || !alien.alive) return;
  const message = applyAlienDestruction(alien, source);
  SPRK.playSound(soundSelect.value);
  await saveState();
  await Promise.all([
    recordScore(`Wave ${gameState.wave}: ${message}`),
    logEvent(message, "score"),
  ]);
}

function startNextWave() {
  gameState.wave += 1;
  gameState.aliens = createAlienFleet(gameState.wave);
  gameState.fleet = { direction: 1, stepTimer: 0, beatIndex: 0 };
  gameState.mystery = { active: false, x: -520, direction: 1, timer: 7, points: 100 };
  gameState.status = `Wave ${gameState.wave} deployed.`;
  gameState.lastEvent = gameState.status;
}

function loseLife(reason) {
  gameState.lives = Math.max(0, gameState.lives - 1);
  gameState.status = reason;
  gameState.lastEvent = reason;
  runtime.enemyShots = [];
  runtime.playerShots = [];
  if (gameState.lives === 0) {
    runtime.running = false;
    gameState.status = "Earth overrun. Reset the wave to try again.";
    gameState.lastEvent = gameState.status;
  }
  queueSave();
  void logEvent(gameState.status, "state");
}

function updateFleet(dt) {
  const alive = aliveAliens();
  if (alive.length === 0 || gameState.lives <= 0) return;
  gameState.fleet.stepTimer += dt;
  const interval = fleetIntervalSeconds();
  if (gameState.fleet.stepTimer < interval) return;

  gameState.fleet.stepTimer = 0;
  gameState.fleet.beatIndex += 1;
  const lateralStep = gameState.mode === "2d" ? 15 : 22;
  alive.forEach((alien) => {
    alien.x += gameState.fleet.direction * lateralStep;
    if (gameState.mode !== "2d") {
      alien.z += 10 + gameState.wave * 1.6;
    }
  });

  const minX = Math.min(...alive.map((alien) => alien.x));
  const maxX = Math.max(...alive.map((alien) => alien.x));
  if (minX < -390 || maxX > 390) {
    gameState.fleet.direction *= -1;
    alive.forEach((alien) => {
      if (gameState.mode === "2d") {
        alien.y += 26;
      } else {
        alien.z += 42;
      }
    });
  }

  if (gameState.mode === "2d" && alive.some((alien) => alien.y > 470)) {
    loseLife("The fleet reached the bunkers in 2D.");
  }

  if (gameState.mode === "lateral3d" && alive.some((alien) => alien.z > -230)) {
    startTransition("fps", "proximity threshold");
  }

  if (gameState.mode !== "2d" && alive.some((alien) => alien.z > 115)) {
    loseLife("The fleet breached the runway.");
  }
  renderHud();
}

function updateMystery(dt) {
  if (gameState.mystery.active) {
    gameState.mystery.x += gameState.mystery.direction * 150 * dt;
    if (Math.abs(gameState.mystery.x) > 540) {
      gameState.mystery.active = false;
      gameState.mystery.timer = 9 + Math.random() * 5;
    }
    return;
  }

  gameState.mystery.timer -= dt;
  if (gameState.mystery.timer <= 0) {
    gameState.mystery.direction = Math.random() > 0.5 ? 1 : -1;
    gameState.mystery.x = gameState.mystery.direction > 0 ? -520 : 520;
    gameState.mystery.points = [50, 100, 150][Math.floor(Math.random() * 3)];
    gameState.mystery.active = true;
    void logEvent(`Mystery ship launched for ${gameState.mystery.points} possible points.`, "mystery");
  }
}

function updatePlayer(dt) {
  runtime.playerCooldown = Math.max(0, runtime.playerCooldown - dt);
  const left = keys.has("arrowleft") || keys.has("a");
  const right = keys.has("arrowright") || keys.has("d");
  const up = keys.has("arrowup") || keys.has("w");
  const down = keys.has("arrowdown") || keys.has("s");

  if (gameState.mode === "fps") {
    if (left) gameState.player.yaw -= 1.8 * dt;
    if (right) gameState.player.yaw += 1.8 * dt;
    if (up) gameState.player.z -= Math.cos(gameState.player.yaw) * 170 * dt;
    if (down) gameState.player.z += Math.cos(gameState.player.yaw) * 170 * dt;
    if (keys.has("q")) gameState.player.x -= 170 * dt;
    if (keys.has("e")) gameState.player.x += 170 * dt;
    gameState.player.x = clamp(gameState.player.x, -PLAYER_LIMIT_X, PLAYER_LIMIT_X);
    gameState.player.z = clamp(gameState.player.z, -30, PLAYER_START_Z + 120);
    return;
  }

  if (left) gameState.player.x -= 250 * dt;
  if (right) gameState.player.x += 250 * dt;
  gameState.player.x = clamp(gameState.player.x, -PLAYER_LIMIT_X, PLAYER_LIMIT_X);
}

function updatePlayerShots(dt) {
  runtime.playerShots = runtime.playerShots.filter((shot) => {
    if (shot.type === "classic") {
      shot.y += shot.speed * dt;
      if (hitBunker2D(shot.x, shot.y, "Player laser")) return false;
      const alien = aliveAliens().find((candidate) => (
        Math.abs(candidate.x - shot.x) < 25 && Math.abs(candidate.y - shot.y) < 22
      ));
      if (alien) {
        void destroyAlien(alien, "laser cannon");
        return false;
      }
      if (gameState.mystery.active && Math.abs(gameState.mystery.x - shot.x) < 34 && shot.y < 75) {
        const points = gameState.mystery.points;
        gameState.mystery.active = false;
        gameState.score += points;
        gameState.status = `Mystery ship destroyed for ${points} bonus points.`;
        gameState.lastEvent = gameState.status;
        addParticles(WIDTH / 2 + shot.x, shot.y, "#ff3b4f", 16);
        queueSave();
        void recordScore(`Wave ${gameState.wave}: UFO bonus`);
        void logEvent(gameState.status, "score");
        return false;
      }
      return shot.y > 20;
    }

    shot.z += shot.speed * dt;
    if (hitBunkerRail(shot.x, shot.z, "Player plasma")) return false;
    const alien = aliveAliens().find((candidate) => (
      Math.abs(candidate.x - shot.x) < 30 && Math.abs(candidate.z - shot.z) < 36
    ));
    if (alien) {
      void destroyAlien(alien, "rail plasma");
      return false;
    }
    return shot.z > -1300;
  });
}

function chooseShooter() {
  const alive = aliveAliens();
  if (alive.length === 0) return null;
  const byColumn = new Map();
  alive.forEach((alien) => {
    const existing = byColumn.get(alien.col);
    if (!existing || alien.row > existing.row) {
      byColumn.set(alien.col, alien);
    }
  });
  const shooters = [...byColumn.values()];
  return shooters[Math.floor(Math.random() * shooters.length)];
}

function fireEnemyShot() {
  const alien = chooseShooter();
  if (!alien) return;
  if (gameState.mode === "2d") {
    runtime.enemyShots.push({ type: "classic", x: alien.x, y: alien.y + 20, speed: 175 + gameState.wave * 12 });
  } else {
    runtime.enemyShots.push({ type: "rail", x: alien.x, z: alien.z + 20, speed: 245 + gameState.wave * 14 });
  }
}

function updateEnemyShots(dt) {
  runtime.enemyFireTimer -= dt;
  const enemyCadence = clamp(1.7 - (TOTAL_ALIENS - aliveAlienCount()) * 0.018, 0.45, 1.7);
  if (runtime.enemyFireTimer <= 0 && runtime.running) {
    runtime.enemyFireTimer = enemyCadence;
    fireEnemyShot();
  }

  runtime.enemyShots = runtime.enemyShots.filter((shot) => {
    if (shot.type === "classic") {
      shot.y += shot.speed * dt;
      if (hitBunker2D(shot.x, shot.y, "Alien laser")) return false;
      if (Math.abs(shot.x - gameState.player.x) < 26 && shot.y > 595) {
        loseLife("Alien laser hit the cannon.");
        return false;
      }
      return shot.y < HEIGHT - 30;
    }

    shot.z += shot.speed * dt;
    if (hitBunkerRail(shot.x, shot.z, "Alien plasma")) return false;
    if (Math.abs(shot.x - gameState.player.x) < 28 && shot.z > gameState.player.z - 25) {
      loseLife("Alien plasma hit the cannon.");
      return false;
    }
    return shot.z < gameState.player.z + 40;
  });
}

function hitAlienByRay(source) {
  const candidates = aliveAliens().map((alien) => {
    const dx = alien.x - gameState.player.x;
    const dz = gameState.player.z - alien.z;
    const yawToAlien = Math.atan2(dx, dz);
    const yawDiff = Math.abs(wrapAngle(yawToAlien - gameState.player.yaw));
    const distance = Math.hypot(dx, dz);
    return { alien, yawDiff, distance };
  }).filter((entry) => entry.yawDiff < 0.16)
    .sort((a, b) => a.yawDiff - b.yawDiff || a.distance - b.distance);

  if (candidates.length === 0) {
    addParticles(WIDTH / 2, HEIGHT / 2, "#d7ffe4", 5);
    return false;
  }

  void destroyAlien(candidates[0].alien, source);
  return true;
}

function firePlayerShot() {
  if (runtime.playerCooldown > 0 || gameState.lives <= 0) return;
  SPRK.unlockSound();
  SPRK.playSound(soundSelect.value);

  if (gameState.mode === "2d") {
    if (runtime.playerShots.some((shot) => shot.type === "classic")) return;
    runtime.playerShots.push({ type: "classic", x: gameState.player.x, y: 592, speed: -620 });
    runtime.playerCooldown = 0.28;
    return;
  }

  if (gameState.mode === "lateral3d") {
    runtime.playerShots.push({ type: "rail", x: gameState.player.x, z: gameState.player.z - 20, speed: -790 });
    runtime.playerCooldown = 0.18;
    return;
  }

  runtime.playerCooldown = 0.08;
  hitAlienByRay("FPS plasma rifle");
}

function updateTransition(dt) {
  if (!runtime.transition) return;
  runtime.transition.elapsed += dt;
  runtime.transition.progress = clamp(runtime.transition.elapsed / runtime.transition.duration, 0, 1);
  if (runtime.transition.progress < 1) return;

  gameState.mode = runtime.transition.to;
  runtime.transition = null;
  gameState.status = `${MODE_LABELS[gameState.mode]} engaged.`;
  gameState.lastEvent = gameState.status;
  queueSave();
  void logEvent(gameState.status, "dimension");
  renderHud();
}

function startTransition(targetMode, reason = "operator input") {
  if (runtime.transition || gameState.mode === targetMode) return;
  const allowed = (
    (gameState.mode === "2d" && targetMode === "lateral3d") ||
    (gameState.mode === "lateral3d" && targetMode === "fps") ||
    (gameState.mode === "2d" && targetMode === "fps")
  );
  if (!allowed) return;
  runtime.transition = {
    from: gameState.mode,
    to: targetMode,
    elapsed: 0,
    duration: targetMode === "lateral3d" ? 1.5 : 1.1,
    progress: 0,
  };
  gameState.status = `Dimension shift to ${MODE_LABELS[targetMode]} started (${reason}).`;
  gameState.lastEvent = gameState.status;
  renderHud();
  void logEvent(gameState.status, "dimension");
}

function updateGame(dt) {
  updateTransition(dt);
  if (!runtime.running || runtime.transition) return;
  updatePlayer(dt);
  updateFleet(dt);
  updateMystery(dt);
  updatePlayerShots(dt);
  updateEnemyShots(dt);
}

function frame(timestamp) {
  const dt = runtime.lastFrame ? Math.min(0.05, (timestamp - runtime.lastFrame) / 1000) : 0;
  runtime.lastFrame = timestamp;
  updateGame(dt);
  drawScene(dt);
  window.requestAnimationFrame(frame);
}

async function startGame() {
  SPRK.unlockSound();
  runtime.running = true;
  gameState.status = `${MODE_LABELS[gameState.mode]} defense active.`;
  gameState.lastEvent = gameState.status;
  renderHud();
  await logEvent(`${playerNameInput.value} started the defense.`, "state");
  await saveState();
}

async function resetGame() {
  runtime.running = false;
  runtime.playerShots = [];
  runtime.enemyShots = [];
  runtime.particles = [];
  runtime.transition = null;
  gameState = createDefaultState();
  renderHud();
  await SPRK.deleteJson("/api/state");
  await SPRK.deleteJson("/api/scores");
  await saveState();
  await logEvent(`${playerNameInput.value} reset Mission 10.`, "reset");
  await refreshScores();
}

async function clearSharedBoard() {
  await SPRK.deleteJson("/api/scores");
  await logEvent(`${playerNameInput.value} cleared the invader score board.`, "scoreboard");
  await refreshScores();
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  keys.add(key);
  if ([" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) {
    event.preventDefault();
  }
  if (key === " ") {
    firePlayerShot();
  }
  if (key === "shift") {
    startTransition(gameState.mode === "2d" ? "lateral3d" : "fps", "Shift key");
  }
  if (key === "f") {
    startTransition("fps", "F key");
  }
}

function handleKeyUp(event) {
  keys.delete(event.key.toLowerCase());
}

function handleMouseMove(event) {
  if (gameState.mode !== "fps") return;
  const movementX = event.movementX || 0;
  const movementY = event.movementY || 0;
  gameState.player.yaw += movementX * 0.004;
  gameState.player.pitch = clamp(gameState.player.pitch + movementY * 0.003, -0.55, 0.55);
}

canvas.addEventListener("click", () => {
  if (gameState.mode === "fps" && canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
  firePlayerShot();
});
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
document.addEventListener("mousemove", handleMouseMove);
startGameButton.addEventListener("click", startGame);
dimensionShiftButton.addEventListener("click", () => {
  SPRK.unlockSound();
  startTransition(gameState.mode === "2d" ? "lateral3d" : "fps", "button");
});
fpsShiftButton.addEventListener("click", () => {
  SPRK.unlockSound();
  startTransition("fps", "button");
});
resetGameButton.addEventListener("click", resetGame);
clearSharedButton.addEventListener("click", clearSharedBoard);

SPRK.setupTabs({
  tabs: [
    { button: scoreboardTab, panel: scorePanel },
    { button: xrayTab, panel: xrayPanel },
    { button: baselineTab, panel: baselinePanel },
  ],
});

window.__sprkTest = {
  getState() {
    return {
      ...publicState(),
      aliveCount: aliveAlienCount(),
      bunkerCells: bunkerCellCount(),
      fleetInterval: fleetIntervalSeconds(),
      transitionActive: Boolean(runtime.transition),
    };
  },
  async resetGame() {
    await resetGame();
    return this.getState();
  },
  async destroyFirstAlienForTest() {
    const alien = aliveAliens()[0];
    await destroyAlien(alien, "test harness");
    return this.getState();
  },
  async hitFirstBunkerForTest() {
    const bunker = gameState.bunkers[0];
    const index = bunker.cells.findIndex(Boolean);
    damageBunkerCell(bunker, index, "test harness");
    await saveState();
    await logEvent("Test harness damaged one bunker cell.", "bunker");
    return this.getState();
  },
  async shiftToLateral() {
    startTransition("lateral3d", "test harness");
    await new Promise((resolve) => window.setTimeout(resolve, 1600));
    return this.getState();
  },
  async enterFps() {
    if (gameState.mode === "2d") {
      gameState.mode = "lateral3d";
    }
    startTransition("fps", "test harness");
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    return this.getState();
  },
  async lookForTest(deltaX, deltaY) {
    gameState.player.yaw += Number(deltaX || 0) * 0.01;
    gameState.player.pitch = clamp(gameState.player.pitch + Number(deltaY || 0) * 0.01, -0.55, 0.55);
    await saveState();
    return this.getState();
  },
  async fireAtFirstAlienForTest() {
    const alien = aliveAliens()[0];
    if (alien) {
      const dx = alien.x - gameState.player.x;
      const dz = gameState.player.z - alien.z;
      gameState.player.yaw = Math.atan2(dx, dz);
      await destroyAlien(alien, "test plasma");
    }
    return this.getState();
  },
};

Promise.all([
  loadState(),
  refreshScores(),
  refreshEvents(),
  SPRK.loadBaselineStatus("/_shared/generated/baseline-status.json", baselinePanel, baselineStatusNote),
]).then(() => {
  drawScene();
  window.requestAnimationFrame(frame);
}).catch((error) => {
  missionStatus.textContent = "Offline";
  liveSummary.textContent = `Space Invaders load failed: ${error.message}`;
  drawScene();
});
