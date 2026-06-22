import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  Switch,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useState, type Dispatch, type SetStateAction } from "react";
import { useApp } from "../lib/store";

const TRACKED_TOPICS = ["fed", "macro", "news"];
const NEWS_FEED_BUTTON_WIDTH = 150;
const NEWS_FEED_PANEL_WIDTH = 800;

const severityColor = {
  low: "rgba(125,211,252,0.18)",
  medium: "rgba(250,204,21,0.18)",
  high: "rgba(251,113,133,0.18)",
} as const;

const TopicSwitch = styled(Switch)(({ theme }) => ({
  width: 46,
  height: 26,
  padding: 0,
  display: "flex",
  "& .MuiSwitch-switchBase": {
    padding: 2,
    transitionDuration: "220ms",
    "&.Mui-checked": {
      transform: "translateX(20px)",
      color: "#062e18",
      "& + .MuiSwitch-track": {
        backgroundColor: "#4ade80",
        opacity: 1,
        border: `1px solid ${alpha(theme.palette.success.light, 0.65)}`,
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  "& .MuiSwitch-track": {
    borderRadius: 13,
    opacity: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.2)",
    boxSizing: "border-box",
  },
}));

interface EventFeedProps {
  newsDrawerOpen: boolean;
  setNewsDrawerOpen: Dispatch<SetStateAction<boolean>>;
}
export const EventFeed = ({
  newsDrawerOpen,
  setNewsDrawerOpen,
}: EventFeedProps) => {
  const events = useApp((s) => s.events);
  const followedTopics = useApp((s) => s.followedTopics);
  const mutedTopics = useApp((s) => s.mutedTopics);
  const toggleTopicFollow = useApp((s) => s.toggleTopicFollow);
  const toggleTopicMute = useApp((s) => s.toggleTopicMute);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [pendingLink, setPendingLink] = useState<string | null>(null);

  const menuOpen = Boolean(filterAnchor);

  const handleOpenLink = () => {
    if (!pendingLink) return;
    window.open(pendingLink, "_blank", "noopener,noreferrer");
    setPendingLink(null);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        position: "fixed",
        top: 0,
        right: newsDrawerOpen ? 0 : `-${NEWS_FEED_PANEL_WIDTH}px`,
        width: {
          xs: `calc(100vw - ${NEWS_FEED_BUTTON_WIDTH}px)`,
          lg: NEWS_FEED_PANEL_WIDTH,
        },
        maxWidth: `calc(100vw - ${NEWS_FEED_BUTTON_WIDTH}px)`,
        height: { xs: "100vh", lg: "80vh" },
        zIndex: 1250,
        overflow: "visible",
        transition: "right 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        borderRadius: "0 0 12px 12px",
        pl: 2,
        pr: 2,
        pt: 2,
        pb: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 24px 90px rgba(0,0,0,0.28)",
        background:
          "linear-gradient(135deg, rgba(13,17,28,0.94) 0%, rgba(10,14,24,0.9) 100%)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          minHeight: 0,
          flex: 1,
        }}
      >
        <Button
          onClick={() => setNewsDrawerOpen(!newsDrawerOpen)}
          aria-expanded={newsDrawerOpen}
          aria-label={newsDrawerOpen ? "Hide" : "Show"}
          sx={{
            display: "inline-flex",
            position: "absolute",
            left: `-${NEWS_FEED_BUTTON_WIDTH}px`,
            top: 18,
            zIndex: 3,
            width: `${NEWS_FEED_BUTTON_WIDTH}px`,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 1.4,
            py: 1,
            minWidth: `${NEWS_FEED_BUTTON_WIDTH}px`,
            height: "62px",
            borderRadius: "16px 0 0 16px",
            bgcolor: "rgba(15,20,31,0.98)",
            background:
              "linear-gradient(180deg, rgb(54 76 123 / 98%) 0%, rgb(2 18 53 / 98%) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRight: 0,
            color: "text.primary",
            backdropFilter: "blur(16px)",
            boxShadow:
              "-14px 18px 36px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.06)",
            textTransform: "none",
            "&:hover": {
              background:
                "linear-gradient(180deg, rgba(30,38,56,0.99) 0%, rgba(18,23,35,0.99) 100%)",
            },
            opacity: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "999px",
                bgcolor: "#34d399",
                boxShadow: "0 0 0 4px rgba(52,211,153,0.14)",
                flexShrink: 0,
              }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <Typography
                component="span"
                sx={{
                  fontSize: 10,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  color: "text.secondary",
                  lineHeight: 1,
                  marginBottom: "8px",
                }}
              >
                Live
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontSize: 14,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                News Feed
              </Typography>
            </Box>
          </Box>
          {newsDrawerOpen ? (
            <ChevronRightRoundedIcon
              fontSize="small"
              sx={{ color: "rgba(255,255,255,0.72)" }}
            />
          ) : (
            <ChevronLeftRoundedIcon
              fontSize="small"
              sx={{ color: "rgba(255,255,255,0.72)" }}
            />
          )}
        </Button>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            minHeight: 0,
            flex: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              gap: 1.2,
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", letterSpacing: 1.2 }}
              >
                Personalized signals
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                Market-moving signals curated for your watchlist
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Chip
                size="small"
                label={`${events.length} signals`}
                sx={{
                  height: 24,
                  border: "1px solid rgba(255,255,255,0.16)",
                  bgcolor: "rgba(255,255,255,0.06)",
                  color: "text.secondary",
                  fontWeight: 700,
                }}
              />
              <Tooltip title="Filters">
                <IconButton
                  size="small"
                  onClick={(event) => setFilterAnchor(event.currentTarget)}
                  sx={{
                    width: 30,
                    height: 30,
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "text.secondary",
                    bgcolor: "rgba(255,255,255,0.05)",
                  }}
                >
                  <FilterListRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Chip
                size="small"
                sx={{
                  height: 24,
                  border: "1px solid rgba(255,255,255,0.16)",
                  bgcolor: "rgba(255,255,255,0.06)",
                  color: "text.secondary",
                  fontWeight: 700,
                }}
              />
            </Box>
          </Box>

          <Menu
            open={menuOpen}
            anchorEl={filterAnchor}
            onClose={() => setFilterAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  mt: 0.8,
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  bgcolor: "rgba(10,14,24,0.98)",
                  backdropFilter: "blur(12px)",
                  p: 1,
                },
              },
            }}
          >
            <Typography
              sx={{
                px: 1,
                pb: 0.75,
                fontSize: 12,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              Topic filters
            </Typography>
            <Box sx={{ display: "grid", gap: 0.5 }}>
              {TRACKED_TOPICS.map((topic) => {
                const followed = followedTopics.includes(topic);
                const muted = mutedTopics.includes(topic);

                return (
                  <Box
                    key={topic}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      alignItems: "center",
                      gap: 0.8,
                      px: 1,
                      py: 0.45,
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.09)",
                      bgcolor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        textTransform: "uppercase",
                        letterSpacing: 0.7,
                        fontWeight: 700,
                      }}
                    >
                      {topic}
                    </Typography>

                    <Tooltip title={followed ? "Turn off" : "Turn on"}>
                      <TopicSwitch
                        checked={followed}
                        onChange={() => toggleTopicFollow(topic)}
                      />
                    </Tooltip>

                    <Tooltip title={muted ? "Unmute topic" : "Mute topic"}>
                      <IconButton
                        size="small"
                        onClick={() => toggleTopicMute(topic)}
                        sx={{
                          width: 26,
                          height: 26,
                          border: "1px solid",
                          borderColor: muted
                            ? "rgba(252,165,165,0.5)"
                            : "rgba(255,255,255,0.2)",
                          color: muted ? "#fca5a5" : "text.secondary",
                          bgcolor: muted
                            ? "rgba(239,68,68,0.2)"
                            : "rgba(255,255,255,0.05)",
                          "&:hover": {
                            bgcolor: muted
                              ? "rgba(239,68,68,0.28)"
                              : "rgba(255,255,255,0.11)",
                          },
                        }}
                      >
                        <VolumeOffRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>
          </Menu>

          <Box
            sx={{
              display: "grid",
              gap: 0.9,
              minHeight: 0,
              flex: 1,
              overflowY: "auto",
              pr: 0.4,
            }}
          >
            {events.length === 0 ? (
              <Typography sx={{ color: "text.secondary", py: 1 }}>
                Waiting for external events...
              </Typography>
            ) : (
              events.slice(0, 14).map((event) => (
                <Box
                  key={event.eventId}
                  sx={{
                    px: 1.1,
                    py: 1,
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                      {event.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${event.severity} · ${event.relevance}`}
                      sx={{
                        height: 20,
                        bgcolor: severityColor[event.severity],
                        border: "1px solid rgba(255,255,255,0.15)",
                        textTransform: "capitalize",
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{ color: "text.secondary", mt: 0.35, fontSize: 13 }}
                  >
                    {event.body}
                  </Typography>
                  {event.url && (
                    <Box sx={{ mt: 0.8 }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setPendingLink(event.url!)}
                        sx={{
                          px: 0,
                          minWidth: 0,
                          textTransform: "none",
                          fontWeight: 700,
                          color: "#93c5fd",
                          "&:hover": {
                            bgcolor: "transparent",
                            color: "#bfdbfe",
                          },
                        }}
                      >
                        Open source link
                      </Button>
                    </Box>
                  )}
                  {event.symbols.length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.7,
                        mt: 0.9,
                      }}
                    >
                      {event.symbols.slice(0, 5).map((symbol) => (
                        <Chip
                          key={`${event.eventId}-${symbol}`}
                          size="small"
                          label={symbol}
                          sx={{
                            height: 20,
                            bgcolor: "rgba(96,165,250,0.14)",
                            border: "1px solid rgba(147,197,253,0.3)",
                            color: "#bfdbfe",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              ))
            )}
          </Box>

          <Dialog
            open={Boolean(pendingLink)}
            onClose={() => setPendingLink(null)}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  bgcolor: "rgba(10,14,24,0.98)",
                  backdropFilter: "blur(10px)",
                },
              },
            }}
          >
            <DialogTitle sx={{ fontWeight: 700 }}>
              Open article in new tab?
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: "text.secondary" }}>
                This will open the news source in a new browser tab.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 1.5 }}>
              <Button onClick={() => setPendingLink(null)} color="inherit">
                Cancel
              </Button>
              <Button
                onClick={handleOpenLink}
                variant="contained"
                color="primary"
              >
                Yes, open
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Paper>
  );
};
