const { test, expect } = require("@playwright/test");

test("SoccerScore baseline works", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto("/");
  await pageB.goto("/");
  await expect(pageA.getByRole("heading", { name: "SoccerScore" })).toBeVisible();

  await pageA.getByRole("button", { name: "Home Goal" }).click();
  await expect(pageA.locator("#score-list")).toContainText("Blue Team");

  await pageB.reload();
  await expect(pageB.locator("#score-list")).toContainText("Blue Team");

  await pageA.getByRole("tab", { name: "Baseline Status" }).click();
  await expect(pageA.locator("#baselinePanel")).toContainText("Playwright is the current baseline validation mechanism");

  await contextA.close();
  await contextB.close();
});
