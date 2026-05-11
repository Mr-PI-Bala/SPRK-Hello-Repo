const playerNameInput = document.querySelector("#player-name");
const soundSelect = document.querySelector("#sound-select");
const questionNumber = document.querySelector("#question-number");
const questionText = document.querySelector("#question-text");
const answerInput = document.querySelector("#answer-input");
const feedback = document.querySelector("#feedback");
const submitButton = document.querySelector("#submit-answer");
const nextButton = document.querySelector("#next-question");
const scoreList = document.querySelector("#score-list");
const eventLog = document.querySelector("#event-log");

const questions = [
  { prompt: "What tag creates the main page title in HTML?", answer: "h1" },
  { prompt: "What does CSS control: logic or style?", answer: "style" },
  { prompt: "What JavaScript word creates a variable that can change?", answer: "let" },
  { prompt: "What API route stores scores in this mission?", answer: "/api/scores" },
];

let currentIndex = 0;
let answeredKey = "";

function normalize(value) {
  return value.trim().toLowerCase();
}

function currentQuestion() {
  return questions[currentIndex % questions.length];
}

function showQuestion() {
  const question = currentQuestion();
  questionNumber.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  questionText.textContent = question.prompt;
  answerInput.value = "";
  feedback.textContent = "Answer when ready.";
  answeredKey = `${currentIndex}:${playerNameInput.value}`;
}

async function log(message) {
  await SPRK.postJson("/api/events", { message, mission: "QuizRoom" });
  await refreshShared();
}

async function loadState() {
  const payload = await SPRK.requestJson("/api/state");
  const state = payload.state || payload;
  currentIndex = Number(state.questionIndex || 0) % questions.length;
  showQuestion();
}

async function submitAnswer() {
  SPRK.unlockSound();
  const question = currentQuestion();
  const correct = normalize(answerInput.value) === normalize(question.answer);
  if (correct) {
    feedback.textContent = "Correct. Your point is on the shared board.";
    SPRK.playSound(soundSelect.value);
    await SPRK.postJson("/api/scores", {
      name: playerNameInput.value || "QuizRoom Player",
      points: 1,
      detail: `Q${currentIndex + 1} correct`,
      sound: soundSelect.value,
    });
    await log(`${playerNameInput.value} answered QuizRoom question ${currentIndex + 1}.`);
  } else {
    feedback.textContent = `Not yet. Correct answer: ${question.answer}`;
    SPRK.playSound("zap");
    await log(`${playerNameInput.value} missed QuizRoom question ${currentIndex + 1}.`);
  }
  answeredKey = "";
}

async function nextQuestion() {
  currentIndex = (currentIndex + 1) % questions.length;
  await SPRK.postJson("/api/state", { questionIndex: currentIndex });
  SPRK.playSound("level");
  showQuestion();
  await log(`QuizRoom moved to question ${currentIndex + 1}.`);
}

async function refreshShared() {
  const scores = await SPRK.requestJson("/api/scores");
  SPRK.renderScores(scoreList, scores);
  const events = await SPRK.requestJson("/api/events");
  SPRK.renderEvents(eventLog, events);
}

submitButton.addEventListener("click", submitAnswer);
nextButton.addEventListener("click", nextQuestion);
answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") submitAnswer();
});

SPRK.setupTabs();
loadState();
refreshShared();
setInterval(loadState, 4000);
