/**
 * RevenueCat Service
 *
 * Service layer for handling in-app purchases and subscriptions.
 *
 * MODE: Automatically detects platform:
 * - Web: Uses mock data for development
 * - iOS/Android: Uses real RevenueCat SDK
 */

import { Capacitor } from '@capacitor/core';
import { PRICING_PLANS, TRIAL_PERIOD_DAYS } from '@/constants/pricing';
import { getRevenueCatApiKey } from '@/config/env';

// Conditional import for RevenueCat SDK (only on native platforms)
let Purchases: any = null;

// Platform detection
const isWeb = (): boolean => Capacitor.getPlatform() === 'web';
const FORCE_MOCK = import.meta.env.VITE_FORCE_MOCK_REVENUECAT === 'true';

// ==================== TYPES ====================

export interface RevenueCatOffering {
  identifier: string;
  serverDescription: string;
  availablePackages: RevenueCatPackage[];
}

export interface RevenueCatPackage {
  identifier: string;
  packageType: 'monthly' | 'annual' | 'lifetime' | 'custom';
  product: RevenueCatProduct;
  offeringIdentifier: string;
}

export interface RevenueCatProduct {
  identifier: string;
  description: string;
  title: string;
  price: number;
  priceString: string;
  currencyCode: string;
  introPrice?: {
    price: number;
    priceString: string;
    period: string;
    cycles: number;
  };
}

export interface RevenueCatCustomerInfo {
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate: string | null;
  entitlements: {
    [key: string]: RevenueCatEntitlement;
  };
  originalAppUserId: string;
}

export interface RevenueCatEntitlement {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: 'trial' | 'intro' | 'normal' | 'promotional';
  latestPurchaseDate: string;
  expirationDate: string | null;
  unsubscribeDetectedAt: string | null;
  billingIssueDetectedAt: string | null;
  productIdentifier: string;
}

export interface PurchaseResult {
  customerInfo: RevenueCatCustomerInfo;
  productIdentifier: string;
  transactionDate: string;
}

// ==================== ERROR HANDLING ====================

/**
 * Handle RevenueCat SDK errors with user-friendly messages
 */
function handleRevenueCatError(error: any): Error {
  const message = error?.message || error?.errorMessage || String(error);
  const code = error?.code;

  // Configuration error (code 23)
  if (code === '23' || message.includes('configuration') || message.includes('None of the products registered')) {
    return new Error('La aplicación está en mantenimiento. Por favor intenta más tarde.');
  }

  // Purchase cancelled by user - silent fail
  if (message.includes('PURCHASE_CANCELLED') || message.includes('User cancelled')) {
    return new Error('Compra cancelada');
  }

  // Network errors
  if (message.includes('NETWORK_ERROR') || message.includes('network')) {
    return new Error('Error de conexión. Verifica tu internet e intenta de nuevo.');
  }

  // Purchase not allowed
  if (message.includes('PURCHASE_NOT_ALLOWED') || message.includes('not allowed')) {
    return new Error('Compras no permitidas. Verifica la configuración de tu dispositivo.');
  }

  // Store issues
  if (message.includes('STORE_PROBLEM') || message.includes('store')) {
    return new Error('Problema con la tienda. Intenta más tarde.');
  }

  // Receipt already in use - trigger restore
  if (message.includes('RECEIPT_ALREADY_IN_USE')) {
    return new Error('Esta compra ya está vinculada a otra cuenta. Intenta restaurar compras.');
  }

  // Product not available
  if (message.includes('PRODUCT_NOT_AVAILABLE')) {
    return new Error('Producto no disponible. Actualiza e intenta de nuevo.');
  }

  // Generic error
  console.error('[RevenueCat] Unhandled error:', error);
  return new Error('Ocurrió un error. Por favor intenta de nuevo.');
}

// ==================== SDK TYPE MAPPING ====================

/**
 * Map RevenueCat SDK CustomerInfo to our custom type
 * Handles differences between SDK types and our internal types
 */
function mapCustomerInfoToCustomType(sdkCustomerInfo: any): RevenueCatCustomerInfo {
  const entitlements: { [key: string]: RevenueCatEntitlement } = {};

  // Map entitlements
  if (sdkCustomerInfo.entitlements?.active) {
    Object.entries(sdkCustomerInfo.entitlements.active).forEach(([key, value]: [string, any]) => {
      entitlements[key] = {
        identifier: value.identifier || key,
        isActive: value.isActive ?? true,
        willRenew: value.willRenew ?? false,
        periodType: value.periodType || 'normal',
        latestPurchaseDate: value.latestPurchaseDate || new Date().toISOString(),
        expirationDate: value.expirationDate || null,
        unsubscribeDetectedAt: value.unsubscribeDetectedAt || null,
        billingIssueDetectedAt: value.billingIssueDetectedAt || null,
        productIdentifier: value.productIdentifier || '',
      };
    });
  }

  return {
    activeSubscriptions: sdkCustomerInfo.activeSubscriptions || [],
    allPurchasedProductIdentifiers: sdkCustomerInfo.allPurchasedProductIdentifiers || [],
    latestExpirationDate: sdkCustomerInfo.latestExpirationDate || null,
    entitlements,
    originalAppUserId: sdkCustomerInfo.originalAppUserId || 'unknown',
  };
}

/**
 * Map RevenueCat SDK Offerings to our custom type
 */
function mapOfferingsToCustomType(sdkOfferings: any): RevenueCatOffering | null {
  // Try to get current offering, fallback to default offering from 'all'
  const current = sdkOfferings?.current || sdkOfferings?.all?.default;

  if (!current) {
    console.warn('[RevenueCat] No current or default offering found in SDK response');
    return null;
  }

  const packages: RevenueCatPackage[] = [];

  if (current.availablePackages) {
    current.availablePackages.forEach((pkg: any) => {
      const product = pkg.product || {};

      packages.push({
        identifier: pkg.identifier || '',
        packageType: mapPackageType(pkg.packageType),
        offeringIdentifier: pkg.offeringIdentifier || current.identifier,
        product: {
          identifier: product.identifier || '',
          description: product.description || '',
          title: product.title || '',
          price: product.price || 0,
          priceString: product.priceString || '$0',
          currencyCode: product.currencyCode || 'USD',
          introPrice: product.introPrice ? {
            price: product.introPrice.price || 0,
            priceString: product.introPrice.priceString || '',
            period: product.introPrice.period || '',
            cycles: product.introPrice.cycles || 0,
          } : undefined,
        },
      });
    });
  }

  return {
    identifier: current.identifier || 'default',
    serverDescription: current.serverDescription || '',
    availablePackages: packages,
  };
}

/**
 * Map SDK package type to our type
 */
function mapPackageType(sdkType: string): 'monthly' | 'annual' | 'lifetime' | 'custom' {
  const type = String(sdkType).toLowerCase();
  if (type.includes('month')) return 'monthly';
  if (type.includes('annual') || type.includes('year')) return 'annual';
  if (type.includes('lifetime')) return 'lifetime';
  return 'custom';
}

// ==================== MOCK DATA ====================

const MOCK_OFFERINGS: RevenueCatOffering = {
  identifier: 'default',
  serverDescription: 'Default offering',
  availablePackages: [
    {
      identifier: 'monthly',
      packageType: 'monthly',
      offeringIdentifier: 'default',
      product: {
        identifier: PRICING_PLANS.monthly.id,
        title: 'Pro (Monthly)',
        description: 'Monthly subscription with 7-day free trial',
        price: PRICING_PLANS.monthly.price,
        priceString: `$${PRICING_PLANS.monthly.price}`,
        currencyCode: 'USD',
        introPrice: {
          price: 0,
          priceString: 'Free',
          period: `${TRIAL_PERIOD_DAYS} days`,
          cycles: 1,
        },
      },
    },
    {
      identifier: 'annual',
      packageType: 'annual',
      offeringIdentifier: 'default',
      product: {
        identifier: PRICING_PLANS.annual.id,
        title: 'Pro (Annual)',
        description: `Annual subscription with 7-day free trial. Save ${PRICING_PLANS.annual.savingsPercent}%!`,
        price: PRICING_PLANS.annual.price,
        priceString: `$${PRICING_PLANS.annual.price}`,
        currencyCode: 'USD',
        introPrice: {
          price: 0,
          priceString: 'Free',
          period: `${TRIAL_PERIOD_DAYS} days`,
          cycles: 1,
        },
      },
    },
    {
      identifier: 'lifetime',
      packageType: 'lifetime',
      offeringIdentifier: 'default',
      product: {
        identifier: PRICING_PLANS.lifetime.id,
        title: 'Pro (Lifetime)',
        description: 'One-time purchase. Pay once, use forever.',
        price: PRICING_PLANS.lifetime.price,
        priceString: `$${PRICING_PLANS.lifetime.price}`,
        currencyCode: 'USD',
      },
    },
  ],
};

// Mock customer info for free user (no subscription)
const MOCK_FREE_USER: RevenueCatCustomerInfo = {
  activeSubscriptions: [],
  allPurchasedProductIdentifiers: [],
  latestExpirationDate: null,
  entitlements: {},
  originalAppUserId: 'mock_user_free',
};

// ==================== MOCK STATE ====================

// LocalStorage key for persisting mock customer info
const MOCK_CUSTOMER_INFO_KEY = 'revenuecat.mockCustomerInfo';

// Load mock customer info from localStorage (survives page refreshes)
function loadMockCustomerInfo(): RevenueCatCustomerInfo {
  try {
    const saved = localStorage.getItem(MOCK_CUSTOMER_INFO_KEY);
    if (saved) {
      console.log('[RevenueCat] Loaded saved mock customer info from localStorage');
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('[RevenueCat] Failed to load mock customer info:', error);
  }
  return MOCK_FREE_USER;
}

// Save mock customer info to localStorage
function saveMockCustomerInfo(info: RevenueCatCustomerInfo): void {
  try {
    localStorage.setItem(MOCK_CUSTOMER_INFO_KEY, JSON.stringify(info));
    console.log('[RevenueCat] Saved mock customer info to localStorage');
  } catch (error) {
    console.warn('[RevenueCat] Failed to save mock customer info:', error);
  }
}

let mockCustomerInfo: RevenueCatCustomerInfo = loadMockCustomerInfo();
let isConfigured = false;

// ==================== SERVICE FUNCTIONS ====================

/**
 * Configure RevenueCat SDK
 * Automatically uses real SDK on native platforms, mock on web
 *
 * @param userId - Optional user ID for anonymous users
 */
export async function configureRevenueCat(userId?: string): Promise<void> {
  // Use mock on web or if force flag is set
  if (isWeb() || FORCE_MOCK) {
    console.log('[RevenueCat] Configuring SDK (MOCK MODE)');
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
    isConfigured = true;
    console.log('[RevenueCat] Mock SDK configured successfully');
    return;
  }

  // Real SDK implementation for native platforms
  try {
    console.log('[RevenueCat] Configuring SDK (REAL MODE)');

    // Dynamic import of RevenueCat SDK (only loads on native)
    if (!Purchases) {
      const rcModule = await import('@revenuecat/purchases-capacitor');
      Purchases = rcModule.Purchases;
    }

    const apiKey = getRevenueCatApiKey();

    if (!apiKey) {
      console.warn('[RevenueCat] No API key found. Falling back to mock mode.');
      await new Promise((resolve) => setTimeout(resolve, 500));
      isConfigured = true;
      return;
    }

    // Configure SDK with API key
    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });

    isConfigured = true;
    console.log('[RevenueCat] Real SDK configured successfully');
  } catch (error) {
    console.error('[RevenueCat] Failed to configure SDK:', error);
    throw handleRevenueCatError(error);
  }
}

/**
 * Get available offerings (products)
 * Returns the list of subscription packages available for purchase
 */
export async function getOfferings(): Promise<RevenueCatOffering | null> {
  if (!isConfigured) {
    console.warn('[RevenueCat] SDK not configured. Call configureRevenueCat() first');
    return null;
  }

  // Use mock on web or if force flag is set
  if (isWeb() || FORCE_MOCK) {
    console.log('[RevenueCat] Fetching offerings (MOCK MODE)');
    await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API call
    return MOCK_OFFERINGS;
  }

  // Real SDK implementation for native platforms
  try {
    console.log('[RevenueCat] Fetching offerings (REAL MODE)');
    const result = await Purchases.getOfferings();
    const mapped = mapOfferingsToCustomType(result);
    console.log('[RevenueCat] Offerings fetched successfully');
    return mapped;
  } catch (error) {
    console.error('[RevenueCat] Failed to fetch offerings:', error);
    throw handleRevenueCatError(error);
  }
}

/**
 * Get current customer info
 * Returns subscription status and entitlements
 */
export async function getCustomerInfo(): Promise<RevenueCatCustomerInfo> {
  if (!isConfigured) {
    console.warn('[RevenueCat] SDK not configured. Returning free user');
    return MOCK_FREE_USER;
  }

  // Use mock on web or if force flag is set
  if (isWeb() || FORCE_MOCK) {
    console.log('[RevenueCat] Fetching customer info (MOCK MODE)');
    await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate API call
    return mockCustomerInfo;
  }

  // Real SDK implementation for native platforms
  try {
    console.log('[RevenueCat] Fetching customer info (REAL MODE)');
    const result = await Purchases.getCustomerInfo();
    const mapped = mapCustomerInfoToCustomType(result.customerInfo);
    console.log('[RevenueCat] Customer info fetched successfully');
    return mapped;
  } catch (error) {
    console.error('[RevenueCat] Failed to fetch customer info:', error);
    throw handleRevenueCatError(error);
  }
}

/**
 * Purchase a package
 * Initiates the purchase flow for a subscription or one-time purchase
 *
 * @param packageToPurchase - The package to purchase
 */
export async function purchasePackage(
  packageToPurchase: RevenueCatPackage
): Promise<PurchaseResult> {
  if (!isConfigured) {
    throw new Error('RevenueCat SDK not configured');
  }

  console.log('[RevenueCat] Purchasing package:', packageToPurchase.identifier);

  // Use mock on web or if force flag is set
  if (isWeb() || FORCE_MOCK) {
    // Mock implementation - Simulate successful purchase with trial
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate purchase flow

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_PERIOD_DAYS);

    const mockPurchasedInfo: RevenueCatCustomerInfo = {
      activeSubscriptions: [packageToPurchase.product.identifier],
      allPurchasedProductIdentifiers: [packageToPurchase.product.identifier],
      latestExpirationDate: packageToPurchase.packageType === 'lifetime' ? null : trialEnd.toISOString(),
      entitlements: {
        pro: {
          identifier: 'pro',
          isActive: true,
          willRenew: packageToPurchase.packageType !== 'lifetime',
          periodType: packageToPurchase.product.introPrice ? 'trial' : 'normal',
          latestPurchaseDate: now.toISOString(),
          expirationDate: packageToPurchase.packageType === 'lifetime' ? null : trialEnd.toISOString(),
          unsubscribeDetectedAt: null,
          billingIssueDetectedAt: null,
          productIdentifier: packageToPurchase.product.identifier,
        },
      },
      originalAppUserId: 'mock_user_pro',
    };

    // Update mock state and persist to localStorage
    mockCustomerInfo = mockPurchasedInfo;
    saveMockCustomerInfo(mockCustomerInfo);

    console.log('[RevenueCat] Purchase successful (MOCK)!');
    console.log('[RevenueCat] Trial ends at:', trialEnd.toISOString());

    return {
      customerInfo: mockPurchasedInfo,
      productIdentifier: packageToPurchase.product.identifier,
      transactionDate: now.toISOString(),
    };
  }

  // Real SDK implementation for native platforms
  try {
    console.log('[RevenueCat] Initiating real purchase flow...');

    // Note: packageToPurchase is our custom type, need to pass the original SDK package
    // For now, we'll use the package identifier to look it up from offerings
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current || offerings.all?.default;

    if (!currentOffering) {
      throw new Error('No offerings available');
    }

    // Find the package in the offering by identifier
    const sdkPackage = currentOffering.availablePackages?.find(
      (pkg: any) => pkg.identifier === packageToPurchase.identifier
    );

    if (!sdkPackage) {
      throw new Error(`Package not found: ${packageToPurchase.identifier}`);
    }

    // Purchase the package
    const result = await Purchases.purchasePackage({ aPackage: sdkPackage });

    const mapped = mapCustomerInfoToCustomType(result.customerInfo);

    console.log('[RevenueCat] Purchase successful (REAL)!');

    return {
      customerInfo: mapped,
      productIdentifier: result.productIdentifier || packageToPurchase.product.identifier,
      transactionDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[RevenueCat] Purchase failed:', error);
    throw handleRevenueCatError(error);
  }
}

/**
 * Restore purchases
 * Restores previous purchases from the user's account
 */
export async function restorePurchases(): Promise<RevenueCatCustomerInfo> {
  if (!isConfigured) {
    throw new Error('RevenueCat SDK not configured');
  }

  // Use mock on web or if force flag is set
  if (isWeb() || FORCE_MOCK) {
    console.log('[RevenueCat] Restoring purchases (MOCK MODE)');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('[RevenueCat] Purchases restored (MOCK)');
    return mockCustomerInfo;
  }

  // Real SDK implementation for native platforms
  try {
    console.log('[RevenueCat] Restoring purchases (REAL MODE)');
    const result = await Purchases.restorePurchases();
    const mapped = mapCustomerInfoToCustomType(result.customerInfo);
    console.log('[RevenueCat] Purchases restored successfully');
    return mapped;
  } catch (error) {
    console.error('[RevenueCat] Failed to restore purchases:', error);
    throw handleRevenueCatError(error);
  }
}

/**
 * Check if user has active Pro entitlement
 */
export function hasProEntitlement(customerInfo: RevenueCatCustomerInfo): boolean {
  const proEntitlement = customerInfo.entitlements.pro;
  return proEntitlement?.isActive ?? false;
}

/**
 * Check if user is in trial period
 */
export function isInTrialPeriod(customerInfo: RevenueCatCustomerInfo): boolean {
  const proEntitlement = customerInfo.entitlements.pro;
  if (!proEntitlement || !proEntitlement.isActive) return false;
  return proEntitlement.periodType === 'trial';
}

/**
 * Get trial end date
 */
export function getTrialEndDate(customerInfo: RevenueCatCustomerInfo): Date | null {
  const proEntitlement = customerInfo.entitlements.pro;
  if (!proEntitlement || !proEntitlement.expirationDate) return null;
  if (proEntitlement.periodType !== 'trial') return null;
  return new Date(proEntitlement.expirationDate);
}

/**
 * Get subscription type
 */
export function getSubscriptionType(
  customerInfo: RevenueCatCustomerInfo
): 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime' {
  const proEntitlement = customerInfo.entitlements.pro;

  if (!proEntitlement || !proEntitlement.isActive) {
    return 'free';
  }

  if (proEntitlement.periodType === 'trial') {
    return 'trial';
  }

  const productId = proEntitlement.productIdentifier;

  if (productId === PRICING_PLANS.monthly.id) return 'monthly';
  if (productId === PRICING_PLANS.annual.id) return 'annual';
  if (productId === PRICING_PLANS.lifetime.id) return 'lifetime';

  return 'free';
}

// ==================== MOCK HELPERS (FOR TESTING) ====================

// REMOVED: Mock helper functions for production security
// __mockResetToFreeUser, __mockExpireTrial, __mockConvertTrialToPaid
// These functions were only for testing and pose a security risk in production
