# SPRK Agent Guide

This repo uses a student-safe subset of MERIT AgenticOps practices. The private MERIT instruction vault remains private; do not copy private instruction text, secrets, or operator-only paths into this repository.

## Read order

1. `README.md` for the student workflow and mission menu.
2. `docs/README.md` for the documentation hub (all repo guides).
3. `MERIT.instructions` for mission naming, branch/PR governance, and repository rules (agent governance — not student doc link syntax).
4. `docs/SPRK_Documentation_Links_Guide.md` when editing docs: portable Markdown links plus `[[wikilink]] (obsidian)` for section references.
5. `docs/SPRK_Student_AgenticOps_Guide.md` for the MERIT-to-SPRK practice mapping.
6. `AgentDraven.instructions` for classroom mentor tone and handoff format.
7. `docs/SPRK_Browser_Mission_Foundation_Guide.md` for the shared mission architecture.
8. Facilitator hosting when needed: `docs/SPRK_Facilitator_Guide.md`, `docs/SPRK_Cloud_Facilitator_Hosting_Guide.md`, `docs/SPRK_Touch_Control_Guide.md`.
9. The selected mission guide under `missions/<NN-GameName-mode>/docs/MISSION_GUIDE.md`.
10. `docs/BASELINE_VALIDATION_AND_3C_FLOW.md` for validation status flow.

## Branch and PR governance

One task equals one named branch and one PR. Do not create a second branch or PR for the same task unless the first one is explicitly abandoned. Follow-up fixes, conflict resolution, validation refreshes, and review edits all go back to the canonical task branch.

If multiple PRs appear for the same task:

1. Pick the canonical PR.
2. Move any useful missing changes into that branch.
3. Close the duplicate PRs.
4. Report the canonical branch/PR in handoff.

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
- Confirm work is on the canonical task branch/PR.
- Commit with a clear conventional-style message such as `docs: add student AgenticOps guide` or `test: refresh mission baseline`.
- Push the branch so students, reviewers, and CI see the same state.

## Student-safe MERIT principles

- Single source of truth: one clear guide for each topic; link instead of duplicating long explanations.
- Validation before confidence: mission changes should pass the Playwright baseline before being considered ready.
- Secrets stay local: use `.env.local` for local secrets if a future mission needs them; commit only `.env.example` templates.
- No hard-coded machine paths: use relative paths and repo helpers so forks, branches, Codespaces, and local clones work.
- Recovery over mystery: errors, docs, and test failures should tell students what to try next.
