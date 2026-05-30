# SPRK Ops

This folder holds lightweight repository hygiene guidance for the student mission environment.

## Default checks

Run from the repository root:

```bash
npm run setup:missions
npm run validate
```

## Hygiene pass

Before committing:

- Confirm you are on your own branch.
- Confirm only intended files changed with `git status --short`.
- Keep `node_modules/`, `tests/artifacts/`, `output/`, `.env`, `.env.local`, Python caches, and browser artifacts out of commits.
- Keep mission-specific files under `missions/<NN-GameName-mode>/` (see [MERIT.instructions](../MERIT.instructions)).
- Keep shared mission-readable baseline status under `missions/_shared/generated/`.
- Prefer ASCII status labels such as `[OK]` and `[FAIL]` in code and logs.

## Student closeout summary

Use three short sections when handing off work:

```markdown
Done
- What changed

State
- What passed or failed

Next
- What someone should try next
```

See also [AgentDraven.instructions](../AgentDraven.instructions).
