# SPRK Browser Testing And Network Architecture
This guide explains how SPRK browser missions run, how automated validation works, and how a facilitator laptop can host a mission for phones, tablets, and other laptops on the same local network.

Mission 10, `10-Space-Invaders`, is the example throughout this document.

## Visual Map
Use this map when you want to jump to the diagram that answers your question.

| Question | Best Visual |
| --- | --- |
| Where is the code running when I use Cursor in a browser? | [Big Picture: Browser To Cursor Cloud To GitHub](#big-picture-browser-to-cursor-cloud-to-github) |
| Which command installs which thing? | [Command Dependency Graph](#command-dependency-graph) |
| What exactly happens during `npm run test:spaceinvaders`? | [Automated Validation Harness](#automated-validation-harness) |
| What objects exist in a browser mission? | [Runtime Architecture For A Browser Mission](#runtime-architecture-for-a-browser-mission) |
| How does Mission 10 keep state across 2D, 3D, and FPS? | [Mission 10 Object Model](#mission-10-object-model) |
| How does browser state move through the backend? | [Runtime Data Lifecycle](#runtime-data-lifecycle) |
| Why do phones not use `127.0.0.1`? | [Why `127.0.0.1` Does Not Reach The Laptop Next To You](#why-127001-does-not-reach-the-laptop-next-to-you) |
| How do iPhone, iPad, Android, and other laptops connect to the facilitator laptop? | [Local Network Object Interaction](#local-network-object-interaction) |

## Quick Vocabulary
| Term | Meaning |
| --- | --- |
| Cursor Cloud Agent | A remote Linux machine controlled through the Cursor browser experience. It edits files, runs commands, commits, pushes, and can run tests. |
| GitHub | The source-code home for the repository. GitHub stores branches, commits, and pull requests. It does not automatically run the live Python game server. |
| Backend | The Python process started by `server.py`. It serves the game page and handles `/api/state`, `/api/scores`, and `/api/events`. |
| Frontend | The browser page: `index.html`, `src/styles.css`, and `src/app.js`. |
| Playwright | The automated browser testing tool used by this repo. |
| Chromium | The browser engine Playwright downloads and controls for tests. |
| `127.0.0.1` / `localhost` | "This same device." It never means "the laptop next to me." |
| LAN IP | The local Wi-Fi or Ethernet address of a machine, such as `192.168.1.42`. Other devices on the same network use this to connect to a facilitator laptop. |

## Big Picture: Browser To Cursor Cloud To GitHub
When you use Cursor in a browser from a Windows laptop, the code usually runs on a remote Cursor Cloud machine, not directly on the laptop in front of you.

```mermaid
flowchart TD
    User["Student or facilitator<br>Windows laptop browser"] --> CursorUI["Cursor Web UI"]
    CursorUI --> Agent["Cursor Cloud Agent<br>remote Linux VM"]
    Agent --> Workspace["/workspace<br>git checkout"]
    Workspace --> Mission["missions/10-Space-Invaders"]
    Agent --> GitHub["GitHub<br>Mr-PI-Bala/SPRK-Hello-Repo"]
    Agent --> Node["Node.js and npm"]
    Agent --> Python["python3"]
    Agent --> Playwright["Playwright test runner"]
    Playwright --> Chromium["Headless Chromium test browser"]
```

### Object Interaction Diagram: Cursor Cloud Work Session
```mermaid
sequenceDiagram
    participant Human as Human on Windows laptop
    participant Browser as Browser tab
    participant Cursor as Cursor Web UI
    participant Agent as Cursor Cloud Agent
    participant FS as /workspace files
    participant Shell as Cloud shell
    participant Git as git client
    participant GitHub as GitHub repo

    Human->>Browser: type request
    Browser->>Cursor: send prompt and workspace context
    Cursor->>Agent: assign task to cloud VM
    Agent->>FS: read and edit files
    Agent->>Shell: run npm, python, git, tests
    Shell->>FS: create test artifacts and docs
    Agent->>Git: git add / commit / push
    Git->>GitHub: upload branch commits
    Agent->>GitHub: create or update pull request
    Cursor-->>Browser: show progress and final answer
```

### System Boundary Table
| Boundary | Runs Where | Owns What | Student Confusion To Avoid |
| --- | --- | --- | --- |
| Windows laptop browser | Your Dell, school laptop, or personal machine | The Cursor web page and any local browser tabs | It is not automatically where the code executes. |
| Cursor Cloud VM | Remote Linux machine | `/workspace`, shell commands, tests, commits | `localhost` here means the remote VM. |
| GitHub | GitHub servers | branches, commits, pull requests | GitHub stores code but does not run `server.py` for classroom play. |
| Facilitator laptop | Local classroom machine | local Python backend and LAN IP | Phones connect to the laptop IP, not to GitHub. |

Object interaction summary:

1. The user types a request into Cursor in the browser.
2. The Cursor Cloud Agent edits files under `/workspace`.
3. The agent runs shell commands on the remote Linux VM.
4. Git commits and pushes go from the cloud VM to GitHub.
5. Tests run inside the cloud VM unless the repo is cloned and tested locally.

## What The Setup Commands Do
### `npm install`
`npm install` reads the repo-level files:

```text
package.json
package-lock.json
```

It installs JavaScript development tools under:

```text
node_modules/
```

For this repo, the important package is `@playwright/test`, which provides the test runner.

This command does not run the game. It prepares the test tooling.

### `npx playwright install chromium`
Playwright needs an actual browser binary to automate. This command downloads the matching Chromium browser build into the machine's Playwright cache.

This command does not change mission code. It installs the browser that the automated test robot uses.

### `npm run test:spaceinvaders`
This runs the Mission 10 validation harness. In `package.json`, the script points to:

```bash
node tests/helpers/run-playwright.js spaceinvaders
```

The helper selects the Space Invaders mission, starts its backend, launches Playwright, opens Chromium, and runs the assertions in:

```text
tests/spaceinvaders.spec.js
```

## Command Dependency Graph
Run these commands in order when setting up a fresh machine for automated browser validation.

```mermaid
flowchart LR
    PackageFiles["package.json<br>package-lock.json"] --> NpmInstall["npm install"]
    NpmInstall --> NodeModules["node_modules/<br>@playwright/test"]
    NodeModules --> Npx["npx playwright install chromium"]
    Npx --> BrowserCache["Playwright browser cache<br>Chromium + headless shell"]
    BrowserCache --> TestCommand["npm run test:spaceinvaders"]
    TestCommand --> Runner["tests/helpers/run-playwright.js"]
    Runner --> MissionServer["python3 server.py<br>port 8010"]
    Runner --> Spec["tests/spaceinvaders.spec.js"]
```

| Command | Reads | Creates Or Uses | Main Purpose |
| --- | --- | --- | --- |
| `npm install` | `package.json`, `package-lock.json` | `node_modules/` | Install JavaScript test tooling. |
| `npx playwright install chromium` | installed Playwright package | Playwright browser cache | Download the browser used by automated tests. |
| `npm run test:spaceinvaders` | `package.json`, test helpers, mission files | Playwright report and baseline status artifacts | Start the backend and verify the mission in a real browser. |
| `python3 server.py` | Mission `server.py` and shared backend | running web server on port `8010` | Run the game for humans to play. |

## Automated Validation Harness
The test harness starts the real backend and opens the real browser page.

```mermaid
sequenceDiagram
    participant User as User or Agent Shell
    participant NPM as npm script
    participant Runner as tests/helpers/run-playwright.js
    participant PW as Playwright
    participant ServerHelper as tests/helpers/start-mission-server.js
    participant Python as python3 server.py
    participant Backend as Mission backend on 127.0.0.1:8010
    participant Browser as Headless Chromium
    participant App as src/app.js
    participant API as /api/state /api/scores /api/events

    User->>NPM: npm run test:spaceinvaders
    NPM->>Runner: node run-playwright.js spaceinvaders
    Runner->>PW: configure baseURL and spec file
    PW->>ServerHelper: start webServer command
    ServerHelper->>Python: python3 server.py
    Python->>Backend: serve mission on port 8010
    PW->>Backend: wait until /api/scores responds
    PW->>Browser: launch Chromium
    Browser->>Backend: GET /?test=1
    Backend->>Browser: index.html, CSS, JS
    Browser->>App: run game code
    App->>API: GET /api/state
    PW->>App: call window.__sprkTest helpers
    App->>API: POST state, scores, and events
    PW->>PW: assert aliens, score, bunkers, modes, and shared state
```

### Validation Harness Objects
| Object | File Or Process | Responsibility | Talks To |
| --- | --- | --- | --- |
| npm script | `package.json` | Names the command students run. | `tests/helpers/run-playwright.js` |
| Test runner helper | `tests/helpers/run-playwright.js` | Selects mission, base URL, and spec file. | Playwright CLI |
| Server helper | `tests/helpers/start-mission-server.js` | Starts the correct Python backend for the chosen mission. | `server.py` |
| Mission backend | `missions/10-Space-Invaders/server.py` | Serves files and shared JSON APIs. | Browser, shared backend helper |
| Browser test | `tests/spaceinvaders.spec.js` | Makes assertions about Mission 10 behavior. | Headless Chromium page |
| Test hooks | `window.__sprkTest` in `src/app.js` | Provide deterministic controls for tests. | Playwright spec |
| Baseline writer | `tests/helpers/write-baseline-status.js` | Publishes test summary for Baseline Status tab. | `missions/_shared/generated/` |

### Validation Pass/Fail Flow
```mermaid
flowchart TD
    Start["npm run test:spaceinvaders"] --> ServerStarts{"Backend starts?"}
    ServerStarts -- "No" --> ServerFail["Fail early<br>check Python or port 8010"]
    ServerStarts -- "Yes" --> BrowserStarts{"Chromium launches?"}
    BrowserStarts -- "No" --> BrowserFail["Fail early<br>run npx playwright install chromium"]
    BrowserStarts -- "Yes" --> PageLoads{"Mission page loads?"}
    PageLoads -- "No" --> PageFail["Check server route, HTML, JS errors"]
    PageLoads -- "Yes" --> Assertions{"Game assertions pass?"}
    Assertions -- "No" --> TestFail["Fix mission behavior or test expectation"]
    Assertions -- "Yes" --> Passed["Baseline passed<br>status JSON/HTML updated"]
```

### What Mission 10 Validation Checks
The Space Invaders baseline verifies:

- the page renders
- the shared backend connects
- the game starts with 55 aliens
- destroying an alien changes score and alien count
- fleet acceleration changes as aliens are destroyed
- bunker damage changes shared state
- 2D, 3D rail, and FPS modes preserve score and wave state
- X-Ray Vision and Baseline Status are reachable

## Runtime Architecture For A Browser Mission
Every browser mission uses the same basic shape.

```mermaid
flowchart LR
    Browser["Browser"] --> HTML["index.html"]
    HTML --> SharedCSS["../_shared/sprk_mission.css"]
    HTML --> LocalCSS["src/styles.css"]
    HTML --> SharedJS["../_shared/sprk_app.js"]
    HTML --> AppJS["src/app.js"]

    AppJS --> Canvas["Canvas or DOM game UI"]
    AppJS --> Controls["Keyboard, mouse, buttons, touch"]
    AppJS --> API["Backend API"]

    API --> State["/api/state"]
    API --> Scores["/api/scores"]
    API --> Events["/api/events"]

    ServerPy["server.py"] --> SharedBackend["missions/_shared/sprk_backend.py"]
    SharedBackend --> State
    SharedBackend --> Scores
    SharedBackend --> Events
```

For Mission 10:

```text
missions/10-Space-Invaders/
  index.html
  server.py
  src/app.js
  src/styles.css
  docs/MISSION_GUIDE.md
  docs/CODE_WALKTHROUGH.md
  docs/PRD.md
```

## Mission 10 Object Model
Mission 10 keeps one state object for all views. The renderer changes how the state is shown, but the score, wave, aliens, and bunkers stay the same.

```mermaid
flowchart TD
    GameState["gameState"] --> Mode["mode<br>2d / lateral3d / fps"]
    GameState --> Score["score"]
    GameState --> Wave["wave"]
    GameState --> Lives["lives"]
    GameState --> Player["player<br>x, z, yaw, pitch"]
    GameState --> Fleet["fleet<br>direction, beat, timing"]
    GameState --> Aliens["aliens[55]<br>type, row, col, x, y, z, alive"]
    GameState --> Bunkers["bunkers[4]<br>voxel cells alive/dead"]
    GameState --> Mystery["mystery ship"]

    Mode --> Renderer["drawScene() chooses camera"]
    Renderer --> Classic["draw2DScene()"]
    Renderer --> Rail["drawRailScene()"]
    Renderer --> FPS["drawFpsScene()"]

    Controls["keyboard, mouse, buttons"] --> Updates["updateGame()"]
    Updates --> Collisions["shot, alien, bunker, player collisions"]
    Collisions --> GameState
    GameState --> Save["POST /api/state"]
    GameState --> RealTime["POST /api/scores"]
    GameState --> XRay["POST /api/events"]
```

Why this matters:

- destroyed aliens stay destroyed after a dimension shift
- bunker damage persists across views
- score continues from 2D into 3D rail and FPS
- tests can inspect a single state machine instead of three separate games

## Runtime Data Lifecycle
This is the live path when a student plays the mission in a browser.

```mermaid
sequenceDiagram
    participant Student as Student
    participant Browser as Browser tab
    participant App as src/app.js
    participant Canvas as Canvas renderer
    participant API as Python backend API
    participant State as In-memory MissionState
    participant Panel as RealTime / X-Ray / Baseline tabs

    Student->>Browser: open mission URL
    Browser->>App: load shared JS and mission JS
    App->>API: GET /api/state
    API->>State: read current state
    State-->>API: state JSON
    API-->>App: state payload
    App->>Canvas: draw current mode
    Student->>App: move, fire, shift dimension
    App->>App: update gameState
    App->>Canvas: redraw 2D, rail, or FPS view
    App->>API: POST /api/state
    App->>API: POST /api/scores when score changes
    App->>API: POST /api/events for X-Ray Vision
    API->>State: merge state, scores, and events
    App->>Panel: refresh visible shared panels
```

### Mission 10 State Table
| State Field | Example | Updated By | Displayed In |
| --- | --- | --- | --- |
| `mode` | `2d`, `lateral3d`, `fps` | Dimension Shift button, Shift key, FPS Dive, proximity trigger | HUD mode label and renderer |
| `score` | `130` | Alien hits and mystery ship hits | HUD and RealTime tab |
| `wave` | `1` | Wave clear logic | HUD and RealTime summary |
| `lives` | `3` | Alien shots or fleet breach | HUD |
| `aliens[]` | 55 alien objects | Fleet movement and collision logic | Canvas renderer and tests |
| `bunkers[]` | four voxel cell arrays | Player and alien shots | Canvas renderer and bunker status |
| `player` | x, z, yaw, pitch | keyboard, mouse, test hooks | renderer and collision logic |
| `mystery` | active UFO state | timer and shot collision | 2D renderer and score events |

## Mission 10 Dimension Flow
```mermaid
flowchart LR
    Classic["2D Classic<br>orthographic-style canvas<br>one laser at a time"] -->|"Dimension Shift<br>1.5s blend"| Rail["3D Rail<br>runway projection<br>z-axis shots"]
    Rail -->|"FPS Dive, F key,<br>or proximity threshold"| FPS["FPS Climax<br>mouse-look style aim<br>rapid plasma"]
    Classic -->|"FPS Dive button"| FPS

    State["Same gameState<br>aliens, bunkers, score, wave"] -. "preserved" .-> Classic
    State -. "preserved" .-> Rail
    State -. "preserved" .-> FPS
```

## Running The Game In Cursor Cloud
Use this when the code is running in Cursor's remote environment.

```bash
cd /workspace/missions/10-Space-Invaders
python3 server.py
```

The backend prints a local link like:

```text
http://localhost:8010
```

Inside Cursor Cloud, that means the Cursor Cloud VM. To view it from your laptop browser, open the Cursor port preview or forwarded URL for port `8010`.

Important: `127.0.0.1:8010` on your Windows laptop is your Windows laptop, not the Cursor Cloud VM.

## Running The Game On A Facilitator Laptop
Use this when one laptop in the room should host the mission for nearby phones, tablets, and laptops.

On the facilitator laptop:

```bash
git clone https://github.com/Mr-PI-Bala/SPRK-Hello-Repo.git
cd SPRK-Hello-Repo
git checkout cursor/10-space-invaders-de64
cd missions/10-Space-Invaders
python server.py
```

On some Windows machines, use:

```bash
py server.py
```

The backend binds to:

```text
0.0.0.0:8010
```

That means it listens on all network interfaces for that laptop.

The facilitator laptop can open:

```text
http://127.0.0.1:8010
```

Other devices must use the facilitator laptop's LAN IP, for example:

```text
http://192.168.1.42:8010
```

## Why `127.0.0.1` Does Not Reach The Laptop Next To You
`127.0.0.1` always points back to the device making the request.

| Device typing `http://127.0.0.1:8010` | Where it tries to connect |
| --- | --- |
| Cursor Cloud VM | Cursor Cloud VM |
| Facilitator Dell laptop | Facilitator Dell laptop |
| iPhone | The iPhone itself |
| iPad | The iPad itself |
| Android phone | The Android phone itself |
| Student laptop | That same student laptop |

So if the backend is running on the facilitator Dell laptop, phones and tablets should not use `127.0.0.1`. They should use the Dell's local network address.

## Local Network Object Interaction
This is the classroom or home Wi-Fi model.

```mermaid
flowchart TD
    Dell["Facilitator Dell laptop<br>runs python server.py<br>LAN IP: 192.168.1.42<br>Port: 8010"]

    DellBrowser["Dell browser"] -->|"http://127.0.0.1:8010"| Dell
    IPhone["iPhone browser"] -->|"http://192.168.1.42:8010"| Dell
    IPad["iPad browser"] -->|"http://192.168.1.42:8010"| Dell
    Android["Android browser"] -->|"http://192.168.1.42:8010"| Dell
    StudentLaptop["Other laptop browser"] -->|"http://192.168.1.42:8010"| Dell

    Dell --> Backend["SPRK backend"]
    Backend --> State["shared in-memory state"]
    Backend --> Scores["shared scores"]
    Backend --> Events["X-Ray Vision events"]
```

### Local Network Sequence Diagram
```mermaid
sequenceDiagram
    participant Dell as Facilitator Dell<br>192.168.1.42:8010
    participant Python as python server.py
    participant iPhone as iPhone Safari
    participant iPad as iPad Safari
    participant Android as Android Chrome
    participant State as Shared backend state

    Dell->>Python: start server.py
    Python->>Python: bind 0.0.0.0:8010
    iPhone->>Python: GET http://192.168.1.42:8010
    iPad->>Python: GET http://192.168.1.42:8010
    Android->>Python: GET http://192.168.1.42:8010
    Python-->>iPhone: same mission HTML/CSS/JS
    Python-->>iPad: same mission HTML/CSS/JS
    Python-->>Android: same mission HTML/CSS/JS
    iPhone->>State: POST /api/events or /api/state
    iPad->>State: GET /api/state
    Android->>State: GET /api/scores
    State-->>iPad: updated shared state
    State-->>Android: updated shared scores
```

### Addressing Table
| You Type This URL On... | URL | Result |
| --- | --- | --- |
| Dell facilitator laptop | `http://127.0.0.1:8010` | Connects to the Dell's own backend. |
| Dell facilitator laptop | `http://192.168.1.42:8010` | Also connects to the Dell through its LAN IP. |
| iPhone on same Wi-Fi | `http://127.0.0.1:8010` | Looks for a backend on the iPhone itself and usually fails. |
| iPhone on same Wi-Fi | `http://192.168.1.42:8010` | Connects to the Dell backend. |
| Cursor Cloud VM | `http://127.0.0.1:8010` | Connects to the backend running inside Cursor Cloud. |
| Your Windows browser while backend runs in Cursor Cloud | Cursor forwarded port URL | Connects through Cursor's tunnel to the cloud backend. |

Requirements:

1. The facilitator laptop and devices are on the same Wi-Fi.
2. The Wi-Fi allows device-to-device traffic.
3. Windows Firewall allows inbound access to Python on port `8010`.
4. The server terminal stays open.

Guest Wi-Fi networks often block device-to-device traffic. If phones cannot connect, try a non-guest network or a phone hotspot that allows local clients to see each other.

## Finding The Facilitator Laptop IP On Windows
Open PowerShell or Command Prompt:

```bash
ipconfig
```

Look for the Wi-Fi adapter's IPv4 address:

```text
Wireless LAN adapter Wi-Fi:
   IPv4 Address . . . . . . . . . . : 192.168.1.42
```

Then nearby devices open:

```text
http://192.168.1.42:8010
```

Replace `192.168.1.42` with the actual address from the facilitator laptop.

## Cursor Cloud Versus Facilitator Laptop
| Scenario | Where backend runs | Best URL for the host | Best URL for phones/tablets |
| --- | --- | --- | --- |
| Cursor Cloud tryout | Remote Cursor VM | Cursor forwarded port URL | Cursor forwarded port URL, if accessible |
| Dell facilitator local play | Dell laptop | `http://127.0.0.1:8010` | `http://<Dell LAN IP>:8010` |
| Student laptop local experiment | Student laptop | `http://127.0.0.1:8010` | Usually not needed unless that student hosts |

## Troubleshooting Checklist
If the automated test fails:

1. Run `npm install`.
2. Run `npx playwright install chromium`.
3. Run `npm run test:spaceinvaders`.
4. Confirm no other process is already using port `8010`.

If phones/tablets cannot reach a facilitator laptop:

1. Confirm the backend is running.
2. Confirm all devices are on the same Wi-Fi.
3. Use `ipconfig` and connect to the facilitator laptop's IPv4 address.
4. Allow Python through Windows Firewall.
5. Avoid guest Wi-Fi networks that block device-to-device traffic.
6. Try from another laptop browser first, then phones/tablets.

## Command Reference
Run Mission 10 in Cursor Cloud:

```bash
cd /workspace/missions/10-Space-Invaders
python3 server.py
```

Run Mission 10 locally on Windows:

```bash
cd missions/10-Space-Invaders
python server.py
```

or:

```bash
py server.py
```

Install test tools:

```bash
npm install
```

Install the Playwright test browser:

```bash
npx playwright install chromium
```

Run Mission 10 validation:

```bash
npm run test:spaceinvaders
```
