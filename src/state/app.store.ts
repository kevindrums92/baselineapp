import { create } from "zustand";
import type {
  AppState,
  SecuritySettings,
  SubscriptionState,
} from "@/types/app.types";
import { TRIAL_PERIOD_DAYS } from "@/constants/pricing";
import { loadState, saveState } from "@/services/storage.service";
import { currentMonthKey } from "@/services/dates.service";

type CloudStatus = "idle" | "syncing" | "ok" | "offline" | "error";
type CloudMode = "guest" | "cloud";

type AppStore = AppState & {
  // UI
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (monthKey: string) => void;

  // Auth state (single source of truth)
  user: {
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
    provider: 'google' | 'apple' | 'guest' | null;
  };
  setUser: (user: AppStore['user']) => void;

  // Landing
  welcomeSeen: boolean;
  setWelcomeSeen: (v: boolean) => void;

  // Cloud
  cloudMode: CloudMode;
  cloudStatus: CloudStatus;
  setCloudMode: (m: CloudMode) => void;
  setCloudStatus: (s: CloudStatus) => void;
  setCloudSyncReady: () => void;

  // Security
  toggleBiometricAuth: () => void;
  updateLastAuthTimestamp: () => void;
  getBiometricSettings: () => SecuritySettings;

  // Session expired detection (in-memory only)
  sessionExpired: boolean;
  setSessionExpired: (v: boolean) => void;

  // Subscription (in-memory only, NOT part of AppState persistence)
  subscription: SubscriptionState | null;
  setSubscription: (sub: SubscriptionState | null) => void;
  startTrial: () => void;
  clearSubscription: () => void;
  syncWithRevenueCat: () => Promise<void>;

  // Sync helpers
  getSnapshot: () => AppState;
  replaceAllData: (next: AppState) => void;
};

const defaultState: AppState = {
  schemaVersion: 1,
  security: { biometricEnabled: false },
};

export const useAppStore = create<AppStore>((set, get) => {
  const hydrated = loadState() ?? defaultState;

  return {
    // ---------- STATE ----------
    ...hydrated,
    subscription: null, // In-memory only, loaded by RevenueCatProvider
    sessionExpired: false,
    setSessionExpired: (v) => set({ sessionExpired: v }),

    cloudMode: "guest",
    cloudStatus: "idle",
    setCloudMode: (m) => set({ cloudMode: m }),
    setCloudStatus: (s) => set({ cloudStatus: s }),

    // Landing flag
    welcomeSeen: (() => {
      try { return localStorage.getItem("app.welcomeSeen.v1") === "1"; }
      catch { return false; }
    })(),
    setWelcomeSeen: (v) => {
      try {
        if (v) localStorage.setItem("app.welcomeSeen.v1", "1");
        else localStorage.removeItem("app.welcomeSeen.v1");
      } catch { }
      set({ welcomeSeen: v });
      saveState(get());
    },

    // UI month
    selectedMonth: currentMonthKey(),
    setSelectedMonth: (monthKey) => set({ selectedMonth: monthKey }),

    // Auth state
    user: {
      email: null,
      name: null,
      avatarUrl: null,
      provider: null,
    },
    setUser: (user) => set({ user }),

    // ---------- SYNC HELPERS ----------
    getSnapshot: () => {
      const s = get();
      return {
        schemaVersion: 1 as const,
        welcomeSeen: s.welcomeSeen,
        security: s.security,
      };
    },

    setCloudSyncReady: () => {
      set({ cloudSyncReady: true });
    },

    // Security
    toggleBiometricAuth: () => {
      set((state) => {
        const next: AppState = {
          ...state,
          schemaVersion: 1,
          security: {
            biometricEnabled: !(state.security?.biometricEnabled ?? false),
            lastAuthTimestamp: state.security?.lastAuthTimestamp,
          },
        };
        saveState(next);
        return next;
      });
    },

    updateLastAuthTimestamp: () => {
      set((state) => {
        const next: AppState = {
          ...state,
          schemaVersion: 1,
          security: {
            biometricEnabled: state.security?.biometricEnabled ?? false,
            lastAuthTimestamp: Date.now(),
          },
        };
        saveState(next);
        return next;
      });
    },

    getBiometricSettings: () => {
      const state = get();
      return state.security ?? { biometricEnabled: false };
    },

    replaceAllData: (data) => {
      const normalizedData = { ...data, schemaVersion: 1 as const };
      saveState(normalizedData);

      // Sync onboarding flags to localStorage
      if (data.welcomeSeen !== undefined) {
        try {
          if (data.welcomeSeen) localStorage.setItem("app.welcomeSeen.v1", "1");
          else localStorage.removeItem("app.welcomeSeen.v1");
        } catch { }
      }

      set({
        schemaVersion: 1,
        welcomeSeen: data.welcomeSeen ?? false,
        security: data.security ?? { biometricEnabled: false },
      });
    },

    // ===== SUBSCRIPTION =====
    setSubscription: (sub) => {
      console.log('[Store] setSubscription called (in-memory only):', sub);
      set({ subscription: sub });
    },

    startTrial: () => {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000);

      const sub: SubscriptionState = {
        status: 'trialing',
        type: 'trial',
        trialEndsAt: trialEnd.toISOString(),
        expiresAt: trialEnd.toISOString(),
        lastChecked: now.toISOString(),
      };

      get().setSubscription(sub);
    },

    clearSubscription: () => {
      get().setSubscription(null);
    },

    syncWithRevenueCat: async () => {
      try {
        const {
          getCustomerInfo,
          hasProEntitlement,
          isInTrialPeriod,
          getTrialEndDate,
          getSubscriptionType,
        } = await import('@/services/revenuecat.service');

        const customerInfo = await getCustomerInfo();
        const isPro = hasProEntitlement(customerInfo);

        if (!isPro) {
          get().setSubscription(null);
          return;
        }

        const isTrialing = isInTrialPeriod(customerInfo);
        const trialEndDate = getTrialEndDate(customerInfo);
        const subType = getSubscriptionType(customerInfo);

        const sub: SubscriptionState = {
          status: isTrialing ? 'trialing' : 'active',
          type: subType,
          trialEndsAt: trialEndDate?.toISOString() ?? null,
          expiresAt: customerInfo.latestExpirationDate,
          lastChecked: new Date().toISOString(),
        };

        get().setSubscription(sub);
      } catch (error) {
        console.error('[Store] Failed to sync with RevenueCat:', error);
      }
    },
  };
});
