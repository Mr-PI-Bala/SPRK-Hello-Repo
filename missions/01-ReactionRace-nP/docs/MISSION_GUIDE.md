# Mission 01: ReactionRace
ReactionRace is the first recommended classroom mission because everyone can join quickly from a browser.

## Start Here
If you are new, follow these in order:

1. [Run the app](#how-to-run).
2. [Play one solo round](#play-it).
3. [Understand the entry point](#entry-point).
4. [Open the code files](#code-files).
5. [Make one small change](#change-it).
6. [Read the deeper walkthrough](CODE_WALKTHROUGH.md) when you want the full code explanation.

## Mission Navigation
| Need | Go Here |
| --- | --- |
| I want to run it | [How To Run](#how-to-run) |
| I want to play it | [Play It](#play-it) |
| I want to know where the app starts | [Entry Point](#entry-point) |
| I want to know which file to open | [Code Files](#code-files) |
| I want diagrams and function details | [CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md) |
| I need to create my branch first | [SPRK Git Repository User Guide](../../../docs/SPRK_Git_Repository_UserGuide.md#create-your-branch) |

## Standard SPRK Guidance
This working repository carries local copies of the shared SPRK guides in `../../../docs/`.

The public source for shared SPRK onboarding and governance is:

```text
https://github.com/Mr-PI-Bala/SPRK-Welcome
```

Students can always read `SPRK-Welcome` because it is public. Working repositories like this one may be private, so they keep local guide copies after access is approved.

## Mission Goal
Build a whole-class reaction game where students join from phones, tablets, Chromebooks, or laptops and compete on a live leaderboard.

## Open The App
The recommended classroom version uses `server.py`.

Open the app through the browser link created in [How To Run](#how-to-run).

Code starting point:

```text
missions/01-ReactionRace-nP/index.html
```

`index.html` is still the page, but `server.py` is what makes the shared scoreboard work across devices.

## How To Run
ReactionRace is a browser app with a tiny Python backend.

The frontend is what students see in the browser. The backend is `server.py`, and it keeps one shared classroom scoreboard.

```mermaid
flowchart LR
    A["Editor<br/>(Codespaces or VS Code)"] --> B["Terminal<br/>(type commands)"]
    B --> C["Mission folder<br/>(go to this app)"]
    C --> D["python server.py<br/>(runs index.html and scores API)"]
    D --> E["Browser link<br/>(play the shared game)"]
```

Plain version:

```text
Editor (Codespaces or VS Code)
  -> Terminal (type commands)
  -> Mission folder (go to this app)
  -> python server.py (runs index.html and the shared scores API)
  -> Browser link (play the shared game)
```

### Run From Codespaces
Use this path on iPad, Chromebook, or any browser device that can open Codespaces.

1. Open `SPRK-Hello-Repo` in Codespaces.
2. Open the terminal.
3. Run:

```bash
cd missions/01-ReactionRace-nP
python server.py
```

4. Open the `Ports` tab.
5. Open the forwarded port for `8000`.
6. The browser should show ReactionRace.

The Codespaces link will look something like:

```text
https://<your-codespace-name>-8000.app.github.dev
```

That link means:

- `8000` is the port where `server.py` is running.
- `app.github.dev` is GitHub's browser access to your Codespace.
- Opening the link shows `index.html`.
- Scores go through `/api/scores`, which is handled by `server.py`.

### Run From VS Code Desktop
Use this path on a laptop with the repository cloned locally.

1. Open the repository in VS Code.
2. Open the terminal.
3. Run:

```bash
cd missions/01-ReactionRace-nP
python server.py
```

4. Open:

```text
http://localhost:8000
```

That link means:

- `localhost` is your own laptop.
- `8000` is the port where `server.py` is running.
- Opening the link shows `index.html`.
- Scores go through `/api/scores`, which is handled by `server.py`.

### Run From A Classroom Host Laptop
Use this path when one laptop hosts the app and other devices join from a browser.

```mermaid
flowchart TB
    subgraph HostRow["Host row"]
        Host["Host laptop<br/>(runs index.html)"]
    end
    subgraph NetworkRow["Network row"]
        Network["Same network<br/>(school Wi-Fi or SPRK Laptop Network)"]
    end
    subgraph StudentRow["Student devices"]
        Chromebook["Chromebook"]
        IPad["iPad"]
        Phone["Phone"]
        Laptop["Student laptop"]
    end
    Host --> Network
    Network --> Chromebook
    Network --> IPad
    Network --> Phone
    Network --> Laptop
```

Plain version:

```text
Host laptop (runs index.html)
  -> same network (school Wi-Fi or SPRK Laptop Network)
     -> Chromebook opens http://<host-laptop-ip>:8000
     -> iPad opens http://<host-laptop-ip>:8000
     -> phone opens http://<host-laptop-ip>:8000
     -> student laptop opens http://<host-laptop-ip>:8000
```

1. Connect the host laptop and student devices to the same network.
2. On the host laptop, run:

```bash
cd missions/01-ReactionRace-nP
python server.py
```

3. Find the host laptop IP address.
4. Student devices open:

```text
http://<host-laptop-ip>:8000
```

Example:

```text
http://192.168.1.25:8000
```

That link means:

- `192.168.1.25` is an example host laptop IP address.
- `8000` is the port where `server.py` is running.
- Every student device must be on the same network to open this link.
- Everyone who opens the same host link uses the same shared scoreboard.

If the page does not open from another device, the network or firewall may be blocking device-to-device traffic.

## Entry Point
Start with `index.html`.

That file is the front door for this mission. The browser opens `index.html`, then `index.html` loads the other files.

```text
index.html
  |
  |-- loads src/styles.css
  |
  |-- loads src/app.js
  |
  |-- talks to server.py through /api/scores
```

Simple meaning:

- `index.html` decides what is on the page.
- `src/styles.css` decides how the page looks.
- `src/app.js` decides how the game behaves.
- `server.py` stores the shared classroom scoreboard.

## Code Files
Open these files from the mission folder:

| File | Link | What To Look For |
| --- | --- | --- |
| Page structure | [index.html](../index.html) | The title, player name input, big button, scoreboard, and student notes. |
| Game behavior | [src/app.js](../src/app.js) | Functions such as `startRound()`, `recordTap()`, and `handleEarlyTap()`. |
| Visual design | [src/styles.css](../src/styles.css) | Color variables, button size, layout, and phone/tablet rules. |
| Shared backend | [server.py](../server.py) | The API that stores and returns the classroom scoreboard. |
| Deep explanation | [CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md) | Diagrams, function table, and the main click flow. |

Recommended first code reading path:

```text
index.html
  -> find the big button
  -> src/app.js
  -> find what happens when the button is clicked
  -> src/styles.css
  -> find the button colors
```

## How The Files Work Together
```mermaid
flowchart LR
    HTML["index.html<br/>page parts"] --> CSS["src/styles.css<br/>colors and layout"]
    HTML --> JS["src/app.js<br/>game actions"]
    JS --> API["server.py<br/>shared scores API"]
    API --> JS
    JS --> Page["Browser page<br/>button, messages, scores"]
    CSS --> Page
```

Plain version:

```text
index.html creates the game parts
  -> styles.css makes the game readable and touch-friendly
  -> app.js listens for taps
  -> server.py stores the shared classroom score
  -> app.js redraws the score
  -> the browser shows the result
```

## What Each File Does
| File | Student Meaning | Good First Change |
| --- | --- | --- |
| `index.html` | The page skeleton. It has the title, name box, button, scoreboard, and notes. | Change a heading or instruction sentence. |
| `src/styles.css` | The style file. It controls colors, spacing, button size, and phone/tablet layout. | Change a color variable like `--go`. |
| `src/app.js` | The frontend game brain. It starts rounds, waits, checks taps, and asks the backend to save scores. | Change button text or the default player name. |
| `server.py` | The backend. It serves the page files and stores one shared classroom scoreboard. | Change `MAX_SCORES` after you understand the flow. |
| `docs/CODE_WALKTHROUGH.md` | The deeper explanation. It has function notes and diagrams. | Read this when you want to understand the code flow. |

## Game Flow
```mermaid
stateDiagram-v2
    [*] --> Ready
    Ready --> Waiting: Start Round
    Waiting --> Ready: Tap too early
    Waiting --> Go: Random timer finishes
    Go --> Result: Tap green button
    Result --> Ready: Score is saved
```

Plain version:

```text
Ready
  Student taps Start Round

Waiting
  Student must wait and not tap early

Go
  Button turns green

Result
  App saves the reaction time

Ready
  Student can start again
```

## Mode
`nP`: many players.

## Play It
Join the facilitator's game link and try one reaction round.

### Solo Test
Use this when one person is testing on one device.

1. Type your player name.
2. Select `Use Name`.
3. Select `Start Round`.
4. Wait for the button to turn green.
5. Tap as fast as you can.
6. Try again and beat your own best score.

### Group Test With Different Devices
Use this when a facilitator shares the app link with multiple students.

1. Facilitator runs the app from Codespaces or a host laptop.
2. Facilitator shares the app link.
3. Each student opens the link on a phone, tablet, Chromebook, or laptop.
4. Each student types their own player name.
5. Each student runs one or more reaction rounds.
6. Students compare scores out loud or from the visible scoreboard on their own device.

Important current limit:

Everyone must use the same backend link to share scores.

If one student opens one Codespaces link and another student opens a different Codespaces link, those are different backends and the scores will not combine.

## Frontend And Backend
This mission now has both a frontend and a backend.

```mermaid
flowchart TD
    DeviceA["Chromebook browser"] --> Backend["server.py<br/>shared backend"]
    DeviceB["iPad browser"] --> Backend
    DeviceC["Phone browser"] --> Backend
    Backend --> Score["One shared scoreboard"]
    Score --> DeviceA
    Score --> DeviceB
    Score --> DeviceC
```

Plain version:

```text
Chromebook, iPad, phone, or laptop browser
  -> same server.py backend link
  -> one shared scoreboard
  -> updated scores show on each browser
```

What the frontend does:

- Shows the page.
- Handles taps.
- Measures reaction time.
- Sends scores to the backend.
- Redraws the scoreboard it gets back from the backend.

What the backend does:

- Serves `index.html`, `src/styles.css`, and `src/app.js`.
- Receives scores at `/api/scores`.
- Stores one shared scoreboard while `server.py` is running.
- Sends updated scores back to every browser that asks for them.
- The browser asks for updated scores every few seconds so other players appear without a manual reload.

Shared-score flow:

```mermaid
flowchart TD
    DeviceA["Student device A<br/>(tap score)"] --> Backend["server.py<br/>(save score)"]
    DeviceB["Student device B"] --> Backend
    DeviceC["Student device C"] --> Backend
    Backend --> SharedScore["Shared classroom scoreboard"]
    SharedScore --> DeviceA
    SharedScore --> DeviceB
    SharedScore --> DeviceC
```

Plain version:

```text
Student device browser
  |
  v
Backend server on Codespaces or host laptop
  |
  v
Shared classroom scoreboard
```

## Change It
Change one visible setting, such as the round label, button text, reaction message, or leaderboard title.

Good first files to inspect:

- [index.html](../index.html): page structure.
- [src/app.js](../src/app.js): game behavior.
- [src/styles.css](../src/styles.css): colors, spacing, and layout.
- [CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md): diagrams and function explanations.

## Show It
Run the changed version and show that the browser display changed.

## Level It Up
Add player names, teams, score history, or a new round type.

## Branch Reminder
Create your branch before editing files.

Guide: [SPRK Git Repository User Guide](../../../docs/SPRK_Git_Repository_UserGuide.md#create-your-branch)
