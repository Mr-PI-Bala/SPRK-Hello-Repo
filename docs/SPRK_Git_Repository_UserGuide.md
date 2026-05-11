# SPRK Git Repository User Guide
This is the master SPRK guide for GitHub accounts, repository access, branches, commits, pushes, and pull requests.

## Table Of Contents
- [SPRK GitHub Account Pattern](#sprk-github-account-pattern)
- [Find A Repository](#find-a-repository)
- [Request Access To A Working Repository](#request-access-to-a-working-repository)
- [Access Request Interaction Flow](#access-request-interaction-flow)
- [Accept A Pending Invitation](#accept-a-pending-invitation)
- [Create Your Branch](#create-your-branch)
- [Commit And Push](#commit-and-push)
- [Open A Pull Request](#open-a-pull-request)
- [Personal Repository Permissions](#personal-repository-permissions)
- [Organization Repository Permissions](#organization-repository-permissions)

## SPRK GitHub Account Pattern
SPRK member accounts use a consistent clan-style identity.

- Public profile name: `FirstName SPRK`
- GitHub username: `FirstName-SPRK`
- Email pattern when available: `firstname.SPRK@gmail.com`
- Branch name: GitHub username in lowercase, such as `<yourname-sprk>`

Example:

- Public profile name: `Maya SPRK`
- GitHub username: `Maya-SPRK`
- Email: `maya.SPRK@gmail.com` when available
- Branch name: `maya-sprk`

In copy/paste snippets, replace `<YourName>-SPRK` and `<yourname-sprk>` with your own values. For Maya, those values are `Maya-SPRK` and `maya-sprk`.

If you convert an existing GitHub account, update old bookmarks, Codespaces sign-in, local remotes, and connected tools. If the account already has important prior work, create a new SPRK account instead.

## Find A Repository
Start from the public doorway:

```text
https://github.com/Mr-PI-Bala/SPRK-Welcome
```

Working repositories use normal GitHub URLs:

```text
https://github.com/<owner>/<repository>
```

Clone URLs add `.git`:

```text
https://github.com/<owner>/<repository>.git
```

## Request Access To A Working Repository
Use GitHub Issues so the request is visible and trackable.

Fast path for the primary repository:

- [Request access to SPRK-Hello-Repo](https://github.com/Mr-PI-Bala/SPRK-Welcome/issues/new?title=Access%20request%3A%20%3CYourName%3E-SPRK%20branch%20access%20for%20SPRK-Hello-Repo&body=%23%23%20Access%20Request%0ARequester%3A%20%60%3CYourName%3E-SPRK%60%20(example%3A%20%60Maya-SPRK%60)%0ARepository%3A%20%60Mr-PI-Bala%2FSPRK-Hello-Repo%60%0ARequested%20access%3A%20%60Write%60%0ABranch%20name%3A%20%60%3Cyourname-sprk%3E%60%20(example%3A%20%60maya-sprk%60)%0A%0A%23%23%20Why%20this%20access%20is%20needed%0AI%20want%20to%20try%20SPRK%20hello%20projects%20and%20push%20my%20own%20branch%20for%20review.%0A%0A%23%23%20Boundaries%0AI%20will%20not%20push%20to%20%60main%60.%0AI%20will%20not%20merge%20pull%20requests.%0AI%20will%20open%20a%20Pull%20Request%20for%20SPRKTeacher%20or%20SPRKAdmin%20review.)

If the link does not work, use the manual steps below.

Steps:

1. Open the working repository.
2. Click `Issues`.
3. Click `New issue`.
4. Use a clear title.
5. Explain who you are, which branch you will use, and what access you need.
6. Submit the issue.

Example title:

```text
Access request: <YourName>-SPRK branch access for SPRK-Hello-Repo
```

Example body:

~~~md
## Access Request
Requester: `<YourName>-SPRK` (example: `Maya-SPRK`)
Repository: `Mr-PI-Bala/SPRK-Hello-Repo`
Requested access: `Write`
Branch name: `<yourname-sprk>` (example: `maya-sprk`)

## Why this access is needed
I am testing the SPRKStudent workflow and need to push my own branch for review.

## Boundaries
I will not push to `main`.
I will not merge pull requests.
I will open a Pull Request for SPRKTeacher or SPRKAdmin review.

## Owner Action
Open repository access settings:

https://github.com/Mr-PI-Bala/SPRK-Hello-Repo/settings/access

Add `<YourName>-SPRK` as collaborator.
~~~

## Access Request Interaction Flow
The GitHub issue is only the request ticket. It does not approve access by itself.

```mermaid
sequenceDiagram
    participant Student as Student<br/>Maya-SPRK
    participant Request as Request Ticket<br/>SPRK-Welcome Issue
    participant GitHub as GitHub<br/>Invitation System
    participant Leader as Repo Owner<br/>Mr-PI-Bala
    participant WorkRepo as Work Repo<br/>SPRK-Hello-Repo

    Student->>Request: Ask for access
    Request-->>Leader: Shows up as an open issue

    Leader->>Request: Read the request
    Leader->>WorkRepo: Go to Settings > Access
    Leader->>GitHub: Invite Student as collaborator

    GitHub-->>Student: Show pending invitation
    Student->>GitHub: Accept invitation

    GitHub-->>WorkRepo: Turn on collaborator access
    Leader->>WorkRepo: Confirm Student has access

    Leader->>Request: Add result comment
    Leader->>Request: Close the issue
```

Success state:

```mermaid
flowchart LR
    Student["Student<br/>Maya-SPRK"] -->|"Can open the private repository"| WorkRepo["SPRK-Hello-Repo"]
    Student -->|"Can clone or open Codespaces"| WorkRepo
    Student -->|"Can create and push own branch"| Branch["maya-sprk branch"]
    Branch -->|"Reviewed through Pull Request"| Main["main branch"]
    Leader["Mr-PI-Bala / SPRKAdmin"] -->|"Request verified, commented, closed"| Request["SPRK-Welcome access issue"]
```

Owner checklist:

1. Read the access request issue.
2. Open the requested repository's `Settings > Access` page.
3. Add the requester as a collaborator.
4. Wait for the requester to accept the GitHub invitation.
5. Verify the requester appears as an active collaborator.
6. Comment on the issue with the result.
7. Close the issue.

## Accept A Pending Invitation
After the owner adds you, GitHub may show a pending invitation.

Open the invitation from GitHub notifications or email, then accept it before trying to push.

If using GitHub CLI, check permission:

```bash
gh repo view Mr-PI-Bala/SPRK-Hello-Repo --json viewerPermission
```

## Create Your Branch
Pull the latest `main`, then create your branch.

```bash
git pull
git checkout -b <yourname-sprk>
```

Use your own GitHub username in lowercase as the branch name.

## Commit And Push
Run the repository check first.

```bash
python -m core.main --check
git status
git add .
git commit -m "Describe your change"
git push -u origin <yourname-sprk>
```

Commit messages should explain what changed. Use commits as checkpoints while learning.

## Open A Pull Request
After pushing your branch, open a Pull Request into `main`.

`SPRKTeacher` or `SPRKAdmin` reviews the work before it enters `main`.

## Personal Repository Permissions
For repositories under a personal GitHub account, adding a collaborator usually gives broad collaborator access. That is workable for trusted staff, but it is not ideal for fine-grained student roles.

For student workflows, keep `main` protected and require Pull Requests before merging.

## Organization Repository Permissions
For stronger role control, use an organization such as `AURAVYBE`.

Organization repositories can support clearer roles such as:

- Read
- Triage
- Write
- Maintain
- Admin

SPRK may later move working repositories into an organization when role-based controls become more important than personal-repo simplicity.
