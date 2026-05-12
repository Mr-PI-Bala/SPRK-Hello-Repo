const { test, expect } = require("@playwright/test");

test("QuizRoom baseline works", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto("/?test=1");
  await pageB.goto("/?test=1");
  await expect(pageA.getByRole("heading", { name: "QuizRoom" })).toBeVisible();

  await pageA.locator("#answer-input").fill("h1");
  await pageA.getByRole("button", { name: "Submit Answer" }).click();
  await expect(pageA.locator("#score-list")).toContainText("Maya-SPRK");

  await pageB.reload();
  await expect(pageB.locator("#score-list")).toContainText("Maya-SPRK");

  await pageA.getByRole("tab", { name: "Baseline Status" }).click();
  await expect(pageA.locator("#baselinePanel")).toContainText("Playwright is the current baseline validation mechanism");

  await contextA.close();
  await contextB.close();
});
