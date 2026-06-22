import { WebSocket } from "ws";
import { MAX_BUFFERED_BYTES, PING_INTERVAL_MS } from "./constants.js";
import { Hub } from "./hub.js";
import { ClientMsg, Client } from "./types.js";
import { log } from "./logger.js";

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

    if (msg.type === "resume") {
      if (msg.lastSeq && msg.lastSeq > 0) {
        const { msgs, ok } = hub.replaySince(msg.lastSeq);
        if (ok) {
          for (const m of msgs) {
            enqueue(JSON.stringify(m));
          }
        } else {
          enqueue(JSON.stringify(hub.snapshot()));
        }
      } else {
        enqueue(JSON.stringify(hub.snapshot()));
      }

      if (msg.lastEventSeq && msg.lastEventSeq > 0) {
        const { msgs, ok } = hub.replayEventsSince(msg.lastEventSeq);
        if (ok) {
          for (const m of msgs) {
            enqueue(JSON.stringify(m));
          }
        } else {
          enqueue(JSON.stringify(hub.eventSnapshot()));
        }
      } else {
        enqueue(JSON.stringify(hub.eventSnapshot()));
      }
      return;
    }

    enqueue(JSON.stringify(hub.snapshot()));
    enqueue(JSON.stringify(hub.eventSnapshot()));
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
