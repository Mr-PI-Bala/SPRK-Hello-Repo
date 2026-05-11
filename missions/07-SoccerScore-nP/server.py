"""Mission 07 backend: serves SoccerScore and stores shared match state."""

from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[1] / "_shared"
sys.path.insert(0, str(SHARED))

from sprk_backend import run_mission_server


if __name__ == "__main__":
    run_mission_server(
        mission_folder=Path(__file__).resolve().parent,
        title="SoccerScore",
        port=8007,
        initial_state={
            "mission": "SoccerScore",
            "home": "Blue Team",
            "away": "Gold Team",
            "homeScore": 0,
            "awayScore": 0,
            "period": 1,
        },
    )
