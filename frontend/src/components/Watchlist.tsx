import {
  Paper,
  Box,
  Typography,
  ButtonBase,
  Divider,
  styled,
} from "@mui/material";
import { useApp } from "../lib/store";
import { PriceCell } from "./PriceCell";

const SymbolButtonBase = styled(ButtonBase)({
  width: "100%",
  px: 2,
  py: 1,
  display: "flex",
  justifyContent: "flex-start",
  "&:hover": { bgcolor: "action.hover" },
  borderBottom: "1px solid",
  borderColor: "rgba(255, 255, 255, 0.12)",
  padding: "12px 16px",
});

export const Watchlist = ({ onSelect }: { onSelect: (s: string) => void }) => {
  const watchlist = useApp((s) => s.watchlist);
  return (
    <Paper
      variant="outlined"
      sx={{ display: "flex", flexDirection: "column", height: "fit-content" }}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          Watchlist · {watchlist.length} symbols
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ maxHeight: "800px", overflow: "auto" }}>
        {watchlist.map((sym) => (
          <SymbolButtonBase key={sym} onClick={() => onSelect(sym)}>
            <Typography sx={{ width: 80, fontWeight: 600, color: "#ccc" }}>
              {sym}
            </Typography>

            <Box sx={{ flex: 1 }}>
              <PriceCell symbol={sym} />
            </Box>
          </SymbolButtonBase>
        ))}
      </Box>
    </Paper>
  );
};
