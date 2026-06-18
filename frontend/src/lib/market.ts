export type WatchlistSort =
  | "symbol"
  | "name"
  | "price"
  | "dayChangePct"
  | "momentum";

export type MarketMeta = {
  name: string;
};

const marketMeta: Record<string, MarketMeta> = {
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

const histories = new Map<string, number[]>();
const MAX_HISTORY_POINTS = 24;

export const getMarketName = (symbol: string) =>
  marketMeta[symbol]?.name ?? symbol;

export const recordPrice = (symbol: string, price: number) => {
  const points = histories.get(symbol) ?? [];
  points.push(price);
  if (points.length > MAX_HISTORY_POINTS)
    points.splice(0, points.length - MAX_HISTORY_POINTS);
  histories.set(symbol, points);
};

export const getHistory = (symbol: string) => histories.get(symbol) ?? [];

export const getMomentumPct = (symbol: string) => {
  const points = histories.get(symbol);
  if (!points || points.length < 2) return 0;
  const first = points[0];
  const last = points[points.length - 1];
  if (!first) return 0;
  return ((last - first) / first) * 100;
};
