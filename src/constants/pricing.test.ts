/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { PRICING_PLANS, TRIAL_PERIOD_DAYS } from './pricing';
import type { PaywallTrigger, PricingPlanKey } from './pricing';

describe('pricing constants', () => {
  describe('PRICING_PLANS', () => {
    it('should have exactly 3 plans: monthly, annual, lifetime', () => {
      const keys = Object.keys(PRICING_PLANS);
      expect(keys).toHaveLength(3);
      expect(keys).toContain('monthly');
      expect(keys).toContain('annual');
      expect(keys).toContain('lifetime');
    });

    it('each plan should have required fields', () => {
      for (const key of Object.keys(PRICING_PLANS) as PricingPlanKey[]) {
        const plan = PRICING_PLANS[key];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('price');
        expect(plan).toHaveProperty('currency', 'USD');
        expect(plan).toHaveProperty('period');
        expect(typeof plan.price).toBe('number');
        expect(plan.price).toBeGreaterThan(0);
      }
    });

    it('annual plan should be cheaper per month than monthly', () => {
      expect(PRICING_PLANS.annual.monthlyEquivalent).toBeLessThan(
        PRICING_PLANS.monthly.monthlyEquivalent
      );
    });
  });

  describe('TRIAL_PERIOD_DAYS', () => {
    it('should be 7 days', () => {
      expect(TRIAL_PERIOD_DAYS).toBe(7);
    });
  });

  describe('removed exports', () => {
    it('should NOT export ProFeature, FREE_TIER_LIMITS, etc.', async () => {
      const pricingModule = await import('./pricing');
      const keys = Object.keys(pricingModule);
      expect(keys).not.toContain('ProFeature');
      expect(keys).not.toContain('FREE_TIER_LIMITS');
      expect(keys).not.toContain('COUNT_LIMITED_FEATURES');
      expect(keys).not.toContain('BOOLEAN_PRO_FEATURES');
    });
  });

  describe('PaywallTrigger type', () => {
    it('should accept valid triggers', () => {
      const validTriggers: PaywallTrigger[] = [
        'onboarding',
        'settings',
        'upgrade_prompt',
        'batch_entry_limit',
      ];
      // If this compiles, the type is correct
      expect(validTriggers).toHaveLength(4);
    });
  });
});
