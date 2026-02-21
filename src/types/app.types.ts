// ==================== SECURITY ====================

export type SecuritySettings = {
  biometricEnabled: boolean;
  lastAuthTimestamp?: number;
};

// ==================== SUBSCRIPTION ====================

export type SubscriptionPlanStatus = 'free' | 'trialing' | 'active' | 'expired' | 'cancelled';

export type SubscriptionPlanType = 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime';

export type SubscriptionState = {
  status: SubscriptionPlanStatus;
  type: SubscriptionPlanType;
  trialEndsAt: string | null;    // ISO 8601
  expiresAt: string | null;      // ISO 8601
  lastChecked: string;           // ISO 8601
  isPromo?: boolean;             // true for gift/promo subs (no App Store transaction)
};

// ==================== STATE ====================

export type AppState = {
  schemaVersion: 1;
  // Onboarding flags
  welcomeSeen?: boolean;
  // Cloud sync
  cloudSyncReady?: boolean;
  // Security
  security?: SecuritySettings;
};
