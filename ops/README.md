# SPRK Ops

This folder holds lightweight repository hygiene guidance for the student mission environment.

## Default Checks
Run from the repository root:

```bash
npm run setup:missions
npm run validate
```

For guided branch/PR work:

```bash
npm run workflow
```

## Hygiene Pass
Before committing:

- Confirm you are on a feature branch, not `main`.
- Confirm only intended files changed with `git status --short`.
- Keep `node_modules/`, `tests/artifacts/`, `output/`, `.env`, `.env.local`, Python caches, and browser artifacts out of commits.
- Keep mission-specific files under `missions/<mission>/`.
- Keep shared mission-readable baseline status under `missions/_shared/generated/`.
- Prefer clear ASCII status labels such as `[OK]` and `[FAIL]` in code and logs.

## Student Closeout Summary
Use three short sections when handing off work:

```markdown
Done
- What changed

State
- What passed or failed

Next
- What someone should try next
```
