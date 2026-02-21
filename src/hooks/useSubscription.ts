import { useMemo } from 'react';
import { useAppStore } from '@/state/app.store';
import type { SubscriptionState } from '@/types/app.types';
import { logger } from '@/shared/utils/logger';

type SubscriptionInfo = {
  isPro: boolean;
  isTrialing: boolean;
  trialEndsAt: string | null;
  subscriptionType: SubscriptionState['type'] | 'free';
  subscription: SubscriptionState | null;
};

function computeIsPro(sub: SubscriptionState | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status === 'active') return true;
  if (sub.status === 'trialing') {
    if (!sub.trialEndsAt) return false;
    return new Date(sub.trialEndsAt) > new Date();
  }
  return false;
}

export function useSubscription(): SubscriptionInfo {
  const subscription = useAppStore((s) => s.subscription);

  return useMemo(() => {
    const isPro = computeIsPro(subscription);
    const isTrialing = subscription?.status === 'trialing' && isPro;
    const trialEndsAt = subscription?.trialEndsAt ?? null;
    const subscriptionType = subscription?.type ?? 'free';

    logger.debug('useSubscription', 'subscription:', subscription);
    logger.debug('useSubscription', 'isPro:', isPro);
    logger.debug('useSubscription', 'isTrialing:', isTrialing);
    logger.debug('useSubscription', 'subscriptionType:', subscriptionType);

    return {
      isPro,
      isTrialing,
      trialEndsAt,
      subscriptionType,
      subscription: subscription ?? null,
    };
  }, [subscription]);
}
