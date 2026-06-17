# Live Portfolio Stream

A real-time crypto watchlist + mock portfolio that streams tick-by-tick quotes over
WebSockets. The UI renders a screen full of constantly-changing numbers at 60fps,
recovers from disconnects with sequence-based backfill, and reconciles correctly
after the tab is backgrounded — without a visible reload.

**Market chosen:** Top on-chain tokens (Solana / Ethereum / Base), 200+ symbols.

- **Live demo (web):** <https://your-app.vercel.app>
- **Live WebSocket endpoint:** `wss://your-backend.up.railway.app/ws`
- **Loom walkthrough (3–5 min):** <https://loom.com/share/...>

---

## Quick start

### One-command local (fallback to the live URL)

```bash
docker-compose up
```


- Backend (Nodejs) → `http://localhost:8080`, 
- WebSocket at `ws://localhost:8080/ws`
- Frontend (Vite) → `http://localhost:5173`

The frontend reads the backend URL using VITE_WS_URL. 
With docker-compose it should default to the local backend;


### What's implemented
#### Frontend (React + TypeScript + Vite + MUI)

- Watchlist screen — symbol, last price, day-change %, updating live.
- Portfolio screen — qty, avg cost, last, unrealized P&L per position, and total
portfolio value, all recomputed on every tick (mock fills).
- Animated numbers + tick-direction flash — green flash on up-ticks, red on
down-ticks; numbers update without layout jump (tabular figures, fixed widths).
- Connection state visible at all times: connecting → connected → reconnecting → stale.
- Background-and-resume — backgrounding for 30s and returning reconciles to true
state with no zombie prices and no reload.
- Detail view — click any symbol to open a live detail panel.


#### Backend (Node.js)

- Ingests a quote feed and maintains a single canonical state map.
- Fans quotes out to all clients serializing each batch exactly once.
- Sends diff-only updates (symbol + changed fields), batched in a 75ms window.
- Reconnect with backfill — client sends lastSeq; server replays from a bounded
in-memory ring buffer, or sends a fresh snapshot if the gap is too large.
- Per-client backpressure — slow clients are detected via bufferedAmount and
evicted rather than allowed to balloon server memory.

---

### Architecture

```
quote feed ──► ingest ──► canonical state (Map<symbol, Quote>)
                             │
                             ├─ diff accumulator (per-symbol, coalesced)
                             │
              every 75ms ──► flush: build ONE diff message
                             │        ├─ assign seq, push to ring buffer
                             │        └─ JSON.stringify once
                             │
                             └─ broadcast: send same string to every client
                                          (drop client if bufferedAmount > 1MB)

client ──► WS ──► store (mutable, outside React)
                    │
   requestAnimationFrame loop (≤60fps) ──► imperative DOM writes per cell
```


#### Why this shape
- Single serialization per batch. Node is single-threaded, so the one thing we
must not do is re-stringify per client. JSON.stringify runs once per 75ms flush
regardless of client count; the per-client cost is just ws.send(sameString). CPU
scales with symbols changed per window, not with connections.

- Diff accumulator keyed by symbol. A symbol that ticks 50× in one window
produces exactly one diff. This decouples outbound message rate (~13 msg/s/client)
from inbound tick rate.

- Data rate ≠ render rate on the client. Incoming messages mutate a plain store
outside React. A single requestAnimationFrame loop reads the latest values and
writes them imperatively to the DOM. Ticks collapse into ≤60 paints/s, and the React
tree never re-renders on a tick.

---
---

## Future enhancements

These are areas in which I see it can be further enhanced.
I have ordered these in the order from most impact on the product quality to least.

### Wire

- **Binary protocol.** Replace diff only JSON with a packe d binary frame
  (MessagePack or a fixed `ArrayBuffer` layout). Drop each diff from ~60 bytes to
  ~12, removes JSON parsing on mobile as well..


### Delivery & scaling

- **Redis Streams.** Shared sequencing so WS nodes are stateless and
  backfill works across instances.

- **Per-client subscriptions.** Show each client only the symbols it is watching
  rather than all 200.

- **Snapshot over HTTP.** Better to serve the initial snapshot from a cacheable endpoint; keep
  the socket for live deltas only.


### Frontend

- **Search.** Filter the watchlist by symbol or name, off the rAF path so live ticks
  keep flowing while typing.

- **Sorting.** Sort by price, day-change %, or other variables. This can including live re-sorting as values tick (with a toggle).

- **Inline price updates.** A tiny rolling chart per row, drawn on one shared canvas to stay off
  the React path.

- **Responsive mobile layout.** Adjust the tables into stacked cards on small screens,
  with touch-friendly targets and the detail view as a bottom sheet or overlay.

- **Virtualized watchlist.** Mount only the rows in view for large symbol universes.
  
- ~ **Worker decode.** Maybe move WS decode into a Web Worker so the main thread only paints.

- **Ticker Symbols & Icons** Add Ticker symbols. and icons to help present the tokens better and increase regonizability

### Product & data

- **Real venue feed.** Swap the mock generator for a live upstream, validated at the
  ingest boundary.

- **Alerts.** Price/percent-move thresholds that fire a toast or push notification.