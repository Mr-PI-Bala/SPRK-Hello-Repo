#!/usr/bin/env python3
"""Add Mission Navigation tables and document TOCs with dual links."""

from __future__ import annotations

import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]

NAV_LABELS = {
    "how to run": "I want to run it",
    "entry point": "I want to know where the app starts",
    "code files": "I want the file map",
    "play it": "I want to play it",
    "change it": "I want to change the game",
    "show it": "I want to show my change",
    "frontend and backend": "I want frontend and backend explained",
    "controls": "I want the controls",
    "open the app": "I want to open the app",
    "mission goal": "I want the mission goal",
    "game flow": "I want the game flow",
    "app flow": "I want the app flow",
    "sounds animations and x-ray vision": "I want sounds and X-Ray Vision",
}


def github_slug(text: str) -> str:
    s = text.strip().lower()
    s = re.sub(r"[^\w]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")


def github_slug_loose(text: str) -> str:
    s = text.strip().lower()
    s = re.sub(r"/", "-", s)
    s = re.sub(r"[^\w]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")


def h2_headings(content: str) -> list[tuple[str, str, str]]:
    """Return list of (title, slug, slug_loose) for ## headings."""
    out = []
    for m in re.finditer(r"^## (.+?)\s*$", content, re.MULTILINE):
        title = m.group(1).strip()
        if title.lower() in ("mission navigation", "table of contents", "table of contents"):
            continue
        out.append((title, github_slug(title), github_slug_loose(title)))
    return out


def dual_same_file(title: str, slug: str) -> str:
    loose = github_slug_loose(title)
    anchor = loose if loose != slug else slug
    return f"[{title}](#{anchor}) [[#{title}]] (obsidian)"


def mission_nav_block(headings: list[tuple[str, str, str]]) -> str:
    rows = []
    skip = {
        "start here",
        "standard sprk guidance",
        "mission navigation",
        "table of contents",
        "branch reminder",
        "level it up",
    }
    for title, slug, loose in headings:
        key = title.lower()
        if key in skip:
            continue
        label = NAV_LABELS.get(key, f"I want {title.lower()}")
        anchor = loose if loose != slug else slug
        rows.append(f"| {label} | [{title}](#{anchor}) [[#{title}]] (obsidian) |")
    if not rows:
        return ""
    lines = [
        "",
        "## Mission Navigation",
        "| Need | Go Here |",
        "| --- | --- |",
        *rows,
        "",
    ]
    return "\n".join(lines)


def add_mission_navigation(path: Path) -> bool:
    content = path.read_text(encoding="utf-8")
    if "## Mission Navigation" in content:
        return False
    headings = h2_headings(content)
    block = mission_nav_block(headings)
    if not block:
        return False
    # Insert after ## Start Here section
    m = re.search(r"^(## Start Here\s*\n)(.*?)(?=^## )", content, re.MULTILINE | re.DOTALL)
    if m:
        insert_at = m.end(2)
        new_content = content[:insert_at] + block + content[insert_at:]
    else:
        # After first heading block (title + intro until first ##)
        m2 = re.search(r"^## ", content, re.MULTILINE)
        if not m2:
            return False
        new_content = content[: m2.start()] + block + content[m2.start() :]
    path.write_text(new_content, encoding="utf-8")
    return True


def doc_toc_block(headings: list[tuple[str, str, str]]) -> str:
    lines = ["## Table of contents", ""]
    for title, slug, loose in headings:
        if title.lower() in ("table of contents",):
            continue
        anchor = loose if loose != slug else slug
        lines.append(f"- [{title}](#{anchor}) [[#{title}]] (obsidian)")
    lines.append("")
    return "\n".join(lines)


def add_doc_toc(path: Path) -> bool:
    content = path.read_text(encoding="utf-8")
    if re.search(r"^## Table [Oo]f [Cc]ontents", content, re.MULTILINE):
        return False
    headings = h2_headings(content)
    if len(headings) < 3:
        return False
    block = doc_toc_block(headings)
    # Insert after first paragraph (after title)
    m = re.match(r"^(# .+?\n\n)(.+?)(\n## )", content, re.DOTALL)
    if m:
        new_content = m.group(1) + m.group(2) + "\n\n" + block + m.group(3) + content[m.end() :]
    else:
        m2 = re.match(r"^(# .+?\n\n)", content)
        if not m2:
            return False
        new_content = content[: m2.end()] + block + content[m2.end() :]
    path.write_text(new_content, encoding="utf-8")
    return True


def main() -> None:
    nav_changed = []
    for path in sorted(REPO.glob("missions/*/docs/MISSION_GUIDE.md")):
        if add_mission_navigation(path):
            nav_changed.append(path.relative_to(REPO).as_posix())
    print(f"Mission Navigation added to {len(nav_changed)} files")
    for f in nav_changed:
        print(f"  {f}")

    toc_changed = []
    for path in sorted((REPO / "docs").glob("*.md")):
        if path.name == "CHANGELOG.md":
            continue
        if add_doc_toc(path):
            toc_changed.append(path.name)
    print(f"TOC added to {len(toc_changed)} docs")
    for f in toc_changed:
        print(f"  {f}")


if __name__ == "__main__":
    main()
