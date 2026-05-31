# Mission 08: SoccerMatch


## Mission Navigation
| Need | Go Here |
| --- | --- |
| I want what this mission is | [What This Mission Is](#what-this-mission-is) [[#What This Mission Is]] (obsidian) |
| I want classroom flow | [Classroom Flow](#classroom-flow) [[#Classroom Flow]] (obsidian) |
| I want run it | [Run It](#run-it) [[#Run It]] (obsidian) |
| I want the controls | [Controls](#controls) [[#Controls]] (obsidian) |
| I want what it teaches | [What It Teaches](#what-it-teaches) [[#What It Teaches]] (obsidian) |
| I want shared pattern | [Shared Pattern](#shared-pattern) [[#Shared Pattern]] (obsidian) |
| I want why mission 08 exists | [Why Mission 08 Exists](#why-mission-08-exists) [[#Why Mission 08 Exists]] (obsidian) |

## What This Mission Is
`SoccerMatch` is the first live shared field mission in this repo. Instead of only reporting goals after the fact, multiple devices join the same running soccer match and see the same ball, players, score, and field.

## Classroom Flow
1. Start the backend from one host laptop.
2. Open the app on that host or through the shared network link.
3. Each device joins one or two local players.
4. Players choose `home` or `away`.
5. Devices control their own joined players on the same live field.

## Run It
```bash
cd missions/08-SoccerMatch-nP
python server.py
```

What each command does:
- `cd missions/08-SoccerMatch-nP`: moves the terminal into Mission 08.
- `python server.py`: starts the shared multiplayer soccer backend on port `8008`.

## Controls
### WASD Player
- Move: `W A S D`
- Turn: `Z` and `X`
- Kick: `Space`

### Arrow Player
- Move: arrow keys
- Turn: `PageUp` and `PageDown`
- Kick: `Enter`

Turning accelerates while held. That means a player can fine-tune one degree at a time at first, then rotate faster when the key stays down.

## What It Teaches
- shared live state instead of only shared scores
- server-authoritative simulation
- many clients polling and sending control input
- separating local input from shared world state
- canvas rendering of a real game field

## Shared Pattern
This mission still keeps the stable right-side tabs:
- `RealTime`
- `X-Ray Vision`
- `Baseline Status`

Read the shared browser mission guide for the baseline repo pattern:
- [../../../docs/SPRK_Browser_Mission_Foundation_Guide.md](../../../docs/SPRK_Browser_Mission_Foundation_Guide.md)

## Why Mission 08 Exists
Mission 07 is a scoreboard tracker. Mission 08 is the actual game.
