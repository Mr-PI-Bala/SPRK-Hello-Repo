"""
ReactionRace classroom server.

This file is the tiny backend for Mission 01.

Students can think of it this way:

Browser pages ask this server for the shared scoreboard.
Browser pages also send new reaction scores back to this server.

Simple flow:

student browser -> server.py -> shared scores list -> student browser

Run it with:

    python server.py

Then open the browser link shown in the terminal.
"""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import urlparse


HOST = "0.0.0.0"
PORT = 8000
MAX_SCORES = 25
MISSION_FOLDER = Path(__file__).parent

# This list is the shared classroom memory.
# Every browser connected to this server sees scores from the same list.
scores = []


def make_json_response(handler, status_code, data):
    """Send a JSON response back to the browser."""
    body = json.dumps(data).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def clean_player_name(raw_name):
    """Keep player names readable and short for the scoreboard."""
    name = str(raw_name or "").strip()
    return name[:24] or "SPRKPlayer"


def clean_reaction_time(raw_time):
    """Turn the browser's reaction time into a safe whole number."""
    try:
        reaction_time = int(raw_time)
    except (TypeError, ValueError):
        return None

    if reaction_time < 0 or reaction_time > 60000:
        return None

    return reaction_time


class ReactionRaceHandler(SimpleHTTPRequestHandler):
    """HTTP handler that serves files and the scoreboard API."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(MISSION_FOLDER), **kwargs)

    def log_message(self, format, *args):
        """Keep terminal messages short and classroom-readable."""
        print(f"server: {self.address_string()} {format % args}")

    def do_GET(self):
        """Serve the app files or return the shared scoreboard."""
        if urlparse(self.path).path == "/api/scores":
            make_json_response(self, 200, {"scores": sorted_scores()})
            return

        super().do_GET()

    def do_POST(self):
        """Receive one new reaction score from a browser."""
        if urlparse(self.path).path != "/api/scores":
            make_json_response(self, 404, {"error": "Unknown API path."})
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            make_json_response(self, 400, {"error": "Score data was not valid JSON."})
            return

        reaction_time = clean_reaction_time(data.get("time"))
        if reaction_time is None:
            make_json_response(self, 400, {"error": "Reaction time must be a valid number."})
            return

        score = {
            "name": clean_player_name(data.get("name")),
            "time": reaction_time,
        }
        scores.append(score)
        keep_best_scores_only()

        print(f"score: {score['name']} reacted in {score['time']} ms")
        make_json_response(self, 201, {"scores": sorted_scores()})

    def do_DELETE(self):
        """Clear the shared classroom scoreboard."""
        if urlparse(self.path).path != "/api/scores":
            make_json_response(self, 404, {"error": "Unknown API path."})
            return

        scores.clear()
        print("scoreboard: cleared")
        make_json_response(self, 200, {"scores": []})


def sorted_scores():
    """Return fastest scores first."""
    return sorted(scores, key=lambda score: score["time"])


def keep_best_scores_only():
    """Keep the scoreboard from growing forever during class."""
    scores[:] = sorted_scores()[:MAX_SCORES]


def main():
    """Start the backend server."""
    server = ThreadingHTTPServer((HOST, PORT), ReactionRaceHandler)

    print()
    print("SPRK ReactionRace backend")
    print("- Shared classroom scoreboard is ON.")
    print("- Open this app from Codespaces Ports or a browser.")
    print(f"- Local link: http://localhost:{PORT}")
    print(f"- Classroom link pattern: http://<host-laptop-ip>:{PORT}")
    print("- Press Ctrl+C to stop.")
    print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nserver: stopped")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
