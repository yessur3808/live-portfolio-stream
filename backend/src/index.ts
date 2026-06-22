import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import {
  DEFAULT_PORT,
  HEALTHCHECK_PATH,
  NEWS_SETTINGS_PATH,
  REFRESH_NEWS_PATH,
  WS_PATH,
} from "./constants.js";
import { log } from "./logger.js";
import { createHub } from "./hub.js";
import { handleConnection } from "./client.js";
import { runIngest } from "./ingest.js";

const PORT = Number(process.env.PORT ?? DEFAULT_PORT);

const hub = createHub();
hub.start();
const newsController = runIngest(hub);

const server = createServer((req, res) => {
  if (req.url === HEALTHCHECK_PATH) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "GET" && req.url === NEWS_SETTINGS_PATH) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        refreshIntervalMs: newsController.getRefreshIntervalMs(),
      }),
    );
    return;
  }

  if (req.method === "POST" && req.url === NEWS_SETTINGS_PATH) {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        const parsed = raw
          ? (JSON.parse(raw) as { refreshIntervalMs?: number })
          : {};
        const nextMs = Number(parsed.refreshIntervalMs);

        if (!Number.isFinite(nextMs) || nextMs <= 0) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(
            JSON.stringify({ status: "error", error: "invalid interval" }),
          );
          return;
        }

        const applied = newsController.setRefreshIntervalMs(nextMs);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({ status: "updated", refreshIntervalMs: applied }),
        );
      } catch (error) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(
          JSON.stringify({ status: "error", error: (error as Error).message }),
        );
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === REFRESH_NEWS_PATH) {
    void newsController
      .refreshNews()
      .then((result) => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({ status: "refreshed", emitted: result.emitted }),
        );
      })
      .catch((error) => {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(
          JSON.stringify({ status: "error", error: (error as Error).message }),
        );
      });
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server, path: WS_PATH });
wss.on("connection", (ws) => handleConnection(ws, hub));

server.listen(PORT, () => log("info", "http listening", { port: PORT }));
