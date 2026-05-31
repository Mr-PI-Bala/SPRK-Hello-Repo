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
from dataclasses import dataclass


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


def print_yes_no_help() -> None:
    print("  y/yes  = yes for this file only")
    print("  n/no   = no for this file only")
    print("  ay/ya  = all yes (this file and every remaining file)")
    print("  an/na  = all no (this file and every remaining file)")
    print("  (See MERIT.instructions: Interactive confirmation shortcuts.)")


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
        print("Open pull requests:")
        if not prs:
            print("  none")
        for pr in prs:
            draft = "draft" if pr.get("isDraft") else "ready"
            review = pr.get("reviewDecision") or "review unknown"
            print(
                f"  #{pr.get('number')} [{draft}] {pr.get('title')} "
                f"({pr.get('headRefName')} -> {pr.get('baseRefName')}, {review})"
            )
    else:
        print()
        print("Open pull requests: unavailable because `gh` is not authenticated or failed.")


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


def menu() -> None:
    print_status()
    while True:
        print()
        print("=== SPRK Guided Workflow Menu ===")
        print("1. Show status again")
        print("2. Start new work branch")
        print("3. Save current work and open PR")
        print("4. Review / approve / optionally merge a PR")
        print("5. Sync local main with GitHub (fix pull blocked by local edits)")
        print("6. Exit")
        choice = input("Choose 1-6: ").strip()
        if choice == "1":
            print_status()
        elif choice == "2":
            start_branch()
        elif choice == "3":
            submit_work()
        elif choice == "4":
            approve_pr()
        elif choice == "5":
            sync_main_with_github()
        elif choice == "6":
            print("Goodbye.")
            return
        else:
            print("Choose a number from 1 to 6.")


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
    else:
        menu()


if __name__ == "__main__":
    main()
