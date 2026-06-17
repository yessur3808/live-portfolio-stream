import { create } from "zustand";

export type Quote = { last: number; dayChangePct: number; ts: number };
export type Position = { symbol: string; qty: number; avgCost: number };
export type ConnState = "connecting" | "connected" | "reconnecting" | "stale";

export const prices = new Map<string, Quote>();
export const dirty = new Set<string>();

export const applySnapshot = (snap: Record<string, Quote>) => {
  prices.clear();
  for (const [sym, q] of Object.entries(snap)) {
    prices.set(sym, q);
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
    dirty.add(c.symbol);
  }
};

// Connection + portfolio state DO live in React state (they change rarely).
type AppState = {
  conn: ConnState;
  setConn: (c: ConnState) => void;
  watchlist: string[];
  positions: Position[];
  toggleWatch: (sym: string) => void;
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
}));
