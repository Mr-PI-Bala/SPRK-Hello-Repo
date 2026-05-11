const playerNameInput = document.querySelector("#player-name");
const deckSelect = document.querySelector("#deck-select");
const soundSelect = document.querySelector("#sound-select");
const progress = document.querySelector("#progress");
const question = document.querySelector("#question");
const answerInput = document.querySelector("#answer-input");
const feedback = document.querySelector("#feedback");
const checkButton = document.querySelector("#check-button");
const nextButton = document.querySelector("#next-button");
const submitButton = document.querySelector("#submit-score");
const scoreList = document.querySelector("#score-list");
const eventLog = document.querySelector("#event-log");

const decks = {
  math: [
    { prompt: "7 x 8", answer: "56" },
    { prompt: "12 + 19", answer: "31" },
    { prompt: "Half of 90", answer: "45" },
    { prompt: "9 squared", answer: "81" },
  ],
  vocab: [
    { prompt: "A synonym for fast", answer: "quick" },
    { prompt: "Opposite of expand", answer: "shrink" },
    { prompt: "A story's main problem", answer: "conflict" },
    { prompt: "A claim supported by facts", answer: "argument" },
  ],
};

let cardIndex = 0;
let streak = 0;
let checked = false;

function currentDeck() {
  return decks[deckSelect.value];
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function showCard() {
  const deck = currentDeck();
  const card = deck[cardIndex % deck.length];
  progress.textContent = `Card ${cardIndex + 1} of ${deck.length} | Streak ${streak}`;
  question.textContent = card.prompt;
  answerInput.value = "";
  feedback.textContent = "Try the card.";
  checked = false;
}

async function log(message) {
  await SPRK.postJson("/api/events", { message, mission: "FlashCards" });
  await refreshShared();
}

async function checkAnswer() {
  SPRK.unlockSound();
  if (checked) return;
  checked = true;
  const card = currentDeck()[cardIndex % currentDeck().length];
  if (normalize(answerInput.value) === normalize(card.answer)) {
    streak += 1;
    feedback.textContent = "Correct. Nice work.";
    SPRK.playSound(soundSelect.value);
    await log(`${playerNameInput.value} answered a FlashCard correctly.`);
  } else {
    feedback.textContent = `Not yet. Correct answer: ${card.answer}`;
    streak = 0;
    SPRK.playSound("zap");
    await log(`${playerNameInput.value} missed a FlashCard.`);
  }
  showProgressOnly();
}

function showProgressOnly() {
  const deck = currentDeck();
  progress.textContent = `Card ${cardIndex + 1} of ${deck.length} | Streak ${streak}`;
}

function nextCard() {
  cardIndex = (cardIndex + 1) % currentDeck().length;
  showCard();
}

async function submitScore() {
  await SPRK.postJson("/api/scores", {
    name: playerNameInput.value || "FlashCards Player",
    points: streak,
    detail: `${deckSelect.value} streak`,
    sound: soundSelect.value,
  });
  SPRK.playSound("level");
  await refreshShared();
}

async function refreshShared() {
  const scores = await SPRK.requestJson("/api/scores");
  SPRK.renderScores(scoreList, scores);
  const events = await SPRK.requestJson("/api/events");
  SPRK.renderEvents(eventLog, events);
}

checkButton.addEventListener("click", checkAnswer);
nextButton.addEventListener("click", nextCard);
submitButton.addEventListener("click", submitScore);
deckSelect.addEventListener("change", () => {
  cardIndex = 0;
  streak = 0;
  showCard();
  log(`FlashCards deck changed to ${deckSelect.value}.`);
});
answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") checkAnswer();
});

SPRK.setupTabs();
showCard();
refreshShared();
