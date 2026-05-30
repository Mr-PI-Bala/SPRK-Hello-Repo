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
    print("Commands that will run:")
    print_command(["git", "checkout", "main"])
    print_command(["git", "pull", "origin", "main"])
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
    run_cmd(["git", "checkout", "main"], check=True)
    run_cmd(["git", "pull", "origin", "main"], check=True)
    run_cmd(["git", "checkout", "-b", branch_name], check=True)
    print(f"[OK] You are now on branch `{branch_name}`.")


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
        print("5. Exit")
        choice = input("Choose 1-5: ").strip()
        if choice == "1":
            print_status()
        elif choice == "2":
            start_branch()
        elif choice == "3":
            submit_work()
        elif choice == "4":
            approve_pr()
        elif choice == "5":
            print("Goodbye.")
            return
        else:
            print("Choose a number from 1 to 5.")


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
    else:
        menu()


if __name__ == "__main__":
    main()
