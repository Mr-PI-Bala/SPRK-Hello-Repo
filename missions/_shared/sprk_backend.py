"""
Shared SPRK classroom backend helpers.

Each mission keeps its own `server.py`, but the repeated classroom behavior
lives here so students can compare missions without reading six copies of the
same port, score, and X-Ray event code.
"""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
import os
import platform
import signal
import shutil
import socket
import subprocess
import sys
import time
from urllib.parse import urlparse


MAX_EVENTS = 80
MAX_SCORES = 30


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    """Allow a clean restart after a server releases its port."""

    allow_reuse_address = True


class MissionState:
    """Tiny in-memory classroom state for one running backend."""

    def __init__(self, title, initial_state):
        self.title = title
        self.initial_state = dict(initial_state)
        self.state = dict(initial_state)
        self.scores = []
        self.events = []
        self.next_score_id = 1
        self.next_event_id = 1

    def log_event(self, kind, message):
        """Print an event and save it for the frontend X-Ray Vision panel."""
        event = {
            "id": self.next_event_id,
            "time": time.strftime("%H:%M:%S"),
            "kind": kind,
            "message": message,
        }
        self.next_event_id += 1
        self.events.append(event)
        del self.events[:-MAX_EVENTS]
        print(f"{event['time']} {kind}: {message}")

    def add_score(self, data):
        """Add one shared classroom score."""
        score = {
            "id": self.next_score_id,
            "name": clean_text(data.get("name"), "SPRKPlayer", 24),
            "points": clean_number(data.get("points"), 0),
            "detail": clean_text(data.get("detail"), "", 80),
            "sound": clean_sound(data.get("sound")),
        }
        self.next_score_id += 1
        self.scores.append(score)
        self.scores.sort(key=lambda item: item["points"], reverse=True)
        del self.scores[MAX_SCORES:]
        self.log_event("score", f"{score['name']} scored {score['points']} ({score['detail']})")
        return score

    def merge_state(self, data):
        """Update shared mission state with simple JSON values."""
        for key, value in data.items():
            if key in {"scores", "events"}:
                continue
            self.state[key] = value
        self.log_event("state", "updated shared mission state")

    def reset(self):
        """Reset scores and shared state for a new classroom round."""
        self.state = dict(self.initial_state)
        self.scores.clear()
        self.log_event("reset", "mission state and scores reset")


def clean_text(raw_value, fallback, limit):
    """Keep student-facing strings readable and short."""
    value = str(raw_value or "").strip()
    return value[:limit] or fallback


def clean_number(raw_value, fallback):
    """Turn frontend numbers into safe integers."""
    try:
        return int(raw_value)
    except (TypeError, ValueError):
        return fallback


def clean_sound(raw_sound):
    """Only allow frontend sound names we know how to play."""
    sound = str(raw_sound or "").strip()
    allowed = {"spark", "chime", "laser", "pop", "drum", "coin", "zap", "level"}
    return sound if sound in allowed else "spark"


def make_json_response(handler, status_code, data):
    """Send a JSON response back to the browser."""
    body = json.dumps(data).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def read_json(handler):
    """Read a JSON request body from the browser."""
    content_length = int(handler.headers.get("Content-Length", "0"))
    body = handler.rfile.read(content_length)
    if not body:
        return {}
    return json.loads(body.decode("utf-8"))


def make_handler(mission_folder, mission_state):
    """Create a request handler class for one mission folder."""
    shared_folder = mission_folder.parent / "_shared"

    class SPRKMissionHandler(SimpleHTTPRequestHandler):
        """Serves mission files plus shared classroom API routes."""

        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(mission_folder), **kwargs)

        def log_message(self, format, *args):
            mission_state.log_event("http", f"{self.address_string()} {format % args}")

        def do_GET(self):
            path = urlparse(self.path).path

            if path.startswith("/_shared/"):
                self.serve_shared_file(path.removeprefix("/_shared/"))
                return

            if path == "/api/scores":
                make_json_response(self, 200, {"scores": mission_state.scores})
                return

            if path == "/api/events":
                make_json_response(self, 200, {"events": mission_state.events})
                return

            if path == "/api/state":
                make_json_response(self, 200, {"state": mission_state.state})
                return

            super().do_GET()

        def serve_shared_file(self, relative_path):
            """Serve common classroom assets without allowing path traversal."""
            safe_parts = [part for part in relative_path.split("/") if part and part not in {".", ".."}]
            target = shared_folder.joinpath(*safe_parts)

            if not target.is_file() or shared_folder not in target.resolve().parents:
                make_json_response(self, 404, {"error": "Shared asset not found."})
                return

            body = target.read_bytes()
            content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):
            path = urlparse(self.path).path

            try:
                data = read_json(self)
            except json.JSONDecodeError:
                make_json_response(self, 400, {"error": "Request body was not valid JSON."})
                return

            if path == "/api/scores":
                mission_state.add_score(data)
                make_json_response(self, 201, {"scores": mission_state.scores})
                return

            if path == "/api/state":
                mission_state.merge_state(data)
                make_json_response(self, 200, {"state": mission_state.state})
                return

            if path == "/api/events":
                mission_state.log_event(
                    clean_text(data.get("kind"), "frontend", 24),
                    clean_text(data.get("message"), "frontend event", 120),
                )
                make_json_response(self, 201, {"events": mission_state.events})
                return

            make_json_response(self, 404, {"error": "Unknown API path."})

        def do_DELETE(self):
            path = urlparse(self.path).path

            if path == "/api/scores":
                mission_state.scores.clear()
                mission_state.log_event("scoreboard", "cleared")
                make_json_response(self, 200, {"scores": []})
                return

            if path == "/api/state":
                mission_state.reset()
                make_json_response(self, 200, {"state": mission_state.state})
                return

            make_json_response(self, 404, {"error": "Unknown API path."})

    return SPRKMissionHandler


def port_is_open(port):
    """Check whether another process is already using this port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.settimeout(0.25)
        return probe.connect_ex(("127.0.0.1", port)) == 0


def find_windows_port_pids(port):
    """Find Windows process IDs using the port, if possible."""
    result = subprocess.run(["netstat", "-ano"], capture_output=True, text=True, check=False)
    pids = []
    for line in result.stdout.splitlines():
        if f":{port}" in line and "LISTENING" in line:
            parts = line.split()
            if parts:
                pids.append(parts[-1])
    return sorted(set(pids))


def find_unix_port_pids(port):
    """Find Linux or macOS process IDs using the port, if possible."""
    if shutil.which("lsof"):
        result = subprocess.run(["lsof", "-ti", f"tcp:{port}"], capture_output=True, text=True, check=False)
        pids = [line.strip() for line in result.stdout.splitlines() if line.strip()]
        if pids:
            return sorted(set(pids))

    if shutil.which("fuser"):
        result = subprocess.run(["fuser", f"{port}/tcp"], capture_output=True, text=True, check=False)
        return sorted(set(part.strip() for part in result.stdout.split() if part.strip().isdigit()))

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
    """Warn about a busy port and offer to stop it safely."""
    if not port_is_open(port):
        return

    print()
    print(f"Port {port} is already in use.")
    print("That usually means another SPRK mission server is still running.")
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


def run_mission_server(mission_folder, title, port, initial_state=None):
    """Start one SPRK mission backend."""
    ask_to_free_port(port)
    mission_state = MissionState(title, initial_state or {})
    handler = make_handler(mission_folder, mission_state)
    server = ReusableThreadingHTTPServer(("0.0.0.0", port), handler)

    print()
    print(f"SPRK {title} backend")
    print("- Shared classroom state is ON.")
    print("- Open this app from Codespaces Ports or a browser.")
    print(f"- Local link: http://localhost:{port}")
    print(f"- Classroom link pattern: http://<host-laptop-ip>:{port}")
    print("- Press Ctrl+C to stop.")
    print()
    mission_state.log_event("server", f"started {title} on port {port}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        mission_state.log_event("server", "stopped")
    finally:
        server.server_close()
