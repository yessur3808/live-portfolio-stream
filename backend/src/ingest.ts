import { WebSocket } from "ws";
import { Hub } from "./hub";
import { log } from "./logger";

const HL_WS = "wss://api.hyperliquid-testnet.xyz/ws";
const HL_INFO = "https://api.hyperliquid-testnet.xyz/info";

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

export function runIngest(hub: Hub) {
  fetchPrevDay();
  setInterval(fetchPrevDay, 5 * 60 * 1000);
  connect(hub);
}

function connect(hub: Hub) {
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
}
