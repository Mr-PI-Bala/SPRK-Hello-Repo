const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const modes = {
  reactionrace: {
    mission: "reactionrace",
    baseUrl: "http://127.0.0.1:8000",
    specs: ["tests/reactionrace.spec.js"],
    label: "ReactionRace Baseline",
  },
  snakegame: {
    mission: "snakegame",
    baseUrl: "http://127.0.0.1:8002",
    specs: ["tests/snakegame.spec.js"],
    label: "SnakeGame Baseline",
  },
  pingpong: {
    mission: "pingpong",
    baseUrl: "http://127.0.0.1:8003",
    specs: ["tests/pingpong.spec.js"],
    label: "PingPong Baseline",
  },
  flashcards: {
    mission: "flashcards",
    baseUrl: "http://127.0.0.1:8004",
    specs: ["tests/flashcards.spec.js"],
    label: "FlashCards Baseline",
  },
  quizroom: {
    mission: "quizroom",
    baseUrl: "http://127.0.0.1:8005",
    specs: ["tests/quizroom.spec.js"],
    label: "QuizRoom Baseline",
  },
  foursquare: {
    mission: "foursquare",
    baseUrl: "http://127.0.0.1:8006",
    specs: ["tests/foursquare.spec.js"],
    label: "FourSquare Baseline",
  },
  soccerscore: {
    mission: "soccerscore",
    baseUrl: "http://127.0.0.1:8007",
    specs: ["tests/soccerscore.spec.js"],
    label: "SoccerScore Baseline",
  },
  soccermatch: {
    mission: "soccermatch",
    baseUrl: "http://127.0.0.1:8008",
    specs: ["tests/soccermatch.spec.js"],
    label: "SoccerMatch Baseline",
  },
  spaceinvaders: {
    mission: "spaceinvaders",
    baseUrl: "http://127.0.0.1:8010",
    specs: ["tests/spaceinvaders.spec.js"],
    label: "Space Invaders Baseline",
  },
};

function runSingle(mode, selected) {
  const env = {
    ...process.env,
    SPRK_MISSION: selected.mission,
    PLAYWRIGHT_BASE_URL: selected.baseUrl,
  };
  const repoRoot = path.resolve(__dirname, "..", "..");
  const args = [
    "test",
    ...selected.specs,
    "--config=tests/playwright.config.js",
  ];
  const playwrightBin = path.join(repoRoot, "node_modules", ".bin", "playwright.cmd");

  const testRun = spawnSync("cmd.exe", ["/c", playwrightBin, ...args], {
    cwd: repoRoot,
    env,
    stdio: "inherit",
    shell: false,
  });

  if (testRun.error) {
    console.error(testRun.error.message);
    return {
      testStatus: 1,
      summaryStatus: 1,
    };
  }

  const resultsPath = path.join(repoRoot, "tests", "artifacts", "results", "results.json");
  const archivedResultsPath = path.join(repoRoot, "tests", "artifacts", "baseline-results", `${mode}-results.json`);
  if (testRun.status !== null && testRun.status !== undefined && fs.existsSync(resultsPath)) {
    fs.mkdirSync(path.dirname(archivedResultsPath), { recursive: true });
    fs.copyFileSync(resultsPath, archivedResultsPath);
  }

  if (!fs.existsSync(archivedResultsPath)) {
    console.error(`Expected Playwright results at ${archivedResultsPath}, but no JSON report was generated.`);
    return {
      testStatus: testRun.status || 1,
      summaryStatus: 1,
    };
  }

  const summaryRun = spawnSync("node", [
    "tests/helpers/write-baseline-status.js",
    mode,
    selected.label,
  ], {
    cwd: repoRoot,
    env,
    stdio: "inherit",
    shell: false,
  });

  return {
    testStatus: testRun.status || 0,
    summaryStatus: summaryRun.status || 0,
  };
}

function sleepMs(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function runSingleWithRetry(mode, selected) {
  const first = runSingle(mode, selected);
  if (!first.testStatus && !first.summaryStatus) {
    return first;
  }

  console.warn(`Retrying ${mode} baseline after an initial failure.`);
  sleepMs(3_000);
  return runSingle(mode, selected);
}

function main() {
  const mode = process.argv[2] || "all";

  if (mode === "all") {
    const orderedModes = ["reactionrace", "snakegame", "pingpong", "flashcards", "quizroom", "foursquare", "soccerscore", "soccermatch", "spaceinvaders"];
    const runs = orderedModes.map((name) => ({ name, result: runSingleWithRetry(name, modes[name]) }));
    const combinedSummaryRun = spawnSync("node", [
      "tests/helpers/write-baseline-status.js",
      "all",
      "SPRK Hello Repo Baseline",
    ], {
      cwd: path.resolve(__dirname, "..", ".."),
      env: process.env,
      stdio: "inherit",
      shell: false,
    });

    const exitCode = runs.reduce((acc, run) => acc || run.result.testStatus || run.result.summaryStatus, 0) || combinedSummaryRun.status || 0;
    process.exit(exitCode);
  }

  const selected = modes[mode];
  if (!selected) {
    console.error(`Unknown mode "${mode}". Expected one of: all, ${Object.keys(modes).join(", ")}`);
    process.exit(1);
  }

  const result = runSingle(mode, selected);
  process.exit(result.testStatus || result.summaryStatus || 0);
}

main();
