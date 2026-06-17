import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0a0a0a", paper: "#121212" },
    success: { main: "#22c55e" },
    error: { main: "#ef4444" },
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
  },
});