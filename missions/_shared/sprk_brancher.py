"""
SPRK Developer Branching Tool.
"""
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

def start_work(branch_name=None):
    if not branch_name:
        branch_name = input("\nEnter new branch name (e.g., maya-ui-fix): ").strip()
    if not branch_name:
        print("Branch name cannot be empty.")
        return
    
    print("\n🚀 Starting fresh on main...")
    run_cmd("git checkout main")
    run_cmd("git pull origin main")
    
    print(f"\n🌱 Creating and switching to branch: {branch_name}")
    run_cmd(f"git checkout -b {branch_name}")
    print(f"\n✅ Ready! You are now working safely in '{branch_name}'.")

def submit_work(message=None):
    out, err, code = run_cmd("git branch --show-current", capture=True)
    current_branch = out
    if current_branch == "main":
        print("\n[ERROR] You are on 'main'. Please create a branch first using option 1.")
        return

    if not message:
        message = input("\nEnter a short message explaining your changes: ").strip()
    if not message:
        print("Message cannot be empty.")
        return

    print("\n💾 Saving work locally...")
    run_cmd("git add .")
    run_cmd(f'git commit -m "{message}"')
    
    print(f"\n☁️ Pushing '{current_branch}' to GitHub...")
    run_cmd(f"git push -u origin {current_branch}")
    
    print("\n📬 Requesting review (Creating Pull Request)...")
    run_cmd(f'gh pr create --title "{message}" --body "Automated PR submission by SPRK Brancher tool."')
    print("\n✅ Success! Your code has been sent to the SPRKAdmin for approval.")

def sync_work():
    print("\n🔄 Cleaning up and syncing back to main baseline...")
    run_cmd("git checkout main")
    run_cmd("git pull origin main")
    print("\n✅ Sync complete. You are on the latest approved code.")

def interactive_menu():
    user = get_current_user()
    print(f"\n=== SPRK DEVELOPER TOOL ===")
    print(f"👤 Logged in as: {user}")
    print("---------------------------")
    print("1. Start new work (Create Branch)")
    print("2. Save and submit for review (Push & PR)")
    print("3. Clean up and sync (Back to Main)")
    print("4. Exit")
    
    choice = input("\nSelect an option (1-4): ").strip()
    if choice == "1":
        start_work()
    elif choice == "2":
        submit_work()
    elif choice == "3":
        sync_work()
    elif choice == "4":
        print("Goodbye!")
    else:
        print("Invalid choice.")

def main():
    parser = argparse.ArgumentParser(description="SPRK Developer Branching Tool")
    parser.add_argument("command", nargs="?", choices=["start", "submit", "sync"], help="Direct command to skip menu")
    parser.add_argument("arg", nargs="?", help="Branch name (for start) or Commit message (for submit)")
    
    args = parser.parse_args()
    
    if args.command == "start": start_work(args.arg)
    elif args.command == "submit": submit_work(args.arg)
    elif args.command == "sync": sync_work()
    else: interactive_menu()

if __name__ == "__main__":
    main()