import { createFlashHttpServer } from "./flash-http-server.js";

const port = Number(process.env.API_PORT || process.env.PORT || 4188);
const host = process.env.API_HOST || process.env.HOST || "127.0.0.1";

const { server, startRenderWorker, stopRenderWorker } = createFlashHttpServer();
const renderWorkerEnabled = process.env.GUGU_FLASH_RENDER_WORKER_DISABLED !== "1";
if (renderWorkerEnabled) {
  startRenderWorker({
    intervalMs: Number(process.env.GUGU_FLASH_RENDER_WORKER_INTERVAL_MS || 5000),
    limit: Number(process.env.GUGU_FLASH_RENDER_WORKER_BATCH_SIZE || process.env.GUGU_FLASH_RENDER_WORKER_LIMIT || 3),
    workerId: process.env.GUGU_FLASH_RENDER_WORKER_ID || "render_worker_alpha",
    runImmediately: process.env.GUGU_FLASH_RENDER_WORKER_RUN_IMMEDIATELY === "1",
    includeRunning: process.env.GUGU_FLASH_RENDER_WORKER_INCLUDE_RUNNING === "1",
    runningStaleMs: Number(process.env.GUGU_FLASH_RENDER_WORKER_RUNNING_STALE_MS || 5 * 60 * 1000),
  });
}

server.listen(port, host, () => {
  const localHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`Gugu Flash API running at http://${localHost}:${port}`);
  console.log(`Health: http://${localHost}:${port}/flash/health`);
  console.log(`Render worker: ${renderWorkerEnabled ? "enabled" : "disabled"}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopRenderWorker?.();
    server.close(() => process.exit(0));
  });
}
