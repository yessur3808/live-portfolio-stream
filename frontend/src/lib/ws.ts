import {
  applySnapshot,
  applyDiff,
  applyEventBatch,
  applyEventSnapshot,
  useApp,
} from "./store";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws";
const STALE_MS = 5000;

let socket: WebSocket | null = null;
let lastSeq = 0;
let lastEventSeq = 0;
let lastTick = Date.now();
let backoff = 500;
let staleTimer: number | undefined;

// function setConn(
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   c: Parameters<typeof useApp.getState>[0] extends never ? never : any,
// ) {
//   useApp.getState().setConn(c);
// }

const checkStale = () => {
  const conn = useApp.getState().conn;
  if (conn === "connected" && Date.now() - lastTick > STALE_MS) {
    useApp.getState().setConn("stale");
  }
};

export const connect = () => {
  useApp.getState().setConn(lastSeq > 0 ? "reconnecting" : "connecting");
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    backoff = 500;
    lastTick = Date.now();
    useApp.getState().setConn("connected");

    socket!.send(JSON.stringify({ type: "resume", lastSeq, lastEventSeq }));
    if (staleTimer) clearInterval(staleTimer);
    staleTimer = window.setInterval(checkStale, 1000);
  };

  socket.onmessage = (ev) => {
    lastTick = Date.now();
    const msg = JSON.parse(ev.data);
    if (useApp.getState().conn !== "connected")
      useApp.getState().setConn("connected");

    switch (msg.type) {
      case "snapshot":
        applySnapshot(msg.snapshot);
        lastSeq = msg.seq;
        break;
      case "diff":
        applyDiff(msg.changes);
        lastSeq = msg.seq;
        break;
      case "heartbeat":
        // keeps lastTick, avoids stale state
        break;
      case "eventSnapshot":
        applyEventSnapshot(msg.events);
        lastEventSeq = msg.eventSeq;
        break;
      case "eventBatch":
        applyEventBatch(msg.events);
        lastEventSeq = msg.eventSeq;
        break;
      case "eventHeartbeat":
        break;
    }
  };

  socket.onclose = () => {
    if (staleTimer) clearInterval(staleTimer);
    useApp.getState().setConn("reconnecting");
    backoff = Math.min(backoff * 2, 8000);
    setTimeout(connect, backoff + Math.random() * 300);
  };

  socket.onerror = () => socket?.close();
};

export const initVisibility = () => {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        connect();
      } else {
        socket.send(JSON.stringify({ type: "resume", lastSeq, lastEventSeq }));
      }
    }
  });
};
