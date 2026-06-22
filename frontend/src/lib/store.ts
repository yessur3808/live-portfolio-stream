import { create } from "zustand";
import { recordPrice } from "./market";

export type Quote = { last: number; dayChangePct: number; ts: number };
export type Position = { symbol: string; qty: number; avgCost: number };
export type ConnState = "connecting" | "connected" | "reconnecting" | "stale";
export type EventCategory = "fed" | "macro" | "headline";
export type EventSeverity = "low" | "medium" | "high";

export type LiveEvent = {
  eventId: string;
  source: string;
  category: EventCategory;
  severity: EventSeverity;
  title: string;
  body: string;
  url?: string;
  symbols: string[];
  topics: string[];
  eventTs: number;
  ingestTs: number;
};

export type RankedEvent = LiveEvent & { relevance: number };

export const prices = new Map<string, Quote>();
export const dirty = new Set<string>();

const MAX_EVENTS = 120;
const MAX_TOASTS = 5;
const TOAST_COOLDOWN_MS = 90_000;
const lastToastAtByEvent = new Map<string, number>();

export const applySnapshot = (snap: Record<string, Quote>) => {
  prices.clear();
  for (const [sym, q] of Object.entries(snap)) {
    prices.set(sym, q);
    recordPrice(sym, q.last);
    dirty.add(sym);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const applyDiff = (changes: any[]) => {
  for (const c of changes) {
    const cur = prices.get(c.symbol) ?? { last: 0, dayChangePct: 0, ts: 0 };
    if (c.last !== undefined) cur.last = c.last;
    if (c.dayChangePct !== undefined) cur.dayChangePct = c.dayChangePct;
    cur.ts = c.ts;
    prices.set(c.symbol, cur);
    if (cur.last > 0) recordPrice(c.symbol, cur.last);
    dirty.add(c.symbol);
  }
};

const intersects = (left: string[], right: string[]) => {
  if (left.length === 0 || right.length === 0) return false;
  const rightSet = new Set(right);
  return left.some((value) => rightSet.has(value));
};

const scoreEvent = (
  event: LiveEvent,
  watchlist: string[],
  followedTopics: string[],
  mutedTopics: string[],
  followedSymbols: string[],
) => {
  if (intersects(event.topics, mutedTopics)) return -1;

  const severityBase = { low: 14, medium: 32, high: 58 };
  let relevance = severityBase[event.severity];

  if (intersects(event.symbols, watchlist)) relevance += 40;
  if (intersects(event.topics, followedTopics)) relevance += 18;
  if (intersects(event.symbols, followedSymbols)) relevance += 24;

  return relevance;
};

const upsertEvents = (incoming: LiveEvent[], replace: boolean) => {
  const state = useApp.getState();
  const bucket = replace
    ? new Map<string, RankedEvent>()
    : new Map<string, RankedEvent>(
        state.events.map((event) => [event.eventId, event]),
      );
  const freshEvents: RankedEvent[] = [];

  for (const event of incoming) {
    const relevance = scoreEvent(
      event,
      state.watchlist,
      state.followedTopics,
      state.mutedTopics,
      state.followedSymbols,
    );
    if (relevance < 0) continue;

    const ranked: RankedEvent = { ...event, relevance };
    const prev = bucket.get(event.eventId);
    if (!prev || prev.ingestTs <= ranked.ingestTs) {
      bucket.set(event.eventId, ranked);
      freshEvents.push(ranked);
    }
  }

  const events = [...bucket.values()]
    .sort((a, b) => b.ingestTs - a.ingestTs)
    .slice(0, MAX_EVENTS);

  const symbolAlertCount: Record<string, number> = {};
  for (const event of events) {
    if (event.relevance < 70) continue;
    for (const symbol of event.symbols) {
      symbolAlertCount[symbol] = (symbolAlertCount[symbol] ?? 0) + 1;
    }
  }

  let toastQueue = state.toastQueue;
  if (!replace) {
    const now = Date.now();
    const toasts = freshEvents
      .filter((event) => event.relevance >= 90)
      .filter((event) => {
        const lastShown = lastToastAtByEvent.get(event.eventId) ?? 0;
        if (now - lastShown < TOAST_COOLDOWN_MS) return false;
        lastToastAtByEvent.set(event.eventId, now);
        return true;
      });
    toastQueue = [...state.toastQueue, ...toasts]
      .slice(-MAX_TOASTS)
      .sort((a, b) => a.ingestTs - b.ingestTs);
  }

  useApp.setState({ events, symbolAlertCount, toastQueue });
};

export const applyEventSnapshot = (events: LiveEvent[]) => {
  upsertEvents(events, true);
};

export const applyEventBatch = (events: LiveEvent[]) => {
  upsertEvents(events, false);
};

// Connection + portfolio state DO live in React state (they change rarely).
type AppState = {
  conn: ConnState;
  setConn: (c: ConnState) => void;
  watchlist: string[];
  positions: Position[];
  toggleWatch: (sym: string) => void;
  events: RankedEvent[];
  symbolAlertCount: Record<string, number>;
  followedTopics: string[];
  mutedTopics: string[];
  followedSymbols: string[];
  toastQueue: RankedEvent[];
  toggleTopicFollow: (topic: string) => void;
  toggleTopicMute: (topic: string) => void;
  toggleSymbolFollow: (symbol: string) => void;
  dismissToast: (eventId: string) => void;
};

export const useApp = create<AppState>((set) => ({
  conn: "connecting",
  setConn: (c) => set({ conn: c }),
  watchlist: [
    "BTC",
    "ETH",
    "SOL",
    "ARB",
    "AVAX",
    "DOGE",
    "LINK",
    "OP",
    "MATIC",
    "APT",
    "SUI",
    "SEI",
    "TIA",
    "INJ",
    "LTC",
    "BCH",
    "NEAR",
    "FTM",
    "ATOM",
    "DOT",
    "ADA",
    "XRP",
    "BNB",
    "AAVE",
    "UNI",
    "RNDR",
    "WLD",
    "PEPE",
    "WIF",
    "ORDI",
  ],
  positions: [
    { symbol: "BTC", qty: 0.5, avgCost: 60000 },
    { symbol: "ETH", qty: 4, avgCost: 3000 },
    { symbol: "SOL", qty: 50, avgCost: 140 },
    { symbol: "ARB", qty: 2000, avgCost: 1.1 },
    { symbol: "DOGE", qty: 10000, avgCost: 0.12 },
  ],
  toggleWatch: (sym) =>
    set((s) => ({
      watchlist: s.watchlist.includes(sym)
        ? s.watchlist.filter((x) => x !== sym)
        : [...s.watchlist, sym],
    })),
  events: [],
  symbolAlertCount: {},
  followedTopics: ["fed", "macro", "news"],
  mutedTopics: [],
  followedSymbols: [],
  toastQueue: [],
  toggleTopicFollow: (topic) =>
    set((s) => ({
      followedTopics: s.followedTopics.includes(topic)
        ? s.followedTopics.filter((x) => x !== topic)
        : [...s.followedTopics, topic],
    })),
  toggleTopicMute: (topic) =>
    set((s) => ({
      mutedTopics: s.mutedTopics.includes(topic)
        ? s.mutedTopics.filter((x) => x !== topic)
        : [...s.mutedTopics, topic],
    })),
  toggleSymbolFollow: (symbol) =>
    set((s) => ({
      followedSymbols: s.followedSymbols.includes(symbol)
        ? s.followedSymbols.filter((x) => x !== symbol)
        : [...s.followedSymbols, symbol],
    })),
  dismissToast: (eventId) =>
    set((s) => ({
      toastQueue: s.toastQueue.filter((x) => x.eventId !== eventId),
    })),
}));
