import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  ButtonBase,
  Chip,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import SearchIcon from "@mui/icons-material/Search";
import { useApp, prices } from "../lib/store";
import { getMarketName, getMomentumPct } from "../lib/market";
import type { WatchlistSort } from "../lib/market";
import { subscribeSymbol } from "../lib/raf";
import { RollingLiveTrendCanvas } from "./RollingLiveTrendCanvas";

const ROW_HEIGHT = 72;
const LIST_HEADER_HEIGHT = 44;
const TABLE_COLUMNS =
  "minmax(0, 1.1fr) minmax(96px, 0.7fr) minmax(89px, 0.7fr) 166px";

const SymbolButtonBase = styled(ButtonBase)({
  width: "100%",
  display: "grid",
  gridTemplateColumns: TABLE_COLUMNS,
  alignItems: "center",
  padding: "14px 16px",
  minHeight: ROW_HEIGHT,
  textAlign: "left",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  transition: "background-color 160ms ease, transform 160ms ease",
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
});

const headerColumns: Array<{ value: WatchlistSort; label: string }> = [
  { value: "symbol", label: "Asset" },
  { value: "price", label: "Price" },
  { value: "dayChangePct", label: "Change" },
  { value: "momentum", label: "Rolling live trend" },
];

const HeaderSortButton = styled(ButtonBase)({
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "start",
  gap: 8,
  padding: 0,
  color: "inherit",
  textAlign: "left",
});

const ArrowStack = ({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      lineHeight: 0.7,
      opacity: active ? 1 : 0.35,
    }}
  >
    <ArrowUpwardRoundedIcon
      sx={{
        fontSize: 14,
        color: active && direction === "asc" ? "text.primary" : "inherit",
      }}
    />
    <ArrowDownwardRoundedIcon
      sx={{
        fontSize: 14,
        mt: -0.15,
        color: active && direction === "desc" ? "text.primary" : "inherit",
      }}
    />
  </Box>
);

const formatCompactPrice = (symbol: string) => {
  const price = prices.get(symbol)?.last ?? 0;
  if (price >= 1000)
    return price.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (price >= 1) return price.toFixed(3);
  return price.toFixed(5);
};

const compare = (
  a: string,
  b: string,
  sortBy: WatchlistSort,
  direction: "asc" | "desc",
) => {
  const multiplier = direction === "asc" ? 1 : -1;
  const left = {
    symbol: a,
    name: getMarketName(a),
    price: prices.get(a)?.last ?? 0,
    dayChangePct: prices.get(a)?.dayChangePct ?? 0,
    momentum: getMomentumPct(a),
  };
  const right = {
    symbol: b,
    name: getMarketName(b),
    price: prices.get(b)?.last ?? 0,
    dayChangePct: prices.get(b)?.dayChangePct ?? 0,
    momentum: getMomentumPct(b),
  };

  if (sortBy === "symbol" || sortBy === "name") {
    return left[sortBy].localeCompare(right[sortBy]) * multiplier;
  }

  return ((left[sortBy] as number) - (right[sortBy] as number)) * multiplier;
};

export const Watchlist = ({ onSelect }: { onSelect: (s: string) => void }) => {
  const watchlist = useApp((s) => s.watchlist);
  const symbolAlertCount = useApp((s) => s.symbolAlertCount);
  const followedSymbols = useApp((s) => s.followedSymbols);
  const toggleSymbolFollow = useApp((s) => s.toggleSymbolFollow);
  const stickyTopRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<WatchlistSort>("dayChangePct");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [liveSort] = useState(true);
  const [stickyTopHeight, setStickyTopHeight] = useState(0);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [revision, setRevision] = useState(0);

  const filteredSymbols = useMemo(() => {
    return watchlist.filter((symbol) => {
      if (!deferredQuery) return true;
      const name = getMarketName(symbol).toLowerCase();
      return (
        symbol.toLowerCase().includes(deferredQuery) ||
        name.includes(deferredQuery)
      );
    });
  }, [deferredQuery, watchlist]);

  useEffect(() => {
    if (!liveSort || filteredSymbols.length === 0) return;

    const unsubscribers = filteredSymbols.map((symbol) =>
      subscribeSymbol(symbol, () => setRevision((value) => value + 1)),
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [filteredSymbols, liveSort]);

  useEffect(() => {
    const node = stickyTopRef.current;
    if (!node) return;

    const updateHeight = () => {
      setStickyTopHeight(node.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const sortSeed = liveSort ? revision : 0;
  const visibleSymbols = useMemo(() => {
    void sortSeed;
    return [...filteredSymbols].sort((a, b) =>
      compare(a, b, sortBy, direction),
    );
  }, [direction, filteredSymbols, sortBy, sortSeed]);

  const listHeight =
    LIST_HEADER_HEIGHT + Math.max(visibleSymbols.length, 1) * ROW_HEIGHT;

  const handleHeaderSort = (value: WatchlistSort) => {
    if (sortBy === value) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(value);
    setDirection(value === "symbol" ? "asc" : "desc");
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
        borderRadius: "12px",
        backdropFilter: "blur(18px)",
        background:
          "linear-gradient(180deg, rgba(14,18,30,0.92) 0%, rgba(9,12,21,0.88) 100%)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 24px 90px rgba(0,0,0,0.35)",
      }}
    >
      <Box sx={{ position: "relative", overflow: "visible" }}>
        <Box
          ref={stickyTopRef}
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 4,
            px: 2.25,
            py: 2,
            backgroundColor: "rgba(10, 14, 24, 0.9)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Stack spacing={1.5}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", letterSpacing: 1.2 }}
                >
                  Watchlist
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, letterSpacing: -0.6 }}
                >
                  Filter, sort, and track live moves
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
              >
                {filteredSymbols.length} of {watchlist.length}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", lg: "row" },
                gap: 1.25,
                alignItems: { xs: "stretch", lg: "center" },
              }}
            >
              <TextField
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search symbol or name"
                size="small"
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    backgroundColor: "rgba(255,255,255,0.04)",
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>

        <Box sx={{ position: "relative", minHeight: listHeight }}>
          <RollingLiveTrendCanvas
            symbols={visibleSymbols}
            rowHeight={ROW_HEIGHT}
            headerHeight={LIST_HEADER_HEIGHT}
          />

          <Box
            sx={{
              position: "sticky",
              top: stickyTopHeight,
              zIndex: 3,
              display: "grid",
              gridTemplateColumns: TABLE_COLUMNS,
              alignItems: "center",
              px: 2,
              height: LIST_HEADER_HEIGHT,
              color: "text.secondary",
              fontSize: 12,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              backgroundColor: "rgba(10, 14, 24, 0.82)",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {headerColumns.map((column) => {
              const active = sortBy === column.value;
              return (
                <HeaderSortButton
                  key={column.value}
                  onClick={() => handleHeaderSort(column.value)}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      letterSpacing: 0.9,
                      textTransform: "uppercase",
                    }}
                  >
                    {column.label}
                  </Typography>
                  <ArrowStack active={active} direction={direction} />
                </HeaderSortButton>
              );
            })}
          </Box>

          {visibleSymbols.length === 0 ? (
            <Box sx={{ px: 2, py: 4, color: "text.secondary" }}>
              No matches for that filter.
            </Box>
          ) : (
            visibleSymbols.map((symbol) => {
              const name = getMarketName(symbol);
              const quote = prices.get(symbol);
              const isPositive = (quote?.dayChangePct ?? 0) >= 0;
              const alertCount = symbolAlertCount[symbol] ?? 0;
              const followed = followedSymbols.includes(symbol);

              return (
                <SymbolButtonBase key={symbol} onClick={() => onSelect(symbol)}>
                  <Box sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: "text.primary",
                          lineHeight: 1.15,
                        }}
                      >
                        {symbol}
                      </Typography>
                      {alertCount > 0 && (
                        <Chip
                          size="small"
                          label={alertCount > 9 ? "9+" : alertCount}
                          sx={{
                            height: 19,
                            bgcolor: "rgba(251,113,133,0.15)",
                            border: "1px solid rgba(251,113,133,0.35)",
                            color: "#fecdd3",
                            fontSize: 11,
                            fontWeight: 700,
                            ".MuiChip-label": { px: 0.65 },
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      sx={{ color: "text.secondary", fontSize: 12.5 }}
                      noWrap
                    >
                      {name}
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: 96 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatCompactPrice(symbol) || "—"}
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: 89 }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: isPositive ? "#34d399" : "#fb7185",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {quote
                        ? `${quote.dayChangePct >= 0 ? "+" : ""}${quote.dayChangePct.toFixed(2)}%`
                        : "—"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 166,
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 0.8,
                    }}
                  >
                    <Chip
                      size="small"
                      label={followed ? "Following" : "Follow"}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSymbolFollow(symbol);
                      }}
                      sx={{
                        height: 20,
                        bgcolor: followed
                          ? "rgba(52,211,153,0.16)"
                          : "rgba(255,255,255,0.06)",
                        border: followed
                          ? "1px solid rgba(52,211,153,0.4)"
                          : "1px solid rgba(255,255,255,0.12)",
                        color: followed ? "#6ee7b7" : "text.secondary",
                        fontWeight: 700,
                        fontSize: 10.5,
                        ".MuiChip-label": { px: 0.8 },
                      }}
                    />
                    <Typography
                      sx={{
                        color: "text.secondary",
                        fontSize: 12,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {quote
                        ? `${getMomentumPct(symbol) >= 0 ? "+" : ""}${getMomentumPct(symbol).toFixed(1)}%`
                        : "—"}
                    </Typography>
                  </Box>
                </SymbolButtonBase>
              );
            })
          )}
        </Box>
      </Box>
    </Paper>
  );
};
