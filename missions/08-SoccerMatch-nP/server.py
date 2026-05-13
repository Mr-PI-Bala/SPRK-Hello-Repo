"""Mission 08 backend: shared live multiplayer soccer match."""

from __future__ import annotations

from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from socketserver import ThreadingMixIn
import json
import math
import mimetypes
import threading
import time
from urllib.parse import urlparse
from http.server import HTTPServer


MISSION_FOLDER = Path(__file__).resolve().parent
SHARED_FOLDER = MISSION_FOLDER.parent / "_shared"
PORT = 8008
MAX_EVENTS = 120
PLAYER_TIMEOUT_SECONDS = 45
TICK_SECONDS = 1 / 30
FIELD_WIDTH = 980
FIELD_HEIGHT = 620
GOAL_WIDTH = 170
PLAYER_RADIUS = 18
BALL_RADIUS = 12


def clean_text(raw_value, fallback, limit):
    value = str(raw_value or "").strip()
    return value[:limit] or fallback


def make_json_response(handler, status_code, data):
    body = json.dumps(data).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    try:
        handler.wfile.write(body)
    except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
        return


def read_json(handler):
    content_length = int(handler.headers.get("Content-Length", "0"))
    if content_length <= 0:
      return {}
    return json.loads(handler.rfile.read(content_length).decode("utf-8"))


class ReusableThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class SoccerMissionState:
    def __init__(self):
        self.lock = threading.Lock()
        self.events = []
        self.next_event_id = 1
        self.players = {}
        self.next_player_id = 1
        self.score = {"home": 0, "away": 0}
        self.match_seconds = 0.0
        self.running = False
        self.ball = self._default_ball()
        self.teams = {"home": "Blue", "away": "Gold"}
        self.last_goal = ""
        self.log_event("server", "started SoccerMatch mission")

    def _default_ball(self):
        return {"x": FIELD_WIDTH / 2, "y": FIELD_HEIGHT / 2, "vx": 0.0, "vy": 0.0}

    def _default_player(self, name, team, scheme, device_id):
        spawn_x = FIELD_WIDTH * (0.25 if team == "home" else 0.75)
        lane = self._team_count(team)
        spawn_y = 110 + (lane % 6) * 72
        return {
            "id": self.next_player_id,
            "deviceId": device_id,
            "scheme": scheme,
            "name": name,
            "team": team,
            "x": spawn_x,
            "y": min(FIELD_HEIGHT - 80, spawn_y),
            "angle": 0.0 if team == "home" else 180.0,
            "kickPressed": False,
            "kickCooldown": 0.0,
            "turnDirection": 0,
            "turnHoldSeconds": 0.0,
            "moveX": 0.0,
            "moveY": 0.0,
            "lastSeen": time.time(),
        }

    def _team_count(self, team):
        return sum(1 for player in self.players.values() if player["team"] == team)

    def log_event(self, kind, message):
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

    def join_player(self, data):
        with self.lock:
            device_id = clean_text(data.get("deviceId"), "device", 48)
            scheme = clean_text(data.get("scheme"), "wasd", 12)
            team = clean_text(data.get("team"), "home", 8)
            if team not in {"home", "away"}:
                team = "home"
            name = clean_text(data.get("name"), f"{scheme.upper()} Player", 24)
            color = clean_text(data.get("color"), "#ffffff", 16)
            avatar = clean_text(data.get("avatar"), "circle", 16)
            if avatar not in {"circle", "rectangle"}:
                avatar = "circle"

            existing = None
            for player in self.players.values():
                if player["deviceId"] == device_id and player["scheme"] == scheme:
                    existing = player
                    break

            if existing:
                existing["name"] = name
                existing["team"] = team
                existing["color"] = color
                existing["avatar"] = avatar
                existing["lastSeen"] = time.time()
                self.log_event("join", f"{name} rejoined on {team}.")
                return existing["id"]

            player = self._default_player(name, team, scheme, device_id)
            player["color"] = color
            player["avatar"] = avatar
            self.players[player["id"]] = player
            self.next_player_id += 1
            self.log_event("join", f"{name} joined {team} using {scheme}.")
            return player["id"]

    def update_input(self, data):
        with self.lock:
            player_id = int(data.get("playerId") or 0)
            player = self.players.get(player_id)
            if not player:
                return False

            player["lastSeen"] = time.time()
            player["moveX"] = max(-1.0, min(1.0, float(data.get("moveX") or 0.0)))
            player["moveY"] = max(-1.0, min(1.0, float(data.get("moveY") or 0.0)))
            turn = int(data.get("turnDirection") or 0)
            player["turnDirection"] = -1 if turn < 0 else 1 if turn > 0 else 0
            player["kickPressed"] = bool(data.get("kickPressed"))
            return True

    def update_teams(self, data):
        with self.lock:
            self.teams["home"] = clean_text(data.get("home"), self.teams["home"], 18)
            self.teams["away"] = clean_text(data.get("away"), self.teams["away"], 18)
            self.log_event("state", "updated team names")

    def reset_match(self):
        with self.lock:
            self.score = {"home": 0, "away": 0}
            self.match_seconds = 0.0
            self.last_goal = ""
            self.running = False
            self.ball = self._default_ball()
            for player in self.players.values():
                player["x"] = FIELD_WIDTH * (0.25 if player["team"] == "home" else 0.75)
                player["y"] = min(FIELD_HEIGHT - 80, 110 + (player["id"] % 6) * 72)
                player["angle"] = 0.0 if player["team"] == "home" else 180.0
                player["kickCooldown"] = 0.0
            self.log_event("reset", "reset the soccer match")

    def set_running(self, running):
        with self.lock:
            self.running = bool(running)
            self.log_event("state", "started the match" if self.running else "paused the match")

    def force_goal_for_test(self, team):
        with self.lock:
            if team not in {"home", "away"}:
                return
            self._apply_goal(team, "test harness")

    def _apply_goal(self, team, scorer_name):
        self.score[team] += 1
        team_name = self.teams[team]
        self.last_goal = f"{team_name} scored via {scorer_name}."
        self.ball = self._default_ball()
        self.log_event("goal", f"{team_name} scored. Reporter: {scorer_name}. Score is {self.score['home']}-{self.score['away']}.")

    def _trim_players(self):
        now = time.time()
        expired_ids = [player_id for player_id, player in self.players.items() if now - player["lastSeen"] > PLAYER_TIMEOUT_SECONDS]
        for player_id in expired_ids:
            player = self.players.pop(player_id)
            self.log_event("leave", f"{player['name']} timed out and left the match.")

    def tick(self):
        with self.lock:
            self._trim_players()
            if self.running:
                self.match_seconds += TICK_SECONDS

            for player in self.players.values():
                if player["turnDirection"] == 0:
                    player["turnHoldSeconds"] = 0.0
                else:
                    player["turnHoldSeconds"] = min(1.6, player["turnHoldSeconds"] + TICK_SECONDS)
                    turn_rate = 60.0 + (player["turnHoldSeconds"] * 180.0)
                    player["angle"] = (player["angle"] + player["turnDirection"] * turn_rate * TICK_SECONDS) % 360

                move_x = player["moveX"]
                move_y = player["moveY"]
                move_length = math.hypot(move_x, move_y)
                if self.running and move_length > 0:
                    move_x /= move_length
                    move_y /= move_length
                    player["x"] += move_x * 210.0 * TICK_SECONDS
                    player["y"] += move_y * 210.0 * TICK_SECONDS

                player["x"] = max(PLAYER_RADIUS, min(FIELD_WIDTH - PLAYER_RADIUS, player["x"]))
                player["y"] = max(PLAYER_RADIUS, min(FIELD_HEIGHT - PLAYER_RADIUS, player["y"]))
                player["kickCooldown"] = max(0.0, player["kickCooldown"] - TICK_SECONDS)

                distance_to_ball = math.hypot(player["x"] - self.ball["x"], player["y"] - self.ball["y"])
                if self.running and distance_to_ball <= PLAYER_RADIUS + BALL_RADIUS + 8:
                    if player["kickPressed"] and player["kickCooldown"] <= 0:
                        angle_radians = math.radians(player["angle"])
                        kick_speed = 420.0 + player["turnHoldSeconds"] * 150.0
                        self.ball["vx"] = math.cos(angle_radians) * kick_speed
                        self.ball["vy"] = math.sin(angle_radians) * kick_speed
                        player["kickCooldown"] = 0.45
                    else:
                        carry_speed = 110.0
                        self.ball["vx"] += (player["x"] - self.ball["x"]) * 0.4
                        self.ball["vy"] += (player["y"] - self.ball["y"]) * 0.4
                        if move_length > 0:
                            self.ball["vx"] += move_x * carry_speed * TICK_SECONDS
                            self.ball["vy"] += move_y * carry_speed * TICK_SECONDS

            if self.running:
                self.ball["x"] += self.ball["vx"] * TICK_SECONDS
                self.ball["y"] += self.ball["vy"] * TICK_SECONDS
                self.ball["vx"] *= 0.986
                self.ball["vy"] *= 0.986

                if self.ball["y"] <= BALL_RADIUS:
                    self.ball["y"] = BALL_RADIUS
                    self.ball["vy"] *= -0.85
                if self.ball["y"] >= FIELD_HEIGHT - BALL_RADIUS:
                    self.ball["y"] = FIELD_HEIGHT - BALL_RADIUS
                    self.ball["vy"] *= -0.85

                in_goal_lane = (FIELD_HEIGHT / 2 - GOAL_WIDTH / 2) <= self.ball["y"] <= (FIELD_HEIGHT / 2 + GOAL_WIDTH / 2)
                if self.ball["x"] <= BALL_RADIUS:
                    if in_goal_lane:
                        self._apply_goal("away", "live play")
                    else:
                        self.ball["x"] = BALL_RADIUS
                        self.ball["vx"] *= -0.85
                if self.ball["x"] >= FIELD_WIDTH - BALL_RADIUS:
                    if in_goal_lane:
                        self._apply_goal("home", "live play")
                    else:
                        self.ball["x"] = FIELD_WIDTH - BALL_RADIUS
                        self.ball["vx"] *= -0.85

    def snapshot(self):
        with self.lock:
            return {
                "field": {"width": FIELD_WIDTH, "height": FIELD_HEIGHT, "goalWidth": GOAL_WIDTH},
                "teams": dict(self.teams),
                "score": dict(self.score),
                "matchSeconds": round(self.match_seconds, 1),
                "lastGoal": self.last_goal,
                "running": self.running,
                "ball": {key: round(value, 2) for key, value in self.ball.items()},
                "players": [
                    {
                        "id": player["id"],
                        "name": player["name"],
                        "team": player["team"],
                        "scheme": player["scheme"],
                        "color": player.get("color", "#ffffff"),
                        "avatar": player.get("avatar", "circle"),
                        "x": round(player["x"], 2),
                        "y": round(player["y"], 2),
                        "angle": round(player["angle"], 1),
                    }
                    for player in self.players.values()
                ],
            }


mission_state = SoccerMissionState()


def tick_loop():
    while True:
        mission_state.tick()
        time.sleep(TICK_SECONDS)


class Mission08Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(MISSION_FOLDER), **kwargs)

    def log_message(self, format, *args):
        mission_state.log_event("http", f"{self.address_string()} {format % args}")

    def do_GET(self):
        path = urlparse(self.path).path

        if path.startswith("/_shared/"):
            self.serve_shared_file(path.removeprefix("/_shared/"))
            return

        if path == "/api/state":
            make_json_response(self, 200, {"state": mission_state.snapshot()})
            return

        if path == "/api/events":
            make_json_response(self, 200, {"events": mission_state.events})
            return

        if path == "/api/scores":
            scoreboard = [
                {"id": 1, "name": mission_state.teams["home"], "points": mission_state.score["home"], "detail": "Goals", "sound": "coin"},
                {"id": 2, "name": mission_state.teams["away"], "points": mission_state.score["away"], "detail": "Goals", "sound": "coin"},
            ]
            make_json_response(self, 200, {"scores": scoreboard})
            return

        super().do_GET()

    def serve_shared_file(self, relative_path):
        safe_parts = [part for part in relative_path.split("/") if part and part not in {".", ".."}]
        target = SHARED_FOLDER.joinpath(*safe_parts)
        if not target.is_file() or SHARED_FOLDER not in target.resolve().parents:
            make_json_response(self, 404, {"error": "Shared asset not found."})
            return

        body = target.read_bytes()
        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            return

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            data = read_json(self)
        except json.JSONDecodeError:
            make_json_response(self, 400, {"error": "Request body was not valid JSON."})
            return

        if path == "/api/join":
            player_id = mission_state.join_player(data)
            make_json_response(self, 201, {"playerId": player_id, "state": mission_state.snapshot()})
            return

        if path == "/api/input":
            updated = mission_state.update_input(data)
            make_json_response(self, 200, {"ok": updated})
            return

        if path == "/api/teams":
            mission_state.update_teams(data)
            make_json_response(self, 200, {"state": mission_state.snapshot()})
            return

        if path == "/api/match":
            action = clean_text(data.get("action"), "", 24)
            if action == "start":
                mission_state.set_running(True)
                make_json_response(self, 200, {"state": mission_state.snapshot()})
                return
            if action == "pause":
                mission_state.set_running(False)
                make_json_response(self, 200, {"state": mission_state.snapshot()})
                return
            make_json_response(self, 400, {"error": "Unknown match action."})
            return

        if path == "/api/events":
            mission_state.log_event(clean_text(data.get("kind"), "frontend", 24), clean_text(data.get("message"), "frontend event", 120))
            make_json_response(self, 201, {"events": mission_state.events})
            return

        if path == "/api/test":
            action = clean_text(data.get("action"), "", 24)
            if action == "goal":
                team = clean_text(data.get("team"), "home", 8)
                mission_state.force_goal_for_test(team)
                make_json_response(self, 200, {"state": mission_state.snapshot()})
                return
            make_json_response(self, 400, {"error": "Unknown test action."})
            return

        make_json_response(self, 404, {"error": "Unknown API path."})

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path == "/api/state":
            mission_state.reset_match()
            make_json_response(self, 200, {"state": mission_state.snapshot()})
            return
        make_json_response(self, 404, {"error": "Unknown API path."})


if __name__ == "__main__":
    tick_thread = threading.Thread(target=tick_loop, daemon=True)
    tick_thread.start()

    print()
    print("SPRK SoccerMatch backend")
    print("- Shared classroom state is ON.")
    print(f"- Local link: http://localhost:{PORT}")
    print(f"- Classroom link pattern: http://<host-laptop-ip>:{PORT}")
    print("- Press Ctrl+C to stop.")
    print()

    server = ReusableThreadingHTTPServer(("0.0.0.0", PORT), Mission08Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        mission_state.running = False
        mission_state.log_event("server", "stopped")
    finally:
        server.server_close()
