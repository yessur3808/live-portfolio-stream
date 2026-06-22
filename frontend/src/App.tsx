import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { connect, initVisibility } from "./lib/ws";
import { startRafLoop } from "./lib/raf";
import { getMarketName } from "./lib/market";
import { useApp } from "./lib/store";
import {
  Watchlist,
  Portfolio,
  ConnBadge,
  PriceCell,
  EventFeed,
} from "./components";

export default function App() {
  const [selected, setSelected] = useState<string | null>(null);
  const [newsDrawerOpen, setNewsDrawerOpen] = useState(true);
  const [badgeInView, setBadgeInView] = useState(true);
  const badgeAnchorRef = useRef<HTMLDivElement | null>(null);
  const toast = useApp((s) => s.toastQueue[0]);
  const dismissToast = useApp((s) => s.dismissToast);
  const conn = useApp((s) => s.conn);

  const subtleStatus =
    conn === "stale"
      ? { text: "Disconnected", color: "#fca5a5" }
      : conn === "reconnecting"
        ? { text: "Reconnecting...", color: "#fde68a" }
        : conn === "connecting"
          ? { text: "Connecting...", color: "#86efac" }
          : { text: "Connected", color: "#86efac" };

  useEffect(() => {
    startRafLoop();
    initVisibility();
    connect();
  }, []);

  useEffect(() => {
    const node = badgeAnchorRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setBadgeInView(entry.isIntersecting);
      },
      { threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 1.5, md: 3 },
        py: { xs: 1.5, md: 3 },
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: "12px",
          background:
            "linear-gradient(135deg, rgba(14,18,30,0.92) 0%, rgba(12,16,26,0.78) 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: "0 30px 100px rgba(0,0,0,0.28)",
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          alignItems: "center",
        }}
      >
        <Stack spacing={0.5}>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", letterSpacing: 1.5 }}
          >
            Real-time portfolio
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 750, letterSpacing: -1 }}>
            Live Portfolio Stream
          </Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: 720 }}>
            A low-latency watchlist and portfolio surface with mutable quote
            state, live reordering, and shared-canvas rolling live trends.
          </Typography>
        </Stack>
        <Box ref={badgeAnchorRef}>
          <ConnBadge />
        </Box>
      </Paper>

      {!badgeInView && (
        <Typography
          sx={{
            position: "fixed",
            top: 10,
            right: 14,
            zIndex: 1100,
            fontSize: 11.5,
            letterSpacing: 0.35,
            color: subtleStatus.color,
            opacity: 0.92,
            bgcolor: "rgba(6,8,14,0.55)",
            border: "1px solid rgba(255,255,255,0.13)",
            backdropFilter: "blur(8px)",
            px: 0.9,
            py: 0.4,
            borderRadius: "8px",
          }}
        >
          {subtleStatus.text}
        </Typography>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          alignItems: "start",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            xl: "minmax(0, 1.55fr) minmax(320px, 0.9fr)",
          },
          gridTemplateAreas: {
            xs: `
              "watchlist"
              "portfolio"
            `,
            xl: `
              "watchlist portfolio"
            `,
          },
        }}
      >
        <Box sx={{ gridArea: "watchlist", minWidth: 0 }}>
          <Watchlist onSelect={setSelected} />
        </Box>
        <Box
          sx={{
            gridArea: "portfolio",
            minWidth: 0,
            position: "sticky",
            top: 0,
          }}
        >
          <Portfolio />
        </Box>
      </Box>

      <EventFeed
        newsDrawerOpen={newsDrawerOpen}
        setNewsDrawerOpen={setNewsDrawerOpen}
      />

      {selected && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mt: 0.5,
            borderRadius: "12px",
            borderColor: "rgba(255,255,255,0.08)",
            background:
              "linear-gradient(135deg, rgba(15,18,30,0.96) 0%, rgba(11,14,22,0.9) 100%)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", letterSpacing: 1.3 }}
              >
                Detail view
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {selected} · {getMarketName(selected)}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setSelected(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ fontSize: 28 }}>
            <PriceCell symbol={selected} />
          </Box>
        </Paper>
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={5200}
        onClose={() => {
          if (toast) dismissToast(toast.eventId);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast?.severity === "high" ? "error" : "info"}
          variant="filled"
          sx={{ width: "100%", minWidth: 320 }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>
            {toast?.title ?? "Signal"}
          </Typography>
          <Typography sx={{ fontSize: 12.5, opacity: 0.9 }}>
            {toast?.body ?? ""}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
}
