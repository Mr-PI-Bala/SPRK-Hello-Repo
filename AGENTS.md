# SPRK Agent Guide

This repo uses a student-safe subset of MERIT AgenticOps practices. The private MERIT instruction vault remains private; do not copy private instruction text, secrets, or operator-only paths into this repository.

## Read order

1. `README.md` for the student workflow and mission menu.
2. `MERIT.instructions` for canonical mission folder naming (`NN-GameName-<mode-label>`).
3. `docs/SPRK_Student_AgenticOps_Guide.md` for the MERIT-to-SPRK practice mapping.
4. `AgentDraven.instructions` for classroom mentor tone and handoff format.
5. `docs/SPRK_Browser_Mission_Foundation_Guide.md` for the shared mission architecture.
6. The selected mission guide under `missions/<NN-GameName-mode>/docs/MISSION_GUIDE.md`.
7. `docs/BASELINE_VALIDATION_AND_3C_FLOW.md` for validation status flow.

## Repository shape

- Keep the SPRK classroom layout: `missions/`, `missions/_shared/`, `tests/`, `docs/`, and `ops/`.
- One mission, one folder under `missions/` — see `MERIT.instructions` (no duplicate paths such as `10-Space-Invaders` and `10-SpaceInvaders-1P-nP`).
- Do not rename `docs/` to a MERIT `{Name} docs/` folder; curriculum links depend on `docs/`.
- Keep mission-specific files inside their mission folder. Do not add mission app files to the repository root.
- Keep generated Playwright artifacts under `tests/artifacts/` and shared mission-readable baseline files under `missions/_shared/generated/`.

## Validation and closeout

Run these before handing off changes:

```bash
npm run setup:missions
npm run validate
```

Closeout checklist:

- Confirm `git status --short` contains only intended files.
- Confirm no `.env`, `.env.local`, `node_modules/`, `tests/artifacts/`, `output/`, Python caches, or browser artifacts are staged.
- Commit with a clear conventional-style message such as `docs: add student AgenticOps guide` or `test: refresh mission baseline`.
- Push the branch so students, reviewers, and CI see the same state.

## Student-safe MERIT principles

- Single source of truth: one clear guide for each topic; link instead of duplicating long explanations.
- Validation before confidence: mission changes should pass the Playwright baseline before being considered ready.
- Secrets stay local: use `.env.local` for local secrets if a future mission needs them; commit only `.env.example` templates.
- No hard-coded machine paths: use relative paths and repo helpers so forks, branches, Codespaces, and local clones work.
- Recovery over mystery: errors, docs, and test failures should tell students what to try next.

## Cursor Cloud specific instructions

- **Python:** mission servers use `python server.py` in helpers; set `export PYTHON=python3` on Linux if `python` is not installed.
- **Tests:** `npm run validate` runs all mission baselines; use `npm run test:spaceinvaders` (etc.) for a single mission.
- **Long-running servers:** use a named tmux session when starting `python3 server.py` manually for browser demos.
- **Playwright:** `tests/playwright.config.js` starts the backend via `tests/helpers/start-mission-server.js` using `SPRK_MISSION` and `PLAYWRIGHT_BASE_URL`.
