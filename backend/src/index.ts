import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { log } from "./logger";
import { createHub } from "./hub";
import { handleConnection } from "./client";
import { runIngest } from "./ingest";

const PORT = Number(process.env.PORT ?? 8080);

const hub = createHub();
hub.start();
runIngest(hub);

const server = createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => handleConnection(ws, hub));

server.listen(PORT, () => log("info", "http listening", { port: PORT }));
