# SPRK Agent Guide

This repo uses a student-safe subset of agentic development practices. Keep this file practical, public, and classroom-friendly. Do not copy private instruction vault text, secrets, or operator-only paths into this repository.

## Read Order
1. `README.md` for the student workflow and mission menu.
2. `docs/SPRK_Guided_Workflow_Helper.md` for the guided branch/PR helper.
3. `docs/SPRK_Student_AgenticOps_Guide.md` for student-safe agentic habits.
4. `docs/SPRK_Browser_Mission_Foundation_Guide.md` for shared mission architecture.
5. The selected mission guide under `missions/<mission>/docs/MISSION_GUIDE.md`.
6. `docs/BASELINE_VALIDATION_AND_3C_FLOW.md` for baseline status flow.

## Repository Shape
- Keep classroom missions under `missions/`.
- Keep shared browser/backend helpers under `missions/_shared/`.
- Keep mission-specific files inside their mission folder.
- Keep repo-wide guides under `docs/`.
- Keep Playwright tests under `tests/`.
- Keep lightweight operations notes under `ops/`.
- Keep generated Playwright artifacts under `tests/artifacts/`.
- Keep shared mission-readable baseline files under `missions/_shared/generated/`.

## Current Mission 10 Path
Mission 10 uses the standard mode suffix:

```text
missions/10-SpaceInvaders-1P-nP
```

## Setup And Validation
Use the inherited setup and validation commands:

```bash
npm run setup:missions
npm run validate
```

Use the guided workflow helper when teaching or practicing branch/PR flow:

```bash
npm run workflow
```

## Closeout Checklist
- Confirm `git status --short` contains only intended files.
- Confirm no `.env`, `.env.local`, `node_modules/`, `tests/artifacts/`, `output/`, Python caches, or browser artifacts are staged.
- Run targeted validation for mission changes, or `npm run validate` for broad changes.
- Commit with a clear message.
- Push the branch and create or update the PR.

## Student-Safe Principles
- Single source of truth: link to existing guides instead of duplicating long explanations.
- Validation before confidence: mission changes should pass Playwright baseline checks.
- Secrets stay local: use `.env.local` for local secrets; commit only safe examples.
- No hard-coded machine paths: prefer repo-relative paths.
- Recovery over mystery: errors and docs should tell students what to try next.
