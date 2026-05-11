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
import os
import platform
from pathlib import Path
import signal
import shutil
import socket
import subprocess
import sys
import time
from urllib.parse import urlparse


HOST = "0.0.0.0"
PORT = 8000
MAX_SCORES = 25
MAX_EVENTS = 80
MISSION_FOLDER = Path(__file__).parent

# This list is the shared classroom memory.
# Every browser connected to this server sees scores from the same list.
scores = []
events = []
next_score_id = 1


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    """Allow a clean restart when the previous server released the port."""

    allow_reuse_address = True


def make_json_response(handler, status_code, data):
    """Send a JSON response back to the browser."""
    body = json.dumps(data).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def log_event(kind, message):
    """Print an event and save it for the frontend X-Ray Vision panel."""
    event = {
        "time": time.strftime("%H:%M:%S"),
        "kind": kind,
        "message": message,
    }
    events.append(event)
    del events[:-MAX_EVENTS]
    print(f"{event['time']} {kind}: {message}")


def make_score_id():
    """Create a simple increasing ID so the frontend can animate new scores."""
    global next_score_id
    score_id = next_score_id
    next_score_id += 1
    return score_id


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


def clean_sound(raw_sound):
    """Only allow sound names that the frontend knows how to play."""
    sound = str(raw_sound or "").strip()
    allowed_sounds = {"spark", "chime", "laser", "pop", "drum"}
    return sound if sound in allowed_sounds else "spark"


class ReactionRaceHandler(SimpleHTTPRequestHandler):
    """HTTP handler that serves files and the scoreboard API."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(MISSION_FOLDER), **kwargs)

    def log_message(self, format, *args):
        """Keep terminal messages short and classroom-readable."""
        print(f"server: {self.address_string()} {format % args}")

    def do_GET(self):
        """Serve the app files or return the shared scoreboard."""
        path = urlparse(self.path).path

        if path == "/api/scores":
            make_json_response(self, 200, {"scores": sorted_scores()})
            return

        if path == "/api/events":
            make_json_response(self, 200, {"events": events})
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
            "id": make_score_id(),
            "name": clean_player_name(data.get("name")),
            "time": reaction_time,
            "sound": clean_sound(data.get("sound")),
        }
        scores.append(score)
        keep_best_scores_only()

        log_event("score", f"{score['name']} reacted in {score['time']} ms")
        make_json_response(self, 201, {"scores": sorted_scores()})

    def do_DELETE(self):
        """Clear the shared classroom scoreboard."""
        if urlparse(self.path).path != "/api/scores":
            make_json_response(self, 404, {"error": "Unknown API path."})
            return

        scores.clear()
        log_event("scoreboard", "cleared")
        make_json_response(self, 200, {"scores": []})


def sorted_scores():
    """Return fastest scores first."""
    return sorted(scores, key=lambda score: score["time"])


def keep_best_scores_only():
    """Keep the scoreboard from growing forever during class."""
    scores[:] = sorted_scores()[:MAX_SCORES]


def port_is_open(port):
    """Check whether another process is already using this port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.settimeout(0.25)
        return probe.connect_ex(("127.0.0.1", port)) == 0


def find_windows_port_pids(port):
    """Find Windows process IDs using the port, if possible."""
    result = subprocess.run(
        ["netstat", "-ano"],
        capture_output=True,
        text=True,
        check=False,
    )

    for line in result.stdout.splitlines():
        if f":{port}" in line and "LISTENING" in line:
            parts = line.split()
            if parts:
                return [parts[-1]]

    return []


def find_unix_port_pids(port):
    """Find Linux or macOS process IDs using the port, if possible."""
    if shutil.which("lsof"):
        lsof_result = subprocess.run(
            ["lsof", "-ti", f"tcp:{port}"],
            capture_output=True,
            text=True,
            check=False,
        )
        pids = [line.strip() for line in lsof_result.stdout.splitlines() if line.strip()]
        if pids:
            return pids

    if shutil.which("fuser"):
        fuser_result = subprocess.run(
            ["fuser", f"{port}/tcp"],
            capture_output=True,
            text=True,
            check=False,
        )
        return [part.strip() for part in fuser_result.stdout.split() if part.strip().isdigit()]

    return []


def find_port_pids(port):
    """Find process IDs using the port on the current operating system."""
    if platform.system() == "Windows":
        return find_windows_port_pids(port)

    return find_unix_port_pids(port)


def stop_port_processes(pids):
    """Stop existing server processes after the user approves."""
    if platform.system() == "Windows":
        for pid in pids:
            subprocess.run(["taskkill", "/PID", pid, "/F"], check=False)
        return

    for pid in pids:
        try:
            os.kill(int(pid), signal.SIGTERM)
        except OSError as error:
            print(f"Could not stop process {pid}: {error}")


def ask_to_free_port(port):
    """Warn about a busy port and offer to stop it on Windows."""
    if not port_is_open(port):
        return

    print()
    print(f"Port {port} is already in use.")
    print("That usually means another ReactionRace server is still running.")

    pids = find_port_pids(port)
    if not pids:
        print("Could not identify the process using the port.")
        print("Close the old terminal or restart Codespaces, then try again.")
        sys.exit(1)

    print(f"Process ID(s) using port {port}: {', '.join(pids)}")
    answer = input("Stop these process(es) so this server can start? [y/N] ").strip().lower()

    if answer not in {"y", "yes"}:
        print("Keeping the existing process. Server was not started.")
        sys.exit(1)

    stop_port_processes(pids)
    time.sleep(0.5)

    if port_is_open(port):
        print("The port is still busy. Stop it manually, then try again.")
        sys.exit(1)

    print(f"Port {port} is clear now.")


def main():
    """Start the backend server."""
    ask_to_free_port(PORT)
    server = ReusableThreadingHTTPServer((HOST, PORT), ReactionRaceHandler)

    print()
    print("SPRK ReactionRace backend")
    print("- Shared classroom scoreboard is ON.")
    print("- Open this app from Codespaces Ports or a browser.")
    print(f"- Local link: http://localhost:{PORT}")
    print(f"- Classroom link pattern: http://<host-laptop-ip>:{PORT}")
    print("- Press Ctrl+C to stop.")
    print()
    log_event("server", f"started on port {PORT}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log_event("server", "stopped")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
