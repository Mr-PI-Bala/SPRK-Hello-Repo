const { test, expect } = require("@playwright/test");

test("FlashCards baseline works", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto("/?test=1");
  await pageB.goto("/?test=1");
  await expect(pageA.getByRole("heading", { name: "FlashCards" })).toBeVisible();

  await pageA.evaluate(() => {
    window.__sprkTest.setStreak(4);
  });
  await pageA.getByRole("button", { name: "Submit Streak" }).click();

  await expect(pageA.locator("#score-list")).toContainText("4");
  await pageB.reload();
  await expect(pageB.locator("#score-list")).toContainText("4");

  await pageA.getByRole("tab", { name: "X-Ray Vision" }).click();
  await expect(pageA.locator("#xrayPanel")).toBeVisible();
  await expect(pageA.locator("#event-log")).toContainText("FlashCards");

  await pageA.getByRole("tab", { name: "Baseline Status" }).click();
  await expect(pageA.locator("#baselinePanel")).toBeVisible();
  await expect(pageA.locator("#baselinePanel")).toContainText("Playwright is the current baseline validation mechanism");

  await contextA.close();
  await contextB.close();
});
