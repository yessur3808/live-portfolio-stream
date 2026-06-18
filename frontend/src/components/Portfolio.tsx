import { useEffect, useRef } from "react";
import { Paper, Box, Typography, Divider } from "@mui/material";
import { useApp, prices } from "../lib/store";
import { subscribeSymbol } from "../lib/raf";
import { getMarketName } from "../lib/market";

export const Portfolio = () => {
  const positions = useApp((s) => s.positions);
  const totalRef = useRef<HTMLSpanElement>(null);
  const rowRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  useEffect(() => {
    const unsubs = positions.map((p) =>
      subscribeSymbol(p.symbol, () => {
        const q = prices.get(p.symbol);
        if (q && rowRefs.current[p.symbol]) {
          const pnl = (q.last - p.avgCost) * p.qty;
          const el = rowRefs.current[p.symbol]!;
          el.textContent = (pnl >= 0 ? "+" : "") + pnl.toFixed(2);
          el.style.color = pnl >= 0 ? "#22c55e" : "#ef4444";
        }
        let total = 0;
        for (const pos of positions) {
          const px = prices.get(pos.symbol)?.last ?? pos.avgCost;
          total += px * pos.qty;
        }
        if (totalRef.current)
          totalRef.current.textContent =
            "$" + total.toLocaleString(undefined, { maximumFractionDigits: 0 });
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [positions]);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: "12px",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(14,18,30,0.92) 0%, rgba(9,12,21,0.88) 100%)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 24px 90px rgba(0,0,0,0.28)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 2.25,
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", letterSpacing: 1.2 }}
          >
            Portfolio
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>Live returns</Typography>
        </Box>
        <Typography
          component="span"
          ref={totalRef}
          className="tabular-nums"
          sx={{ fontWeight: 700, fontSize: 18 }}
        >
          —
        </Typography>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
      {positions.map((p) => (
        <Box
          key={p.symbol}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2.25,
            py: 1.4,
            fontSize: 14,
            borderBottom: "1px solid",
            borderColor: "rgba(255,255,255,0.06)",
            minHeight: 64,
          }}
        >
          <Box sx={{ width: 104, pr: 1 }}>
            <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {p.symbol}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 12 }} noWrap>
              {getMarketName(p.symbol)}
            </Typography>
          </Box>
          <Typography
            sx={{ width: 104, color: "text.secondary" }}
            className="tabular-nums"
          >
            {p.qty} @ {p.avgCost}
          </Typography>
          <span
            className="tabular-nums"
            style={{ flex: 1, textAlign: "right", fontWeight: 700 }}
            ref={(el) => {
              if (el) rowRefs.current[p.symbol] = el;
            }}
          >
            —
          </span>
        </Box>
      ))}
    </Paper>
  );
};
