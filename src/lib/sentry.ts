import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

/**
 * Initialize Sentry for error-only tracking.
 * No performance tracing, no session replay — just errors.
 * This maximizes the free tier quota (5,000 errors/month).
 */
export function initSentry() {
  if (!import.meta.env.PROD) {
    return;
  }

  if (!SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Release tracking — matches __APP_VERSION__ from vite.config.ts
    release: `baselineapp@${__APP_VERSION__}`,
    environment: import.meta.env.MODE, // "development" | "production"

    // Error-only: disable performance tracing
    tracesSampleRate: 0,

    // Disable session replay (saves quota)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    enabled: import.meta.env.PROD,

    // Filter noisy or irrelevant errors
    beforeSend(event) {
      // Skip ResizeObserver errors (browser noise, not real bugs)
      if (event.exception?.values?.some(
        (e) => e.value?.includes("ResizeObserver loop")
      )) {
        return null;
      }

      // Skip network errors from extensions or third-party scripts
      if (event.exception?.values?.some(
        (e) => e.value?.includes("chrome-extension://") ||
               e.value?.includes("moz-extension://")
      )) {
        return null;
      }

      return event;
    },

    // Limit breadcrumbs to reduce payload size
    maxBreadcrumbs: 30,

    // Ignore common non-actionable errors
    ignoreErrors: [
      // Browser navigation
      "Non-Error promise rejection captured",
      "AbortError",
      // Network flakiness
      "Failed to fetch",
      "NetworkError",
      "Load failed",
      // Auth-related (handled by app)
      "AuthRetryableFetchError",
    ],
  });
}

/**
 * Capture an error manually (for try-catch blocks).
 * Use this in production error paths instead of just console.error.
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Set user identity for error attribution.
 * Call after auth state changes.
 */
export function setSentryUser(userId: string | null, email?: string | null) {
  if (userId) {
    Sentry.setUser({ id: userId, email: email || undefined });
  } else {
    Sentry.setUser(null);
  }
}
