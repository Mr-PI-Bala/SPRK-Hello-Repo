#!/usr/bin/env python3
"""Add [[Note#Heading]] (obsidian) after portable section links in SPRK markdown docs."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

SKIP_FILES = {
    "MERIT.instructions",
    "AgentDraven.instructions",
    "AGENTS.md",
}

SKIP_PREFIXES = ("tests/", "node_modules/", ".git/")


def github_slug(text: str) -> str:
    """Approximate GitHub heading anchor (matches most SPRK docs)."""
    s = text.strip().lower()
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"[^\w]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def github_slug_loose(text: str) -> str:
    """Variant: slashes become hyphen boundaries (dictionaries--maps)."""
    s = text.strip().lower()
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"/", "-", s)
    s = re.sub(r"[^\w]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def extract_headings(content: str) -> dict[str, str]:
    """Map anchor slug -> exact heading text (supports duplicate suffix -1, -2)."""
    slugs: dict[str, str] = {}
    counts: dict[str, int] = {}
    for m in re.finditer(r"^(#{1,6})\s+(.+?)\s*$", content, re.MULTILINE):
        text = m.group(2).strip()
        for base in {github_slug(text), github_slug_loose(text)}:
            n = counts.get(base, 0)
            counts[base] = n + 1
            slug = base if n == 0 else f"{base}-{n}"
            slugs[slug] = text
    return slugs


def load_heading_index() -> dict[Path, dict[str, str]]:
    index: dict[Path, dict[str, str]] = {}
    for path in REPO_ROOT.rglob("*.md"):
        rel = path.relative_to(REPO_ROOT).as_posix()
        if any(rel.startswith(p) for p in SKIP_PREFIXES):
            continue
        try:
            index[path.resolve()] = extract_headings(path.read_text(encoding="utf-8"))
        except OSError:
            pass
    return index


def vault_note_path(target: Path) -> str:
    return target.relative_to(REPO_ROOT).with_suffix("").as_posix()


def split_fenced_blocks(content: str) -> list[tuple[bool, str]]:
    parts: list[tuple[bool, str]] = []
    pattern = re.compile(r"^```.*?^```", re.MULTILINE | re.DOTALL)
    last = 0
    for m in pattern.finditer(content):
        if m.start() > last:
            parts.append((False, content[last : m.start()]))
        parts.append((True, m.group(0)))
        last = m.end()
    if last < len(content):
        parts.append((False, content[last:]))
    if not parts:
        parts.append((False, content))
    return parts


def resolve_target(current: Path, href: str) -> tuple[Path | None, str | None]:
    if href.startswith("#"):
        return current.resolve(), href[1:] or None
    if "#" not in href:
        return None, None
    file_part, _, anchor = href.partition("#")
    if not file_part:
        return current.resolve(), anchor or None
    if file_part.startswith(("http://", "https://", "mailto:")):
        return None, None
    target = (current.parent / file_part).resolve()
    if not target.exists():
        return None, None
    return target, anchor or None


def heading_text_for(index: dict[Path, dict[str, str]], target: Path, anchor: str) -> str | None:
    slugs = index.get(target.resolve())
    if not slugs:
        return None
    if anchor in slugs:
        return slugs[anchor]
    base = re.sub(r"-\d+$", "", anchor)
    if base in slugs:
        return slugs[base]
    # Match anchor against every heading slug variant in the target file
    for text in set(slugs.values()):
        if github_slug(text) == anchor or github_slug_loose(text) == anchor:
            return text
        if github_slug(text) == base or github_slug_loose(text) == base:
            return text
    return None


def already_has_obsidian(after: str) -> bool:
    return bool(re.match(r"\s*\[\[", after))


def make_obsidian_wikilink(note_path: str, heading: str, same_file: bool) -> str:
    if same_file:
        return f"[[#{heading}]] (obsidian)"
    return f"[[{note_path}#{heading}]] (obsidian)"


LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")


def process_link(
    match: re.Match[str],
    current: Path,
    index: dict[Path, dict[str, str]],
) -> str:
    full = match.group(0)
    href = match.group(2).strip()
    tail_start = match.end()
    # tail handled by caller

    if href.startswith(("http://", "https://", "mailto:")):
        return full

    target, anchor = resolve_target(current, href)
    if target is None or not anchor:
        return full

    heading = heading_text_for(index, target, anchor)
    if not heading:
        return full

    same_file = target.resolve() == current.resolve()
    note = vault_note_path(target) if not same_file else ""
    wiki = make_obsidian_wikilink(note, heading, same_file)
    return f"{full} {wiki}"


def process_prose_block(block: str, current: Path, index: dict[Path, dict[str, str]]) -> str:
    out: list[str] = []
    pos = 0
    for m in LINK_RE.finditer(block):
        out.append(block[pos : m.start()])
        after = block[m.end() :]
        if already_has_obsidian(after):
            out.append(m.group(0))
        else:
            out.append(process_link(m, current, index))
        pos = m.end()
    out.append(block[pos:])
    result = "".join(out)
    result = re.sub(
        r"(\[\[[^\]]+\]\] \(obsidian\))\s+\[\[[^\]]+\]\] \(obsidian\)",
        r"\1",
        result,
    )
    return result


def process_file(path: Path, index: dict[Path, dict[str, str]]) -> bool:
    rel = path.relative_to(REPO_ROOT).as_posix()
    if path.name in SKIP_FILES:
        return False
    original = path.read_text(encoding="utf-8")
    chunks = split_fenced_blocks(original)
    new_chunks: list[str] = []
    changed = False
    for fenced, chunk in chunks:
        if fenced:
            new_chunks.append(chunk)
        else:
            processed = process_prose_block(chunk, path.resolve(), index)
            if processed != chunk:
                changed = True
            new_chunks.append(processed)
    new_content = "".join(new_chunks)
    if changed:
        path.write_text(new_content, encoding="utf-8")
    return changed


def main() -> int:
    index = load_heading_index()
    changed_files: list[str] = []
    for path in sorted(REPO_ROOT.rglob("*.md")):
        rel = path.relative_to(REPO_ROOT).as_posix()
        if any(rel.startswith(p) for p in SKIP_PREFIXES):
            continue
        if process_file(path, index):
            changed_files.append(rel)
    print(f"Updated {len(changed_files)} files:")
    for f in changed_files:
        print(f"  {f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
