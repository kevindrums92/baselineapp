/**
 * Ad Types and Configuration
 */

export type AdType = 'interstitial' | 'rewarded' | 'banner' | 'native';

export type AdPlacement =
  | 'after_transaction_create'
  | 'after_transaction_edit'
  | 'after_category_create'
  | 'app_launch'
  | 'stats_view';

export interface AdConfig {
  /** AdMob App ID (different for iOS and Android) */
  appId: string;
  /** Interstitial Ad Unit ID */
  interstitialAdUnitId: string;
  /** Rewarded Video Ad Unit ID */
  rewardedAdUnitId: string;
  /** Banner Ad Unit ID */
  bannerAdUnitId: string;
  /** Whether to use test ads (development) */
  useTestAds: boolean;
}

export interface AdFrequencyConfig {
  /** Minimum time between interstitial ads (milliseconds) */
  minTimeBetweenAds: number;
  /** Maximum ads per session */
  maxAdsPerSession: number;
  /** Delay before showing first ad (milliseconds) */
  initialDelay: number;
  /** Actions count before showing ad */
  actionsBeforeAd: number;
}

export interface AdSession {
  /** Session start time */
  startedAt: number;
  /** Last ad shown timestamp */
  lastAdShown: number;
  /** Number of ads shown in current session */
  adsShownCount: number;
  /** Number of actions performed (transactions, edits, etc.) */
  actionCount: number;
}

export interface AdReward {
  /** Reward type identifier */
  type: 'premium_stats' | 'unlimited_categories' | 'cloud_backup' | 'export' | 'ad_free_24h';
  /** Reward display name */
  name: string;
  /** Reward duration in days (0 for one-time) */
  durationDays: number;
  /** Expiration timestamp (null if not active) */
  expiresAt: number | null;
}

export interface AdError {
  code: string;
  message: string;
  placement?: AdPlacement;
}