import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { prices } from "../lib/store";
import { subscribeSymbol } from "../lib/raf";

const formatPrice = (n: number) => {
  if (n >= 1000)
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(5);
};

const PriceCell = ({ symbol }: { symbol: string }) => {
  const priceRef = useRef<HTMLSpanElement>(null);
  const changeRef = useRef<HTMLSpanElement>(null);
  const prevPrice = useRef<number>(prices.get(symbol)?.last ?? 0);

  useEffect(() => {
    const unsubscribe = subscribeSymbol(symbol, () => {
      const quote = prices.get(symbol);
      if (!quote || !priceRef.current) return;

      const isUp = quote.last > prevPrice.current;
      prevPrice.current = quote.last;

      priceRef.current.textContent = formatPrice(quote.last);
      priceRef.current.classList.remove("flash-up", "flash-down");
      void priceRef.current.offsetWidth;
      priceRef.current.classList.add(isUp ? "flash-up" : "flash-down");

      if (changeRef.current) {
        changeRef.current.textContent = `${quote.dayChangePct.toFixed(2)}%`;
        changeRef.current.style.color =
          quote.dayChangePct >= 0 ? "#16a34a" : "#dc2626";
        changeRef.current.style.background =
          quote.dayChangePct >= 0
            ? "rgba(22, 163, 74, 0.10)"
            : "rgba(220, 38, 38, 0.10)";
      }
    });

    return () => {
      unsubscribe();
    };
  }, [symbol]);

  const quote = prices.get(symbol);
  const isPositive = (quote?.dayChangePct ?? 0) >= 0;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        width: "100%",
        minWidth: 0,
      }}
    >
      <Box
        component="span"
        ref={priceRef}
        className="tabular-nums"
        sx={{
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.2,
          color: "text.primary",
          borderRadius: 1,
          px: 0.5,
          whiteSpace: "nowrap",
        }}
      >
        {quote ? formatPrice(quote.last) : "—"}
      </Box>

      <Box
        component="span"
        ref={changeRef}
        className="tabular-nums"
        sx={{
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1,
          px: 1,
          py: 0.5,
          borderRadius: 999,
          whiteSpace: "nowrap",
          color: isPositive ? "#16a34a" : "#dc2626",
          backgroundColor: isPositive
            ? "rgba(22, 163, 74, 0.10)"
            : "rgba(220, 38, 38, 0.10)",
        }}
      >
        {quote ? `${quote.dayChangePct.toFixed(2)}%` : "—"}
      </Box>
    </Box>
  );
};

export default PriceCell;
