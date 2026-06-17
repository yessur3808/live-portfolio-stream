import { dirty } from "./store";

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

export const subscribeSymbol = (sym: string, fn: Listener) => {
  let set = listeners.get(sym);
  if (!set) {
    set = new Set();
    listeners.set(sym, set);
  }
  set.add(fn);
  return () => set!.delete(fn);
};

export const startRafLoop = () => {
  const frame = () => {
    if (dirty.size > 0) {
      for (const sym of dirty) {
        const set = listeners.get(sym);
        if (set) for (const fn of set) fn();
      }
      dirty.clear();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};
