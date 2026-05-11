"""Mission 03 backend: serves PingPong and stores shared classroom scores."""

from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[1] / "_shared"
sys.path.insert(0, str(SHARED))

from sprk_backend import run_mission_server


if __name__ == "__main__":
    run_mission_server(
        mission_folder=Path(__file__).resolve().parent,
        title="PingPong",
        port=8003,
        initial_state={"mission": "PingPong", "mode": "2P-nP"},
    )
