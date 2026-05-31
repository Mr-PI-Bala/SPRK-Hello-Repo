# SPRK Hello Repo — Documentation Hub

This folder is the **single source of truth** for repo-wide SPRK guides. Curriculum links, agents, and mission docs point here instead of duplicating long explanations.

Link rules (portable hyperlinks + section wikilinks): [SPRK_Documentation_Links_Guide.md](SPRK_Documentation_Links_Guide.md) [[SPRK_Documentation_Links_Guide#Portable link (everywhere)]] (obsidian)

Enterprise MERIT AgenticOps instructions (L1/L2/L3) live in the **private MERIT Obsidian vault**. This public student repository carries only the safe subset in `MERIT.instructions`, `AgentDraven.instructions`, `AGENTS.md`, and the guides below.

## Table of contents

- [Start here](#start-here) [[#Start here]] (obsidian)
- [AgenticOps and governance](#agenticops-and-governance) [[#AgenticOps and governance]] (obsidian)
- [Toolchain](#toolchain) [[#Toolchain]] (obsidian)
- [Missions, testing, and classroom hosting](#missions-testing-and-classroom-hosting) [[#Missions, testing, and classroom hosting]] (obsidian)
- [Public doorway](#public-doorway) [[#Public doorway]] (obsidian)
- [History](#history) [[#History]] (obsidian)
- [Read in Obsidian (optional)](#read-in-obsidian-optional) [[#Read in Obsidian (optional)]] (obsidian)

## Read in Obsidian (optional)

Obsidian is **not required**. The same files render in GitHub, Codespaces, and VS Code Markdown preview.

To use graph view, backlinks, or section wikilinks labeled `(obsidian)` in these docs:

1. Install [Obsidian](https://obsidian.md/).
2. Choose **Open folder as vault**.
3. Select this repository **root** (the folder that contains `README.md` and `docs/`), not only `docs/`.

Do not paste private MERIT vault paths or operator-only `obsidian://` URIs into issues, chats, or commits.

## Start here

| Role | First read |
| --- | --- |
| Student | [Repository README](../README.md) → your mission's `MISSION_GUIDE.md` |
| Facilitator / teacher | [SPRK_Facilitator_Guide.md](SPRK_Facilitator_Guide.md) |
| Coding agent | [AGENTS.md](../AGENTS.md) → [MERIT.instructions](../MERIT.instructions) |
| Maintainer | [PROJECT_GUIDE.md](PROJECT_GUIDE.md) (local) and SPRK-Welcome `docs/PROJECT_GUIDE.md` on GitHub |

## AgenticOps and governance

| Guide | Purpose |
| --- | --- |
| [MERIT.instructions](../MERIT.instructions) | Agent governance: mission naming, branch/PR rules, validation |
| [SPRK_Documentation_Links_Guide.md](SPRK_Documentation_Links_Guide.md) | Portable and Obsidian link rules for student docs (canonical spec) |
| [AgentDraven.instructions](../AgentDraven.instructions) | Classroom mentor tone and handoff format |
| [AGENTS.md](../AGENTS.md) | Agent read order and closeout checklist |
| [SPRK_Student_AgenticOps_Guide.md](SPRK_Student_AgenticOps_Guide.md) | MERIT enterprise vs SPRK student mapping |
| [SPRK_Guided_Workflow_Helper.md](SPRK_Guided_Workflow_Helper.md) | Guided Git/GitHub helper (`npm run workflow`) |
| [BASELINE_VALIDATION_AND_3C_FLOW.md](BASELINE_VALIDATION_AND_3C_FLOW.md) | Playwright baseline and 3C flow |
| [ops/README.md](../ops/README.md) | Hygiene and 3-3 handoff format |

## Toolchain

| Guide | Purpose |
| --- | --- |
| [SPRK_Git_Repository_UserGuide.md](SPRK_Git_Repository_UserGuide.md) | Accounts, access, branches, PRs |
| [SPRK_CodeSpaces_UserGuide.md](SPRK_CodeSpaces_UserGuide.md) | Codespaces runtime and safe checks |
| [SPRK_VSCode_UserGuide.md](SPRK_VSCode_UserGuide.md) | Markdown preview, Mermaid, extensions |
| [SPRK_Language_Crosswalk.md](SPRK_Language_Crosswalk.md) | Python, JavaScript, and related patterns |

## Missions, testing, and classroom hosting

| Guide | Purpose |
| --- | --- |
| [SPRK_Browser_Mission_Foundation_Guide.md](SPRK_Browser_Mission_Foundation_Guide.md) | Shared browser-mission structure |
| [SPRK_Browser_Testing_And_Network_Architecture.md](SPRK_Browser_Testing_And_Network_Architecture.md) | Playwright harness, APIs, network model |
| [SPRK_Classroom_Network_Test_Guide.md](SPRK_Classroom_Network_Test_Guide.md) | Laptop LAN hosting and device tests |
| [SPRK_Facilitator_Guide.md](SPRK_Facilitator_Guide.md) | One-page facilitator cheat sheet |
| [SPRK_Cloud_Facilitator_Hosting_Guide.md](SPRK_Cloud_Facilitator_Hosting_Guide.md) | Cursor Cloud + public tunnels |
| [SPRK_Touch_Control_Guide.md](SPRK_Touch_Control_Guide.md) | iPhone and touchscreen play |

Mission-specific steps: `missions/<NN-GameName-mode>/docs/MISSION_GUIDE.md`.

Facilitator quick path: [SPRK_Facilitator_Guide — Start Here](SPRK_Facilitator_Guide.md#start-here--pick-your-hosting-path) [[SPRK_Facilitator_Guide#Start Here — Pick Your Hosting Path]] (obsidian)

## Public doorway

Shared onboarding also lives in the public SPRK-Welcome repository (`Mr-PI-Bala/SPRK-Welcome` on GitHub). This repo keeps local copies so students can keep working here after access is approved.

## History

| Guide | Purpose |
| --- | --- |
| [CHANGELOG.md](CHANGELOG.md) | Documentation and release notes for this repo |
