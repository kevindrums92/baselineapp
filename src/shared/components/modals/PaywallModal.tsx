import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Crown } from 'lucide-react';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import PricingCard from './PricingCard';
import type { PricingPlanKey, PaywallTrigger } from '@/constants/pricing';
import { openLegalPage } from '@/shared/utils/browser.utils';

type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
  trigger: PaywallTrigger;
  onSelectPlan?: (planId: string) => void;
};

const BENEFIT_KEYS = [
  'adFree',
  'aiBatchEntry',
] as const;

export default function PaywallModal({ open, onClose, trigger, onSelectPlan }: PaywallModalProps) {
  const { t, i18n } = useTranslation('paywall');
  const [selectedPlan, setSelectedPlan] = useState<PricingPlanKey>('annual');
  const [isVisible, setIsVisible] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
      setIsPurchasing(false);
      setError(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const subtitleKey = `subtitle.${trigger}` as const;

  async function handleContinue() {
    if (isPurchasing || !onSelectPlan) return;

    setIsPurchasing(true);
    setError(null);
    try {
      await onSelectPlan(selectedPlan);
      onClose();
    } catch (err: any) {
      console.error('[PaywallModal] Purchase failed:', err);
      const errorMessage = err?.message || err?.errorMessage || 'Purchase failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  }

  async function handleRestore() {
    if (isPurchasing) return;

    setIsPurchasing(true);
    setError(null);
    try {
      const { restorePurchases } = await import('@/services/revenuecat.service');
      const { isNative } = await import('@/shared/utils/platform');
      const { useAppStore } = await import('@/state/app.store');

      if (isNative()) {
        try {
          const { supabase } = await import('@/lib/supabaseClient');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { Purchases } = await import('@revenuecat/purchases-capacitor');
            await Purchases.logIn({ appUserID: user.id });
          }
        } catch (loginError) {
          console.debug('[PaywallModal] Failed to link user for restore:', loginError);
        }
      }

      await restorePurchases();

      const { getSubscription } = await import('@/services/subscription.service');
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { user } } = await supabase.auth.getUser();
      const subscription = await getSubscription(user?.id ?? null);
      useAppStore.getState().setSubscription(subscription);

      onClose();
    } catch (err: any) {
      console.error('[PaywallModal] Restore failed:', err);
      setError('No previous purchases found.');
    } finally {
      setIsPurchasing(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[85] transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <FullscreenLayout
        headerRight={
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
            aria-label="Close"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        }
        ctaButton={
          <button
            type="button"
            onClick={handleContinue}
            disabled={isPurchasing}
            className="w-full rounded-2xl bg-gray-900 dark:bg-emerald-500 py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPurchasing ? 'Processing...' : t('cta.startTrial')}
          </button>
        }
      >
        {/* Crown icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#18B7B0]/10">
            <Crown size={32} className="text-[#18B7B0]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
          {t('title')}
        </h1>
        <p className="mb-6 text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {t(subtitleKey)}
        </p>

        {/* Benefits */}
        <div className="mb-6 space-y-3">
          {BENEFIT_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#18B7B0]/10 dark:bg-[#18B7B0]/20">
                <Check size={14} className="text-[#18B7B0]" strokeWidth={3} />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{t(`benefits.${key}`)}</p>
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 mb-4">
            <p className="text-sm text-red-700 dark:text-red-300 text-center font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Pricing cards */}
        <div className="space-y-3 pb-4">
          <PricingCard
            planKey="annual"
            selected={selectedPlan === 'annual'}
            onSelect={(plan) => {
              setSelectedPlan(plan);
              setError(null);
            }}
          />
          <PricingCard
            planKey="monthly"
            selected={selectedPlan === 'monthly'}
            onSelect={(plan) => {
              setSelectedPlan(plan);
              setError(null);
            }}
          />
          <PricingCard
            planKey="lifetime"
            selected={selectedPlan === 'lifetime'}
            onSelect={(plan) => {
              setSelectedPlan(plan);
              setError(null);
            }}
          />
        </div>

        {/* Legal Links */}
        <p className="mt-4 px-2 text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {t('legal.text')}{' '}
          <button
            type="button"
            onClick={() => {
              const locale = i18n.language || 'es';
              openLegalPage('terms', locale);
            }}
            className="text-[#18B7B0] underline"
          >
            {t('legal.terms')}
          </button>
          {' '}{t('legal.and')}{' '}
          <button
            type="button"
            onClick={() => {
              const locale = i18n.language || 'es';
              openLegalPage('privacy', locale);
            }}
            className="text-[#18B7B0] underline"
          >
            {t('legal.privacy')}
          </button>.
        </p>

        {/* Auto-renewal disclaimer */}
        <p className="mt-3 px-2 text-center text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
          {t('legal.autoRenew')}
        </p>

        {/* Restore purchases */}
        <button
          type="button"
          onClick={handleRestore}
          disabled={isPurchasing}
          className="mt-2 w-full py-2 text-center text-xs text-gray-500 dark:text-gray-400 transition-colors active:text-gray-700 dark:active:text-gray-200 disabled:opacity-50"
        >
          {isPurchasing ? 'Restoring...' : t('cta.restore')}
        </button>
      </FullscreenLayout>
    </div>
  );
}
