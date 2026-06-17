import { Chip } from "@mui/material";
import { useApp } from "../lib/store";

const colorMap: Record<string, "warning" | "success" | "error" | "default"> = {
  connecting: "warning",
  connected: "success",
  reconnecting: "warning",
  stale: "error",
};

export const ConnBadge = () => {
  const conn = useApp((s) => s.conn);
  return (
    <Chip
      size="small"
      label={`● ${conn}`}
      color={colorMap[conn]}
      variant="outlined"
    />
  );
};
