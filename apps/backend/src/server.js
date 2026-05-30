import { createFlashHttpServer } from "./flash-http-server.js";

const port = Number(process.env.API_PORT || process.env.PORT || 4188);
const host = process.env.API_HOST || process.env.HOST || "127.0.0.1";

const { server } = createFlashHttpServer();

server.listen(port, host, () => {
  const localHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`Gugu Flash API running at http://${localHost}:${port}`);
  console.log(`Health: http://${localHost}:${port}/flash/health`);
});
