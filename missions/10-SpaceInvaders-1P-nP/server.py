"""Mission 10 backend: Space Invaders."""

from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[1] / "_shared"
sys.path.insert(0, str(SHARED))

from sprk_backend import run_mission_server


if __name__ == "__main__":
    run_mission_server(
        mission_folder=Path(__file__).resolve().parent,
        title="Space Invaders",
        port=8010,
        initial_state={
            "mission": "Space Invaders",
            "status": "Ready",
            "mode": "2d",
            "score": 0,
            "wave": 1,
            "lives": 3,
            "aliensDestroyed": 0,
        },
    )
