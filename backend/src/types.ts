export interface Quote {
  symbol: string;
  last: number;
  dayChangePct: number;
  ts: number;
}

export type EventCategory = "fed" | "macro" | "headline";
export type EventSeverity = "low" | "medium" | "high";

export interface LiveEvent {
  eventId: string;
  source: string;
  category: EventCategory;
  severity: EventSeverity;
  title: string;
  body: string;
  url?: string;
  symbols: string[];
  topics: string[];
  eventTs: number;
  ingestTs: number;
}

export interface FieldDiff {
  symbol: string;
  last?: number;
  dayChangePct?: number;
  ts: number;
}

export type ServerMsg =
  | {
      type: "snapshot";
      seq: number;
      snapshot: Record<string, Quote>;
      ts: number;
    }
  | { type: "diff"; seq: number; changes: FieldDiff[]; ts: number }
  | { type: "heartbeat"; seq: number; ts: number }
  | {
      type: "eventSnapshot";
      eventSeq: number;
      events: LiveEvent[];
      ts: number;
    }
  | { type: "eventBatch"; eventSeq: number; events: LiveEvent[]; ts: number }
  | { type: "eventHeartbeat"; eventSeq: number; ts: number };

export interface ClientMsg {
  type: "resume" | "hello";
  lastSeq?: number;
  lastEventSeq?: number;
}

export interface Client {
  enqueue: (payload: string) => void;
}
