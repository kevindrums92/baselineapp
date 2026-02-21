// ==================== SUBSCRIPTION TYPES ====================

// All features are now free. Pro only provides: ad-free + unlimited AI batch entry.
export type PaywallTrigger =
  | 'onboarding'
  | 'settings'
  | 'upgrade_prompt'
  | 'batch_entry_limit';

// ==================== PRICING PLANS ====================

export const PRICING_PLANS = {
  monthly: {
    id: 'co.baselineapp.monthly',
    price: 4.99,
    currency: 'USD',
    period: 'month' as const,
    savingsPercent: 0,
    monthlyEquivalent: 4.99,
    badge: null,
  },
  annual: {
    id: 'co.baselineapp.annual',
    price: 34.99,
    currency: 'USD',
    period: 'year' as const,
    savingsPercent: 41,
    monthlyEquivalent: 2.92,
    badge: 'bestValue' as const,
  },
  lifetime: {
    id: 'co.baselineapp.lifetime',
    price: 89.99,
    currency: 'USD',
    period: 'lifetime' as const,
    savingsPercent: null,
    monthlyEquivalent: null,
    badge: null,
  },
} as const;

export type PricingPlanKey = keyof typeof PRICING_PLANS;
export type PricingPlan = (typeof PRICING_PLANS)[PricingPlanKey];

export const TRIAL_PERIOD_DAYS = 7;
