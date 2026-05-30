import { spawn } from "node:child_process";

const webPort = process.env.WEB_PORT || process.env.PORT || "4177";
const apiPort = process.env.API_PORT || "4188";
const host = process.env.HOST || "127.0.0.1";

const children = [
  {
    name: "web",
    command: process.execPath,
    args: ["scripts/dev-server.mjs"],
    env: { ...process.env, PORT: webPort, HOST: host },
  },
  {
    name: "api",
    command: process.execPath,
    args: ["apps/backend/src/server.js"],
    env: { ...process.env, API_PORT: apiPort, API_HOST: host },
  },
];

function start({ name, command, args, env }) {
  const child = spawn(command, args, {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`[${name}] exited with ${signal || code}`);
    shutdown(code || 1);
  });
  return child;
}

let shuttingDown = false;
const running = children.map(start);

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of running) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 100);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log(`Gugu Flash Web: http://${host}:${webPort}/apps/web/`);
console.log(`Gugu Flash Web + API: http://${host}:${webPort}/apps/web/?api=http&apiBase=http%3A%2F%2F${host}%3A${apiPort}`);
console.log(`Gugu Flash Operator: http://${host}:${webPort}/apps/operator/?apiBase=http%3A%2F%2F${host}%3A${apiPort}`);
console.log(`Gugu Flash API: http://${host}:${apiPort}/flash/health`);
