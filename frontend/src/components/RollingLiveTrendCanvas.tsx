import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { getHistory, getMomentumPct } from "../lib/market";
import { subscribeSymbol } from "../lib/raf";

type Props = {
  symbols: string[];
  rowHeight: number;
  headerHeight: number;
};

const drawSparkline = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  values: number[],
) => {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 12);
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.fill();

  if (values.length < 2) {
    ctx.restore();
    return;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, max * 0.0001, 0.0001);
  const rising = values[values.length - 1] >= values[0];
  const lineColor = rising ? "#34d399" : "#fb7185";
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, `${lineColor}55`);
  gradient.addColorStop(1, `${lineColor}10`);

  ctx.beginPath();
  values.forEach((value, index) => {
    const px = x + (index / Math.max(values.length - 1, 1)) * width;
    const py = y + height - ((value - min) / range) * height;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  values.forEach((value, index) => {
    const px = x + (index / Math.max(values.length - 1, 1)) * width;
    const py = y + height - ((value - min) / range) * height;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  const lastValue = values[values.length - 1];
  const lastX = x + width;
  const lastY = y + height - ((lastValue - min) / range) * height;
  ctx.fillStyle = lineColor;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const RollingLiveTrendCanvas = ({
  symbols,
  rowHeight,
  headerHeight,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const draw = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = rect.width;
      const cssHeight = Math.max(
        headerHeight + symbols.length * rowHeight,
        rowHeight * 2,
      );

      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      symbols.forEach((symbol, index) => {
        const rowTop = headerHeight + index * rowHeight;
        const sparkX = Math.max(cssWidth - 144, 176);
        const sparkWidth = Math.max(cssWidth - sparkX - 48, 88);
        const sparkY = rowTop + 11;
        const sparkHeight = rowHeight - 22;

        drawSparkline(
          ctx,
          sparkX,
          sparkY,
          sparkWidth,
          sparkHeight,
          getHistory(symbol),
        );

        const momentum = getMomentumPct(symbol);
        ctx.fillStyle =
          momentum >= 0 ? "rgba(110,231,183,0.9)" : "rgba(251,113,133,0.9)";
        ctx.font = "600 11px Inter, system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `${momentum >= 0 ? "+" : ""}${momentum.toFixed(1)}%`,
          sparkX + sparkWidth,
          rowTop + rowHeight / 2,
        );
      });
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(wrapper);

    const unsubscribers = symbols.map((symbol) =>
      subscribeSymbol(symbol, draw),
    );

    return () => {
      resizeObserver.disconnect();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [headerHeight, rowHeight, symbols]);

  return (
    <Box
      ref={wrapperRef}
      sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <canvas ref={canvasRef} />
    </Box>
  );
};
