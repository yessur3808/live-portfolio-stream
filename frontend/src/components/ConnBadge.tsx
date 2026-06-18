import { Box, Chip, Typography } from "@mui/material";
import { useApp } from "../lib/store";

type ConnVisual = {
  text: string;
  textColor: string;
  bg: string;
  border: string;
};

const VISUALS: Record<string, ConnVisual> = {
  connecting: {
    text: "connecting",
    textColor: "#86efac",
    bg: "rgba(34,197,94,0.14)",
    border: "rgba(134,239,172,0.38)",
  },
  connected: {
    text: "connected",
    textColor: "#86efac",
    bg: "rgba(34,197,94,0.14)",
    border: "rgba(134,239,172,0.38)",
  },
  reconnecting: {
    text: "reconnecting",
    textColor: "#fde68a",
    bg: "rgba(245,158,11,0.16)",
    border: "rgba(252,211,77,0.42)",
  },
  stale: {
    text: "disconnected",
    textColor: "#fca5a5",
    bg: "rgba(239,68,68,0.14)",
    border: "rgba(252,165,165,0.4)",
  },
};

export const ConnBadge = () => {
  const conn = useApp((s) => s.conn);
  const visual = VISUALS[conn] ?? VISUALS.stale;

  return (
    <Chip
      size="small"
      label={
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.7 }}>
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "999px",
              bgcolor: visual.textColor,
              border:
                conn === "reconnecting"
                  ? "2px solid rgba(253,230,138,0.38)"
                  : "none",
              animation:
                conn === "reconnecting"
                  ? "connSpin 1s linear infinite"
                  : conn === "stale"
                    ? "none"
                    : "connPulse 1.8s ease-in-out infinite",
              "@keyframes connPulse": {
                "0%, 100%": { opacity: 0.75, transform: "scale(1)" },
                "50%": { opacity: 1, transform: "scale(1.15)" },
              },
              "@keyframes connSpin": {
                from: { transform: "rotate(0deg)" },
                to: { transform: "rotate(360deg)" },
              },
            }}
          />
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: visual.textColor,
              textTransform: "capitalize",
              letterSpacing: 0.3,
            }}
          >
            {visual.text}
          </Typography>
        </Box>
      }
      variant="outlined"
      sx={{
        borderRadius: "12px",
        px: 0.5,
        fontWeight: 700,
        borderColor: visual.border,
        bgcolor: visual.bg,
        backdropFilter: "blur(12px)",
      }}
    />
  );
};
