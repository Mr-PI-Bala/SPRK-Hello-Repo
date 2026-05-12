const { test, expect } = require("@playwright/test");

async function openReactionRace(page) {
  await page.goto("/?test=1");
  await expect(page.getByRole("heading", { name: "ReactionRace" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Round" })).toBeVisible();
  await expect(page.locator("#scoreboardStatus")).toContainText("Shared scoreboard connected.");
}

async function setPlayerName(page, name) {
  await page.locator("#playerName").fill(name);
  await page.getByRole("button", { name: "Use Name" }).click();
  await expect(page.locator("#roundMessage")).toContainText(`Player name set to ${name}.`);
}

async function submitDeterministicScore(page, reactionTimeMs) {
  await page.evaluate(async (reactionTime) => {
    window.__sprkTest.forceReadyRound(reactionTime);
    await window.__sprkTest.recordKnownTap(reactionTime);
  }, reactionTimeMs);
  await expect(page.locator("#roundMessage")).toContainText(`${reactionTimeMs} ms`);
}

test("ReactionRace supports shared multiplayer scoreboard and x-ray events", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await openReactionRace(pageA);
  await openReactionRace(pageB);

  await setPlayerName(pageA, "AgentAlpha");
  await submitDeterministicScore(pageA, 240);

  await expect(pageA.locator("#scoreList")).toContainText("AgentAlpha");
  await expect(pageA.locator("#scoreList")).toContainText("240 ms");
  await expect(pageA.locator("#bestTime")).toContainText("AgentAlpha 240 ms");

  await pageB.reload();
  await expect(pageB.locator("#scoreList")).toContainText("AgentAlpha");
  await expect(pageB.locator("#scoreList")).toContainText("240 ms");

  await setPlayerName(pageB, "AgentBeta");
  await submitDeterministicScore(pageB, 120);

  await expect(pageB.locator("#bestTime")).toContainText("AgentBeta 120 ms");
  await expect(pageB.locator("#scoreList li").first()).toContainText("AgentBeta");
  await expect(pageB.locator("#scoreList li").nth(1)).toContainText("AgentAlpha");

  await pageA.reload();
  await expect(pageA.locator("#scoreList li").first()).toContainText("AgentBeta");
  await expect(pageA.locator("#scoreList li").nth(1)).toContainText("AgentAlpha");

  await pageA.getByRole("tab", { name: "X-Ray Vision" }).click();
  await expect(pageA.locator("#eventList")).toContainText("server: started on port 8000");
  await expect(pageA.locator("#eventList")).toContainText("AgentAlpha reacted in 240 ms");
  await expect(pageA.locator("#eventList")).toContainText("AgentBeta reacted in 120 ms");

  await pageA.getByRole("button", { name: "Clear" }).click();
  await expect(pageA.locator("#scoreboardStatus")).toContainText("cleared");
  await expect(pageA.locator("#scoreList li")).toHaveCount(0);

  await pageB.reload();
  await expect(pageB.locator("#scoreList li")).toHaveCount(0);
  await expect(pageB.locator("#bestTime")).toContainText("none yet");

  await contextA.close();
  await contextB.close();
});

test("ReactionRace shows an offline message when the backend calls fail", async ({ page }) => {
  await page.route("**/api/scores", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/?test=1");
  await expect(page.locator("#scoreboardStatus")).toContainText("Shared scoreboard offline.");
});
