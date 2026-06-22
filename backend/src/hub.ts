import {
  EVENT_BATCH_INTERVAL_MS,
  EVENT_RING_SIZE,
  EVENT_SNAPSHOT_LIMIT,
  QUOTE_BATCH_INTERVAL_MS,
  QUOTE_RING_SIZE,
} from "./constants.js";
import { Quote, FieldDiff, ServerMsg, Client, LiveEvent } from "./types.js";
import { log } from "./logger.js";

interface RingEntry {
  seq: number;
  change: FieldDiff;
}

interface EventRingEntry {
  eventSeq: number;
  event: LiveEvent;
}

export type Hub = ReturnType<typeof createHub>;

export function createHub() {
  const state = new Map<string, Quote>();
  let seq = 0;
  let eventSeq = 0;

  const ring: RingEntry[] = new Array(QUOTE_RING_SIZE);
  let rhead = 0;
  let rlen = 0;

  const eventRing: EventRingEntry[] = new Array(EVENT_RING_SIZE);
  let erhead = 0;
  let erlen = 0;

  let pending = new Map<string, FieldDiff>();
  let pendingEvents = new Map<string, LiveEvent>();
  const eventState = new Map<string, LiveEvent>();

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
      rhead = (rhead + 1) % QUOTE_RING_SIZE;
      if (rlen < QUOTE_RING_SIZE) rlen++;
      changes.push(d);
    }
    pending = new Map();

    broadcast({ type: "diff", seq, changes, ts: Date.now() });
  }

  function flushEventBatch() {
    if (pendingEvents.size === 0) {
      broadcast({ type: "eventHeartbeat", eventSeq, ts: Date.now() });
      return;
    }

    const events: LiveEvent[] = [];
    for (const event of pendingEvents.values()) {
      eventSeq++;
      eventRing[erhead] = { eventSeq, event };
      erhead = (erhead + 1) % EVENT_RING_SIZE;
      if (erlen < EVENT_RING_SIZE) erlen++;
      events.push(event);
    }
    pendingEvents = new Map();

    broadcast({ type: "eventBatch", eventSeq, events, ts: Date.now() });
  }

  function start() {
    setInterval(flushBatch, QUOTE_BATCH_INTERVAL_MS);
    setInterval(flushEventBatch, EVENT_BATCH_INTERVAL_MS);
    log("info", "hub started", {
      batchMs: QUOTE_BATCH_INTERVAL_MS,
      ringSize: QUOTE_RING_SIZE,
      eventBatchMs: EVENT_BATCH_INTERVAL_MS,
      eventRingSize: EVENT_RING_SIZE,
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

  function eventSnapshot(): ServerMsg {
    const events = [...eventState.values()]
      .sort((a, b) => b.ingestTs - a.ingestTs)
      .slice(0, EVENT_SNAPSHOT_LIMIT);
    return { type: "eventSnapshot", eventSeq, events, ts: Date.now() };
  }

  function replaySince(lastSeq: number): { msgs: ServerMsg[]; ok: boolean } {
    if (rlen === 0) return { msgs: [], ok: lastSeq === seq };

    const oldestIdx = (rhead - rlen + QUOTE_RING_SIZE) % QUOTE_RING_SIZE;
    const oldestSeq = ring[oldestIdx].seq;
    if (lastSeq + 1 < oldestSeq) return { msgs: [], ok: false };

    const msgs: ServerMsg[] = [];
    for (let i = 0; i < rlen; i++) {
      const e = ring[(oldestIdx + i) % QUOTE_RING_SIZE];
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

  function replayEventsSince(lastEventSeq: number): {
    msgs: ServerMsg[];
    ok: boolean;
  } {
    if (erlen === 0) return { msgs: [], ok: lastEventSeq === eventSeq };

    const oldestIdx = (erhead - erlen + EVENT_RING_SIZE) % EVENT_RING_SIZE;
    const oldestSeq = eventRing[oldestIdx].eventSeq;
    if (lastEventSeq + 1 < oldestSeq) return { msgs: [], ok: false };

    const msgs: ServerMsg[] = [];
    for (let i = 0; i < erlen; i++) {
      const e = eventRing[(oldestIdx + i) % EVENT_RING_SIZE];
      if (e.eventSeq > lastEventSeq) {
        msgs.push({
          type: "eventBatch",
          eventSeq: e.eventSeq,
          events: [e.event],
          ts: Date.now(),
        });
      }
    }
    return { msgs, ok: true };
  }

  function ingestEvent(event: LiveEvent) {
    const prev = eventState.get(event.eventId);
    if (prev && prev.ingestTs >= event.ingestTs) return;

    eventState.set(event.eventId, event);
    pendingEvents.set(event.eventId, event);
  }

  return {
    start,
    ingestQuote,
    ingestEvent,
    snapshot,
    eventSnapshot,
    replaySince,
    replayEventsSince,
    register: (c: Client) => clients.add(c),
    unregister: (c: Client) => clients.delete(c),
  };
}
