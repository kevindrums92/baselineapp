/**
 * Push Banner Tracking Service
 *
 * Manages the state and visibility logic for the push notification banner
 * shown on HomePage to encourage users to enable push notifications.
 *
 * Logic:
 * - Banner shows if user has 5+ transactions and push is not enabled
 * - After dismissing, banner hides for 3 days
 * - After dismissing 3 times (9 days total), banner never shows again
 * - If user enables push, banner is permanently hidden
 */

const STORAGE_KEY = "app.pushBannerDismisses";
const DAYS_BETWEEN_SHOWS = 3;
const MAX_DISMISSES = 3;

interface BannerDismissState {
  count: number;
  lastDismissedAt: string | null; // ISO date string
}

/**
 * Load current dismiss state from localStorage
 */
function loadDismissState(): BannerDismissState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { count: 0, lastDismissedAt: null };
    }
    return JSON.parse(stored) as BannerDismissState;
  } catch {
    return { count: 0, lastDismissedAt: null };
  }
}

/**
 * Save dismiss state to localStorage
 */
function saveDismissState(state: BannerDismissState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("[PushBannerTracking] Failed to save state:", err);
  }
}

/**
 * Check if the banner should be shown
 * Returns true if:
 * - User hasn't dismissed 3 times (permanent hide)
 * - Last dismiss was more than 3 days ago (or never dismissed)
 */
export function shouldShowBanner(): boolean {
  const state = loadDismissState();

  // Permanently hidden after 3 dismisses
  if (state.count >= MAX_DISMISSES) {
    return false;
  }

  // Never dismissed, should show
  if (!state.lastDismissedAt) {
    return true;
  }

  // Check if enough time has passed since last dismiss
  const lastDismiss = new Date(state.lastDismissedAt);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - lastDismiss.getTime()) / (1000 * 60 * 60 * 24));

  return daysSince >= DAYS_BETWEEN_SHOWS;
}

/**
 * Record a banner dismissal
 * Increments count and updates timestamp
 */
export function recordDismiss(): void {
  const state = loadDismissState();
  const newState: BannerDismissState = {
    count: state.count + 1,
    lastDismissedAt: new Date().toISOString(),
  };
  saveDismissState(newState);

  console.log(`[PushBannerTracking] Banner dismissed (${newState.count}/${MAX_DISMISSES})`);
}

/**
 * Mark banner as permanently hidden
 * Call this when user successfully enables push notifications
 */
export function markAsEnabled(): void {
  const newState: BannerDismissState = {
    count: MAX_DISMISSES, // Set to max to permanently hide
    lastDismissedAt: new Date().toISOString(),
  };
  saveDismissState(newState);

  console.log("[PushBannerTracking] Banner permanently hidden (push enabled)");
}

/**
 * Reset banner state (for testing/debugging)
 */
export function resetBannerState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[PushBannerTracking] Banner state reset");
  } catch (err) {
    console.error("[PushBannerTracking] Failed to reset state:", err);
  }
}

/**
 * Get current dismiss count (for debugging)
 */
export function getDismissCount(): number {
  return loadDismissState().count;
}
