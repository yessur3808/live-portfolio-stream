// TODO: Replace these hardcoded frontend constants with environment variables or `.env` file
export const FRONTEND_WS_URL =
  import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws";
export const FRONTEND_STALE_MS = 5000;

export const TRACKED_TOPICS = ["fed", "macro", "news"] as const;
export const NEWS_FEED_BUTTON_WIDTH = 150;
export const NEWS_FEED_PANEL_WIDTH = 800;
export const MIN_REFRESH_SPIN_MS = 500;

export const NEWS_REFRESH_OPTIONS = [
  { label: "5 minutes", value: 5 * 60 * 1000 },
  { label: "10 minutes", value: 10 * 60 * 1000 },
  { label: "15 minutes", value: 15 * 60 * 1000 },
  { label: "30 minutes", value: 30 * 60 * 1000 },
  { label: "1 hour", value: 60 * 60 * 1000 },
  { label: "2 hours", value: 2 * 60 * 60 * 1000 },
  { label: "6 hours", value: 6 * 60 * 60 * 1000 },
  { label: "12 hours", value: 12 * 60 * 60 * 1000 },
  { label: "daily", value: 24 * 60 * 60 * 1000 },
] as const;

export const NEWS_SEVERITY_COLOR = {
  low: "rgba(125,211,252,0.18)",
  medium: "rgba(250,204,21,0.18)",
  high: "rgba(251,113,133,0.18)",
} as const;

const toHttpEndpoint = (pathname: string, fallback: string) => {
  try {
    const url = new URL(FRONTEND_WS_URL);
    url.protocol = url.protocol === "wss:" ? "https:" : "http:";
    url.pathname = pathname;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return fallback;
  }
};

export const REFRESH_NEWS_ENDPOINT = toHttpEndpoint(
  "/admin/refresh-news",
  "http://localhost:8080/admin/refresh-news",
);

export const NEWS_SETTINGS_ENDPOINT = toHttpEndpoint(
  "/admin/news-settings",
  "http://localhost:8080/admin/news-settings",
);

export const STORE_MAX_EVENTS = 120;
export const STORE_MAX_TOASTS = 5;
export const STORE_TOAST_COOLDOWN_MS = 90_000;

export const DEFAULT_WATCHLIST = [
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
] as const;

export const DEFAULT_POSITIONS = [
  { symbol: "BTC", qty: 0.5, avgCost: 60000 },
  { symbol: "ETH", qty: 4, avgCost: 3000 },
  { symbol: "SOL", qty: 50, avgCost: 140 },
  { symbol: "ARB", qty: 2000, avgCost: 1.1 },
  { symbol: "DOGE", qty: 10000, avgCost: 0.12 },
] as const;

export const DEFAULT_FOLLOWED_TOPICS = ["fed", "macro", "news"] as const;

export const WATCHLIST_ROW_HEIGHT = 72;
export const WATCHLIST_LIST_HEADER_HEIGHT = 44;
export const WATCHLIST_TABLE_COLUMNS =
  "minmax(0, 1.1fr) minmax(96px, 0.7fr) minmax(89px, 0.7fr) 166px";
export const WATCHLIST_HEADER_COLUMNS = [
  { value: "symbol", label: "Asset" },
  { value: "price", label: "Price" },
  { value: "dayChangePct", label: "Change" },
  { value: "momentum", label: "Rolling live trend" },
] as const;

export const CONN_VISUALS = {
  connecting: {
    text: "connecting",
    textColor: "#86efac",
    bg: "rgba(34,197,94,0.14)",
    border: "rgba(134,239,172,0.38)",
  },
  connected: {
    text: "connected",
    textColor: "#86efac",
    bg: "rgba(34,197,94,0.14)",
    border: "rgba(134,239,172,0.38)",
  },
  reconnecting: {
    text: "reconnecting",
    textColor: "#fde68a",
    bg: "rgba(245,158,11,0.16)",
    border: "rgba(252,211,77,0.42)",
  },
  stale: {
    text: "disconnected",
    textColor: "#fca5a5",
    bg: "rgba(239,68,68,0.14)",
    border: "rgba(252,165,165,0.4)",
  },
} as const;

export const MARKET_META: Record<string, { name: string }> = {
  BTC: { name: "Bitcoin" },
  ETH: { name: "Ethereum" },
  SOL: { name: "Solana" },
  ARB: { name: "Arbitrum" },
  AVAX: { name: "Avalanche" },
  DOGE: { name: "Dogecoin" },
  LINK: { name: "Chainlink" },
  OP: { name: "Optimism" },
  MATIC: { name: "Polygon" },
  POL: { name: "Polygon" },
  APT: { name: "Aptos" },
  SUI: { name: "Sui" },
  SEI: { name: "Sei" },
  TIA: { name: "Celestia" },
  INJ: { name: "Injective" },
  LTC: { name: "Litecoin" },
  BCH: { name: "Bitcoin Cash" },
  NEAR: { name: "NEAR" },
  FTM: { name: "Fantom" },
  ATOM: { name: "Cosmos" },
  DOT: { name: "Polkadot" },
  ADA: { name: "Cardano" },
  XRP: { name: "XRP" },
  BNB: { name: "BNB" },
  AAVE: { name: "Aave" },
  UNI: { name: "Uniswap" },
  RNDR: { name: "Render" },
  WLD: { name: "Worldcoin" },
  PEPE: { name: "Pepe" },
  WIF: { name: "dogwifhat" },
  ORDI: { name: "ORDI" },
};

export const MAX_HISTORY_POINTS = 24;
