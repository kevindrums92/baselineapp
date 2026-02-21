import type { AppState } from "@/types/app.types";

const KEY = "app.pendingSnapshot.v1";

export function setPendingSnapshot(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function getPendingSnapshot(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function clearPendingSnapshot() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function hasPendingSnapshot(): boolean {
  return !!getPendingSnapshot();
}
