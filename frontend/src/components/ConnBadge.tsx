import { Box, Chip, Typography } from "@mui/material";
import { CONN_VISUALS } from "../constants";
import { useApp } from "../lib/store";

export const ConnBadge = () => {
  const conn = useApp((s) => s.conn);
  const visual = CONN_VISUALS[conn] ?? CONN_VISUALS.stale;

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
