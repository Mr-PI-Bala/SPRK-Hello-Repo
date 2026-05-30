# SPRK Student AgenticOps Guide

This guide translates MERIT AgenticOps practices into a classroom-friendly shape for `SPRK-Hello-Repo`.

The full MERIT instruction file is an enterprise/private-vault artifact. This public/student repo should carry only the safe operating principles that help students learn: clear structure, validation, secrets hygiene, readable docs, and clean handoff.

## Compare and contrast

| Area | MERIT enterprise pattern | SPRK student adaptation |
| --- | --- | --- |
| Instruction source | Private vault hierarchy with L1/L2/L3 instructions | Public repo uses `MERIT.instructions`, `AgentDraven.instructions`, `AGENTS.md`, this guide, and mission docs |
| Documentation folder | `{Name} docs/` for product/operator docs | Keep existing `docs/` because the curriculum and mission links already depend on it |
| Entry points | `run_[project].py` and `test_[project].py` | Browser missions use `server.py` per mission and npm scripts for validation |
| Configuration | Central `cfg/` for product settings | Keep mission constants close to small learning apps; move shared or sensitive values into config only when complexity requires it |
| Validation | Unified test runner, health checks, hygiene gates | `npm run setup:missions`, `npm run validate`, Playwright baseline, and generated Baseline Status tab |
| Ops surface | `ops/` for hygiene, cleanup, validation, archiving | Lightweight `ops/README.md` describes student-safe hygiene and validation commands |
| Secrets | `.env.example` committed; `.env.local` local only | Same principle; `.env.local` is ignored even though current missions do not require secrets |
| Versioning | Strict semantic versioning, tags, changelog closeout | Keep `VERSION` and `docs/CHANGELOG.md`; reserve baseline/version bumps for intentional releases |
| Executive reporting | 3-3 Done/State/Next report | Use short student handoff summaries: what changed, how tested, what to try next |

## Mission folder naming (required)

Enterprise MERIT products often use internal codenames; SPRK missions use one public folder name per game:

```text
NN-GameName-<mode-label>
```

Examples: `02-SnakeGame-1P-nP`, `10-SpaceInvaders-1P-nP`.

Rules are canonical in [MERIT.instructions](../MERIT.instructions). Do not add a second folder for the same mission under a different spelling.

## What to bring in now

### 1. Single source of truth

Use one canonical place for each topic:

- Student start path: `README.md`
- Mission naming: `MERIT.instructions`
- Mentor tone: `AgentDraven.instructions`
- Mission architecture: `docs/SPRK_Browser_Mission_Foundation_Guide.md`
- Validation flow: `docs/BASELINE_VALIDATION_AND_3C_FLOW.md`
- Language concepts: `docs/SPRK_Language_Crosswalk.md`
- Mission-specific play/build steps: `missions/<NN-GameName-mode>/docs/MISSION_GUIDE.md`

When adding a new explanation, link to the existing guide if it already exists. Do not create duplicate status or verification docs for the same mission.

### 2. Inherited setup and validation

Branches and forks inherit these repo-owned setup paths:

```bash
npm run setup:missions
npm run validate
```

### 3. Student closeout checklist

Before a student or agent says a change is ready:

- Check the branch is not `main`.
- Run `npm run validate` for mission-safe changes.
- Check `git status --short` for only intended files.
- Do not stage secrets, caches, `node_modules/`, `tests/artifacts/`, or local output.
- Commit with a clear message.
- Push the branch.

### 4. Secrets and local state

Current missions do not need API keys. If a future mission does:

- Commit `.env.example` with safe placeholder names.
- Keep real values in `.env.local`.
- Keep `.env.local` ignored.
- Never paste real secrets into issues, chats, docs, generated reports, or screenshots.

### 5. Hard-coded paths

Avoid machine-specific paths such as `/Users/name/...` or `C:\Users\name\...` in repo code and docs. Prefer relative paths from the repo root, mission folder paths, or helper scripts.

### 6. Error and recovery language

Student-facing errors should include the next action. Prefer:

```text
[FAIL] Mission backend did not start on port 8005. Try closing the old server or rerun npm run validate.
```

Avoid unexplained failures such as:

```text
Error: failed
```

### 7. Documentation hygiene

Use short docs that point to the source of truth. A good student guide answers:

- What is this?
- Where do I start?
- What command do I run?
- What does success look like?
- What should I try if it fails?

## What not to import directly

Do not force these enterprise-only patterns into this classroom repo unless the project grows into them:

- Private vault paths or private instruction contents.
- Product-specific DIRT/SoulOS phase names.
- Heavy admin-console requirements for every beginner mission.
- A mandatory `{Name} docs/` rename that would break existing SPRK links.
- Billing, subscriber, or tenant architecture in simple classroom games.

## Recommended next steps

1. Keep `MERIT.instructions`, `AgentDraven.instructions`, `AGENTS.md`, and this guide as the public MERIT-to-SPRK bridge.
2. Use `ops/README.md` for hygiene reminders before commit.
3. Continue using Playwright Baseline Status as the shared confidence signal for missions.
