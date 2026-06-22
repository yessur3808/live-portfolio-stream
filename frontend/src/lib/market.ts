import { MARKET_META, MAX_HISTORY_POINTS } from "../constants";

export type WatchlistSort =
  | "symbol"
  | "name"
  | "price"
  | "dayChangePct"
  | "momentum";

export type MarketMeta = {
  name: string;
};

const histories = new Map<string, number[]>();

export const getMarketName = (symbol: string) =>
  MARKET_META[symbol]?.name ?? symbol;

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
