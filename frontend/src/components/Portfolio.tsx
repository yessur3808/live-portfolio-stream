import { useEffect, useRef } from "react";
import { Paper, Box, Typography, Divider } from "@mui/material";
import { useApp, prices } from "../lib/store";
import { subscribeSymbol } from "../lib/raf";

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
    <Paper variant="outlined">
      <Box
        sx={{ px: 2, py: 1, display: "flex", justifyContent: "space-between" }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          Portfolio
        </Typography>
        <Typography
          component="span"
          ref={totalRef}
          className="tabular-nums"
          variant="caption"
          sx={{ fontWeight: 600 }}
        >
          —
        </Typography>
      </Box>
      <Divider />
      {positions.map((p) => (
        <Box
          key={p.symbol}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1,
            fontSize: 14,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography sx={{ width: 64, fontWeight: 500 }}>
            {p.symbol}
          </Typography>
          <Typography
            sx={{ width: 96, color: "text.secondary" }}
            className="tabular-nums"
          >
            {p.qty} @ {p.avgCost}
          </Typography>
          <span
            className="tabular-nums"
            style={{ flex: 1, textAlign: "right" }}
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
