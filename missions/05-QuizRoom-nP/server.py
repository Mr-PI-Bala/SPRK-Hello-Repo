"""Mission 05 backend: serves QuizRoom with shared room state."""

from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[1] / "_shared"
sys.path.insert(0, str(SHARED))

from sprk_backend import run_mission_server


if __name__ == "__main__":
    run_mission_server(
        mission_folder=Path(__file__).resolve().parent,
        title="QuizRoom",
        port=8005,
        initial_state={"mission": "QuizRoom", "questionIndex": 0},
    )
