const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
const scoreline = document.querySelector("#scoreline");
const startButton = document.querySelector("#start-button");
const resetButton = document.querySelector("#reset-button");
const leftNameInput = document.querySelector("#left-name");
const rightNameInput = document.querySelector("#right-name");
const soundSelect = document.querySelector("#sound-select");
const scoreList = document.querySelector("#score-list");
const eventLog = document.querySelector("#event-log");

const winningScore = 5;
const keys = new Set();
let leftScore = 0;
let rightScore = 0;
let running = false;
let lastFrame = 0;

const leftPaddle = { x: 28, y: 160, width: 14, height: 88, speed: 360 };
const rightPaddle = { x: 678, y: 160, width: 14, height: 88, speed: 360 };
const ball = { x: 360, y: 210, radius: 9, vx: 260, vy: 170 };

function log(message) {
  SPRK.postJson("/api/events", { message, mission: "PingPong" }).then(refreshShared);
}

function resetBall(direction = 1) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.vx = 260 * direction;
  ball.vy = (Math.random() > 0.5 ? 170 : -170);
}

function resetRound() {
  leftScore = 0;
  rightScore = 0;
  resetBall();
  updateScoreline();
  draw();
  log("PingPong round reset.");
}

function updateScoreline() {
  scoreline.textContent = `${leftScore} : ${rightScore}`;
}

function movePaddles(seconds) {
  if (keys.has("w")) leftPaddle.y -= leftPaddle.speed * seconds;
  if (keys.has("s")) leftPaddle.y += leftPaddle.speed * seconds;
  if (keys.has("arrowup")) rightPaddle.y -= rightPaddle.speed * seconds;
  if (keys.has("arrowdown")) rightPaddle.y += rightPaddle.speed * seconds;
  leftPaddle.y = Math.max(0, Math.min(canvas.height - leftPaddle.height, leftPaddle.y));
  rightPaddle.y = Math.max(0, Math.min(canvas.height - rightPaddle.height, rightPaddle.y));
}

function ballTouches(paddle) {
  return ball.x - ball.radius < paddle.x + paddle.width &&
    ball.x + ball.radius > paddle.x &&
    ball.y + ball.radius > paddle.y &&
    ball.y - ball.radius < paddle.y + paddle.height;
}

function bounceBall(paddle, direction) {
  const hitSpot = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
  ball.vx = Math.abs(ball.vx) * direction * 1.04;
  ball.vy = hitSpot * 260;
  SPRK.playSound(soundSelect.value);
}

function scorePoint(side) {
  if (side === "left") {
    leftScore += 1;
    resetBall(1);
  } else {
    rightScore += 1;
    resetBall(-1);
  }
  updateScoreline();
  log(`${side === "left" ? leftNameInput.value : rightNameInput.value} scored.`);
  if (leftScore >= winningScore || rightScore >= winningScore) finishRound();
}

async function finishRound() {
  running = false;
  const winner = leftScore > rightScore ? leftNameInput.value : rightNameInput.value;
  await SPRK.postJson("/api/scores", {
    name: winner || "PingPong Player",
    points: Math.max(leftScore, rightScore),
    detail: `Won ${leftScore}:${rightScore}`,
    sound: soundSelect.value,
  });
  SPRK.playSound("level");
  await refreshShared();
}

function update(seconds) {
  movePaddles(seconds);
  ball.x += ball.vx * seconds;
  ball.y += ball.vy * seconds;

  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
    ball.vy *= -1;
    SPRK.playSound("pop");
  }
  if (ballTouches(leftPaddle)) bounceBall(leftPaddle, 1);
  if (ballTouches(rightPaddle)) bounceBall(rightPaddle, -1);
  if (ball.x < -30) scorePoint("right");
  if (ball.x > canvas.width + 30) scorePoint("left");
}

function drawPaddle(paddle, color) {
  ctx.fillStyle = color;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#334155";
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
  drawPaddle(leftPaddle, "#38bdf8");
  drawPaddle(rightPaddle, "#f97316");
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function loop(time) {
  const seconds = Math.min((time - lastFrame) / 1000, 0.05);
  lastFrame = time;
  if (running) update(seconds);
  draw();
  requestAnimationFrame(loop);
}

async function refreshShared() {
  const scores = await SPRK.requestJson("/api/scores");
  SPRK.renderScores(scoreList, scores);
  const events = await SPRK.requestJson("/api/events");
  SPRK.renderEvents(eventLog, events);
}

startButton.addEventListener("click", () => {
  SPRK.unlockSound();
  running = true;
  lastFrame = performance.now();
  log("PingPong round started.");
});
resetButton.addEventListener("click", resetRound);
window.addEventListener("keydown", (event) => keys.add(event.key.toLowerCase()));
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

SPRK.setupTabs();
resetRound();
refreshShared();
requestAnimationFrame(loop);
