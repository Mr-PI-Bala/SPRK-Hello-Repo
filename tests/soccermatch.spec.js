const { test, expect } = require("@playwright/test");

test("SoccerMatch baseline works", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto("/?test=1");
  await pageB.goto("/?test=1");
  await expect(pageA.getByRole("heading", { name: "SoccerMatch" })).toBeVisible();

  await pageA.evaluate(async () => {
    await window.__sprkTest.joinForTest("Maya", "home", "wasd");
  });
  await expect(pageA.locator("#roster-list")).toContainText("Maya");

  await pageB.reload();
  await expect(pageB.locator("#roster-list")).toContainText("Maya");

  await pageA.evaluate(async () => {
    await window.__sprkTest.goalForTest("home");
  });
  await expect(pageA.locator("#scoreboard-inline")).toContainText("1 : 0");

  const movement = await pageA.evaluate(async () => {
    const firstSnapshot = await window.__sprkTest.getState();
    const player = firstSnapshot.players.find((entry) => entry.name === "Maya");
    await window.__sprkTest.startMatch();
    await window.__sprkTest.sendInput(player.id, {
      moveX: 1,
      moveY: 0,
      turnDirection: 0,
      kickPressed: false,
    });
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const secondSnapshot = await window.__sprkTest.getState();
    const updated = secondSnapshot.players.find((entry) => entry.id === player.id);
    return {
      beforeX: player.x,
      afterX: updated.x,
      matchSeconds: secondSnapshot.matchSeconds,
    };
  });
  expect(movement.afterX).toBeGreaterThan(movement.beforeX);
  expect(movement.matchSeconds).toBeGreaterThan(0);

  await pageA.getByRole("tab", { name: "X-Ray Vision" }).click();
  await expect(pageA.locator("#xrayPanel")).toBeVisible();
  await expect(pageA.locator("#event-log")).toContainText("joined");

  await pageA.getByRole("tab", { name: "Baseline Status" }).click();
  await expect(pageA.locator("#baselinePanel")).toBeVisible();
  await expect(pageA.locator("#baselinePanel")).toContainText("Playwright is the current baseline validation mechanism");

  await contextA.close();
  await contextB.close();
});
