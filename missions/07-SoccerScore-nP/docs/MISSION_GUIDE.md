# Mission 07: SoccerScore
Start here when you want a shared scoreboard for sports or classroom teams.

Deep dive: [Code Walkthrough](CODE_WALKTHROUGH.md).

Shared browser-mission foundation:

- [../../../docs/SPRK_Browser_Mission_Foundation_Guide.md](../../../docs/SPRK_Browser_Mission_Foundation_Guide.md)

## Start Here
1. Run the mission with `python server.py`.
2. Open the link on the scoreboard device and reporter devices.
3. Rename teams if needed.
4. Tap a goal button when a team scores.
5. Watch the shared event board and X-Ray Vision.

## How To Run
```bash
cd missions/07-SoccerScore-nP
python server.py
```

```mermaid
flowchart LR
    A["Facilitator terminal"] --> B["python server.py<br/>(serves SoccerScore)"]
    B --> C["Browser scoreboard on port 8007"]
    C --> D["Goal button<br/>(updates /api/state)"]
    D --> E["Event board<br/>(POST /api/scores)"]
    D --> F["X-Ray Vision<br/>(POST /api/events)"]
```

ASCII view:

```text
Laptop server -> Scoreboard browser -> Goal button -> Shared match state + event list
```

## Entry Point
- App page: [index.html](../index.html)
- Browser logic: [src/app.js](../src/app.js)
- Styling: [src/styles.css](../src/styles.css)
- Backend: [server.py](../server.py)

## Play It
One device can be the scoreboard. Other devices can report goals if they are connected to the same backend link. This mission can become a soccer, football, softball, basketball, or classroom tournament tracker.

## Language Crosswalk In This Mission
Use the repo-wide guide: [../../../docs/SPRK_Language_Crosswalk.md](../../../docs/SPRK_Language_Crosswalk.md)

SoccerScore is a strong example of:

- key-value shared state: home team, away team, score, and period
- string interpolation: event text such as goal and period updates
- callbacks: score buttons, team-name saves, and reset actions
- frontend/backend API flow: shared score and event tracking

## Try Changing One Thing
| Challenge | Hint |
| --- | --- |
| Rename the sport. | Change the title text in `index.html`. |
| Add score correction buttons. | Copy the goal button pattern and subtract in `changeScore()`. |
| Add event types. | Add buttons that send text to `/api/events`. |

## Mission-Specific Variation
SoccerScore's main local differences from the shared foundation are:

- the `RealTime` tab represents game events for a live team score board
- `src/app.js` owns team naming, period changes, and score reporting
- the mission emphasizes shared event tracking for real-world sports or class games
