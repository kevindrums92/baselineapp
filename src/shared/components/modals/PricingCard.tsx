import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { PRICING_PLANS } from '@/constants/pricing';
import type { PricingPlanKey } from '@/constants/pricing';

type PricingCardProps = {
  planKey: PricingPlanKey;
  selected: boolean;
  onSelect: (planKey: PricingPlanKey) => void;
};

export default function PricingCard({ planKey, selected, onSelect }: PricingCardProps) {
  const { t } = useTranslation('paywall');
  const plan = PRICING_PLANS[planKey];

  return (
    <button
      type="button"
      onClick={() => onSelect(planKey)}
      className={`relative w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
        selected
          ? 'border-2 border-[#18B7B0] bg-white dark:bg-gray-900 shadow-sm'
          : 'border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
      }`}
    >
      {/* Badge */}
      {plan.badge && (
        <span className="absolute -top-3 left-4 rounded-full bg-[#18B7B0] px-3 py-0.5 text-xs font-semibold text-white">
          {t(`badges.${plan.badge}`)}
        </span>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Plan name */}
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {t(`plans.${planKey}`)}
          </p>

          {/* Price */}
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              ${plan.price}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {plan.period === 'month' && t('plans.perMonth')}
              {plan.period === 'year' && t('plans.perYear')}
              {plan.period === 'lifetime' && t('plans.oneTime')}
            </span>
          </div>

          {/* Monthly equivalent & savings */}
          {plan.monthlyEquivalent && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {t('equivalentMonthly', { price: plan.monthlyEquivalent.toFixed(2) })}
            </p>
          )}
          {plan.savingsPercent ? (
            <p className="mt-0.5 text-xs font-medium text-[#18B7B0]">
              {t('savings', { percent: plan.savingsPercent })}
            </p>
          ) : null}
        </div>

        {/* Selection indicator */}
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
            selected ? 'bg-[#18B7B0]' : 'border-2 border-gray-300 dark:border-gray-600'
          }`}
        >
          {selected && <Check size={14} className="text-white" strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}
