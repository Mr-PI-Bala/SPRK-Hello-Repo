/*
  SnakeGame logic.

  Big idea:
  - The snake is an array of grid cells.
  - Food is one grid cell.
  - Each timer tick moves the snake one cell.
  - The backend stores shared classroom scores.
*/

const playerNameInput = document.querySelector("#playerName");
const soundChoice = document.querySelector("#soundChoice");
const saveNameButton = document.querySelector("#saveNameButton");
const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const gameStatus = document.querySelector("#gameStatus");
const scoreNow = document.querySelector("#scoreNow");
const roundMessage = document.querySelector("#roundMessage");
const startButton = document.querySelector("#startButton");
const submitButton = document.querySelector("#submitButton");
const clearButton = document.querySelector("#clearButton");
const scoreList = document.querySelector("#scoreList");
const eventList = document.querySelector("#eventList");
const sharedStatus = document.querySelector("#sharedStatus");
const baselinePanel = document.querySelector("#baselinePanel");
const baselineStatusNote = document.querySelector("#baselineStatusNote");
const searchParams = new URLSearchParams(window.location.search);
const testModeEnabled = searchParams.get("test") === "1";

SPRK.setupTabs(
  {
    tabs: [
      { button: document.querySelector("#scoreboardTab"), panel: document.querySelector("#scorePanel") },
      { button: document.querySelector("#xrayTab"), panel: document.querySelector("#xrayPanel") },
      { button: document.querySelector("#baselineTab"), panel: document.querySelector("#baselinePanel") },
    ],
  }
);

const gridSize = 21;
const cellSize = canvas.width / gridSize;
const snakeColor = "#1fc76a";
let moveDelayMs = 150;
let playerName = "Maya-SPRK";
let snake = [];
let food = { x: 10, y: 10 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let timerId = null;
let gameRunning = false;

playerNameInput.value = playerName;

function resetGame() {
  snake = [
    { x: 6, y: 10 },
    { x: 5, y: 10 },
    { x: 4, y: 10 }
  ];
  food = randomFood();
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  gameRunning = false;
  gameStatus.textContent = "Ready";
  scoreNow.textContent = "Score: 0";
  roundMessage.textContent = "Press Start, then use arrows or WASD.";
  drawGame();
}

function randomFood() {
  return {
    x: Math.floor(Math.random() * gridSize),
    y: Math.floor(Math.random() * gridSize)
  };
}

function hitWall(head) {
  return head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
}

function hitSelf(head) {
  return snake.some((part) => part.x === head.x && part.y === head.y);
}

function moveSnake() {
  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (hitWall(head) || hitSelf(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreNow.textContent = `Score: ${score}`;
    food = randomFood();
    SPRK.playSound(soundChoice.value);
  } else {
    snake.pop();
  }

  drawGame();
}

function drawGame() {
  context.fillStyle = "#0d141d";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#ff5c7a";
  context.fillRect(food.x * cellSize, food.y * cellSize, cellSize - 2, cellSize - 2);

  context.fillStyle = snakeColor;
  snake.forEach((part) => {
    context.fillRect(part.x * cellSize, part.y * cellSize, cellSize - 2, cellSize - 2);
  });
}

function startGame() {
  SPRK.unlockSound();
  resetGame();
  gameRunning = true;
  gameStatus.textContent = "Playing";
  roundMessage.textContent = "Collect food. Avoid walls and yourself.";
  timerId = window.setInterval(moveSnake, moveDelayMs);
}

function endGame() {
  window.clearInterval(timerId);
  gameRunning = false;
  gameStatus.textContent = "Game Over";
  roundMessage.textContent = "Submit your score or start again.";
  SPRK.playSound("drum");
}

function setDirection(next) {
  if (next.x + direction.x === 0 && next.y + direction.y === 0) {
    return;
  }
  nextDirection = next;
}

async function submitScore() {
  SPRK.unlockSound();
  const result = await SPRK.postJson("/api/scores", {
    name: playerName,
    points: score,
    detail: "Snake score",
    sound: soundChoice.value
  });
  SPRK.renderScores(scoreList, result.scores);
  sharedStatus.textContent = "Shared scoreboard updated.";
}

async function refreshSharedPanels() {
  const scores = await SPRK.requestJson("/api/scores");
  SPRK.renderScores(scoreList, scores.scores);
  const events = await SPRK.requestJson("/api/events");
  SPRK.renderEvents(eventList, events.events);
}

saveNameButton.addEventListener("click", () => {
  SPRK.unlockSound();
  playerName = playerNameInput.value.trim() || "Maya-SPRK";
  playerNameInput.value = playerName;
  roundMessage.textContent = `Player set to ${playerName}.`;
});

startButton.addEventListener("click", startGame);
submitButton.addEventListener("click", submitScore);
clearButton.addEventListener("click", async () => {
  await SPRK.deleteJson("/api/scores");
  await refreshSharedPanels();
});

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    SPRK.unlockSound();
    const value = button.dataset.direction;
    if (value === "up") setDirection({ x: 0, y: -1 });
    if (value === "down") setDirection({ x: 0, y: 1 });
    if (value === "left") setDirection({ x: -1, y: 0 });
    if (value === "right") setDirection({ x: 1, y: 0 });
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") setDirection({ x: 0, y: -1 });
  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") setDirection({ x: 0, y: 1 });
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") setDirection({ x: -1, y: 0 });
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") setDirection({ x: 1, y: 0 });
});

SPRK_TOUCH.attach({
  target: canvas,
  onDirection: (dx, dy) => {
    if (dx === 0 && dy === 0) {
      return;
    }
    setDirection({ x: dx, y: dy });
  },
  unlockSound: () => SPRK.unlockSound(),
  fullscreenElement: document.querySelector(".play-card"),
});

resetGame();
SPRK.loadBaselineStatus("/_shared/generated/baseline-status.json", baselinePanel, baselineStatusNote);
refreshSharedPanels();
window.setInterval(refreshSharedPanels, 2000);

if (testModeEnabled) {
  window.__sprkTest = {
    setScore(nextScore) {
      score = nextScore;
      scoreNow.textContent = `Score: ${score}`;
      gameStatus.textContent = "Game Over";
      roundMessage.textContent = "Submit your score or start again.";
    },
  };
}
