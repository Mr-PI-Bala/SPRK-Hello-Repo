"""
SPRK guided GitHub workflow helper.

Default behavior is intentionally educational: show status first, explain the
commands behind each option, and require explicit confirmation before changing
branches, creating commits, opening PRs, approving PRs, or merging PRs.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field


CONFIRM_TEXT = "I UNDERSTAND"
SELF_APPROVE_TEXT = "I UNDERSTAND SELF APPROVAL"
BRANCH_RE = re.compile(r"^[a-z0-9][a-z0-9._/-]{1,80}$")
ALL_YES_ANSWERS = {"ay", "ya", "all-yes", "allyes"}
ALL_NO_ANSWERS = {"an", "na", "all-no", "allno"}


@dataclass
class CommandResult:
    stdout: str
    stderr: str
    returncode: int


def run_cmd(args: list[str], check: bool = False) -> CommandResult:
    """Run a command without shell interpolation."""
    result = subprocess.run(args, capture_output=True, text=True, check=False)
    command_result = CommandResult(
        stdout=result.stdout.strip(),
        stderr=result.stderr.strip(),
        returncode=result.returncode,
    )
    if check and result.returncode != 0:
        print_command_failure(args, command_result)
        sys.exit(result.returncode)
    return command_result


def print_command(args: list[str]) -> None:
    print(f"  $ {' '.join(args)}")


def print_command_failure(args: list[str], result: CommandResult) -> None:
    print()
    print("[FAIL] Command did not complete:")
    print_command(args)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)


def require_tool(tool: str) -> bool:
    result = run_cmd([tool, "--version"])
    if result.returncode == 0:
        return True
    print(f"[WARN] `{tool}` is not available or is not on PATH.")
    return False


def gh_json(args: list[str]) -> dict | list | None:
    result = run_cmd(["gh", *args])
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def current_branch() -> str:
    result = run_cmd(["git", "branch", "--show-current"])
    return result.stdout or "(detached)"


def changed_files() -> list[str]:
    result = run_cmd(["git", "status", "--short"])
    return [line for line in result.stdout.splitlines() if line.strip()]


def parse_porcelain_path(line: str) -> tuple[str, str] | None:
    """Parse one `git status --porcelain` line into (xy, path)."""
    if len(line) < 4:
        return None
    xy = line[:2]
    path = line[3:].strip()
    if path.startswith('"') and path.endswith('"'):
        path = path[1:-1]
    if " -> " in path:
        path = path.split(" -> ", 1)[1]
    return xy, path


def dirty_tracked_files() -> list[tuple[str, str]]:
    """Return tracked paths with local worktree or index changes (not untracked ??)."""
    result = run_cmd(["git", "status", "--porcelain"])
    dirty: list[tuple[str, str]] = []
    for line in result.stdout.splitlines():
        parsed = parse_porcelain_path(line)
        if not parsed:
            continue
        xy, path = parsed
        if xy == "??":
            continue
        if xy.strip() == "":
            continue
        dirty.append((xy, path))
    return dirty


def parse_yes_no_answer(raw: str) -> str | None:
    """Return yes, no, all_yes, all_no, or None if invalid."""
    answer = raw.strip().lower()
    if answer in {"y", "yes"}:
        return "yes"
    if answer in {"n", "no"}:
        return "no"
    if answer in ALL_YES_ANSWERS:
        return "all_yes"
    if answer in ALL_NO_ANSWERS:
        return "all_no"
    return None


def print_interactive_shortcuts_banner(context: str = "") -> None:
    """Remind users that y/n and ay/ya/an/na shortcuts exist before prompts appear."""
    print()
    print("=== Interactive answers (use whenever the helper asks yes/no) ===")
    if context:
        print(f"  Context: {context}")
    print("  y or yes     — yes for this item only")
    print("  n or no      — no for this item only")
    print("  ay or ya     — all yes (this item and every remaining item in the list)")
    print("  an or na     — all no (this item and every remaining item in the list)")
    print("  MERIT.instructions → Interactive confirmation shortcuts (SPRK tools)")


def print_yes_no_help() -> None:
    print_interactive_shortcuts_banner()


def prompt_discard_file(path: str, status_xy: str) -> str | None:
    """Ask whether to discard local edits for one file. Returns yes/no/all_yes/all_no."""
    while True:
        answer = input(f"{path} [{status_xy}] — discard local and use GitHub main? [y/n/ay/ya/an/na]: ")
        parsed = parse_yes_no_answer(answer)
        if parsed:
            return parsed
        print("[WARN] Enter y, n, ay, ya, an, or na.")


def choose_files_to_discard(files: list[tuple[str, str]]) -> tuple[list[str], list[str]] | None:
    """
    Ask file-by-file whether to discard local edits.
    Returns (discard_paths, keep_paths) or None if the user cancels.
    """
    if not files:
        return [], []

    print()
    print("=== Local files not checked in to GitHub ===")
    for xy, path in files:
        print(f"  {xy} {path}")
    print()
    print("For each file, choose whether to discard your local edits and match GitHub main:")
    print_yes_no_help()
    print()

    to_discard: list[str] = []
    to_keep: list[str] = []
    batch: str | None = None

    for xy, path in files:
        if batch == "yes":
            to_discard.append(path)
            continue
        if batch == "no":
            to_keep.append(path)
            continue

        choice = prompt_discard_file(path, xy)
        if choice == "yes":
            to_discard.append(path)
        elif choice == "no":
            to_keep.append(path)
        elif choice == "all_yes":
            batch = "yes"
            to_discard.append(path)
        elif choice == "all_no":
            batch = "no"
            to_keep.append(path)

    if to_keep and not to_discard:
        print()
        print("[STOP] You chose to keep every local file. Nothing was synced.")
        print("If you want GitHub main on this laptop, run again and answer y or ay for the files to replace.")
        print("If you want to save local edits, use menu option 2 to create a branch and option 3 to open a PR.")
        return None

    return to_discard, to_keep


def current_user() -> str | None:
    payload = gh_json(["api", "user", "--jq", ".login"])
    if isinstance(payload, str):
        return payload

    result = run_cmd(["gh", "api", "user", "--jq", ".login"])
    if result.returncode == 0:
        return result.stdout.strip()
    return None


def confirm_or_stop(prompt: str, expected: str = CONFIRM_TEXT) -> bool:
    print()
    print(prompt)
    answer = input(f'Type "{expected}" to continue: ').strip()
    if answer != expected:
        print("[STOP] No changes were made.")
        return False
    return True


@dataclass
class PrTriageReport:
    number: int
    title: str
    head_ref: str
    url: str
    is_draft: bool
    ahead_commits: list[tuple[str, str]] = field(default_factory=list)
    behind_count: int = 0
    deleted_if_merged: list[str] = field(default_factory=list)
    changed_files: list[str] = field(default_factory=list)
    verdict: str = "REVIEW"
    recommendation: str = ""


def list_open_prs(limit: int = 20) -> list[dict]:
    payload = gh_json([
        "pr",
        "list",
        "--state",
        "open",
        "--limit",
        str(limit),
        "--json",
        "number,title,headRefName,baseRefName,isDraft,url",
    ])
    return payload if isinstance(payload, list) else []


def analyze_open_pr(pr: dict) -> PrTriageReport | None:
    head = pr.get("headRefName")
    if not head:
        return None
    number = int(pr["number"])
    report = PrTriageReport(
        number=number,
        title=pr.get("title", ""),
        head_ref=head,
        url=pr.get("url", ""),
        is_draft=bool(pr.get("isDraft")),
    )

    run_cmd(["git", "fetch", "origin", head, "main"])

    ahead = run_cmd(["git", "log", f"origin/main..origin/{head}", "--oneline"])
    if ahead.returncode == 0 and ahead.stdout:
        for line in ahead.stdout.splitlines():
            parts = line.split(" ", 1)
            if len(parts) == 2:
                report.ahead_commits.append((parts[0], parts[1]))

    behind = run_cmd(["git", "rev-list", "--count", f"origin/{head}..origin/main"])
    if behind.returncode == 0 and behind.stdout.isdigit():
        report.behind_count = int(behind.stdout)

    deleted = run_cmd([
        "git",
        "diff",
        "origin/main",
        f"origin/{head}",
        "--diff-filter=D",
        "--name-only",
    ])
    if deleted.returncode == 0 and deleted.stdout:
        report.deleted_if_merged = [p for p in deleted.stdout.splitlines() if p.strip()]

    changed = run_cmd(["git", "diff", "--name-only", f"origin/main...origin/{head}"])
    if changed.returncode == 0 and changed.stdout:
        report.changed_files = [p for p in changed.stdout.splitlines() if p.strip()]

    classify_pr_report(report)
    return report


def classify_pr_report(report: PrTriageReport) -> None:
    docs_only = report.changed_files and all(
        f.startswith("docs/") or f == "docs" for f in report.changed_files
    )
    touches_missions = any(f.startswith("missions/") for f in report.changed_files)
    heavy_deletions = len(report.deleted_if_merged) >= 3
    very_behind = report.behind_count >= 15

    if heavy_deletions and very_behind:
        report.verdict = "STALE_UNSAFE"
        report.recommendation = (
            "Do not merge this PR. It is far behind main and would remove files that exist on main now. "
            "Close the PR, then port only the salvage commits listed below onto a new branch from main (menu 6)."
        )
    elif docs_only and not report.deleted_if_merged and report.behind_count > 0:
        report.verdict = "LIKELY_SUPERSEDED"
        report.recommendation = (
            "Docs-only PR while main has moved forward — content may already be on main via a newer merge. "
            "Compare on GitHub, then close without merge if redundant. Open a fresh docs PR only if something is still missing."
        )
    elif report.ahead_commits and touches_missions and not heavy_deletions:
        report.verdict = "PORT_TO_NEW_BRANCH"
        report.recommendation = (
            "Gameplay or mission changes should land on a new branch from latest main, not by merging this old PR. "
            "Close this PR after porting the salvage commits (menu 6)."
        )
    elif not report.ahead_commits:
        report.verdict = "NO_UNIQUE_COMMITS"
        report.recommendation = "No commits ahead of main — safe to close if the PR is redundant."
    else:
        report.verdict = "REVIEW_MANUALLY"
        report.recommendation = (
            "Read the diff on GitHub. Use menu 4 only if merge is safe; otherwise close and port work to a new PR."
        )


def print_pr_triage_report(report: PrTriageReport) -> None:
    draft = "draft" if report.is_draft else "ready"
    print()
    print(f"--- PR #{report.number} [{draft}] {report.title} ---")
    print(f"  URL: {report.url}")
    print(f"  Branch: {report.head_ref} -> main")
    print(f"  Verdict: {report.verdict}")
    print(f"  Recommendation: {report.recommendation}")
    print(f"  Behind main: {report.behind_count} commit(s) on main not in this PR")
    if report.ahead_commits:
        print("  Unique commits on this PR (salvage candidates):")
        for sha, subject in report.ahead_commits:
            print(f"    {sha} {subject}")
    if report.changed_files:
        print("  Files this PR changes vs main:")
        for path in report.changed_files[:20]:
            print(f"    {path}")
        if len(report.changed_files) > 20:
            print(f"    ... and {len(report.changed_files) - 20} more")
    if report.deleted_if_merged:
        print("  [WARN] Merging now would DELETE these paths that exist on main:")
        for path in report.deleted_if_merged[:15]:
            print(f"    {path}")
        if len(report.deleted_if_merged) > 15:
            print(f"    ... and {len(report.deleted_if_merged) - 15} more")


def prompt_yes_no_item(prompt: str, batch: str | None) -> tuple[bool | None, str | None]:
    """Return (decision, new_batch). decision True=yes, False=no, None=cancelled."""
    if batch == "yes":
        return True, batch
    if batch == "no":
        return False, batch
    while True:
        answer = input(f"{prompt} [y/n/ay/ya/an/na]: ").strip()
        parsed = parse_yes_no_answer(answer)
        if parsed == "yes":
            return True, batch
        if parsed == "no":
            return False, batch
        if parsed == "all_yes":
            return True, "yes"
        if parsed == "all_no":
            return False, "no"
        print("[WARN] Enter y, n, ay, ya, an, or na.")


def close_pr_with_comment(pr_number: int, comment: str) -> bool:
    result = run_cmd(["gh", "pr", "close", str(pr_number), "--comment", comment])
    if result.returncode != 0:
        print_command_failure(["gh", "pr", "close", str(pr_number), "--comment", comment], result)
        return False
    print(f"[OK] Closed PR #{pr_number}.")
    return True


def port_commits_to_new_branch(commits: list[tuple[str, str]], pr_number: int) -> None:
    if not commits:
        print("[STOP] No commits to port.")
        return

    print()
    print(f"=== Port salvage commits from PR #{pr_number} ===")
    print("Commits:")
    for index, (sha, subject) in enumerate(commits, start=1):
        print(f"  {index}. {sha} {subject}")
    print_interactive_shortcuts_banner("pick commits to cherry-pick")

    selected: list[str] = []
    batch: str | None = None
    for index, (sha, subject) in enumerate(commits, start=1):
        label = f"Port commit {index}/{len(commits)}: {sha} {subject}"
        decision, batch = prompt_yes_no_item(label, batch)
        if decision is True:
            selected.append(sha)

    if not selected:
        print("[STOP] No commits selected. Nothing was ported.")
        return

    branch_name = input("\nNew branch name (from latest main): ").strip()
    if not validate_branch_name(branch_name):
        return

    print()
    print("Commands that will run:")
    print_command(["git", "fetch", "origin"])
    print_command(["git", "checkout", "main"])
    print("  $ git pull origin main  (or reset --hard if you used sync-main with ay/ya)")
    print_command(["git", "checkout", "-b", branch_name])
    for sha in selected:
        print_command(["git", "cherry-pick", sha])
    print_command(["git", "push", "-u", "origin", branch_name])
    print()
    print("After cherry-picks, run tests, then menu option 3 to open a new PR.")

    if not confirm_or_stop("Confirm you understand cherry-picks may conflict and need manual fix."):
        return

    if not sync_main_with_github(skip_status=True):
        return

    run_cmd(["git", "checkout", "-b", branch_name], check=True)
    for sha in selected:
        pick = run_cmd(["git", "cherry-pick", sha])
        if pick.returncode != 0:
            print_command_failure(["git", "cherry-pick", sha], pick)
            print("[FAIL] Fix conflicts, then `git cherry-pick --continue` or `git cherry-pick --abort`.")
            return
    push = run_cmd(["git", "push", "-u", "origin", branch_name])
    if push.returncode != 0:
        print_command_failure(["git", "push", "-u", "origin", branch_name], push)
        return
    print(f"[OK] Ported {len(selected)} commit(s) onto `{branch_name}`. Use menu 3 to open a new PR.")


def triage_open_prs() -> None:
    print_status()
    prs = list_open_prs()
    if not prs:
        print()
        print("[INFO] No open pull requests.")
        return

    print()
    print("=== Triage open pull requests ===")
    print("This compares each open PR to current GitHub main — without merging.")
    print("Use this when drafts look old (for example #13 gameplay, #14 docs) but you still want")
    print("to salvage ideas into a fresh branch and close the stale PR.")
    print_interactive_shortcuts_banner("close PRs or pick commits to port")

    run_cmd(["git", "fetch", "origin", "main"])
    reports: list[PrTriageReport] = []
    for pr in prs:
        report = analyze_open_pr(pr)
        if report:
            reports.append(report)
            print_pr_triage_report(report)

    print()
    print("=== Triage actions ===")
    print("  1. Report only (done — no changes)")
    print("  2. Close PRs without merge (asks per PR; ay/ya = close all remaining)")
    print("  3. Port salvage commits to a new branch from main")
    print("  4. Return to main menu")
    action = input("Choose 1-4: ").strip()

    if action == "2":
        default_comment = (
            "Closed via SPRK workflow triage: superseded by main or replaced by a fresh branch. "
            "Salvage commits were ported separately if still needed."
        )
        print(f"Default close comment: {default_comment}")
        comment = input("Close comment (Enter for default): ").strip() or default_comment
        batch: str | None = None
        for report in reports:
            prompt = f"Close PR #{report.number} ({report.verdict}) without merging?"
            decision, batch = prompt_yes_no_item(prompt, batch)
            if decision:
                close_pr_with_comment(report.number, comment)
    elif action == "3":
        pr_pick = input("PR number to port commits from: ").strip().lstrip("#")
        if not pr_pick.isdigit():
            print("[STOP] PR number must be numeric.")
            return
        target = next((r for r in reports if r.number == int(pr_pick)), None)
        if not target:
            refreshed = fetch_pr(pr_pick)
            if refreshed:
                target = analyze_open_pr(refreshed)
        if not target or not target.ahead_commits:
            print("[STOP] Could not find salvage commits for that PR.")
            return
        port_commits_to_new_branch(target.ahead_commits, target.number)
    elif action == "4":
        return
    else:
        print()
        print("[INFO] No GitHub changes made. Use menu 4 only when triage says merge is safe.")


def print_status() -> None:
    print()
    print("=== SPRK Workflow Status ===")
    print(f"Current branch: {current_branch()}")

    git_status = changed_files()
    if git_status:
        print()
        print("Changed files:")
        for line in git_status:
            print(f"  {line}")
    else:
        print("Changed files: none")

    user = current_user()
    print(f"GitHub user: {user or 'not authenticated or gh unavailable'}")

    prs = gh_json([
        "pr",
        "list",
        "--state",
        "open",
        "--limit",
        "8",
        "--json",
        "number,title,headRefName,baseRefName,isDraft,reviewDecision",
    ])
    if isinstance(prs, list):
        print()
        print("Open pull requests (run menu 7 to triage — do not merge stale PRs blindly):")
        if not prs:
            print("  none")
        else:
            for pr in prs:
                draft = "draft" if pr.get("isDraft") else "ready"
                print(
                    f"  #{pr.get('number')} [{draft}] {pr.get('title')} "
                    f"({pr.get('headRefName')} -> {pr.get('baseRefName')})"
                )
            print("  Tip: menu 7 analyzes each PR vs main, can close superseded drafts, and can")
            print("  cherry-pick salvage commits onto a new branch for your next PR.")
    else:
        print()
        print("Open pull requests: unavailable because `gh` is not authenticated or failed.")

    print_interactive_shortcuts_banner("menu 5 sync-main file prompts; menu 7 triage/close/port")


def explain_start_branch(branch_name: str) -> None:
    print()
    print("=== Start New Work: What Will Happen ===")
    print("This creates a safe feature branch from the latest `main`.")
    print("If you have uncommitted local files, the helper will ask file-by-file first (y/n/ay/ya/an/na).")
    print("Commands that will run:")
    print_command(["git", "fetch", "origin"])
    print_command(["git", "checkout", "main"])
    print("  $ git pull origin main")
    print("    (or `git reset --hard origin/main` if you discard all local edits)")
    print_command(["git", "checkout", "-b", branch_name])
    print()
    print("This does not commit, push, approve, or merge anything.")


def validate_branch_name(branch_name: str) -> bool:
    if not BRANCH_RE.match(branch_name):
        print("[STOP] Branch names should be lowercase letters, numbers, dots, dashes, underscores, or slashes.")
        print("Example: maya-space-invaders-fix")
        return False
    if branch_name in {"main", "master"}:
        print("[STOP] Do not create work directly on main/master.")
        return False
    return True


def start_branch(branch_name: str | None = None) -> None:
    print_status()
    branch_name = branch_name or input("\nNew branch name: ").strip()
    if not validate_branch_name(branch_name):
        return
    explain_start_branch(branch_name)
    if not confirm_or_stop("Confirm you understand this will switch branches and create a new branch."):
        return
    if not sync_main_with_github(skip_status=True, from_start_branch=True):
        return
    run_cmd(["git", "checkout", "-b", branch_name], check=True)
    print(f"[OK] You are now on branch `{branch_name}`.")


def explain_sync_main(to_discard: list[str], to_keep: list[str], hard_reset: bool) -> None:
    print()
    print("=== Sync Main With GitHub: What Will Happen ===")
    print("This updates your local `main` branch to match GitHub.")
    print("Commands that will run:")
    print_command(["git", "fetch", "origin"])
    print_command(["git", "checkout", "main"])
    for path in to_discard:
        print_command(["git", "checkout", "origin/main", "--", path])
    if hard_reset:
        print_command(["git", "reset", "--hard", "origin/main"])
    else:
        print_command(["git", "pull", "origin", "main"])
    if to_keep:
        print()
        print("Files that will keep your local edits:")
        for path in to_keep:
            print(f"  {path}")
    print()
    print("Learning note: discard = your uncommitted edits for that file are removed permanently.")


def sync_main_with_github(skip_status: bool = False, from_start_branch: bool = False) -> bool:
    """
    Match local main to origin/main, resolving uncommitted file conflicts interactively.
    Returns True if sync completed (or was not needed), False if aborted.
    """
    if not skip_status:
        print_status()

    dirty = dirty_tracked_files()
    to_discard: list[str] = []
    to_keep: list[str] = []

    if dirty:
        choice = choose_files_to_discard(dirty)
        if choice is None:
            return False
        to_discard, to_keep = choice
        if to_keep:
            print()
            print("[INFO] Keeping local edits for:")
            for path in to_keep:
                print(f"  {path}")

    hard_reset = not to_keep
    if dirty:
        explain_sync_main(to_discard, to_keep, hard_reset)
        if not confirm_or_stop(
            "Confirm you understand this will change local files and update main from GitHub."
        ):
            return False
    else:
        print()
        print("=== Sync Main With GitHub ===")
        print("No uncommitted tracked files. Fetching and updating main only.")
        print_command(["git", "fetch", "origin"])
        print_command(["git", "checkout", "main"])
        print_command(["git", "pull", "origin", "main"])
        if not confirm_or_stop("Confirm you understand this will switch to main and pull from GitHub."):
            return False

    fetch = run_cmd(["git", "fetch", "origin"])
    if fetch.returncode != 0:
        print_command_failure(["git", "fetch", "origin"], fetch)
        return False

    checkout = run_cmd(["git", "checkout", "main"])
    if checkout.returncode != 0:
        print_command_failure(["git", "checkout", "main"], checkout)
        print("[FAIL] Could not switch to main. Resolve the files above, then run sync again.")
        return False

    for path in to_discard:
        restore = run_cmd(["git", "checkout", "origin/main", "--", path])
        if restore.returncode != 0:
            print_command_failure(["git", "checkout", "origin/main", "--", path], restore)
            return False

    if hard_reset:
        reset = run_cmd(["git", "reset", "--hard", "origin/main"])
        if reset.returncode != 0:
            print_command_failure(["git", "reset", "--hard", "origin/main"], reset)
            return False
    else:
        pull = run_cmd(["git", "pull", "origin", "main"])
        if pull.returncode != 0:
            print()
            print("[FAIL] `git pull` is still blocked.")
            print("Files you kept local may conflict with GitHub. Run sync again and choose y or ay for them,")
            print("or save them on a feature branch (menu option 2, then 3).")
            if pull.stdout:
                print(pull.stdout)
            if pull.stderr:
                print(pull.stderr)
            return False

    if from_start_branch:
        print("[OK] Local `main` matches GitHub. Creating your work branch next.")
    else:
        print("[OK] Local `main` is synced with GitHub (`origin/main`).")
    return True


def explain_submit_work(commit_message: str) -> None:
    print()
    print("=== Save And Open PR: What Will Happen ===")
    print("This takes the current changed files, creates one commit, pushes the branch, and opens a PR.")
    print("Commands that will run:")
    print_command(["git", "add", "-A"])
    print_command(["git", "commit", "-m", commit_message])
    print_command(["git", "push", "-u", "origin", current_branch()])
    print_command(["gh", "pr", "create", "--title", commit_message, "--body", "..."])
    print()
    print("Learning note: `git add -A` stages all current changes shown in status.")
    print("If unrelated files are listed above, stop now and clean them up before submitting.")


def submit_work(commit_message: str | None = None) -> None:
    print_status()
    branch = current_branch()
    if branch in {"main", "master"}:
        print("[STOP] You are on main/master. Create a feature branch first.")
        return
    changes = changed_files()
    if not changes:
        print("[STOP] There are no changed files to commit.")
        return
    commit_message = commit_message or input("\nCommit / PR title: ").strip()
    if not commit_message:
        print("[STOP] Commit message cannot be empty.")
        return
    explain_submit_work(commit_message)
    if not confirm_or_stop("Confirm you understand this will commit, push, and create a pull request."):
        return
    run_cmd(["git", "add", "-A"], check=True)
    commit = run_cmd(["git", "commit", "-m", commit_message])
    if commit.returncode != 0:
        print_command_failure(["git", "commit", "-m", commit_message], commit)
        return
    run_cmd(["git", "push", "-u", "origin", branch], check=True)
    pr_body = (
        "Created with the SPRK guided workflow helper after the student "
        "reviewed status and confirmed the submit action."
    )
    result = run_cmd(["gh", "pr", "create", "--title", commit_message, "--body", pr_body])
    if result.returncode != 0:
        print_command_failure(["gh", "pr", "create", "--title", commit_message, "--body", pr_body], result)
        return
    print(result.stdout)
    print("[OK] Pull request created.")


def fetch_pr(pr_number: str) -> dict | None:
    payload = gh_json([
        "pr",
        "view",
        pr_number,
        "--json",
        "number,title,author,headRefName,baseRefName,isDraft,mergeable,reviewDecision,url,files",
    ])
    return payload if isinstance(payload, dict) else None


def print_pr_summary(pr: dict) -> None:
    print()
    print("=== Pull Request Summary ===")
    print(f"PR: #{pr.get('number')} {pr.get('title')}")
    print(f"URL: {pr.get('url')}")
    print(f"Author: {(pr.get('author') or {}).get('login')}")
    print(f"Branch: {pr.get('headRefName')} -> {pr.get('baseRefName')}")
    print(f"Draft: {pr.get('isDraft')}")
    print(f"Mergeable: {pr.get('mergeable')}")
    print(f"Review decision: {pr.get('reviewDecision')}")
    print()
    print("Files changed:")
    for file_info in pr.get("files", []):
        print(f"  {file_info.get('path')}")


def explain_approve(pr_number: str, merge_after: bool, merge_method: str) -> None:
    print()
    print("=== Approve / Merge: What Will Happen ===")
    print("This is intended for a teacher, admin, or repository maintainer.")
    print("Commands that may run:")
    print_command([
        "gh",
        "pr",
        "review",
        pr_number,
        "--approve",
        "-b",
        "Approved via SPRK guided workflow helper after explicit confirmation.",
    ])
    if merge_after:
        print_command(["gh", "pr", "merge", pr_number, f"--{merge_method}", "--delete-branch"])
    else:
        print("  (merge skipped unless you choose to merge)")
    print()
    print("Learning note: GitHub repository rules still apply. If required checks or reviews are missing,")
    print("GitHub may reject the approval or merge and explain what is still needed.")


def approve_pr(pr_number: str | None = None) -> None:
    print_status()
    pr_number = pr_number or input("\nPR number to review: ").strip().lstrip("#")
    if not pr_number.isdigit():
        print("[STOP] PR number must be numeric.")
        return

    pr = fetch_pr(pr_number)
    if not pr:
        print(f"[STOP] Could not load PR #{pr_number}.")
        return
    print_pr_summary(pr)

    user = current_user()
    author = (pr.get("author") or {}).get("login")
    if user and author and user.lower() == author.lower():
        print()
        print("[WARN] You are the PR author.")
        print("GitHub rules may prevent approving your own PR. If this is a solo-maintainer repo,")
        print("you may still continue, but GitHub can reject the approval or merge.")
        if not confirm_or_stop(
            "Confirm you understand this is a self-approval attempt.",
            expected=SELF_APPROVE_TEXT,
        ):
            return

    merge_answer = input("\nMerge after approval? [y/N] ").strip().lower()
    merge_after = merge_answer in {"y", "yes"}
    merge_method = "squash"
    if merge_after:
        method_answer = input("Merge method: squash, merge, or rebase? [squash] ").strip().lower()
        if method_answer in {"merge", "rebase", "squash"}:
            merge_method = method_answer
        else:
            merge_method = "squash"

    explain_approve(pr_number, merge_after, merge_method)
    if not confirm_or_stop("Confirm you understand this may approve and possibly merge code into main."):
        return

    review = run_cmd([
        "gh",
        "pr",
        "review",
        pr_number,
        "--approve",
        "-b",
        "Approved via SPRK guided workflow helper after explicit confirmation.",
    ])
    if review.returncode != 0:
        print_command_failure(["gh", "pr", "review", pr_number, "--approve"], review)
        return
    print("[OK] PR approved.")

    if merge_after:
        merge = run_cmd(["gh", "pr", "merge", pr_number, f"--{merge_method}", "--delete-branch"])
        if merge.returncode != 0:
            print_command_failure(["gh", "pr", "merge", pr_number, f"--{merge_method}", "--delete-branch"], merge)
            return
        print("[OK] PR merged.")


def print_menu() -> None:
    print()
    print("=== SPRK Guided Workflow Menu ===")
    print("  Shortcuts when asked y/n: ay or ya = all yes | an or na = all no  (see MERIT.instructions)")
    print("1. Show status again")
    print("2. Start new work branch (syncs main first; per-file ay/ya if local edits block pull)")
    print("3. Save current work and open PR")
    print("4. Review / approve / optionally merge a PR (only when triage says it is safe)")
    print("5. Sync local main with GitHub (lists dirty files; y/n/ay/ya/an/na per file)")
    print("6. Triage open PRs (analyze vs main, close without merge, port commits to new branch)")
    print("7. Exit")


def menu() -> None:
    print_status()
    while True:
        print_menu()
        choice = input("Choose 1-7: ").strip()
        if choice == "1":
            print_status()
        elif choice == "2":
            start_branch()
        elif choice == "3":
            submit_work()
        elif choice == "4":
            print()
            print("[TIP] If open PRs may be stale, run option 6 first. Option 4 merges into main.")
            approve_pr()
        elif choice == "5":
            sync_main_with_github()
        elif choice == "6":
            triage_open_prs()
        elif choice == "7":
            print("Goodbye.")
            return
        else:
            print("Choose a number from 1 to 7.")


def main() -> None:
    parser = argparse.ArgumentParser(description="SPRK guided GitHub workflow helper")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("status", help="Show current branch, changed files, user, and open PRs")
    branch_parser = subparsers.add_parser("branch", help="Create a new branch from latest main")
    branch_parser.add_argument("name", nargs="?", help="New branch name")
    submit_parser = subparsers.add_parser("submit", help="Commit current changes, push, and open a PR")
    submit_parser.add_argument("message", nargs="?", help="Commit message and PR title")
    approve_parser = subparsers.add_parser("approve", help="Approve and optionally merge a PR")
    approve_parser.add_argument("number", nargs="?", help="Pull request number")
    subparsers.add_parser(
        "sync-main",
        help="Update local main from GitHub; ask per file (y/n/ay/ya/an/na) when local edits block pull",
    )
    subparsers.add_parser(
        "triage-prs",
        help="Analyze open PRs vs main; close without merge or port commits to a new branch",
    )

    args = parser.parse_args()

    if not require_tool("git"):
        sys.exit(1)
    if args.command in {None, "status", "submit", "approve"} and not require_tool("gh"):
        print("[WARN] GitHub PR actions require the GitHub CLI. Status can still show local git state.")

    if args.command == "status":
        print_status()
    elif args.command == "branch":
        start_branch(args.name)
    elif args.command == "submit":
        submit_work(args.message)
    elif args.command == "approve":
        approve_pr(args.number)
    elif args.command == "sync-main":
        if not sync_main_with_github():
            sys.exit(1)
    elif args.command == "triage-prs":
        triage_open_prs()
    else:
        menu()


if __name__ == "__main__":
    main()
