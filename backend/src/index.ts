import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { log } from "./logger.js";
import { createHub } from "./hub.js";
import { handleConnection } from "./client.js";
import { runIngest } from "./ingest.js";

const PORT = Number(process.env.PORT ?? 8080);

const hub = createHub();
hub.start();
const newsController = runIngest(hub);

const server = createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "POST" && req.url === "/admin/refresh-news") {
    void newsController
      .refreshNews()
      .then(() => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "refreshed" }));
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

const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => handleConnection(ws, hub));

server.listen(PORT, () => log("info", "http listening", { port: PORT }));
