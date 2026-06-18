import { Quote, FieldDiff, ServerMsg, Client } from "./types.js";
import { log } from "./logger.js";

const BATCH_INTERVAL_MS = 75;
const RING_SIZE = 2000;

interface RingEntry {
  seq: number;
  change: FieldDiff;
}

export type Hub = ReturnType<typeof createHub>;

export function createHub() {
  const state = new Map<string, Quote>();
  let seq = 0;

  const ring: RingEntry[] = new Array(RING_SIZE);
  let rhead = 0;
  let rlen = 0;

  let pending = new Map<string, FieldDiff>();

  const clients = new Set<Client>();

  function broadcast(msg: ServerMsg) {
    const payload = JSON.stringify(msg);
    for (const c of clients) c.enqueue(payload);
  }

  function flushBatch() {
    if (pending.size === 0) {
      broadcast({ type: "heartbeat", seq, ts: Date.now() });
      return;
    }

    const changes: FieldDiff[] = [];
    for (const d of pending.values()) {
      seq++;
      ring[rhead] = { seq, change: d };
      rhead = (rhead + 1) % RING_SIZE;
      if (rlen < RING_SIZE) rlen++;
      changes.push(d);
    }
    pending = new Map();

    broadcast({ type: "diff", seq, changes, ts: Date.now() });
  }

  function start() {
    setInterval(flushBatch, BATCH_INTERVAL_MS);
    log("info", "hub started", {
      batchMs: BATCH_INTERVAL_MS,
      ringSize: RING_SIZE,
    });
  }

  function ingestQuote(q: Quote) {
    const prev = state.get(q.symbol);
    if (prev && prev.last === q.last && prev.dayChangePct === q.dayChangePct) {
      return;
    }
    state.set(q.symbol, q);

    let d = pending.get(q.symbol);
    if (!d) {
      d = { symbol: q.symbol, ts: q.ts };
      pending.set(q.symbol, d);
    }
    if (!prev || prev.last !== q.last) d.last = q.last;
    if (!prev || prev.dayChangePct !== q.dayChangePct)
      d.dayChangePct = q.dayChangePct;
    d.ts = q.ts;
  }

  function snapshot(): ServerMsg {
    const snap: Record<string, Quote> = {};
    for (const [k, v] of state) snap[k] = v;
    return { type: "snapshot", seq, snapshot: snap, ts: Date.now() };
  }

  function replaySince(lastSeq: number): { msgs: ServerMsg[]; ok: boolean } {
    if (rlen === 0) return { msgs: [], ok: lastSeq === seq };

    const oldestIdx = (rhead - rlen + RING_SIZE) % RING_SIZE;
    const oldestSeq = ring[oldestIdx].seq;
    if (lastSeq + 1 < oldestSeq) return { msgs: [], ok: false };

    const msgs: ServerMsg[] = [];
    for (let i = 0; i < rlen; i++) {
      const e = ring[(oldestIdx + i) % RING_SIZE];
      if (e.seq > lastSeq) {
        msgs.push({
          type: "diff",
          seq: e.seq,
          changes: [e.change],
          ts: Date.now(),
        });
      }
    }
    return { msgs, ok: true };
  }

  return {
    start,
    ingestQuote,
    snapshot,
    replaySince,
    register: (c: Client) => clients.add(c),
    unregister: (c: Client) => clients.delete(c),
  };
}
