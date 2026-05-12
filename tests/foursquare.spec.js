const { test, expect } = require("@playwright/test");

test("FourSquare baseline works", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto("/");
  await pageB.goto("/");
  await expect(pageA.getByRole("heading", { name: "FourSquare" })).toBeVisible();

  await pageA.getByRole("button", { name: "Claim" }).first().click();
  await pageA.getByRole("button", { name: "Win Rally" }).first().click();
  await expect(pageA.locator("#score-list")).toContainText("Maya-SPRK");

  await pageB.reload();
  await expect(pageB.locator("#score-list")).toContainText("Maya-SPRK");

  await pageA.getByRole("tab", { name: "Baseline Status" }).click();
  await expect(pageA.locator("#baselinePanel")).toContainText("Playwright is the current baseline validation mechanism");

  await contextA.close();
  await contextB.close();
});
