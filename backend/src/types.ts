export interface Quote {
  symbol: string;
  last: number;
  dayChangePct: number;
  ts: number;
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
  | { type: "heartbeat"; seq: number; ts: number };

export interface ClientMsg {
  type: "resume" | "hello";
  lastSeq?: number;
}

export interface Client {
  enqueue: (payload: string) => void;
}
