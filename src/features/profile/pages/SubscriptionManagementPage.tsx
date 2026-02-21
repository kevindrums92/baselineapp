import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaywallPurchase } from "@/hooks/usePaywallPurchase";
import { PRICING_PLANS } from "@/constants/pricing";
import { supabase } from "@/lib/supabaseClient";
import { useAppStore } from "@/state/app.store";
import {
  Crown,
  Calendar,
  DollarSign,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Infinity as InfinityIcon,
  Shield,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { isNative } from "@/shared/utils/platform";
import { openUrl } from "@/shared/utils/browser.utils";
import PaywallModal from "@/shared/components/modals/PaywallModal";
import PageHeader from "@/shared/components/layout/PageHeader";

export default function SubscriptionManagementPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("profile");
  const { isPro, isTrialing, subscription, trialEndsAt } = useSubscription();
  const user = useAppStore((s) => s.user);
  const isAnonymous = !user.email;
  const [showPaywall, setShowPaywall] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { handleSelectPlan } = usePaywallPurchase({
    onSuccess: () => {
      setShowPaywall(false);
      setRestoreMessage(null); // Clear any previous errors
    },
    onError: () => setRestoreMessage({ type: 'error', text: t("subscription.messages.purchaseError") }),
  });

  // Determine current plan details
  const currentPlan = subscription?.type || 'free';
  const isLifetime = currentPlan === 'lifetime';
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const expiresAt = subscription?.expiresAt;
  const isPromo = subscription?.isPromo ?? false;

  // Get plan pricing info
  const planInfo = currentPlan === 'monthly' ? PRICING_PLANS.monthly
    : currentPlan === 'annual' ? PRICING_PLANS.annual
    : currentPlan === 'lifetime' ? PRICING_PLANS.lifetime
    : null;

  // Format price with currency
  const formatPrice = (price: number, currency: string) => {
    return `$${price.toFixed(2)} ${currency}`;
  };

  // Calculate annual savings
  const annualSavings = PRICING_PLANS.monthly.price * 12 - PRICING_PLANS.annual.price;

  // Calculate trial days remaining
  const trialDaysRemaining = trialEndsAt ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  // Format renewal date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Handle restore purchases
  async function handleRestorePurchases() {
    if (!isNative()) {
      setRestoreMessage({ type: 'error', text: t("subscription.messages.onlyMobile") });
      return;
    }

    setRestoring(true);
    setRestoreMessage(null);

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      console.log('[SubscriptionManagement] Restoring purchases...');

      const { customerInfo } = await Purchases.restorePurchases();
      console.log('[SubscriptionManagement] Restore result:', customerInfo);

      const entitlements = customerInfo.entitlements.active['pro'];
      if (entitlements && entitlements.isActive) {
        setRestoreMessage({ type: 'success', text: t("subscription.messages.purchaseRestored") });

        // Refresh subscription from service
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { refreshSubscription } = await import('@/services/subscription.service');
          await refreshSubscription(user.id);
        }
      } else {
        setRestoreMessage({ type: 'error', text: t("subscription.messages.noPurchasesFound") });
      }
    } catch (error) {
      console.error('[SubscriptionManagement] Restore failed:', error);
      setRestoreMessage({ type: 'error', text: t("subscription.messages.restoreError") });
    } finally {
      setRestoring(false);
    }
  }

  // Handle manage in App Store
  async function handleManageInAppStore() {
    if (isNative()) {
      // Open App Store subscriptions management (in-app browser)
      await openUrl("https://apps.apple.com/account/subscriptions");
    } else {
      setRestoreMessage({ type: 'error', text: t("subscription.messages.manageOnlyMobile") });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader title={t("subscription.title")} />

      {/* Content */}
      <div
        className="flex-1 px-4 pt-6 pb-20"
      >
        {/* Current Plan Card */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium opacity-90 mb-1">{t("subscription.currentPlan")}</p>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                {currentPlan === 'free' && t("subscription.plans.free")}
                {currentPlan === 'monthly' && t("subscription.plans.monthly")}
                {currentPlan === 'annual' && t("subscription.plans.annual")}
                {currentPlan === 'lifetime' && t("subscription.plans.lifetime")}
                {isPro && <Crown size={28} />}
              </h2>
            </div>
            {isTrialing && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wide">
                <Sparkles size={14} />
                {t("subscription.status.trial")}
              </span>
            )}
          </div>

          {/* Free plan details */}
          {currentPlan === 'free' && !isTrialing && (
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium opacity-90">
                {t("subscription.freePlanIncludes")}:
              </p>
              <ul className="text-xs space-y-1.5 opacity-90">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-white" />
                  {t("subscription.freePlanFeature1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-white" />
                  {t("subscription.freePlanFeature2")}
                </li>
              </ul>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">
              {isActive ? t("subscription.status.active") : t("subscription.status.inactive")}
            </span>
          </div>

          {/* Trial info */}
          {isTrialing && trialDaysRemaining > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} />
              <span className="text-sm">
                {t("subscription.trialDaysRemaining", { count: trialDaysRemaining })}
              </span>
            </div>
          )}

          {/* Renewal / Expiration date */}
          {expiresAt && !isLifetime && (
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} />
              <span className="text-sm">
                {isTrialing ? t("subscription.trialEnds") : isPromo ? t("subscription.expires") : t("subscription.renews")}: {formatDate(expiresAt)}
              </span>
            </div>
          )}

          {/* Lifetime badge */}
          {currentPlan === 'lifetime' && (
            <div className="flex items-center gap-2 mb-2">
              <InfinityIcon size={18} />
              <span className="text-sm font-medium">
                {t("subscription.lifetimeAccess")}
              </span>
            </div>
          )}

          {/* Price - hide for promo/gift subs */}
          {planInfo && !isPromo && (
            <div className="flex items-center gap-2">
              <DollarSign size={18} />
              <span className="text-sm">
                {formatPrice(planInfo.price, planInfo.currency)} {currentPlan === 'monthly' ? t("subscription.perMonth") : currentPlan === 'annual' ? t("subscription.perYear") : t("subscription.oneTimePayment")}
              </span>
            </div>
          )}
        </div>

        {/* Login Banner - Show for anonymous Pro/trial users */}
        {isAnonymous && (isPro || isTrialing) && (
          <button
            type="button"
            onClick={() => navigate('/onboarding/login')}
            className="mb-6 w-full rounded-2xl p-5 shadow-sm overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800 text-left transition active:scale-[0.99]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 dark:bg-amber-500/30">
                <Shield size={22} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1">
                  {t("subscription.loginBanner.title")}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                  {t("subscription.loginBanner.subtitle")}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {t("subscription.loginBanner.cta")}
                  <ChevronRight size={16} />
                </span>
              </div>
            </div>
          </button>
        )}

        {/* Upgrade Options - Only show if not lifetime */}
        {!isLifetime && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1">
              {t("subscription.upgradePlan")}
            </h3>
            <div className="space-y-3">
              {/* Monthly Plan - Show if free or annual */}
              {(currentPlan === 'free' || currentPlan === 'annual') && (
                <button
                  type="button"
                  onClick={() => {
                    setRestoreMessage(null); // Clear any previous messages
                    setShowPaywall(true);
                  }}
                  className="w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-50">{t("subscription.monthlyPlan")}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatPrice(PRICING_PLANS.monthly.price, PRICING_PLANS.monthly.currency)}{t("subscription.perMonth")}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("subscription.flexibleMonthlyBilling")}
                      </p>
                    </div>
                    <ChevronLeft size={20} className="text-gray-400 rotate-180" />
                  </div>
                </button>
              )}

              {/* Annual Plan - Show if monthly or free */}
              {(currentPlan === 'free' || currentPlan === 'monthly') && (
                <button
                  type="button"
                  onClick={() => {
                    setRestoreMessage(null); // Clear any previous messages
                    setShowPaywall(true);
                  }}
                  className="w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-50">{t("subscription.annualPlan")}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatPrice(PRICING_PLANS.annual.price, PRICING_PLANS.annual.currency)}{t("subscription.perYear")}</p>
                      {(currentPlan === 'monthly' || currentPlan === 'free') && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                          {t("subscription.savingsPerYear", { amount: annualSavings.toFixed(2) })}
                        </p>
                      )}
                    </div>
                    <ChevronLeft size={20} className="text-gray-400 rotate-180" />
                  </div>
                </button>
              )}

              {/* Lifetime Plan - Show if not lifetime */}
              {!isLifetime && (
                <button
                  type="button"
                  onClick={() => {
                    setRestoreMessage(null); // Clear any previous messages
                    setShowPaywall(true);
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 shadow-sm border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-50">{t("subscription.lifetimePlan")}</p>
                        <Crown size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatPrice(PRICING_PLANS.lifetime.price, PRICING_PLANS.lifetime.currency)} {t("subscription.oneTimePayment")}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        {t("subscription.unlimitedLifetimeAccess")}
                      </p>
                    </div>
                    <ChevronLeft size={20} className="text-emerald-600 dark:text-emerald-400 rotate-180" />
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1">
            {t("subscription.actions")}
          </h3>
          <div className="space-y-3">
            {/* Restore Purchases */}
            <button
              type="button"
              onClick={handleRestorePurchases}
              disabled={restoring}
              className="w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw size={20} className={`text-gray-600 dark:text-gray-400 ${restoring ? 'animate-spin' : ''}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {t("subscription.restorePurchases")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("subscription.restorePurchasesSubtitle")}
                    </p>
                  </div>
                </div>
              </div>
            </button>

            {/* Manage in App Store - hide for promo/gift subs (no store subscription to manage) */}
            {isPro && !isPromo && (
              <button
                type="button"
                onClick={handleManageInAppStore}
                className="w-full rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExternalLink size={20} className="text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">
                        {t("subscription.manageInAppStore")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("subscription.manageInAppStoreSubtitle")}
                      </p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-gray-400 rotate-180" />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Restore message */}
        {restoreMessage && (
          <div className={`rounded-xl p-4 ${
            restoreMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm ${
              restoreMessage.type === 'success'
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {restoreMessage.text}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 rounded-xl bg-gray-100 dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <strong>{t("subscription.info.note")}</strong> {t("subscription.info.appleManagement")}
          </p>
        </div>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="upgrade_prompt"
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}
