/**
 * AdMob Ads Service
 * Manages interstitial ad frequency, session tracking, and display logic
 */

import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions, AdMobRewardItem } from '@capacitor-community/admob';
import type { AdPlacement, AdSession, AdFrequencyConfig, AdConfig } from '@/types/ads.types';

const AD_SESSION_KEY = 'app.adSession.v1';

/**
 * Default frequency configuration
 * - Min 3 minutes between ads
 * - Max 5 ads per session
 * - 2 minute initial delay
 * - Show ad every 3 actions
 */
const DEFAULT_FREQUENCY_CONFIG: AdFrequencyConfig = {
  minTimeBetweenAds: 3 * 60 * 1000, // 3 minutes in ms
  maxAdsPerSession: 5,
  initialDelay: 2 * 60 * 1000, // 2 minutes in ms
  actionsBeforeAd: 3,
};

/**
 * Google's official test ad unit IDs
 * These always serve test ads regardless of app publication status.
 * https://developers.google.com/admob/ios/test-ads
 * https://developers.google.com/admob/android/test-ads
 */
const TEST_AD_IDS: Record<'ios' | 'android', { interstitial: string; rewarded: string; banner: string }> = {
  ios: {
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    banner: 'ca-app-pub-3940256099942544/2934735716',
  },
  android: {
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    banner: 'ca-app-pub-3940256099942544/6300978111',
  },
};

/**
 * AdMob configuration (iOS and Android)
 * When useTestAds is true, Google's demo ad unit IDs are used instead of production IDs.
 * Set useTestAds to false before submitting to App Store / Play Store.
 */
const USE_TEST_ADS = false;

const AD_CONFIG: Record<'ios' | 'android', AdConfig> = {
  ios: {
    appId: 'ca-app-pub-1664291794679786~7314308108',
    interstitialAdUnitId: USE_TEST_ADS ? TEST_AD_IDS.ios.interstitial : 'ca-app-pub-1664291794679786/7310438677',
    rewardedAdUnitId: USE_TEST_ADS ? TEST_AD_IDS.ios.rewarded : 'ca-app-pub-1664291794679786/4381023000',
    bannerAdUnitId: USE_TEST_ADS ? TEST_AD_IDS.ios.banner : 'ca-app-pub-1664291794679786/4688144765',
    useTestAds: USE_TEST_ADS,
  },
  android: {
    appId: 'ca-app-pub-1664291794679786~3525498108',
    interstitialAdUnitId: USE_TEST_ADS ? TEST_AD_IDS.android.interstitial : 'ca-app-pub-1664291794679786/3166405455',
    rewardedAdUnitId: USE_TEST_ADS ? TEST_AD_IDS.android.rewarded : 'ca-app-pub-1664291794679786/1853323788',
    bannerAdUnitId: USE_TEST_ADS ? TEST_AD_IDS.android.banner : 'ca-app-pub-1664291794679786/4688144765',
    useTestAds: USE_TEST_ADS,
  },
};

let frequencyConfig: AdFrequencyConfig = DEFAULT_FREQUENCY_CONFIG;
let currentSession: AdSession | null = null;
let rewardedVideoLoaded = false;
let isBannerVisible = false;

/**
 * Request App Tracking Transparency authorization (iOS 14.5+)
 * Must be called BEFORE AdMob.initialize() so AdMob knows the consent status.
 * On Android/web this is a no-op.
 */
export async function requestTrackingIfNeeded(): Promise<void> {
  try {
    const { status } = await AdMob.trackingAuthorizationStatus();

    if (status === 'notDetermined') {
      await AdMob.requestTrackingAuthorization();
    }

    const finalStatus = await AdMob.trackingAuthorizationStatus();
    console.log('[AdMob] Tracking authorization status:', finalStatus.status);
  } catch {
    // On Android/web, ATT is not available — that's expected
    console.log('[AdMob] Tracking authorization not available (non-iOS)');
  }
}

/**
 * Initialize AdMob SDK
 * Must be called on app startup (before showing ads)
 */
export async function initializeAdMob(): Promise<void> {
  try {
    const platform = getPlatform();
    const config = AD_CONFIG[platform];

    await AdMob.initialize({
      testingDevices: config.useTestAds ? ['b4325c96d038416804e1035b0c62f193'] : undefined,
      initializeForTesting: config.useTestAds,
    });

    console.log('[AdMob] SDK initialized successfully');
  } catch (error) {
    console.error('[AdMob] Failed to initialize:', error);
  }
}

/**
 * Get current platform (iOS or Android)
 */
function getPlatform(): 'ios' | 'android' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'ios';
  }
  return 'android';
}

/**
 * Get current ad session from localStorage
 */
function getSession(): AdSession {
  if (currentSession) return currentSession;

  try {
    const stored = localStorage.getItem(AD_SESSION_KEY);
    if (stored) {
      currentSession = JSON.parse(stored);
      return currentSession!;
    }
  } catch {
    // Invalid JSON, create new session
  }

  // Create new session
  currentSession = {
    startedAt: Date.now(),
    lastAdShown: 0,
    adsShownCount: 0,
    actionCount: 0,
  };

  saveSession();
  return currentSession;
}

/**
 * Save session to localStorage
 */
function saveSession(): void {
  if (!currentSession) return;
  try {
    localStorage.setItem(AD_SESSION_KEY, JSON.stringify(currentSession));
  } catch {
    console.warn('[AdMob] Failed to save session');
  }
}

/**
 * Reset session (call this on app startup or after 24h)
 */
export function resetSession(): void {
  currentSession = {
    startedAt: Date.now(),
    lastAdShown: 0,
    adsShownCount: 0,
    actionCount: 0,
  };
  saveSession();
  console.log('[AdMob] Session reset');
}

/**
 * Update frequency configuration
 */
export function setFrequencyConfig(config: Partial<AdFrequencyConfig>): void {
  frequencyConfig = { ...frequencyConfig, ...config };
  console.log('[AdMob] Frequency config updated:', frequencyConfig);
}

/**
 * Check if ad can be shown based on frequency rules
 */
function canShowAd(placement: AdPlacement): boolean {
  const session = getSession();
  const now = Date.now();

  // Check if session just started (initial delay)
  const timeSinceSessionStart = now - session.startedAt;
  if (timeSinceSessionStart < frequencyConfig.initialDelay) {
    console.log('[AdMob] Too soon since session start:', timeSinceSessionStart);
    return false;
  }

  // Check max ads per session
  if (session.adsShownCount >= frequencyConfig.maxAdsPerSession) {
    console.log('[AdMob] Max ads per session reached:', session.adsShownCount);
    return false;
  }

  // Check minimum time between ads
  const timeSinceLastAd = now - session.lastAdShown;
  if (session.lastAdShown > 0 && timeSinceLastAd < frequencyConfig.minTimeBetweenAds) {
    console.log('[AdMob] Too soon since last ad:', timeSinceLastAd);
    return false;
  }

  // Check action count
  if (session.actionCount < frequencyConfig.actionsBeforeAd) {
    console.log('[AdMob] Not enough actions:', session.actionCount);
    return false;
  }

  console.log('[AdMob] Ad can be shown at placement:', placement);
  return true;
}

/**
 * Increment action count (call after user performs an action)
 */
export function trackAction(): void {
  const session = getSession();
  session.actionCount++;
  saveSession();
  console.log('[AdMob] Action tracked, count:', session.actionCount);
}

/**
 * Prepare interstitial ad (preload)
 */
export async function prepareInterstitial(): Promise<void> {
  try {
    const platform = getPlatform();
    const config = AD_CONFIG[platform];

    await AdMob.prepareInterstitial({
      adId: config.interstitialAdUnitId,
    });

    console.log('[AdMob] Interstitial ad prepared');
  } catch (error) {
    console.error('[AdMob] Failed to prepare interstitial:', error);
  }
}

/**
 * Show interstitial ad if frequency rules allow
 * @param placement - Where the ad is being shown
 * @returns true if ad was shown, false otherwise
 */
export async function maybeShowInterstitial(placement: AdPlacement): Promise<boolean> {
  if (!canShowAd(placement)) {
    return false;
  }

  try {
    // Show the ad
    await AdMob.showInterstitial();

    // Update session
    const session = getSession();
    session.lastAdShown = Date.now();
    session.adsShownCount++;
    session.actionCount = 0; // Reset action count
    saveSession();

    console.log('[AdMob] Interstitial ad shown at placement:', placement);

    // Preload next ad
    prepareInterstitial();

    return true;
  } catch (error) {
    console.error('[AdMob] Failed to show interstitial:', error);
    return false;
  }
}

/**
 * Prepare rewarded video ad (preload)
 */
export async function prepareRewardedVideo(): Promise<void> {
  try {
    const platform = getPlatform();
    const config = AD_CONFIG[platform];

    await AdMob.prepareRewardVideoAd({
      adId: config.rewardedAdUnitId,
    });

    rewardedVideoLoaded = true;
    console.log('[AdMob] Rewarded video ad prepared');
  } catch (error) {
    rewardedVideoLoaded = false;
    console.error('[AdMob] Failed to prepare rewarded video:', error);
  }
}

/**
 * Check if a rewarded video ad is loaded and ready to show.
 * Use this to decide whether to show the "watch ad" button.
 */
export function isRewardedVideoReady(): boolean {
  return rewardedVideoLoaded;
}

/**
 * Show rewarded video ad (always allowed, user-initiated)
 * @returns Reward item if user completed the video, null if user dismissed
 * @throws Error if ad failed to load/show (no inventory, not ready, network error)
 */
export async function showRewardedVideo(): Promise<AdMobRewardItem | null> {
  rewardedVideoLoaded = false;

  const result = await AdMob.showRewardVideoAd();

  console.log('[AdMob] Rewarded video result:', result);

  // Preload next rewarded video
  prepareRewardedVideo();

  return result as AdMobRewardItem | null;
}

/**
 * Show banner ad at bottom of screen.
 * Includes deduplication — calling when already showing is a no-op.
 */
export async function showBanner(): Promise<void> {
  if (isBannerVisible) return;

  try {
    const platform = getPlatform();
    const config = AD_CONFIG[platform];

    const options: BannerAdOptions = {
      adId: config.bannerAdUnitId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: config.useTestAds,
    };

    await AdMob.showBanner(options);
    isBannerVisible = true;
    console.log('[AdMob] Banner ad shown');
  } catch (error) {
    console.error('[AdMob] Failed to show banner:', error);
  }
}

/**
 * Hide banner ad (keeps it in memory for fast resume)
 */
export async function hideBanner(): Promise<void> {
  if (!isBannerVisible) return;

  try {
    await AdMob.hideBanner();
    isBannerVisible = false;
    console.log('[AdMob] Banner ad hidden');
  } catch (error) {
    console.error('[AdMob] Failed to hide banner:', error);
  }
}

/**
 * Remove banner ad completely (frees memory)
 */
export async function removeBanner(): Promise<void> {
  try {
    await AdMob.removeBanner();
    isBannerVisible = false;
    console.log('[AdMob] Banner ad removed');
  } catch (error) {
    console.error('[AdMob] Failed to remove banner:', error);
  }
}

/**
 * Get current session stats (for debugging/analytics)
 */
export function getSessionStats(): AdSession {
  return { ...getSession() };
}

/**
 * Check if session should be reset (after 24 hours)
 * Call this on app startup
 */
export function checkAndResetSession(): void {
  const session = getSession();
  const now = Date.now();
  const sessionAge = now - session.startedAt;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (sessionAge > ONE_DAY) {
    console.log('[AdMob] Session expired, resetting');
    resetSession();
  }
}
