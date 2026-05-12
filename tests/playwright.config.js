const { defineConfig } = require("@playwright/test");
const path = require("node:path");

module.exports = defineConfig({
  testDir: path.resolve(__dirname),
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  outputDir: path.join(__dirname, "artifacts", "run-output"),
  reporter: [
    ["list"],
    ["html", { outputFolder: path.join(__dirname, "artifacts", "playwright-report"), open: "never" }],
    ["json", { outputFile: path.join(__dirname, "artifacts", "results", "results.json") }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8000",
    headless: true,
    trace: "on-first-retry",
  },
  webServer: {
    command: "node helpers/start-mission-server.js",
    url: `${process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8000"}/api/scores`,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 60_000,
  },
});
