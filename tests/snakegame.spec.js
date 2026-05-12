const { test, expect } = require("@playwright/test");

async function openSnakeGame(page) {
  await page.goto("/?test=1");
  await expect(page.getByRole("heading", { name: "SnakeGame" })).toBeVisible();
  await expect(page.locator("#sharedStatus")).toContainText("Connecting", { timeout: 15_000 });
}

async function setPlayerName(page, name) {
  await page.locator("#playerName").fill(name);
  await page.getByRole("button", { name: "Use Name" }).click();
  await expect(page.locator("#roundMessage")).toContainText(`Player set to ${name}.`);
}

async function submitDeterministicScore(page, points) {
  await page.evaluate((score) => {
    window.__sprkTest.setScore(score);
  }, points);
  await page.getByRole("button", { name: "Submit Score" }).click();
}

test("SnakeGame supports shared scores and baseline status", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await openSnakeGame(pageA);
  await openSnakeGame(pageB);

  await setPlayerName(pageA, "SnakeAlpha");
  await submitDeterministicScore(pageA, 30);
  await expect(pageA.locator("#scoreList")).toContainText("SnakeAlpha");
  await expect(pageA.locator("#scoreList")).toContainText("30");

  await pageB.reload();
  await expect(pageB.locator("#scoreList")).toContainText("SnakeAlpha");

  await setPlayerName(pageB, "SnakeBeta");
  await submitDeterministicScore(pageB, 60);
  await expect(pageB.locator("#scoreList li").first()).toContainText("SnakeBeta");

  await pageA.reload();
  await expect(pageA.locator("#scoreList li").first()).toContainText("SnakeBeta");

  await pageA.getByRole("tab", { name: "Baseline Status" }).click();
  await expect(pageA.locator("#baselinePanel")).toContainText("Playwright is the current baseline validation mechanism");
  await expect(pageA.locator("#baselinePanel")).toContainText("baseline-status.html");

  await pageA.getByRole("button", { name: "Clear" }).click();
  await expect(pageA.locator("#scoreList li")).toHaveCount(0);

  await contextA.close();
  await contextB.close();
});
