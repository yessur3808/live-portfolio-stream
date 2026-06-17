import { useEffect, useState } from "react";
import { Container, Box, Typography, Paper, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { connect, initVisibility } from "./lib/ws";
import { startRafLoop } from "./lib/raf";
import { Watchlist, Portfolio, ConnBadge, PriceCell } from "./components";

export default function App() {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    startRafLoop();
    initVisibility();
    connect();
  }, []);

  return (
    <Container
      maxWidth="md"
      sx={{ py: 4, height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Live Portfolio Stream
        </Typography>
        <ConnBadge />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "5fr 1fr" },
          flex: 1,
          minHeight: 0,
        }}
      >
        <Watchlist onSelect={setSelected} />
        <Portfolio />
      </Box>

      {selected && (
        <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>{selected} detail</Typography>
            <IconButton size="small" onClick={() => setSelected(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ fontSize: 28 }}>
            <PriceCell symbol={selected} />
          </Box>
        </Paper>
      )}
    </Container>
  );
}
