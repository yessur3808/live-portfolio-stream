import { WebSocket } from "ws";
import { Hub } from "./hub.js";
import { log } from "./logger.js";
import { EventCategory, EventSeverity, LiveEvent } from "./types.js";

const HL_WS = "wss://api.hyperliquid-testnet.xyz/ws";
const HL_INFO = "https://api.hyperliquid-testnet.xyz/info";
const NEWS_REFRESH_MS = 30 * 60 * 1000;

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

type NewsItem = {
  title: string;
  body: string;
  url: string;
  publishedAt: number;
  source: string;
  category: EventCategory;
  severity: EventSeverity;
  topics: string[];
  symbols: string[];
};

type SourceFeed = {
  name: string;
  category: EventCategory;
  url: string;
  topics: string[];
  severity: EventSeverity;
  symbols: string[];
  parser: (
    text: string,
    source: string,
    category: EventCategory,
    severity: EventSeverity,
    topics: string[],
    symbols: string[],
  ) => NewsItem[];
};

export type NewsRefreshResult = {
  emitted: number;
};

export type NewsRefreshController = {
  refreshNews: () => Promise<NewsRefreshResult>;
};

const prevDay = new Map<string, number>();
const lastNewsAtBySource = new Map<string, number>();
const lastNewsIdBySource = new Map<string, Set<string>>();

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();

const fingerprintNews = (
  source: string,
  title: string,
  url: string,
  publishedAt: number,
) => `${source}:${title.toLowerCase()}:${url}:${publishedAt}`;

const extractRssItems = (
  text: string,
  source: string,
  category: EventCategory,
  severity: EventSeverity,
  topics: string[],
  symbols: string[],
) => {
  const items: NewsItem[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const titleRegex =
    /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i;
  const linkRegex = /<link>([\s\S]*?)<\/link>/i;
  const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;
  const descriptionRegex =
    /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i;

  for (const match of text.matchAll(itemRegex)) {
    const chunk = match[0];
    const title = normalizeText(
      chunk.match(titleRegex)?.[1] ?? chunk.match(titleRegex)?.[2] ?? "",
    );
    const url = normalizeText(chunk.match(linkRegex)?.[1] ?? "");
    const description = normalizeText(
      chunk.match(descriptionRegex)?.[1] ??
        chunk.match(descriptionRegex)?.[2] ??
        title,
    );
    const publishedAt =
      Date.parse(chunk.match(pubDateRegex)?.[1] ?? "") || Date.now();
    if (!title || !url) continue;
    items.push({
      title,
      body: description,
      url,
      publishedAt,
      source,
      category,
      severity,
      topics,
      symbols,
    });
  }

  return items;
};

const extractJsonArticles = (
  text: string,
  source: string,
  category: EventCategory,
  severity: EventSeverity,
  topics: string[],
  symbols: string[],
) => {
  const items: NewsItem[] = [];
  try {
    const parsed = JSON.parse(text) as {
      articles?: Array<{
        title?: string;
        description?: string;
        url?: string;
        publishedAt?: string;
      }>;
    };
    for (const article of parsed.articles ?? []) {
      const title = normalizeText(article.title ?? "");
      const url = normalizeText(article.url ?? "");
      if (!title || !url) continue;
      items.push({
        title,
        body: normalizeText(article.description ?? title),
        url,
        publishedAt: Date.parse(article.publishedAt ?? "") || Date.now(),
        source,
        category,
        severity,
        topics,
        symbols,
      });
    }
  } catch {
    return [];
  }
  return items;
};

const NEWS_FEEDS: SourceFeed[] = [
  {
    name: "fed_press",
    category: "fed",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    topics: ["fed", "policy", "rates"],
    severity: "high",
    symbols: ["BTC", "ETH", "SOL"],
    parser: extractRssItems,
  },
  {
    name: "fed_speeches",
    category: "macro",
    url: "https://www.federalreserve.gov/feeds/speeches.xml",
    topics: ["fed", "macro", "rates"],
    severity: "medium",
    symbols: ["BTC", "ETH", "SOL"],
    parser: extractRssItems,
  },
  {
    name: "sec_press",
    category: "headline",
    url: "https://www.sec.gov/news/pressreleases.rss",
    topics: ["sec", "regulation", "crypto"],
    severity: "medium",
    symbols: ["BTC", "ETH"],
    parser: extractRssItems,
  },
  {
    name: "fomc_calendar",
    category: "fed",
    url: "https://www.federalreserve.gov/feeds/press_monetary.xml",
    topics: ["fed", "fomc", "policy"],
    severity: "high",
    symbols: ["BTC", "ETH", "SOL"],
    parser: extractRssItems,
  },
  {
    name: "fed_testimony",
    category: "headline",
    url: "https://www.federalreserve.gov/feeds/testimony.xml",
    topics: ["fed", "testimony", "macro"],
    severity: "medium",
    symbols: ["BTC", "ETH", "SOL"],
    parser: extractRssItems,
  },
];

async function fetchPrevDay() {
  try {
    const res = await fetch(HL_INFO, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    });

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

export const runIngest = (hub: Hub): NewsRefreshController => {
  fetchPrevDay();
  setInterval(fetchPrevDay, 5 * 60 * 1000);
  connect(hub);
  return startNewsPolling(hub);
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

const startNewsPolling = (hub: Hub): NewsRefreshController => {
  const poll = async (manual = false) => {
    let emitted = 0;

    for (const feed of NEWS_FEEDS) {
      const lastRun = lastNewsAtBySource.get(feed.name) ?? 0;
      if (!manual && Date.now() - lastRun < NEWS_REFRESH_MS) continue;

      try {
        const res = await fetch(feed.url, {
          headers: {
            accept:
              "application/rss+xml, application/xml, text/xml, application/json;q=0.9, text/html;q=0.8",
            "user-agent": "live-portfolio-stream/1.0 (+local-dev)",
          },
        });
        if (!res.ok) {
          log("warn", "news feed fetch failed", {
            source: feed.name,
            status: res.status,
          });
          continue;
        }

        const text = await res.text();
        const items = feed.parser(
          text,
          feed.name,
          feed.category,
          feed.severity,
          feed.topics,
          feed.symbols,
        );
        const seen = lastNewsIdBySource.get(feed.name) ?? new Set<string>();
        const freshItems = items.filter((item) => {
          const key = fingerprintNews(
            item.source,
            item.title,
            item.url,
            item.publishedAt,
          );
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        if (freshItems.length === 0) {
          lastNewsAtBySource.set(feed.name, Date.now());
          lastNewsIdBySource.set(feed.name, seen);
          continue;
        }

        for (const item of freshItems) {
          emitEvent(
            hub,
            item.source,
            item.category,
            item.severity,
            item.title,
            item.body,
            item.symbols,
            item.topics,
            item.url,
          );
        }
        emitted += freshItems.length;

        lastNewsAtBySource.set(feed.name, Date.now());
        lastNewsIdBySource.set(feed.name, seen);
        log("info", "news feed refreshed", {
          source: feed.name,
          items: freshItems.length,
        });
      } catch (e) {
        log("error", "news feed refresh failed", {
          source: feed.name,
          err: (e as Error).message,
        });
      }
    }

    return { emitted };
  };

  void poll(true);
  setInterval(() => {
    void poll(false);
  }, NEWS_REFRESH_MS);

  return {
    refreshNews: () => poll(true),
  };
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
