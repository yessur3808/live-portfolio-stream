import { WebSocket } from "ws";
import { Hub } from "./hub";
import { ClientMsg, Client } from "./types";
import { log } from "./logger";

const MAX_BUFFERED_BYTES = 1 << 20;
const PING_INTERVAL_MS = 20_000;

export function handleConnection(ws: WebSocket, hub: Hub) {
  let isAlive = true;
  let handshakeDone = false;

  function enqueue(payload: string) {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > MAX_BUFFERED_BYTES) {
      log("warn", "client too slow, terminating", {
        buffered: ws.bufferedAmount,
      });
      ws.terminate();
      return;
    }
    ws.send(payload);
  }

  const client: Client = { enqueue };
  hub.register(client);

  function onMessage(raw: string) {
    if (handshakeDone) return;
    handshakeDone = true;

    let msg: ClientMsg;
    try {
      msg = JSON.parse(raw);
    } catch {
      msg = { type: "hello" };
    }

    if (msg.type === "resume" && msg.lastSeq && msg.lastSeq > 0) {
      const { msgs, ok } = hub.replaySince(msg.lastSeq);
      if (ok) {
        for (const m of msgs) enqueue(JSON.stringify(m));
      } else {
        enqueue(JSON.stringify(hub.snapshot()));
      }
    } else {
      enqueue(JSON.stringify(hub.snapshot()));
    }
  }

  const pingTimer = setInterval(() => {
    if (!isAlive) {
      ws.terminate();
      return;
    }
    isAlive = false;
    ws.ping();
  }, PING_INTERVAL_MS);

  function cleanup() {
    clearInterval(pingTimer);
    hub.unregister(client);
  }

  ws.on("message", (raw) => onMessage(raw.toString()));
  ws.on("pong", () => {
    isAlive = true;
  });
  ws.on("close", cleanup);
  ws.on("error", (e) => {
    log("warn", "client socket error", { err: (e as Error).message });
    cleanup();
  });
}
