import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCloudState, upsertCloudState } from "@/services/cloudState.service";
import { useAppStore } from "@/state/app.store";
import { clearState } from "@/services/storage.service";
import {
  getPendingSnapshot,
  setPendingSnapshot,
  clearPendingSnapshot,
} from "@/services/pendingSync.service";
import { logger } from "@/shared/utils/logger";
import { getNetworkStatus, addNetworkListener } from "@/services/network.service";
import {
  initializePushNotifications,
  deactivateToken,
  migrateGuestTokenToUser,
  cleanup as cleanupPushNotifications,
} from "@/services/pushNotification.service";

const SEEN_KEY = "app.welcomeSeen.v1";
const SYNC_LOCK_KEY = "app.syncLock";
const SYNC_LOCK_TIMEOUT = 5000; // 5 seconds

function isNetworkOrServerError(err: unknown) {
  const msg = String((err as any)?.message ?? err ?? "").toLowerCase();
  const status = (err as any)?.status ?? (err as any)?.statusCode ?? 0;
  return (
    !navigator.onLine ||
    msg.includes("failed to fetch") ||
    msg.includes("err_name_not_resolved") ||
    msg.includes("networkerror") ||
    msg.includes("internal server error") ||
    msg.includes("bad gateway") ||
    msg.includes("service unavailable") ||
    msg.includes("gateway timeout") ||
    msg.includes("timeout") ||
    msg.includes("econnrefused") ||
    msg.includes("econnreset") ||
    (typeof status === "number" && status >= 500 && status < 600)
  );
}

function acquireSyncLock(): boolean {
  try {
    const now = Date.now();
    const existingLock = localStorage.getItem(SYNC_LOCK_KEY);

    if (existingLock) {
      const lockTime = parseInt(existingLock, 10);
      if (now - lockTime < SYNC_LOCK_TIMEOUT) {
        logger.warn("CloudSync", "Sync already in progress in another tab/window");
        return false;
      }
    }

    localStorage.setItem(SYNC_LOCK_KEY, String(now));
    return true;
  } catch {
    return true;
  }
}

function releaseSyncLock() {
  try {
    localStorage.removeItem(SYNC_LOCK_KEY);
  } catch {
    // ignore
  }
}

export default function CloudSyncGate() {
  const getSnapshot = useAppStore((s) => s.getSnapshot);
  const replaceAllData = useAppStore((s) => s.replaceAllData);

  const setCloudMode = useAppStore((s) => s.setCloudMode);
  const setCloudStatus = useAppStore((s) => s.setCloudStatus);
  const setUser = useAppStore((s) => s.setUser);
  const updateLastAuthTimestamp = useAppStore((s) => s.updateLastAuthTimestamp);

  const setWelcomeSeen = useAppStore((s) => s.setWelcomeSeen);

  const welcomeSeen = useAppStore((s) => s.welcomeSeen);
  const security = useAppStore((s) => s.security);

  const initializedRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  async function pushSnapshot(snapshot: ReturnType<typeof getSnapshot>) {
    if (!(await getNetworkStatus())) {
      setCloudStatus("offline");
      setPendingSnapshot(snapshot);
      return;
    }

    try {
      setCloudStatus("syncing");
      logger.info("CloudSync", "Pushing snapshot");
      await upsertCloudState(snapshot);
      clearPendingSnapshot();
      setCloudStatus("ok");
    } catch (err) {
      logger.error("CloudSync", "Push failed:", err);
      setCloudStatus(isNetworkOrServerError(err) ? "offline" : "error");
      setPendingSnapshot(snapshot);
    }
  }

  async function initForSession() {
    console.log("[CloudSyncGate] initForSession() called");

    const isOnline = await getNetworkStatus();
    if (!isOnline) {
      logger.info("CloudSync", "App started offline, checking for existing session");

      const supabaseKeys = Object.keys(localStorage).filter(key =>
        key.includes('sb-') && key.includes('-auth-token')
      );

      let storedSessionData: any = null;
      const hasStoredSession = supabaseKeys.length > 0 &&
        supabaseKeys.some(key => {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (parsed) {
                storedSessionData = parsed;
                return true;
              }
            }
            return false;
          } catch {
            return false;
          }
        });

      logger.info("CloudSync", `Has stored Supabase session: ${hasStoredSession}`);

      if (hasStoredSession && storedSessionData) {
        setCloudMode("cloud");

        const session = storedSessionData;
        const sessionUser = session.currentSession?.user || session.user;
        if (sessionUser && !sessionUser.is_anonymous) {
          const meta = sessionUser.user_metadata ?? {};
          const appMeta = sessionUser.app_metadata ?? {};
          const provider = (appMeta.provider as string) || sessionUser.identities?.[0]?.provider || null;

          setUser({
            email: sessionUser.email ?? null,
            name: (meta.full_name as string) || (meta.name as string) || null,
            avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || null,
            provider: provider as 'google' | 'apple' | null,
          });
          logger.info("CloudSync", `Offline mode: cloud (loaded user: ${sessionUser.email})`);
        } else {
          logger.info("CloudSync", "Offline mode: cloud (anonymous user, will sync when online)");
        }
      } else {
        setCloudMode("guest");
        logger.info("CloudSync", "Offline mode: guest (no session)");
      }

      setCloudStatus("offline");
      initializedRef.current = true;
      useAppStore.getState().setCloudSyncReady();
      return;
    }

    let session: any = null;
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("getSession timeout")), 5000)
        ),
      ]);
      session = result.data.session;
    } catch {
      console.warn("[CloudSyncGate] getSession() timed out, reading from localStorage");
      const storedKeys = Object.keys(localStorage).filter(
        (key) => key.includes("sb-") && key.includes("-auth-token")
      );
      for (const key of storedKeys) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "");
          if (parsed?.currentSession) {
            session = parsed.currentSession;
            break;
          }
        } catch { /* skip */ }
      }
    }
    console.log("[CloudSyncGate] Session:", session ? `User ${session.user?.id || session.user_id}` : "null");

    // Check if session is pending OTP verification
    if (session) {
      const pendingOtp = localStorage.getItem('auth.pendingOtpVerification');
      if (pendingOtp) {
        const timestamp = parseInt(pendingOtp, 10);
        const elapsed = Date.now() - timestamp;
        if (elapsed > 10 * 60 * 1000) {
          console.warn("[CloudSyncGate] Found abandoned session pending OTP (>10min) - signing out");
          localStorage.removeItem('auth.pendingOtpVerification');
          await supabase.auth.signOut();
          window.location.reload();
          return;
        } else {
          console.log("[CloudSyncGate] Session pending OTP verification (recent), allowing continuation");
        }
      }
    }

    if (!session) {
      const persistedWasAuthenticated = localStorage.getItem('app.wasAuthenticated') === 'true';

      if (persistedWasAuthenticated) {
        logger.info("CloudSync", "Session expired for previously authenticated user — showing recovery modal");
        useAppStore.getState().setSessionExpired(true);
        setCloudMode("guest");
        setCloudStatus("idle");
        initializedRef.current = true;
        useAppStore.getState().setCloudSyncReady();
        return;
      }

      const currentMode = useAppStore.getState().cloudMode;
      const currentUser = useAppStore.getState().user;
      const hasExistingCloudSession = currentMode === "cloud" && currentUser.email;

      if (import.meta.env.DEV && hasExistingCloudSession) {
        logger.warn("CloudSync", "HMR detected: Session null but already in cloud mode. Skipping reset.");
        setTimeout(async () => {
          const { data: retryData } = await supabase.auth.getSession();
          if (retryData.session) {
            logger.info("CloudSync", "HMR: Session recovered after retry");
            initForSession();
          }
        }, 500);
        return;
      }

      logger.info("CloudSync", "No session found, checking if guest mode or logout");

      const wasAuthenticated = currentMode === "cloud" && !!currentUser.email;

      if (wasAuthenticated) {
        logger.info("CloudSync", "Authenticated user logged out, clearing local data");
        clearPendingSnapshot();
        clearState();
        replaceAllData({ schemaVersion: 1 });

        try {
          localStorage.removeItem(SEEN_KEY);
        } catch {}
        setWelcomeSeen(false);
      } else {
        logger.info("CloudSync", "No session, preserving local data (guest or anonymous session expired)");
      }

      setUser({
        email: null,
        name: null,
        avatarUrl: null,
        provider: null,
      });

      if (isOnline) {
        try {
          const { error: anonError } = await supabase.auth.signInAnonymously();
          if (!anonError) {
            console.log("[CloudSyncGate] Anonymous session created, SIGNED_IN will init cloud sync");
            return;
          }
          console.warn("[CloudSyncGate] signInAnonymously failed:", anonError);
        } catch (err) {
          console.warn("[CloudSyncGate] signInAnonymously error:", err);
        }
      }

      setCloudMode("guest");
      setCloudStatus("idle");
      initializedRef.current = false;
      useAppStore.getState().setCloudSyncReady();
      logger.info("CloudSync", "Guest mode fallback - no session available");
      return;
    }

    logger.info("CloudSync", "Session found, user:", session.user.id, "anonymous:", session.user.is_anonymous);

    const meta = session.user.user_metadata ?? {};
    const appMeta = session.user.app_metadata ?? {};
    const provider = (appMeta.provider as string) || session.user.identities?.[0]?.provider || null;

    console.log("[CloudSyncGate] Setting user data and cloud mode for:", session.user.email);
    setUser({
      email: session.user.email ?? null,
      name: (meta.full_name as string) || (meta.name as string) || null,
      avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || null,
      provider: provider as 'google' | 'apple' | null,
    });

    if (session.user.email && !session.user.is_anonymous) {
      localStorage.setItem('app.wasAuthenticated', 'true');
      localStorage.setItem('app.lastAuthEmail', session.user.email);
      if (provider) localStorage.setItem('app.lastAuthProvider', provider);
    }

    setCloudMode("cloud");
    console.log("[CloudSyncGate] Cloud mode set, starting sync process");

    const networkStatus = await getNetworkStatus();
    if (!networkStatus) {
      setCloudStatus("offline");
      setPendingSnapshot(getSnapshot());
      initializedRef.current = true;
      useAppStore.getState().setCloudSyncReady();
      return;
    }

    const lockAcquired = acquireSyncLock();
    if (!lockAcquired) {
      logger.warn("CloudSync", "Could not acquire sync lock, another sync in progress");
      setCloudStatus("ok");
      initializedRef.current = true;
      useAppStore.getState().setCloudSyncReady();
      return;
    }

    try {
      setCloudStatus("syncing");

      // If there are pending local changes, push first
      const pending = getPendingSnapshot();
      if (pending) {
        logger.info("CloudSync", "Found pending snapshot, pushing first");
        await pushSnapshot(pending);
        initializedRef.current = true;
        return;
      }

      // Normal flow: pull from cloud
      logger.info("CloudSync", "No pending changes, pulling from cloud...");
      const cloud = await getCloudState();

      if (cloud) {
        logger.info("CloudSync", "Cloud data found");

        // Mark onboarding as complete if cloud has data
        const onboardingCompleted = localStorage.getItem('app.onboarding.completed.v2') === 'true';
        if (!onboardingCompleted && cloud.welcomeSeen) {
          localStorage.setItem('app.onboarding.completed.v2', 'true');
          localStorage.setItem('app.onboarding.timestamp.v2', Date.now().toString());
        }

        replaceAllData(cloud);

        // Fetch subscription separately from RevenueCat/Supabase
        try {
          const { getSubscription } = await import('@/services/subscription.service');
          const subscription = await getSubscription(session.user.id);
          useAppStore.getState().setSubscription(subscription);
          console.log("[CloudSyncGate] Subscription loaded:", subscription?.status ?? 'free');
        } catch (subError) {
          console.error("[CloudSyncGate] Failed to load subscription:", subError);
        }

        updateLastAuthTimestamp();
      } else {
        // New account: push local data to cloud
        const localSnapshot = getSnapshot();
        logger.info("CloudSync", "New account detected, pushing local data to cloud");
        await upsertCloudState(localSnapshot);
        updateLastAuthTimestamp();
      }

      setCloudStatus("ok");
      initializedRef.current = true;
      useAppStore.getState().setCloudSyncReady();
      logger.info("CloudSync", "CloudSync initialization complete");

      // Initialize push notifications for authenticated users
      initializePushNotifications().then((enabled) => {
        logger.info("CloudSync", `Push notifications initialized: ${enabled ? "enabled" : "not enabled"}`);
      });
    } catch (err) {
      logger.error("CloudSync", "Init failed:", err);
      setCloudStatus(isNetworkOrServerError(err) ? "offline" : "error");
      setPendingSnapshot(getSnapshot());
      initializedRef.current = true;
      useAppStore.getState().setCloudSyncReady();
    } finally {
      releaseSyncLock();
    }
  }

  async function pushNow() {
    await pushSnapshot(getSnapshot());
  }

  // online/offline listeners
  useEffect(() => {
    async function onOnline() {
      if (!initializedRef.current) return;
      const pending = getPendingSnapshot();
      if (pending) {
        await pushSnapshot(pending);
      }
    }

    function onOffline() {
      setCloudStatus("offline");
      setPendingSnapshot(getSnapshot());
    }

    const removeListener = addNetworkListener((isOnline) => {
      if (isOnline) {
        onOnline();
      } else {
        onOffline();
      }
    });

    return () => {
      removeListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent retry: periodically push pending snapshot when status is "error"
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const { cloudMode, cloudStatus } = useAppStore.getState();
      if (cloudMode !== "cloud" || !initializedRef.current) return;
      if (cloudStatus !== "error") return;

      const pending = getPendingSnapshot();
      if (!pending) return;

      logger.info("CloudSync", "Retry: attempting to push pending snapshot...");
      await pushSnapshot(pending);
    }, 30_000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auth listener + init
  useEffect(() => {
    initForSession();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        const oauthTransition = localStorage.getItem('app.oauthTransition');
        if (oauthTransition) {
          const elapsed = Date.now() - parseInt(oauthTransition, 10);
          if (elapsed < 120_000) {
            console.log("[CloudSyncGate] SIGNED_OUT during OAuth transition, skipping cleanup");
            return;
          }
          localStorage.removeItem('app.oauthTransition');
        }

        const persistedAuth = localStorage.getItem('app.wasAuthenticated');
        if (persistedAuth) {
          console.log("[CloudSyncGate] SIGNED_OUT with wasAuthenticated flag — session expired");
          useAppStore.getState().setSessionExpired(true);
          setCloudMode("guest");
          setCloudStatus("idle");
          return;
        }

        deactivateToken();
        cleanupPushNotifications();

        clearPendingSnapshot();
        clearState();

        useAppStore.getState().clearSubscription();
        import('@/services/subscription.service').then(({ clearSubscriptionCache }) => {
          clearSubscriptionCache();
        });

        replaceAllData({ schemaVersion: 1 });

        try {
          localStorage.removeItem(SEEN_KEY);
        } catch {}
        setWelcomeSeen(false);

        setUser({
          email: null,
          name: null,
          avatarUrl: null,
          provider: null,
        });

        setCloudMode("guest");
        setCloudStatus("idle");
        initializedRef.current = false;

        try {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.warn("[CloudSyncGate] Failed to re-create anonymous session after logout:", error);
            useAppStore.getState().setCloudSyncReady();
          } else {
            console.log("[CloudSyncGate] Anonymous session re-created");
          }
        } catch (err) {
          console.warn("[CloudSyncGate] signInAnonymously error after logout:", err);
          useAppStore.getState().setCloudSyncReady();
        }

        return;
      }

      if (event === "SIGNED_IN") {
        localStorage.removeItem('app.oauthTransition');
        localStorage.removeItem('app.onboarding.logout.v2');

        if (session?.user?.is_anonymous) {
          if (initializedRef.current && useAppStore.getState().cloudMode === "cloud") {
            console.log("[CloudSyncGate] Anonymous SIGNED_IN but already in cloud mode, skipping");
            return;
          }
          console.log("[CloudSyncGate] Anonymous SIGNED_IN, initializing cloud sync");
          initializedRef.current = false;
          setTimeout(() => initForSession(), 0);
          return;
        }

        console.log("[CloudSyncGate] Authenticated SIGNED_IN, re-initializing...");

        useAppStore.getState().setSessionExpired(false);
        localStorage.removeItem('app.wasAuthenticated');
        localStorage.removeItem('app.lastAuthEmail');
        localStorage.removeItem('app.lastAuthProvider');

        initializedRef.current = false;

        setTimeout(async () => {
          // Migrate RevenueCat to authenticated user
          try {
            const { isNative } = await import('@/shared/utils/platform');
            if (isNative() && session?.user) {
              const { Purchases } = await import('@revenuecat/purchases-capacitor');
              await Purchases.logIn({ appUserID: session.user.id });
              console.log("[CloudSyncGate] RevenueCat linked to user:", session.user.id);

              const { getSubscription } = await import('@/services/subscription.service');
              const subscription = await getSubscription(session.user.id);
              useAppStore.getState().setSubscription(subscription);
            }
          } catch (err) {
            console.warn("[CloudSyncGate] Failed to migrate RevenueCat (non-blocking):", err);
          }

          migrateGuestTokenToUser().then((migrated) => {
            if (migrated) {
              console.log("[CloudSyncGate] Guest push token migrated to authenticated user");
            }
          });

          await initForSession();

          const previousAnonUserId = localStorage.getItem('app.previousAnonUserId');
          if (previousAnonUserId) {
            localStorage.removeItem('app.previousAnonUserId');
            try {
              await supabase.rpc('cleanup_orphaned_anonymous_user', { anon_user_id: previousAnonUserId });
              console.log("[CloudSyncGate] Cleaned up orphaned anonymous user:", previousAnonUserId);
            } catch (err) {
              console.warn("[CloudSyncGate] Failed to cleanup orphaned anonymous user:", err);
            }
          }
        }, 0);
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce push when data changes (only in cloud, already initialized)
  useEffect(() => {
    const mode = useAppStore.getState().cloudMode;
    if (mode !== "cloud" || !initializedRef.current) return;

    async function checkNetworkAndPush() {
      if (!(await getNetworkStatus())) {
        setCloudStatus("offline");
        setPendingSnapshot(getSnapshot());
        return;
      }

      if (debounceRef.current) window.clearTimeout(debounceRef.current);

      debounceRef.current = window.setTimeout(() => {
        pushNow();
      }, 1200);
    }

    checkNetworkAndPush();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeSeen, security]);

  return null;
}
