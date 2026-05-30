# Product Requirement Document: Space Invaders: Dimensional Shift

## Project Name
Space Invaders: Dimensional Shift

## Target Audience
Game Developers / AI Code Agents

## Objective
Build a classic 2D *Space Invaders* clone that dynamically shifts into a 3D lateral rail-shooter, and ultimately into a 3D First-Person Shooter (FPS), seamlessly transitioning the gameplay mechanics, logic, and iconic assets across three distinct dimensions.

---

## 1. Phase 1: The Classic 2D Foundation
The game begins as a faithful recreation of Taito's original 1978 *Space Invaders*.

### 2D Landscape & Mechanics

- **Playfield:** A fixed, vertical 2D screen with a pitch-black background.
- **The Player (Bunker/Cannon):** A green laser cannon restricted to horizontal movement along the bottom of the screen. Can fire only one projectile at a time.
- **The Shields (Bunkers):** Four green, destructible, voxel-like structures placed above the player. They degrade dynamically as they take hits from both player and enemy lasers.
- **The Mystery Ship:** A red UFO that occasionally flies across the top of the screen, awarding bonus points when destroyed.

### The Icon Fleet: Grid & Movement
The enemy fleet consists of 5 rows of 11 aliens, utilizing three iconic designs. They move horizontally as a single cohesive grid. When the grid hits the screen edge, the entire fleet drops down one row and reverses direction.

**Crucial Mechanic:** As aliens are destroyed, the remaining fleet's movement and audio pitch speed up.

| Alien Icon | Grid Row Placement | Points Value |
| --- | --- | --- |
| Squid (Top Alien) | Row 5 (Top) | 30 Points |
| Crab (Middle Alien) | Rows 3 and 4 | 20 Points |
| Octopus (Bottom Alien) | Rows 1 and 2 (Bottom) | 10 Points |

**Reference for 2D Mechanics:** Review classic Space Invaders gameplay and logic for exact timing, grid steps, and collision boxes.

---

## 2. Phase 2: Dimensional Transition Mechanics
The core feature of this game is the player's ability to initiate a **Dimension Shift** via a navigation trigger, such as holding the Spacebar or a Shift key.

```text
[ 2D Classic Grid ] --(Camera rotates down and z-axis expands)--> [ 3D Lateral / Rail Runway ]
```

### Camera & Controls Transformation

1. **Phase 1 to Phase 2: 2D to 3D Lateral**
   - The camera smoothly lerps from a flat, orthographic top-down/front view down to a low-angle perspective behind the player's cannon.

2. **The Landscape Expansion**
   - The flat 2D plane extrudes into a deep, grid-lined 3D "runway" stretching into the horizon.
   - The 2D alien fleet transforms into 3D voxel models.

3. **Gameplay Shift**
   - Instead of moving left/right on a flat wall, the aliens are now advancing down the runway toward the player along the Z-axis while still shuffling left and right.
   - The bunkers become 3D geometric barriers.

---

## 3. Phase 3: The First-Person Shooter Climax
As the player presses the final navigation ability, or when the alien fleet breaches a specific proximity threshold, the camera plunges directly into the barrel of the cannon.

- **Movement:** Transition from locked horizontal tracks to full 3D freedom of movement with WASD on a ground plane, or full 360-degree aiming.
- **Shooting:** The fire rate restriction, one bullet at a time, is lifted or upgraded to a rapid-fire plasma rifle.
- **The Sky Box:** The simple grid runway expands into a full 3D outer space skybox, with giant Squid, Crab, and Octopus behemoths raining projectiles down from above.

---

## 4. Reference Implementations For The AI Agent
To properly execute the camera transitions and dimensional shifting, analyze the following architectural references:

- **For the 2D to 3D Lateral Shift:** See *Retro/Grade* or the 3D classic modes in *Namco Museum* / *Galaga 3D*. The camera transition must mimic the perspective shift found in *Fez* rotation mechanics, but on the pitch axis rather than the yaw axis.
- **For the FPS Shift:** Reference *Space Invaders Extreme* visual style and fan-made *Space Invaders FPS* concepts.
- **Tech Stack Recommendation:** Use Three.js/WebGL or Unity/C#. The 2D mode should simply be a 3D engine restricted to an orthographic camera view, such as `camera.orthographic = true`, making the transition to 3D a seamless matter of changing the camera's position, rotation, and field of view.

---

## 5. Acceptance Criteria For AI Code Generation

- [ ] **Requirement 1:** A functional 2D Space Invaders game with accurate scoring, fleet acceleration, bunker destruction, and a grid of 55 aliens.
- [ ] **Requirement 2:** A "Dimension Shift" button that smoothly interpolates the camera from a 2D orthographic viewpoint to a 3D perspective viewpoint behind the player over 1.5 seconds.
- [ ] **Requirement 3:** An FPS mode triggered by proximity or input that locks the camera to the player's vector, allowing mouse-look aiming at the 3D voxel alien models.
- [ ] **Requirement 4:** Unified state machine: Alien health, player score, and wave progression must remain constant across all three dimensional views.

---

## 6. Implementation Notes In This Repo
This repo keeps Mission 10 browser-first and lightweight. The implementation uses a Canvas renderer with projection math instead of adding a new 3D dependency. The core architectural requirement is preserved: one unified `gameState` is rendered as 2D classic, 3D rail, or FPS mode without rebuilding the wave.

| PRD Requirement | Mission 10 Implementation |
| --- | --- |
| 55 aliens | `createAlienFleet()` builds 5 rows of 11 aliens. |
| Icon scoring | Squid = 30, Crab = 20, Octopus = 10. |
| Bunker destruction | Bunkers are voxel-cell arrays damaged by player and alien shots. |
| Mystery ship | A red UFO crosses the top of the 2D playfield for bonus points. |
| Fleet acceleration | `fleetIntervalSeconds()` decreases as aliens are destroyed. |
| 1.5s shift | `startTransition("lateral3d")` uses a 1.5 second blend. |
| FPS input | `fps` mode supports aim changes and rapid plasma fire. |
| Unified state | `gameState` stores mode, score, wave, aliens, bunkers, player, and mystery ship data. |
