# Changelog

## 0.1.5
- Added `docs/SPRK_Browser_Mission_Foundation_Guide.md` to hold the common browser-mission pattern at the repo level.
- Trimmed repeated mission-guide sections so mission docs point to shared foundations and keep only mission-specific differences locally.
- Kept the template aligned with the shared foundation-guide approach.

## 0.1.4
- Moved the X-Ray event ID and incremental event rendering pattern into the shared backend/frontend helpers so all missions inherit it.
- Updated `ReactionRace` to use the shared X-Ray helper path instead of keeping a mission-only implementation.
- Restored the robust `tests/helpers/write-baseline-status.js` CLI flow so repo-level baseline status generation works again.
- Kept one canonical `docs/SPRK_Language_Crosswalk.md` and removed the duplicate `docs/SPRK_Language_Crosswalk_Complete.md`.
- Added language crosswalk callouts to each mission guide and to the `XX-Template-nP` scaffold.
- Re-ran the full baseline suite and regenerated the shared baseline status files.

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
