# Mission 10: Space Invaders: Dimensional Shift
Build and play a Space Invaders mission that begins as a classic 2D defense game, rotates into a 3D rail shooter, and finishes as an FPS-style cannon view.

## Start Here
1. Run the mission.
2. Start the wave and play the 2D version first.
3. Press **Dimension Shift** or hold **Shift** to rotate into the 3D runway.
4. Press **FPS Dive** or **F** to enter the first-person climax.
5. Open **X-Ray Vision** to watch score, bunker, dimension, and wave events.

## Mission Navigation
| Need | Go Here |
| --- | --- |
| I want to run the mission | [How To Run](#how-to-run) [[#How To Run]] (obsidian) |
| I want math wave celebrations | [Math Wave Celebrations](#math-wave-celebrations) [[#Math Wave Celebrations]] (obsidian) |
| I want the controls | [Controls](#controls) [[#Controls]] (obsidian) |
| I want the file map | [Code Files](#code-files) [[#Code Files]] (obsidian) |
| I want how rules map to the PRD | [How The Game Rules Map To The PRD](#how-the-game-rules-map-to-the-prd) [[#How The Game Rules Map To The PRD]] (obsidian) |
| I want to change the game | [Try Changing One Thing](#try-changing-one-thing) [[#Try Changing One Thing]] (obsidian) |
| I want the original product requirement | [PRD.md](PRD.md) |
| I want the deeper architecture view | [CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md) |
| I need the shared Git workflow | [SPRK Git Repository User Guide](../../../docs/SPRK_Git_Repository_UserGuide.md#create-your-branch) [[docs/SPRK_Git_Repository_UserGuide#Create Your Branch]] (obsidian) |
| I want the common browser mission pattern | [SPRK Browser Mission Foundation Guide](../../../docs/SPRK_Browser_Mission_Foundation_Guide.md) |

## What This Mission Gives You
- A 55-alien Space Invaders fleet with Squid, Crab, and Octopus rows.
- Classic 2D play with one player laser at a time.
- Four voxel-like destructible bunkers hit by both player and alien shots.
- A mystery ship that crosses the top of the 2D field for bonus points.
- Fleet acceleration as aliens are destroyed.
- A 1.5 second dimension shift from flat 2D into a 3D runway.
- An FPS mode with mouse-look style aiming and rapid plasma shots.
- Shared SPRK panels for `RealTime`, `X-Ray Vision`, and `Baseline Status`.

## How To Run
```bash
cd missions/10-SpaceInvaders-1P-nP
python server.py
```

On Linux/macOS or Cursor Cloud, use:

```bash
python3 server.py
```

What each command does:

- `cd missions/10-SpaceInvaders-1P-nP`: moves the terminal into this mission folder.
- `python server.py`: starts the local backend and serves the mission page.
- `python3 server.py`: starts the same backend on Linux/macOS environments where Python is exposed as `python3`.

Open the browser link shown in the terminal. This mission uses port `8010`.

## Math Wave Celebrations

When you clear a fleet and the next wave number is special, a celebration card appears with a short math insight. Examples:

- **Primes** from wave 3 onward: 3, 5, 7, 11, 13…
- **Fibonacci**: 1, 2, 3, 5, 8, 13, 21…
- **π, φ, e** milestone digit patterns
- **Palindromes**, perfect squares, powers of two, happy numbers, angle waves (θ), and more

Logic lives in `src/wave_math.js`. Tap **Launch Wave N** (or press Enter) to continue fighting.

## Controls
| Mode | Movement | Fire | Shift |
| --- | --- | --- | --- |
| 2D Classic | A/D or left/right arrows | Space or canvas click | Shift or Dimension Shift |
| 3D Rail | A/D or left/right arrows | Space or canvas click | Shift, F, or FPS Dive |
| FPS | WASD for forward/back and Q/E for strafe; mouse or arrow keys to aim | Space or canvas click | Already in final mode |

## Code Files
| File | What It Does | What You Usually Change First |
| --- | --- | --- |
| `README.md` | Short Quick Start for running Mission 10. | Run command or control summary. |
| `index.html` | Page structure, canvas, controls, and shared panels. | Mission labels, controls, and student-facing copy. |
| `src/app.js` | Game state, fleet rules, collisions, rendering, dimension shifts, and shared API calls. | Alien values, fleet speed, controls, and rendering style. |
| `src/wave_math.js` | Detects math-special wave numbers and builds celebration text. | Add new number patterns or student-friendly insights. |
| `src/styles.css` | Mission-specific layout and visual treatment. | Canvas size, colors, and responsive layout. |
| `server.py` | Starts the shared SPRK backend on port `8010`. | Port, title, or initial state defaults. |
| `docs/MISSION_GUIDE.md` | Student mission instructions. | Challenge prompts and run steps. |
| `docs/CODE_WALKTHROUGH.md` | Deeper code explanation and diagrams. | Architecture notes and extension ideas. |
| `docs/PRD.md` | Original product requirement document plus implementation mapping. | Acceptance criteria or future scope notes. |

## How The Game Rules Map To The PRD
| PRD Requirement | Mission Implementation |
| --- | --- |
| 55 aliens in iconic rows | `createAlienFleet()` builds 5 rows of 11 aliens with Squid, Crab, and Octopus types. |
| Accurate scoring | Alien point values are 30, 20, and 10; the mystery ship awards bonus points. |
| Fleet acceleration | `fleetIntervalSeconds()` shortens the beat as alive aliens decrease. |
| Bunker destruction | Bunkers are arrays of live/dead voxel cells damaged by player and enemy shots. |
| 2D to 3D shift | `startTransition("lateral3d")` runs a 1.5 second camera blend. |
| FPS mode | `fps` mode keeps the same state and changes movement, aiming, and fire rate. |
| Unified state machine | `gameState` stores score, wave, aliens, bunkers, mode, and player data across every view. |

## Try Changing One Thing
1. Change the Squid point value from `30` to another number in `ALIEN_TYPES`.
2. Make the fleet more aggressive by lowering the minimum in `fleetIntervalSeconds()`.
3. Change bunker shapes by editing `createBunkerCells()`.
4. Add a new FPS power-up that repairs one bunker cell.

## Language Crosswalk Coverage
Use the canonical crosswalk: [../../../docs/SPRK_Language_Crosswalk.md](../../../docs/SPRK_Language_Crosswalk.md)

This mission demonstrates:

- arrays of objects for aliens, bunkers, shots, stars, and particles
- object state with `gameState`
- conditionals for mode-specific controls and collisions
- loops for rendering grids and alien rows
- callbacks through button, keyboard, mouse, and animation-frame events
- frontend/backend API flow through `/api/state`, `/api/scores`, and `/api/events`
