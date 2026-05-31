const { test, expect } = require("@playwright/test");

test("Space Invaders dimensional shift baseline works", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto("/?test=1");
  await expect(pageA.getByRole("heading", { name: "Space Invaders: In 2D, 2.5D, 3D and FPS" })).toBeVisible();
  await expect(pageA.locator(".lede")).toContainText("Only 2D is enabled by default");

  const initial = await pageA.evaluate(async () => window.__sprkTest.resetGame());
  expect(initial.mode).toBe("2d");
  expect(initial.aliveCount).toBe(55);
  expect(initial.score).toBe(0);
  expect(initial.lives).toBe(3);
  expect(initial.maxLives).toBe(3);
  expect(initial.bunkerCells).toBeGreaterThan(0);

  await pageA.getByRole("button", { name: "Start / Resume" }).focus();
  await pageA.keyboard.press("Space");
  const afterButtonSpace = await pageA.evaluate(() => window.__sprkTest.getState());
  expect(afterButtonSpace.running).toBe(false);
  expect(afterButtonSpace.status).toBe("Ready");

  const tenLifeState = await pageA.evaluate(async () => window.__sprkTest.setLivesForTest(12));
  expect(tenLifeState.lives).toBe(10);
  expect(tenLifeState.maxLives).toBe(10);

  const afterImpact = await pageA.evaluate(async () => window.__sprkTest.loseLifeForTest());
  expect(afterImpact.lives).toBe(9);
  expect(afterImpact.playerImpactActive).toBe(true);

  const afterAlien = await pageA.evaluate(async () => window.__sprkTest.destroyFirstAlienForTest());
  expect(afterAlien.score).toBe(30);
  expect(afterAlien.floatingTextCount).toBeGreaterThan(0);
  expect(afterAlien.aliveCount).toBe(54);
  expect(afterAlien.fleetInterval).toBeLessThan(initial.fleetInterval);

  const afterBunker = await pageA.evaluate(async () => window.__sprkTest.hitFirstBunkerForTest());
  expect(afterBunker.bunkerCells).toBe(afterAlien.bunkerCells - 1);

  const railState = await pageA.evaluate(async () => window.__sprkTest.shiftToLateral());
  expect(railState.mode).toBe("lateral3d");
  expect(railState.score).toBe(30);
  expect(railState.railTiltDegrees).toBeLessThanOrEqual(railState.railTiltMaxDegrees);
  expect(railState.railTiltMaxDegrees).toBe(70);
  expect(railState.railRowGap).toBeGreaterThan(12);
  expect(railState.overviewVisible).toBe(true);

  const fpsState = await pageA.evaluate(async () => window.__sprkTest.enterFps());
  expect(fpsState.mode).toBe("fps");
  expect(fpsState.overviewVisible).toBe(true);
  const lookedState = await pageA.evaluate(async () => window.__sprkTest.lookForTest(20, -6));
  expect(lookedState.player.yaw).not.toBe(fpsState.player.yaw);

  const afterFpsShot = await pageA.evaluate(async () => window.__sprkTest.fireAtFirstAlienForTest());
  expect(afterFpsShot.mode).toBe("fps");
  expect(afterFpsShot.score).toBeGreaterThan(30);
  expect(afterFpsShot.aliveCount).toBe(53);

  await expect(pageA.locator("#score-list")).toContainText("Maya-SPRK");
  await pageA.getByRole("tab", { name: "X-Ray Vision" }).click();
  await expect(pageA.locator("#event-log")).toContainText("destroyed");

  await pageB.goto("/?test=1");
  await expect.poll(async () => {
    const snapshot = await pageB.evaluate(() => window.__sprkTest.getState());
    return {
      mode: snapshot.mode,
      score: snapshot.score,
      aliveCount: snapshot.aliveCount,
    };
  }).toEqual({
    mode: "fps",
    score: afterFpsShot.score,
    aliveCount: 53,
  });

  await pageA.getByRole("tab", { name: "Baseline Status" }).click();
  await expect(pageA.locator("#baselinePanel")).toBeVisible();
  await expect(pageA.locator("#baselinePanel")).toContainText("Playwright is the current baseline validation mechanism");

  await contextA.close();
  await contextB.close();
});
