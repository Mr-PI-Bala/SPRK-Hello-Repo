"""Mission 06 backend: serves FourSquare and stores shared square state."""

from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[1] / "_shared"
sys.path.insert(0, str(SHARED))

from sprk_backend import run_mission_server


if __name__ == "__main__":
    run_mission_server(
        mission_folder=Path(__file__).resolve().parent,
        title="FourSquare",
        port=8006,
        initial_state={
            "mission": "FourSquare",
            "squares": {"A": "", "B": "", "C": "", "D": ""},
            "round": 1,
        },
    )
