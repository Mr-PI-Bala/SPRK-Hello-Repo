# SPRK Student AgenticOps Guide

This guide translates agentic development practices into a classroom-friendly shape for `SPRK-Hello-Repo`.

The goal is not to hide Git, tests, or review. The goal is to make the workflow visible, teachable, and recoverable.

## Compare And Contrast
| Area | Enterprise Pattern | SPRK Student Adaptation |
| --- | --- | --- |
| Instructions | Private operator guides and role-specific runbooks | Public `AGENTS.md`, student docs, and mission guides only |
| Entry points | Product-specific runners and service commands | Mission `server.py`, npm scripts, and `npm run workflow` |
| Setup | Environment bootstrap scripts | `npm run setup:missions` and devcontainer post-create setup |
| Validation | CI gates, health checks, and release checks | Playwright mission baseline through `npm run validate` |
| Workflow | Branch, commit, PR, review, merge | Guided by `docs/SPRK_Guided_Workflow_Helper.md` |
| Secrets | Local environment files and secret stores | `.env.local` is ignored; commit only safe examples |
| Closeout | Structured handoff reports | Short 3-3: Done, State, Next |

## What To Bring Into Student Work

### 1. Single Source Of Truth
Use one canonical place for each topic:

- Student start path: `README.md`
- Guided workflow: `docs/SPRK_Guided_Workflow_Helper.md`
- Browser mission architecture: `docs/SPRK_Browser_Mission_Foundation_Guide.md`
- Testing and network architecture: `docs/SPRK_Browser_Testing_And_Network_Architecture.md`
- Validation flow: `docs/BASELINE_VALIDATION_AND_3C_FLOW.md`
- Language concepts: `docs/SPRK_Language_Crosswalk.md`
- Mission-specific play/build steps: `missions/<mission>/docs/MISSION_GUIDE.md`

When adding a new explanation, link to the existing guide if it already exists.

### 2. Inherited Setup And Validation
Branches and forks inherit these repo-owned commands:

```bash
npm run setup:missions
npm run validate
```

Codespaces-compatible environments run setup from `.devcontainer/devcontainer.json`. GitHub Actions runs mission validation from `.github/workflows/mission-baseline.yml`.

### 3. Guided GitHub Workflow
Use:

```bash
npm run workflow
```

The helper shows status first, explains each operation, and requires confirmation before changing branches, committing, opening PRs, approving, or merging.

### 4. Student Closeout Checklist
Before a student or agent says a change is ready:

- Check the branch is not `main`.
- Run the targeted mission test or `npm run validate`.
- Check `git status --short` for only intended files.
- Do not stage secrets, caches, `node_modules/`, `tests/artifacts/`, or local output.
- Commit with a clear message.
- Push the branch and open or update the PR.

### 5. Secrets And Local State
Current missions do not need API keys. If a future mission does:

- Commit `.env.example` with safe placeholder names.
- Keep real values in `.env.local`.
- Keep `.env.local` ignored.
- Never paste real secrets into issues, chats, docs, generated reports, or screenshots.

### 6. Error And Recovery Language
Student-facing errors should include the next action. Prefer:

```text
[FAIL] Mission backend did not start on port 8010. Close the old server or rerun npm run validate.
```

Avoid unexplained failures such as:

```text
Error: failed
```

## What Not To Import
Do not force enterprise-only patterns into this classroom repo:

- private vault paths or private instruction contents
- heavy admin-console requirements for beginner missions
- billing, subscriber, tenant, or production operations architecture
- mandatory folder renames that break existing curriculum links

## Recommended Student Handoff
Use three short sections:

```markdown
Done
- What changed

State
- What passed or failed

Next
- What someone should try next
```
