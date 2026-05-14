import sys
import argparse
import subprocess
import json

def run_cmd(cmd, capture=False):
    result = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    if capture:
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    return result.returncode

def get_current_user():
    out, err, code = run_cmd("gh api user --json login", capture=True)
    if code != 0:
        print("\n[ERROR] Could not verify GitHub identity.")
        print("Please log in using: gh auth login")
        sys.exit(1)
    return json.loads(out).get("login")

def list_prs():
    print("\n📋 Pending Pull Requests:")
    run_cmd("gh pr list")

def approve_and_merge(pr_num=None):
    user = get_current_user()
    
    if not pr_num:
        pr_num = input("\nEnter PR number to review and merge: ").strip()
    if not pr_num:
        print("PR number cannot be empty.")
        return
    
    # Fetch PR author to enforce the No Self-Approval Rule
    out, err, code = run_cmd(f"gh pr view {pr_num} --json author", capture=True)
    if code != 0:
        print(f"\n[ERROR] Could not find PR #{pr_num}.")
        return
    
    try:
        pr_data = json.loads(out)
        pr_author = pr_data.get("author", {}).get("login")
    except json.JSONDecodeError:
        print("\n[ERROR] Error reading PR data from GitHub.")
        return
    
    if pr_author.lower() == user.lower():
        print(f"\n🚨 [ACCESS DENIED] You cannot grade your own homework!")
        print(f"'{user}' cannot approve a Pull Request created by '{pr_author}'.")
        print("Please ask another SPRKAdmin or SPRKTeacher to review this.")
        return
    
    print(f"\n✅ Approving PR #{pr_num} (authored by {pr_author})...")
    code = run_cmd(f'gh pr review {pr_num} --approve -b "Approved by {user} via SPRK Approver tool."')
    
    if code == 0:
        print(f"🔀 Merging PR #{pr_num} into main...")
        run_cmd(f"gh pr merge {pr_num} --merge --delete-branch")
        print("\n🎉 Success! The code is merged and the branch is cleaned up.")
    else:
        print("\n[ERROR] Failed to approve PR. Check your permissions.")

def interactive_menu():
    user = get_current_user()
    print(f"\n=== SPRK APPROVER TOOL ===")
    print(f"🎓 Logged in as: {user} (Admin/Teacher)")
    print("--------------------------")
    print("1. List pending reviews")
    print("2. Approve and Merge a PR")
    print("3. Exit")
    
    choice = input("\nSelect an option (1-3): ").strip()
    if choice == "1": list_prs()
    elif choice == "2": approve_and_merge()
    elif choice == "3": print("Goodbye!")
    else: print("Invalid choice.")

def main():
    parser = argparse.ArgumentParser(description="SPRK Teacher/Admin PR Tool")
    parser.add_argument("command", nargs="?", choices=["list", "merge"], help="Direct command to skip menu")
    parser.add_argument("pr_num", nargs="?", help="Pull Request number (for merge)")
    
    args = parser.parse_args()
    if args.command == "list": list_prs()
    elif args.command == "merge": approve_and_merge(args.pr_num)
    else: interactive_menu()

if __name__ == "__main__":
    main()