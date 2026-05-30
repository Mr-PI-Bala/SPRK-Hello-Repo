# SPRK Student AgenticOps Guide

This guide translates MERIT AgenticOps practices into a classroom-friendly shape for `SPRK-Hello-Repo`.

The full enterprise MERIT instruction set remains in the private MERIT vault. This public/student repo carries the safe operating principles that help students and agents learn: clear structure, one source of truth, validation, branch discipline, secrets hygiene, readable docs, and clean handoff.

## Compare and contrast

| Area | MERIT enterprise pattern | SPRK student adaptation |
| --- | --- | --- |
| Instruction source | Private vault hierarchy with L1/L2/L3 instructions | Public repo uses `MERIT.instructions`, `AgentDraven.instructions`, `AGENTS.md`, this guide, and mission docs |
| Documentation folder | `{Name} docs/` for product/operator docs | Keep existing `docs/` because curriculum and mission links depend on it |
| Entry points | Product-specific runners and service commands | Mission `server.py`, npm scripts, and `npm run workflow` |
| Setup | Environment bootstrap scripts | `npm run setup:missions` and devcontainer post-create setup |
| Validation | CI gates, health checks, and release checks | Playwright mission baseline through `npm run validate` |
| Workflow | One task, one branch, one PR | Guided by `docs/SPRK_Guided_Workflow_Helper.md`; duplicate PRs are closed after consolidation |
| Secrets | Local environment files and secret stores | `.env.local` is ignored; commit only safe examples |
| Closeout | Structured handoff reports | Short 3-3: Done, State, Next |

## Mission folder naming (required)

SPRK missions use one public folder name per game:

```text
NN-GameName-<mode-label>
```

Examples: `02-SnakeGame-1P-nP`, `10-SpaceInvaders-1P-nP`.

Rules are canonical in [MERIT.instructions](../MERIT.instructions). Do not add a second folder for the same mission under a different spelling.

## What to bring into student work

### 1. Single source of truth

Use one canonical place for each topic:

- Student start path: `README.md`
- Mission naming and branch/PR governance: `MERIT.instructions`
- Mentor tone: `AgentDraven.instructions`
- Guided workflow: `docs/SPRK_Guided_Workflow_Helper.md`
- Browser mission architecture: `docs/SPRK_Browser_Mission_Foundation_Guide.md`
- Testing and network architecture: `docs/SPRK_Browser_Testing_And_Network_Architecture.md`
- Validation flow: `docs/BASELINE_VALIDATION_AND_3C_FLOW.md`
- Language concepts: `docs/SPRK_Language_Crosswalk.md`
- Mission-specific play/build steps: `missions/<NN-GameName-mode>/docs/MISSION_GUIDE.md`

When adding a new explanation, link to the existing guide if it already exists. Do not create duplicate status or verification docs for the same mission.

### 2. Inherited setup and validation

Branches and forks inherit these repo-owned commands:

```bash
npm run setup:missions
npm run validate
```

Codespaces-compatible environments run setup from `.devcontainer/devcontainer.json`. GitHub Actions runs mission validation from `.github/workflows/mission-baseline.yml`.

### 3. Branch and PR discipline

Use one named branch and one PR per task. If a task needs more review, more validation, or conflict fixes, update the same branch and PR instead of creating a new branch. If duplicate PRs already exist, pick one canonical PR, move useful changes into it, and close the duplicates.

This is the classroom version of the enterprise MERIT rule: forward progress should have one source of truth.

### 4. Guided GitHub workflow

Use:

```bash
npm run workflow
```

The helper shows status first, explains each operation, and requires confirmation before changing branches, committing, opening PRs, approving, or merging.

### 5. Student closeout checklist

Before a student or agent says a change is ready:

- Check the branch is not `main`.
- Confirm the branch is the canonical branch for the current task.
- Run the targeted mission test or `npm run validate`.
- Check `git status --short` for only intended files.
- Do not stage secrets, caches, `node_modules/`, `tests/artifacts/`, or local output.
- Commit with a clear message.
- Push the branch and open or update the canonical PR.

### 6. Secrets and local state

Current missions do not need API keys. If a future mission does:

- Commit `.env.example` with safe placeholder names.
- Keep real values in `.env.local`.
- Keep `.env.local` ignored.
- Never paste real secrets into issues, chats, docs, generated reports, or screenshots.

### 7. Hard-coded paths

Avoid machine-specific paths such as `/Users/name/...` or `C:\Users\name\...` in repo code and docs. Prefer relative paths from the repo root, mission folder paths, or helper scripts.

### 8. Error and recovery language

Student-facing errors should include the next action. Prefer:

```text
[FAIL] Mission backend did not start on port 8010. Close the old server or rerun npm run validate.
```

Avoid unexplained failures such as:

```text
Error: failed
```

## What not to import

Do not force enterprise-only patterns into this classroom repo unless the project grows into them:

- private vault paths or private instruction contents
- heavy admin-console requirements for beginner missions
- billing, subscriber, tenant, or production operations architecture
- duplicate branches or PRs for the same task
- duplicate mission folders or alternate naming schemes for the same game

## Recommended student handoff

Use three short sections:

```markdown
Done
- What changed

State
- What passed or failed
- Canonical branch and PR

Next
- What someone should try next
```
