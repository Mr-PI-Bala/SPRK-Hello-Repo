# SPRK Agent Guide

This repo uses a student-safe subset of MERIT AgenticOps practices. The private MERIT instruction vault remains private; do not copy private instruction text, secrets, or operator-only paths into this public/student repository.

## Read order

1. `README.md` for the student workflow and mission menu.
2. `docs/SPRK_Student_AgenticOps_Guide.md` for the MERIT-to-SPRK practice mapping.
3. `docs/SPRK_Browser_Mission_Foundation_Guide.md` for the shared mission architecture.
4. The selected mission guide under `missions/<mission>/docs/MISSION_GUIDE.md`.
5. `docs/BASELINE_VALIDATION_AND_3C_FLOW.md` for validation status flow.

## Repository shape

- Keep the existing SPRK classroom layout: `missions/`, `missions/_shared/`, `tests/`, `docs/`, `.devcontainer/`, `.github/workflows/`, and `ops/`.
- Do not rename `docs/` to a MERIT `{Name} docs/` folder in this student repo; the current path is already linked throughout the curriculum.
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
- Push the branch so students, reviewers, and GitHub Actions see the same state.

## Student-safe MERIT principles

- Single source of truth: one clear guide for each topic; link instead of duplicating long explanations.
- Validation before confidence: mission changes should pass the Playwright baseline before being considered ready.
- Secrets stay local: use `.env.local` for local secrets if a future mission needs them; commit only `.env.example` templates.
- No hard-coded machine paths: use relative paths and repo helpers so forks, branches, Codespaces, and local clones work.
- Recovery over mystery: errors, docs, and test failures should tell students what to try next.
