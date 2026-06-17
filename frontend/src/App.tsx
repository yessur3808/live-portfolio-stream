import { useEffect, useState } from "react";
import { Container, Box, Typography, Paper, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { connect, initVisibility } from "./lib/ws";
import { startRafLoop } from "./lib/raf";
import Watchlist from "./components/Watchlist";
import Portfolio from "./components/Portfolio";
import ConnBadge from "./components/ConnBadge";
import PriceCell from "./components/PriceCell";

export default function App() {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    startRafLoop();
    initVisibility();
    connect();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
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
