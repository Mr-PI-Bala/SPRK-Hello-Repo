const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

const missions = {
  reactionrace: {
    key: "reactionrace",
    title: "ReactionRace",
    folder: path.resolve(__dirname, "..", "..", "missions", "01-ReactionRace-nP"),
    port: 8000,
  },
  snakegame: {
    key: "snakegame",
    title: "SnakeGame",
    folder: path.resolve(__dirname, "..", "..", "missions", "02-SnakeGame-1P-nP"),
    port: 8002,
  },
  pingpong: {
    key: "pingpong",
    title: "PingPong",
    folder: path.resolve(__dirname, "..", "..", "missions", "03-PingPong-2P-nP"),
    port: 8003,
  },
  flashcards: {
    key: "flashcards",
    title: "FlashCards",
    folder: path.resolve(__dirname, "..", "..", "missions", "04-FlashCards-1P-nP"),
    port: 8004,
  },
  quizroom: {
    key: "quizroom",
    title: "QuizRoom",
    folder: path.resolve(__dirname, "..", "..", "missions", "05-QuizRoom-nP"),
    port: 8005,
  },
  foursquare: {
    key: "foursquare",
    title: "FourSquare",
    folder: path.resolve(__dirname, "..", "..", "missions", "06-FourSquare-nP"),
    port: 8006,
  },
  soccerscore: {
    key: "soccerscore",
    title: "SoccerScore",
    folder: path.resolve(__dirname, "..", "..", "missions", "07-SoccerScore-nP"),
    port: 8007,
  },
};

function getMission() {
  const key = (process.env.SPRK_MISSION || "").toLowerCase();
  const mission = missions[key];

  if (!mission) {
    throw new Error(`Unknown or missing SPRK_MISSION. Expected one of: ${Object.keys(missions).join(", ")}`);
  }

  return mission;
}

function isPortOpen(targetHost, targetPort) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(300, () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(targetPort, targetHost);
  });
}

function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tryRequest = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Mission backend did not become ready at ${url}.`));
          return;
        }

        setTimeout(tryRequest, 250);
      });

      request.on("error", () => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Mission backend did not become ready at ${url}.`));
          return;
        }

        setTimeout(tryRequest, 250);
      });
    };

    tryRequest();
  });
}

function shutdownChild(child) {
  if (!child || child.killed) {
    return;
  }

  child.kill("SIGTERM");
  setTimeout(() => {
    if (!child.killed) {
      child.kill("SIGKILL");
    }
  }, 1_500).unref();
}

async function main() {
  const mission = getMission();
  const python = process.env.PYTHON || "python";

  if (await isPortOpen("127.0.0.1", mission.port)) {
    console.error(`Port ${mission.port} is already in use. Stop the existing ${mission.title} server before running Playwright.`);
    process.exit(1);
  }

  const child = spawn(python, ["server.py"], {
    cwd: mission.folder,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));

  child.once("exit", (code, signal) => {
    console.error(`${mission.title} backend exited early with code=${code} signal=${signal}.`);
    process.exit(code || 1);
  });

  process.once("SIGINT", () => {
    shutdownChild(child);
    process.exit(130);
  });

  process.once("SIGTERM", () => {
    shutdownChild(child);
    process.exit(143);
  });

  try {
    await waitForServer(`http://127.0.0.1:${mission.port}/api/scores`, 20_000);
    console.log(`${mission.title} backend ready at http://127.0.0.1:${mission.port}`);
  } catch (error) {
    shutdownChild(child);
    throw error;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
