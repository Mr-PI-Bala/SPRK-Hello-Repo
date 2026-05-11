const playerNameInput = document.querySelector("#player-name");
const soundSelect = document.querySelector("#sound-select");
const homeNameInput = document.querySelector("#home-name");
const awayNameInput = document.querySelector("#away-name");
const homeScore = document.querySelector("#home-score");
const awayScore = document.querySelector("#away-score");
const periodLabel = document.querySelector("#period-label");
const saveTeamsButton = document.querySelector("#save-teams");
const nextPeriodButton = document.querySelector("#next-period");
const resetGameButton = document.querySelector("#reset-game");
const scoreList = document.querySelector("#score-list");
const eventLog = document.querySelector("#event-log");

let match = {
  home: "Blue Team",
  away: "Gold Team",
  homeScore: 0,
  awayScore: 0,
  period: 1,
};

async function log(message) {
  await SPRK.postJson("/api/events", { message, mission: "SoccerScore" });
  await refreshShared();
}

function renderMatch() {
  homeNameInput.value = match.home;
  awayNameInput.value = match.away;
  homeScore.textContent = match.homeScore;
  awayScore.textContent = match.awayScore;
  periodLabel.textContent = `Period ${match.period}`;
}

async function saveMatch(nextMatch) {
  match = nextMatch;
  await SPRK.postJson("/api/state", match);
  renderMatch();
}

async function loadMatch() {
  const payload = await SPRK.requestJson("/api/state");
  const state = payload.state || payload;
  match = { ...match, ...state };
  renderMatch();
}

async function changeScore(side) {
  SPRK.unlockSound();
  const team = side === "home" ? match.home : match.away;
  const nextMatch = {
    ...match,
    homeScore: side === "home" ? Number(match.homeScore) + 1 : Number(match.homeScore),
    awayScore: side === "away" ? Number(match.awayScore) + 1 : Number(match.awayScore),
  };
  await saveMatch(nextMatch);
  await SPRK.postJson("/api/scores", {
    name: team,
    points: 1,
    detail: `Goal in period ${match.period}`,
    sound: soundSelect.value,
  });
  SPRK.playSound(soundSelect.value);
  await log(`${playerNameInput.value} reported a goal for ${team}.`);
}

async function saveTeams() {
  await saveMatch({ ...match, home: homeNameInput.value, away: awayNameInput.value });
  await log(`${playerNameInput.value} updated team names.`);
}

async function nextPeriod() {
  await saveMatch({ ...match, period: Number(match.period) + 1 });
  SPRK.playSound("coin");
  await log(`SoccerScore moved to period ${match.period}.`);
}

async function resetGame() {
  await saveMatch({ ...match, homeScore: 0, awayScore: 0, period: 1 });
  SPRK.playSound("zap");
  await log("SoccerScore reset the match.");
}

async function refreshShared() {
  const scores = await SPRK.requestJson("/api/scores");
  SPRK.renderScores(scoreList, scores);
  const events = await SPRK.requestJson("/api/events");
  SPRK.renderEvents(eventLog, events);
}

document.addEventListener("click", (event) => {
  const side = event.target.dataset.goal;
  if (side) changeScore(side);
});
saveTeamsButton.addEventListener("click", saveTeams);
nextPeriodButton.addEventListener("click", nextPeriod);
resetGameButton.addEventListener("click", resetGame);

SPRK.setupTabs();
loadMatch();
refreshShared();
setInterval(loadMatch, 4000);
setInterval(refreshShared, 5000);
