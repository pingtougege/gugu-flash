import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { extname, join, normalize } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const port = Number(process.env.PORT || 4177);
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function resolvePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const relative = clean.endsWith("/") ? `${clean}index.html` : clean;
  const full = normalize(join(root, relative));
  if (!full.startsWith(normalize(root))) return null;
  return full;
}

function getLanUrls() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === "IPv4" && !entry.internal)
    .map((entry) => `http://${entry.address}:${port}`);
}

createServer(async (req, res) => {
  const cleanPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (cleanPath === "/apps/web") {
    res.writeHead(308, { Location: "/apps/web/" });
    res.end();
    return;
  }

  const filePath = resolvePath(req.url || "/");
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(port, host, () => {
  const localHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`Gugu Flash running at http://${localHost}:${port}`);

  if (host === "0.0.0.0") {
    for (const url of getLanUrls()) {
      console.log(`Gugu Flash LAN URL: ${url}`);
    }
  }
});
