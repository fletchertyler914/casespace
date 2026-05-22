/** Notifies timer UIs to refetch active timer + today's entry after external start/stop. */

type Listener = (caseId: string) => void;
const listeners = new Set<Listener>();

export function notifyTimerChanged(caseId: string): void {
  for (const listener of listeners) {
    listener(caseId);
  }
}

export function subscribeTimerChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
