import { useEffect, useState } from "react";
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { connect, initVisibility } from "./lib/ws";
import { startRafLoop } from "./lib/raf";
import { getMarketName } from "./lib/market";
import { Watchlist, Portfolio, ConnBadge, PriceCell } from "./components";

export default function App() {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    startRafLoop();
    initVisibility();
    connect();
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
        <ConnBadge />
      </Paper>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: {
            xs: "1fr",
            xl: "minmax(0, 1.8fr) minmax(320px, 0.82fr)",
          },
          flex: 1,
          minHeight: 0,
        }}
      >
        <Watchlist onSelect={setSelected} />
        <Portfolio />
      </Box>

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
    </Box>
  );
}
