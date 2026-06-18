import { GlobalStyles } from "@mui/material";

export default function AppGlobalStyles() {
  return (
    <GlobalStyles
      styles={{
        body: {
          background:
            "radial-gradient(circle at top left, rgba(139,92,246,0.16), transparent 34%), radial-gradient(circle at top right, rgba(14,165,233,0.12), transparent 28%), linear-gradient(180deg, #06080f 0%, #0a1020 100%)",
        },
        "#root": {
          position: "relative",
        },
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
        "*": { boxSizing: "border-box" },
      }}
    />
  );
}
