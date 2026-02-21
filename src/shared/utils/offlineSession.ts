/**
 * Offline Session Reader
 *
 * Reads the Supabase session directly from localStorage without going through
 * the Supabase client. This avoids hanging when the client is trying to refresh
 * an expired JWT token over the network (which can block for 30+ seconds offline).
 *
 * IMPORTANT: This is for boot-path decisions only (routing, UI state).
 * For actual API calls, always use supabase.auth.getSession().
 */

export interface StoredSessionInfo {
  userId: string;
  email: string | null;
  isAnonymous: boolean;
}

/**
 * Read Supabase session from localStorage (no network, no await).
 * Returns basic user info if a session exists, null otherwise.
 *
 * Supabase stores sessions in localStorage with key pattern: sb-<project-ref>-auth-token
 */
export function getStoredSession(): StoredSessionInfo | null {
  try {
    const keys = Object.keys(localStorage).filter(
      (key) => key.includes('sb-') && key.includes('-auth-token')
    );

    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);
        const user = parsed?.currentSession?.user || parsed?.user;

        if (user?.id) {
          return {
            userId: user.id,
            email: user.email ?? null,
            isAnonymous: !!user.is_anonymous,
          };
        }
      } catch {
        // Corrupted entry, skip
      }
    }
  } catch {
    // localStorage not available
  }

  return null;
}

/**
 * Check if there's any stored Supabase session (sync, no network).
 */
export function hasStoredSession(): boolean {
  return getStoredSession() !== null;
}
