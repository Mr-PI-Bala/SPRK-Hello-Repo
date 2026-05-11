"""Mission 02 backend: SnakeGame."""

from pathlib import Path
import sys


MISSION_FOLDER = Path(__file__).parent
sys.path.insert(0, str(MISSION_FOLDER.parent / "_shared"))

from sprk_backend import run_mission_server


if __name__ == "__main__":
    run_mission_server(
        MISSION_FOLDER,
        title="SnakeGame",
        port=8002,
        initial_state={"mission": "SnakeGame", "mode": "1P-nP"},
    )
