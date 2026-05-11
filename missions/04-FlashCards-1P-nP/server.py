"""Mission 04 backend: serves FlashCards and keeps shared practice scores."""

from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[1] / "_shared"
sys.path.insert(0, str(SHARED))

from sprk_backend import run_mission_server


if __name__ == "__main__":
    run_mission_server(
        mission_folder=Path(__file__).resolve().parent,
        title="FlashCards",
        port=8004,
        initial_state={"mission": "FlashCards", "mode": "1P-nP"},
    )
