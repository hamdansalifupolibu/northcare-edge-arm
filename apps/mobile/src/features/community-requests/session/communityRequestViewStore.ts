/**
 * Ephemeral in-memory detail hold for Community Requests.
 * Cleared on logout / workspace switch. Not persisted. No contact numbers in AsyncStorage.
 */

type Listener = () => void;

let detailClearedGeneration = 0;
const listeners = new Set<Listener>();

export function clearCommunityRequestViews(): void {
  detailClearedGeneration += 1;
  for (const listener of listeners) {
    listener();
  }
}

export function getCommunityRequestViewGeneration(): number {
  return detailClearedGeneration;
}

export function subscribeCommunityRequestViewClears(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
