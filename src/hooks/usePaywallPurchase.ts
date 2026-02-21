/**
 * usePaywallPurchase
 * Hook compartido para manejar la compra/activación de trial desde el PaywallModal
 *
 * Encapsula toda la lógica de:
 * - Asegurar que RevenueCat esté vinculado al usuario (Purchases.logIn)
 * - Obtener offerings de RevenueCat
 * - Ejecutar la compra (activar trial)
 * - Sincronizar con subscription.service.ts
 * - Cerrar el modal automáticamente
 * - Manejo de errores
 */

import { useState, useCallback } from 'react';
import { useAppStore } from '@/state/app.store';
import type { RevenueCatPackage } from '@/services/revenuecat.service';
import { logger } from '@/shared/utils/logger';

type UsePaywallPurchaseOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function usePaywallPurchase(options?: UsePaywallPurchaseOptions) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleSelectPlan = useCallback(
    async (planId: string) => {
      logger.debug('usePaywallPurchase', 'User selected plan:', planId);
      setIsPurchasing(true);

      try {
        const { purchasePackage, getOfferings } = await import('@/services/revenuecat.service');
        const { isNative } = await import('@/shared/utils/platform');

        // Link RevenueCat to authenticated user BEFORE purchase
        if (isNative()) {
          try {
            const { supabase } = await import('@/lib/supabaseClient');
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              const { Purchases } = await import('@revenuecat/purchases-capacitor');
              await Purchases.logIn({ appUserID: user.id });
              logger.debug('usePaywallPurchase', 'Linked to user:', user.id, 'anonymous:', user.is_anonymous);
            }
          } catch (loginError) {
            logger.warn('usePaywallPurchase', 'Failed to link user (continuing anyway):', loginError);
          }
        }

        // Get offerings
        const offerings = await getOfferings();

        if (!offerings) {
          throw new Error('No offerings available');
        }

        logger.debug('usePaywallPurchase', 'Offerings loaded:', offerings);

        // Find the selected package
        const packageToPurchase = offerings.availablePackages.find(
          (pkg: RevenueCatPackage) => pkg.identifier === planId
        );

        if (!packageToPurchase) {
          throw new Error(`Package ${planId} not found`);
        }

        // Execute purchase (activates 7-day trial)
        const purchaseResult = await purchasePackage(packageToPurchase);
        logger.debug('usePaywallPurchase', 'Trial activated:', purchaseResult);

        // Fetch subscription using new service (RevenueCat → Supabase → localStorage)
        const { getSubscription } = await import('@/services/subscription.service');
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { user } } = await supabase.auth.getUser();

        const subscription = await getSubscription(user?.id ?? null);
        useAppStore.getState().setSubscription(subscription);
        logger.debug('usePaywallPurchase', 'Subscription synced:', subscription?.status);

        // Call success callback if provided
        options?.onSuccess?.();
      } catch (error) {
        logger.error('usePaywallPurchase', 'Purchase failed:', error);
        logger.debug('usePaywallPurchase', 'Error type:', typeof error);
        logger.debug('usePaywallPurchase', 'Error instanceof Error:', error instanceof Error);
        logger.debug('usePaywallPurchase', 'Error.message:', (error as any)?.message);
        logger.debug('usePaywallPurchase', 'Error.errorMessage:', (error as any)?.errorMessage);

        // Call error callback if provided
        const errorObj = error instanceof Error ? error : new Error('Unknown error');
        options?.onError?.(errorObj);

        // Re-throw to let PaywallModal handle UI state
        logger.debug('usePaywallPurchase', 'Re-throwing error for modal to handle');
        throw errorObj;
      } finally {
        setIsPurchasing(false);
      }
    },
    [options]
  );

  return {
    handleSelectPlan,
    isPurchasing,
  };
}
