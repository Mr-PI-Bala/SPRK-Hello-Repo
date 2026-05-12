const { test, expect } = require("@playwright/test");

test("PingPong baseline works", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto("/?test=1");
  await pageB.goto("/?test=1");
  await expect(pageA.getByRole("heading", { name: "PingPong" })).toBeVisible();

  await pageA.evaluate(async () => {
    await window.__sprkTest.finishRoundWithWinner("Left Player", 5, "Won 5:3");
  });

  await expect(pageA.locator("#score-list")).toContainText("Left Player");
  await pageB.reload();
  await expect(pageB.locator("#score-list")).toContainText("Left Player");

  await pageA.getByRole("tab", { name: "Baseline Status" }).click();
  await expect(pageA.locator("#baselinePanel")).toContainText("Playwright is the current baseline validation mechanism");

  await contextA.close();
  await contextB.close();
});
