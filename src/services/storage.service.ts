import type { AppState } from "@/types/app.types";

const STORAGE_KEY = "app_state_v1";

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Ensure required fields
    if (!parsed.schemaVersion) return null;

    return parsed as AppState;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // optional: handle quota exceeded
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
