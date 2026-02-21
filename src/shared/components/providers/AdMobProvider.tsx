import { useEffect } from 'react';
import { requestTrackingIfNeeded, initializeAdMob, checkAndResetSession, prepareInterstitial, prepareRewardedVideo } from '@/services/ads.service';
import { useSubscription } from '@/hooks/useSubscription';

/**
 * AdMobProvider
 * Initializes AdMob SDK on app startup and manages ad session lifecycle
 */
export default function AdMobProvider({ children }: { children: React.ReactNode }) {
  const { isPro } = useSubscription();

  useEffect(() => {
    // Only initialize ads for free users
    if (isPro) {
      console.log('[AdMobProvider] User is Pro, skipping ad initialization');
      return;
    }

    async function initAds() {
      try {
        console.log('[AdMobProvider] Initializing AdMob SDK...');

        // Request ATT authorization before initializing AdMob (iOS 14.5+)
        await requestTrackingIfNeeded();

        // Initialize AdMob SDK (reads ATT status automatically)
        await initializeAdMob();

        // Check and reset session if needed (after 24 hours)
        checkAndResetSession();

        // Preload first interstitial ad
        await prepareInterstitial();

        // Preload rewarded video ad (for batch entry free tier)
        await prepareRewardedVideo();

        console.log('[AdMobProvider] AdMob SDK initialized successfully');
      } catch (error) {
        console.error('[AdMobProvider] Failed to initialize AdMob:', error);
      }
    }

    initAds();
  }, [isPro]);

  return <>{children}</>;
}
