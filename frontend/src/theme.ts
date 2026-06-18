import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#06080f", paper: "#0f1523" },
    primary: { main: "#8b5cf6" },
    success: { main: "#22c55e" },
    error: { main: "#fb7185" },
    text: {
      primary: "#e5e7eb",
      secondary: "#9ca3af",
    },
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 750 },
    h5: { fontWeight: 700 },
    button: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
});
