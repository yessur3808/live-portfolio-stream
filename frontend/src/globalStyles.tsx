import { GlobalStyles } from "@mui/material";

export default function AppGlobalStyles() {
  return (
    <GlobalStyles
      styles={{
        "@keyframes flashUp": {
          from: { backgroundColor: "rgba(34,197,94,0.35)" },
          to: { backgroundColor: "transparent" },
        },
        "@keyframes flashDown": {
          from: { backgroundColor: "rgba(239,68,68,0.35)" },
          to: { backgroundColor: "transparent" },
        },
        ".flash-up": { animation: "flashUp 0.3s ease-out" },
        ".flash-down": { animation: "flashDown 0.3s ease-out" },
        ".tabular-nums": { fontVariantNumeric: "tabular-nums" },
      }}
    />
  );
}
