# Changelog

## 0.1.3
- Added `missions/XX-Template-nP` as the canonical browser-first mission template.
- Moved the template mission guide and walkthrough into the mission folder where they belong.
- Removed tracked empty root placeholder files (`app.js`, `index.html`, `server.py`, `styles.css`, `MISSION_GUIDE.md`, `CODE_WALKTHROUGH.md`).
- Updated the repo README with the template mission path and the clean-folder rule.

## 0.1.2
- Expanded the baseline validation harness to all seven SPRK hello missions.
- Added `Baseline Status` as the third stable tab across the remaining browser-first mission UIs.
- Added mission-specific Playwright suites for `PingPong`, `FlashCards`, `QuizRoom`, `FourSquare`, and `SoccerScore`.
- Kept Playwright reports and generated validation artifacts under the `tests/` workspace while preserving shared mission-readable baseline files.

## 0.1.1
- Added baseline validation for `ReactionRace` and `SnakeGame`.
- Added the shared `Baseline Status` tab pattern alongside `RealTime` and `X-Ray Vision`.
- Added root hygiene rules for `.env`, `node_modules`, Playwright artifacts, and Python caches.
- Added baseline validation and 3C flow documentation.

## 0.1.0
- Tagged `Build SPRK hello missions` as the first student-facing baseline.
- Established the initial set of browser-first SPRK hello missions for classroom use.
