# Changelog

## Unreleased
- Added Mission 10 Space Invaders as `10-SpaceInvaders-1P-nP`, including docs, Playwright coverage, and mission-runner wiring.
- Added a student-safe MERIT-to-SPRK AgenticOps guide that compares enterprise practices with the existing mission repository workflow.
- Added root `AGENTS.md` and `ops/README.md` as lightweight bootstrap and hygiene surfaces for students, agents, branches, and forks.
- Added `npm run validate` as the student-facing mission validation command and kept Playwright baseline validation passing at `9 / 9`.

## 0.1.11
- Reduced Mission 08 background chatter by removing the fixed `220ms` world polling loop and switching SoccerMatch to adaptive sync.
- Kept Mission 08 responsive by refreshing immediately after real local actions while using lighter background sync intervals for paused and live states.
- Revalidated SoccerMatch with `npm run test:soccermatch` after the sync behavior change.

## 0.1.10
- Fixed Mission 08 match ticking so `Start Match` actually starts live movement, ball motion, and clock updates instead of leaving the shared state paused forever.
- Fixed Mission 08 keyboard control flow so local player movement updates are delivered reliably after join and focus changes do not leave control state stuck.
- Hardened Mission 08 input handling and the SoccerMatch Playwright regression so the baseline now verifies that a joined player can start the match and physically move on the field.

## 0.1.9
- Fixed Mission 08 input handling so gameplay keys no longer interfere while students are typing team names or player names into form fields.
- Added explicit `Start Match` and `Pause Match` controls to Mission 08 so the live ball and clock do not begin until the class is ready.
- Added per-player color selection and avatar-shape selection for both the `WASD` player and the `Arrow` player in Mission 08.
- Kept Mission 08 validated with `npm run test:soccermatch` after the interaction changes.

## 0.1.8
- Added `missions/08-SoccerMatch-nP` as a real multiplayer soccer mission with a live shared field, joinable players, shared ball physics, team choice, and two local control schemes per device.
- Added Mission 08 student docs and code walkthrough so the new live-simulation pattern is documented alongside the existing browser-first mission structure.
- Wired Mission 08 into the repo menu, Playwright mission runner, mission-server helper, and baseline summary generation.
- Added `tests/soccermatch.spec.js` and re-ran the full baseline so the shared generated baseline status now reports `9 / 9` passing.

## 0.1.7
- Fixed the shared tab helper so `X-Ray Vision` and `Baseline Status` panels become visible correctly across missions that use the shared UI tabs.
- Fixed `QuizRoom` so the shared-state polling loop no longer clears the answer field while a student is typing the current question.
- Strengthened Playwright coverage for `PingPong`, `FlashCards`, and `QuizRoom` so tab visibility and the QuizRoom typing flow are validated directly.
- Added a retry path to the repo-level Playwright runner to make the sequential multi-mission baseline more resilient to transient startup failures.
- Re-ran the mission baseline checks and regenerated the shared baseline status files to a passing `8 / 8`.

## 0.1.6
- Updated `README.md` so `Start Here` steps 3, 4, and 5 link directly to the detailed local sections students should read next.
- Moved the branching diagram into the branch section where the workflow is explained.
- Added a quick branch-path summary with direct links for GitHub page, Codespaces browser, and VS Code desktop branch workflows.
- Added command explanations and quick use-case notes for the `Option A` and `Option B` branch methods, plus explanations for the stale-file sync commands.
- Added local `README.md` sections for choosing a mission, playing first, and making one small change so students have a clearer first-run path.

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
