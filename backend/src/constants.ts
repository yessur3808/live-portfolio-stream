import { EventCategory, EventSeverity } from "./types.js";

// TODO: Replace these hardcoded constants with environment variables or an `.env` file

export const DEFAULT_PORT = 8080;
export const HEALTHCHECK_PATH = "/healthz";
export const NEWS_SETTINGS_PATH = "/admin/news-settings";
export const REFRESH_NEWS_PATH = "/admin/refresh-news";
export const WS_PATH = "/ws";

export const HYPERLIQUID_WS_URL = "wss://api.hyperliquid-testnet.xyz/ws";
export const HYPERLIQUID_INFO_URL = "https://api.hyperliquid-testnet.xyz/info";
export const DEFAULT_NEWS_REFRESH_MS = 30 * 60 * 1000;
export const PREV_DAY_REFRESH_MS = 5 * 60 * 1000;

export const MARKETS = [
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
] as const;

export type NewsFeedConfig = {
  name: string;
  category: EventCategory;
  url: string;
  topics: string[];
  severity: EventSeverity;
  symbols: string[];
};

export const NEWS_FEEDS: NewsFeedConfig[] = [
  {
    name: "fed_press",
    category: "fed",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    topics: ["fed", "policy", "rates"],
    severity: "high",
    symbols: ["BTC", "ETH", "SOL"],
  },
  {
    name: "fed_speeches",
    category: "macro",
    url: "https://www.federalreserve.gov/feeds/speeches.xml",
    topics: ["fed", "macro", "rates"],
    severity: "medium",
    symbols: ["BTC", "ETH", "SOL"],
  },
  {
    name: "sec_press",
    category: "headline",
    url: "https://www.sec.gov/news/pressreleases.rss",
    topics: ["sec", "regulation", "crypto"],
    severity: "medium",
    symbols: ["BTC", "ETH"],
  },
  {
    name: "fomc_calendar",
    category: "fed",
    url: "https://www.federalreserve.gov/feeds/press_monetary.xml",
    topics: ["fed", "fomc", "policy"],
    severity: "high",
    symbols: ["BTC", "ETH", "SOL"],
  },
  {
    name: "fed_testimony",
    category: "headline",
    url: "https://www.federalreserve.gov/feeds/testimony.xml",
    topics: ["fed", "testimony", "macro"],
    severity: "medium",
    symbols: ["BTC", "ETH", "SOL"],
  },
] as const;

export const QUOTE_BATCH_INTERVAL_MS = 75;
export const QUOTE_RING_SIZE = 2000;
export const EVENT_BATCH_INTERVAL_MS = 1000;
export const EVENT_RING_SIZE = 2000;
export const EVENT_SNAPSHOT_LIMIT = 120;

export const MAX_BUFFERED_BYTES = 1 << 20;
export const PING_INTERVAL_MS = 20_000;
