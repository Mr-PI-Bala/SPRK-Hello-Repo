"""Mission template backend: copy this when starting a new browser-first SPRK mission."""

from pathlib import Path
import sys

SHARED = Path(__file__).resolve().parents[1] / "_shared"
sys.path.insert(0, str(SHARED))

from sprk_backend import run_mission_server


if __name__ == "__main__":
    run_mission_server(
        mission_folder=Path(__file__).resolve().parent,
        title="Template Mission",
        port=8010,
        initial_state={
            "mission": "Template Mission",
            "status": "Ready",
            "actionCount": 0,
            "note": "Replace this card with your mission's main interaction.",
        },
    )
