import { WebSocket } from "ws";
import { Hub } from "./hub.js";
import { log } from "./logger.js";
import { EventCategory, EventSeverity, LiveEvent } from "./types.js";

const HL_WS = "wss://api.hyperliquid-testnet.xyz/ws";
const HL_INFO = "https://api.hyperliquid-testnet.xyz/info";

const MARKETS = [
  "BTC",
  "ETH",
  "SOL",
  "ARB",
  "AVAX",
  "DOGE",
  "LINK",
  "OP",
  "MATIC",
  "DOT",
  "ADA",
  "XRP",
  "BNB",
];

const FED_LINES = [
  "Fed officials signaled policy remains data dependent ahead of the next meeting.",
  "Treasury yields moved after remarks suggested caution on early cuts.",
  "Policy path commentary shifted rate-cut odds in short-dated futures.",
];

const MACRO_RELEASES = [
  "US CPI printed slightly above consensus, lifting front-end yields.",
  "NFP beat estimates while unemployment stayed stable.",
  "Retail sales surprised to the upside and risk assets reacted higher.",
  "PCE core came in-line with forecasts, volatility cooled post-release.",
];

const HEADLINE_LINES = [
  "Large asset manager filed updated ETF documents, sparking broad crypto bids.",
  "Exchange announced expanded derivatives products for major alt pairs.",
  "Custody provider disclosed expanded institutional settlement rails.",
  "Stablecoin issuer published reserve attestation and treasury update.",
];

const HEADLINE_LINKS = [
  "https://www.reuters.com/markets/",
  "https://www.bloomberg.com/markets",
  "https://www.coindesk.com/markets/",
  "https://www.theblock.co/news",
];

const SPORTS_MATCHUPS = [
  "Knicks vs Heat",
  "Lakers vs Nuggets",
  "Chiefs vs Ravens",
  "Yankees vs Red Sox",
];

const prevDay = new Map<string, number>();

async function fetchPrevDay() {
  try {
    const res = await fetch(HL_INFO, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    });
    // Shape: [ { universe: [{ name }] }, [ { prevDayPx }, ... ] ]
    const parsed = (await res.json()) as any[];
    if (!Array.isArray(parsed) || parsed.length < 2) return;

    const universe = (parsed[0]?.universe ?? []) as { name: string }[];
    const ctxs = parsed[1] as { prevDayPx: string }[];

    prevDay.clear();
    universe.forEach((u, i) => {
      const px = parseFloat(ctxs[i]?.prevDayPx);
      if (!Number.isNaN(px)) prevDay.set(u.name, px);
    });
    log("info", "loaded prev-day prices", { count: prevDay.size });
  } catch (e) {
    log("error", "prevday fetch failed", { err: (e as Error).message });
  }
}

export const runIngest = (hub: Hub) => {
  fetchPrevDay();
  setInterval(fetchPrevDay, 5 * 60 * 1000);
  connect(hub);
  startFedAdapter(hub);
  startMacroAdapter(hub);
  startHeadlineAdapter(hub);
  startSportsAdapter(hub);
};

const randomItem = <T>(items: readonly T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

const randomSymbols = (count: number): string[] => {
  const picked = new Set<string>();
  while (picked.size < count) picked.add(randomItem(MARKETS));
  return [...picked];
};

const emitEvent = (
  hub: Hub,
  source: string,
  category: EventCategory,
  severity: EventSeverity,
  title: string,
  body: string,
  symbols: string[],
  topics: string[],
  url?: string,
) => {
  const now = Date.now();
  const event: LiveEvent = {
    eventId: `${source}:${category}:${now}:${Math.random().toString(36).slice(2, 8)}`,
    source,
    category,
    severity,
    title,
    body,
    url,
    symbols,
    topics,
    eventTs: now,
    ingestTs: now,
  };
  hub.ingestEvent(event);
};

const startFedAdapter = (hub: Hub) => {
  setInterval(() => {
    const symbols = randomSymbols(2);
    emitEvent(
      hub,
      "fedwire",
      "fed",
      Math.random() > 0.75 ? "high" : "medium",
      "Federal Reserve policy update",
      randomItem(FED_LINES),
      symbols,
      ["fed", "rates", "macro"],
    );
  }, 45_000);
};

const startMacroAdapter = (hub: Hub) => {
  setInterval(() => {
    const symbols = randomSymbols(3);
    emitEvent(
      hub,
      "macrocalendar",
      "macro",
      Math.random() > 0.7 ? "high" : "medium",
      "Economic release crossed wires",
      randomItem(MACRO_RELEASES),
      symbols,
      ["macro", "cpi", "nfp", "data"],
    );
  }, 28_000);
};

const startHeadlineAdapter = (hub: Hub) => {
  setInterval(() => {
    const symbols = randomSymbols(2);
    const body = randomItem(HEADLINE_LINES);
    const url = randomItem(HEADLINE_LINKS);
    emitEvent(
      hub,
      "newswire",
      "headline",
      Math.random() > 0.8 ? "high" : "low",
      "Market headline",
      body,
      symbols,
      ["news", "crypto", "risk"],
      url,
    );
  }, 16_000);
};

const startSportsAdapter = (hub: Hub) => {
  setInterval(() => {
    const symbols = randomSymbols(1);
    emitEvent(
      hub,
      "sportslive",
      "sports",
      "low",
      `Sports pulse: ${randomItem(SPORTS_MATCHUPS)}`,
      "Live score momentum spiked social chatter during US session.",
      symbols,
      ["sports", "sentiment", "flow"],
    );
  }, 20_000);
};

const connect = (hub: Hub) => {
  const ws = new WebSocket(HL_WS);

  ws.on("open", () => {
    ws.send(
      JSON.stringify({
        method: "subscribe",
        subscription: { type: "allMids" },
      }),
    );
    log("info", "hyperliquid connected");
  });

  ws.on("message", (raw) => {
    let env: any;
    try {
      env = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (env.channel !== "allMids") return;

    const mids: Record<string, string> = env.data?.mids ?? {};
    const now = Date.now();
    for (const [sym, pxStr] of Object.entries(mids)) {
      const px = parseFloat(pxStr);
      if (Number.isNaN(px)) continue;
      const prev = prevDay.get(sym);
      const dc = prev && prev > 0 ? ((px - prev) / prev) * 100 : 0;
      hub.ingestQuote({ symbol: sym, last: px, dayChangePct: dc, ts: now });
    }
  });

  ws.on("close", () => {
    log("warn", "hyperliquid disconnected, retrying in 2s");
    setTimeout(() => connect(hub), 2000);
  });

  ws.on("error", (e) => {
    log("error", "hyperliquid error", { err: (e as Error).message });
    ws.close();
  });
};
