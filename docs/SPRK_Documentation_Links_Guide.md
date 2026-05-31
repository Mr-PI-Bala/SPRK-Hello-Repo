# SPRK Documentation Links Guide

This guide defines how to write hyperlinks in SPRK **student documentation** (`docs/`, mission `docs/`, and `README.md` bodies). It does **not** belong in `MERIT.instructions` — that file is for agent governance (naming, branches, validation).

Repo-wide index: [docs/README.md](README.md).

Maintenance scripts (for maintainers): `ops/tools/apply-obsidian-section-links.py`, `ops/tools/add-doc-toc-and-mission-nav.py`.

## Table of contents

- [Portable link (everywhere)](#portable-link-everywhere) [[#Portable link (everywhere)]] (obsidian)
- [Obsidian link (section references)](#obsidian-link-section-references) [[#Obsidian link (section references)]] (obsidian)
- [When to use each](#when-to-use-each) [[#When to use each]] (obsidian)
- [Obsidian vault setup (optional)](#obsidian-vault-setup-optional) [[#Obsidian vault setup (optional)]] (obsidian)
- [Enterprise MERIT vault](#enterprise-merit-vault) [[#Enterprise MERIT vault]] (obsidian)

## Portable link (everywhere)

Use standard Markdown relative paths and GitHub-style heading anchors. This link works in GitHub, Codespaces, VS Code Markdown preview, and Cursor.

```markdown
[Visible label](path/to/doc.md#heading-anchor)
```

Rules:

- Paths are **relative to the file you are editing**.
- Heading anchors use lowercase words separated by hyphens (GitHub slug rules).
- Use portable links in tables, mission guides, issues, and handoffs.

## Obsidian link (section references)

When the target is a **section** (not just a whole file), add an Obsidian wikilink immediately after the portable link and label it **`(obsidian)`**:

```markdown
[Facilitator cheat sheet](SPRK_Facilitator_Guide.md#one-page-facilitator-cheat-sheet) [[SPRK_Facilitator_Guide#One-Page Facilitator Cheat Sheet]] (obsidian)
```

Rules:

- `NoteName` is the Markdown filename **without** `.md`.
- `Exact Heading Text` matches the target heading line.
- Same-file section: `[Validation](#validation-before-confidence) [[#Validation before confidence]] (obsidian)`
- Whole-file targets: portable link only; Obsidian wikilink is optional.
- Do **not** use `(obsidian)` for external URLs. Do **not** paste private MERIT vault `obsidian://` URIs into this repo.

## When to use each

| Target | Portable link | `[[wikilink]] (obsidian)` |
| --- | --- | --- |
| Section in this file | Required | Required |
| Section in another file | Required | Required |
| Whole file | Required | Optional |
| External site | Required | Do not add |

## Obsidian vault setup (optional)

Open the **repository root** (folder containing `README.md`, `MERIT.instructions`, and `docs/`) as the vault so wikilinks like `[[docs/SPRK_Facilitator_Guide#Start Here]]` resolve. Obsidian is optional; the portable link is always enough for classroom work.

## Enterprise MERIT vault

Full enterprise MERIT L1/L2/L3 instructions remain in the **private MERIT Obsidian vault** (separate from this repo). This public repo carries the student-safe subset in `MERIT.instructions`, `AgentDraven.instructions`, and `AGENTS.md`.
