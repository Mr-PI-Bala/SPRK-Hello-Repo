const fs = require("node:fs");
const path = require("node:path");

const missionCoverage = {
  all: [
    {
      mission: "ReactionRace",
      checks: [
        "Page renders and shared backend connects",
        "Deterministic score submission updates the shared scoreboard",
        "Two browser clients stay in sync on leaderboard order",
        "Clear scoreboard propagates across clients",
        "X-Ray Vision shows backend score events",
        "Offline scoreboard message appears when backend calls fail",
      ],
    },
    {
      mission: "SnakeGame",
      checks: [
        "Page renders and shared backend connects",
        "Player naming works",
        "Game state can be forced for deterministic score submission",
        "Two browser clients stay in sync on shared scores",
        "Baseline Status tab loads generated validation summary",
      ],
    },
    {
      mission: "PingPong",
      checks: [
        "Page renders and backend connects",
        "Deterministic winner submission updates the shared scoreboard",
        "Baseline Status tab loads generated validation summary",
      ],
    },
    {
      mission: "FlashCards",
      checks: [
        "Page renders and backend connects",
        "Deterministic streak submission updates the shared scoreboard",
        "Baseline Status tab loads generated validation summary",
      ],
    },
    {
      mission: "QuizRoom",
      checks: [
        "Page renders and shared question state loads",
        "Correct answer submission updates the shared scoreboard",
        "Baseline Status tab loads generated validation summary",
      ],
    },
    {
      mission: "FourSquare",
      checks: [
        "Page renders and shared board state loads",
        "Claim and rally actions update scores and state",
        "Baseline Status tab loads generated validation summary",
      ],
    },
    {
      mission: "SoccerScore",
      checks: [
        "Page renders and match state loads",
        "Goal reporting updates the shared event board",
        "Baseline Status tab loads generated validation summary",
      ],
    },
    {
      mission: "SoccerMatch",
      checks: [
        "Page renders and live field state loads",
        "A player can join the shared match",
        "A test goal updates the shared score",
        "X-Ray Vision and Baseline Status tabs load correctly",
      ],
    },
    {
      mission: "Space Invaders",
      checks: [
        "Page renders and dimensional game state loads",
        "The 55-alien fleet scores and accelerates as aliens are destroyed",
        "Bunker voxel damage updates shared mission state",
        "2D, 3D rail, and FPS modes preserve score and wave state",
        "X-Ray Vision and Baseline Status tabs load correctly",
      ],
    },
  ],
  reactionrace: [
    {
      mission: "ReactionRace",
      checks: [
        "Page renders and shared backend connects",
        "Deterministic score submission updates the shared scoreboard",
        "Two browser clients stay in sync on leaderboard order",
        "Clear scoreboard propagates across clients",
        "X-Ray Vision shows backend score events",
        "Offline scoreboard message appears when backend calls fail",
      ],
    },
  ],
  snakegame: [
    {
      mission: "SnakeGame",
      checks: [
        "Page renders and shared backend connects",
        "Player naming works",
        "Game state can be forced for deterministic score submission",
        "Two browser clients stay in sync on shared scores",
        "Baseline Status tab loads generated validation summary",
      ],
    },
  ],
  pingpong: [
    {
      mission: "PingPong",
      checks: [
        "Page renders and backend connects",
        "Deterministic winner submission updates the shared scoreboard",
        "Baseline Status tab loads generated validation summary",
      ],
    },
  ],
  flashcards: [
    {
      mission: "FlashCards",
      checks: [
        "Page renders and backend connects",
        "Deterministic streak submission updates the shared scoreboard",
        "Baseline Status tab loads generated validation summary",
      ],
    },
  ],
  quizroom: [
    {
      mission: "QuizRoom",
      checks: [
        "Page renders and shared question state loads",
        "Correct answer submission updates the shared scoreboard",
        "Baseline Status tab loads generated validation summary",
      ],
    },
  ],
  foursquare: [
    {
      mission: "FourSquare",
      checks: [
        "Page renders and shared board state loads",
        "Claim and rally actions update scores and state",
        "Baseline Status tab loads generated validation summary",
      ],
    },
  ],
  soccerscore: [
    {
      mission: "SoccerScore",
      checks: [
        "Page renders and match state loads",
        "Goal reporting updates the shared event board",
        "Baseline Status tab loads generated validation summary",
      ],
    },
  ],
  soccermatch: [
    {
      mission: "SoccerMatch",
      checks: [
        "Page renders and live field state loads",
        "A player can join the shared match",
        "A test goal updates the shared score",
        "X-Ray Vision and Baseline Status tabs load correctly",
      ],
    },
  ],
  spaceinvaders: [
    {
      mission: "Space Invaders",
      checks: [
        "Page renders and dimensional game state loads",
        "The 55-alien fleet scores and accelerates as aliens are destroyed",
        "Bunker voxel damage updates shared mission state",
        "2D, 3D rail, and FPS modes preserve score and wave state",
        "X-Ray Vision and Baseline Status tabs load correctly",
      ],
    },
  ],
};

function flattenSuites(suites, testCases = []) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const result = test.results && test.results.length > 0 ? test.results[test.results.length - 1] : null;
        const titleParts = [suite.title, spec.title, test.title].filter(Boolean);
        testCases.push({
          title: titleParts.join(" > ") || spec.file,
          status: result ? result.status : "unknown",
          durationMs: result ? result.duration : 0,
          file: spec.file,
        });
      }
    }

    flattenSuites(suite.suites || [], testCases);
  }

  return testCases;
}

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function writeFile(targetPath, contents) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, contents);
}

function main() {
  const mode = process.argv[2] || "all";
  const label = process.argv[3] || "SPRK Hello Repo Baseline";
  const repoRoot = path.resolve(__dirname, "..", "..");
  const resultsFiles = mode === "all"
    ? [
      path.join(repoRoot, "tests", "artifacts", "baseline-results", "reactionrace-results.json"),
      path.join(repoRoot, "tests", "artifacts", "baseline-results", "snakegame-results.json"),
      path.join(repoRoot, "tests", "artifacts", "baseline-results", "pingpong-results.json"),
      path.join(repoRoot, "tests", "artifacts", "baseline-results", "flashcards-results.json"),
      path.join(repoRoot, "tests", "artifacts", "baseline-results", "quizroom-results.json"),
      path.join(repoRoot, "tests", "artifacts", "baseline-results", "foursquare-results.json"),
      path.join(repoRoot, "tests", "artifacts", "baseline-results", "soccerscore-results.json"),
      path.join(repoRoot, "tests", "artifacts", "baseline-results", "soccermatch-results.json"),
      path.join(repoRoot, "tests", "artifacts", "baseline-results", "spaceinvaders-results.json"),
    ]
    : [path.join(repoRoot, "tests", "artifacts", "baseline-results", `${mode}-results.json`)];
  const cases = resultsFiles.flatMap((resultsPath) => {
    const rawResults = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
    return flattenSuites(rawResults.suites || []);
  });
  const generatedAt = new Date().toISOString();
  const passed = cases.filter((testCase) => testCase.status === "passed").length;
  const failed = cases.filter((testCase) => testCase.status !== "passed").length;
  const status = failed === 0 ? "passed" : "failed";

  const summary = {
    baselineName: label,
    mode,
    runner: "Playwright",
    baselinePolicy: "Playwright is the current baseline validation mechanism for browser-first SPRK missions. Additional or replacement baseline validators are allowed later.",
    generatedAt,
    generatedAtLabel: formatTimestamp(generatedAt),
    status,
    passed,
    failed,
    total: cases.length,
    htmlReportPath: "tests/artifacts/playwright-report/index.html",
    resultsJsonPath: "tests/artifacts/results/results.json",
    checks: missionCoverage[mode] || [],
    tests: cases,
  };

  const jsonText = JSON.stringify(summary, null, 2);
  const htmlText = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${summary.baselineName}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #101820;
        --panel: #162331;
        --panel-strong: #1f3448;
        --text: #f2f7fb;
        --muted: #a9bac8;
        --accent: #1fb6ff;
        --go: #1fc76a;
        --danger: #ff5c7a;
        --border: #30485c;
      }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: var(--bg); color: var(--text); }
      main { width: min(1080px, calc(100% - 28px)); margin: 0 auto; padding: 20px 0 28px; }
      section { margin-bottom: 14px; padding: 16px; border: 1px solid var(--border); background: var(--panel); }
      h1, h2, h3, p { margin-top: 0; }
      .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .card { padding: 12px; background: var(--panel-strong); }
      .ok { color: var(--go); }
      .bad { color: var(--danger); }
      ul { margin: 0; padding-left: 18px; }
      li { margin-bottom: 8px; }
      code { color: var(--text); }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 10px; border-bottom: 1px solid var(--border); }
      .passed { color: var(--go); font-weight: 700; }
      .failed { color: var(--danger); font-weight: 700; }
      @media (max-width: 820px) { .summary { grid-template-columns: 1fr 1fr; } }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>${summary.baselineName}</h1>
        <p>${summary.baselinePolicy}</p>
      </section>
      <section class="summary">
        <div class="card"><strong>Status</strong><p class="${summary.status === "passed" ? "ok" : "bad"}">${summary.status.toUpperCase()}</p></div>
        <div class="card"><strong>Generated</strong><p>${summary.generatedAtLabel}</p></div>
        <div class="card"><strong>Tests</strong><p>${summary.passed} passed / ${summary.total} total</p></div>
        <div class="card"><strong>Report</strong><p><code>${summary.htmlReportPath}</code></p></div>
      </section>
      <section>
        <h2>What Was Validated</h2>
        ${summary.checks.map((group) => `<h3>${group.mission}</h3><ul>${group.checks.map((item) => `<li>${item}</li>`).join("")}</ul>`).join("")}
      </section>
      <section>
        <h2>Test Results</h2>
        <table>
          <thead>
            <tr><th>Test</th><th>Status</th><th>Duration</th></tr>
          </thead>
          <tbody>
            ${summary.tests.map((testCase) => `<tr><td>${testCase.title}</td><td class="${testCase.status === "passed" ? "passed" : "failed"}">${testCase.status}</td><td>${testCase.durationMs} ms</td></tr>`).join("")}
          </tbody>
        </table>
      </section>
    </main>
  </body>
</html>`;

  writeFile(path.join(repoRoot, "tests", "artifacts", "results", "latest-status.json"), jsonText);
  writeFile(path.join(repoRoot, "missions", "_shared", "generated", "baseline-status.json"), jsonText);
  writeFile(path.join(repoRoot, "missions", "_shared", "generated", "baseline-status.html"), htmlText);
}

main();
