/**
 * Browser utilities for opening URLs
 *
 * CRITICAL: Use these utilities for ALL external URL navigation in the app.
 *
 * Platform Behavior:
 * - iOS: Opens Safari View Controller (in-app browser)
 * - Android: Opens Chrome Custom Tabs (in-app browser)
 * - Web: Opens window.open() in new tab
 *
 * Why In-App Browser?
 * - Better UX: User never leaves the app
 * - Apple Requirement: App Review Guideline 4.0 requires in-app browser for auth/legal links
 * - Security: User can see URL and SSL certificate
 *
 * Usage:
 * ```typescript
 * import { openUrl, openLegalPage } from '@/shared/utils/browser.utils';
 *
 * // Generic URL:
 * await openUrl('https://example.com');
 *
 * // Legal pages (Terms/Privacy):
 * await openLegalPage('terms', locale);
 * ```
 */

import { Browser } from '@capacitor/browser';
import { isNative } from './platform';

/**
 * Opens a URL in the appropriate browser context
 *
 * Platform Behavior:
 * - iOS: Safari View Controller (modal with "Done" button)
 * - Android: Chrome Custom Tabs (app-themed browser bar)
 * - Web: window.open() in new tab
 *
 * @param url - The URL to open (must be valid HTTPS URL)
 * @param options - Optional configuration
 * @param options.presentationStyle - iOS only: 'fullscreen' (default) | 'popover'
 *
 * @example
 * // Open help documentation
 * await openUrl('https://baselineapp.jotatech.org/help');
 *
 * @example
 * // Open with popover style on iOS
 * await openUrl('https://example.com', { presentationStyle: 'popover' });
 */
export async function openUrl(
  url: string,
  options?: {
    presentationStyle?: 'fullscreen' | 'popover';
  }
): Promise<void> {
  if (isNative()) {
    // Native: Use in-app browser (Safari View Controller / Chrome Custom Tabs)
    await Browser.open({
      url,
      presentationStyle: options?.presentationStyle || 'fullscreen',
      // iOS: Shows "Done" button to close
      // Android: Shows custom tab with app's theme color
    });
  } else {
    // Web: Open in new tab
    window.open(url, '_blank');
  }
}

/**
 * Closes the in-app browser (native only)
 *
 * Note: Usually not needed, as the user can close it manually.
 * Only use if you need programmatic control (e.g., after successful OAuth callback).
 *
 * @example
 * // Close after successful login
 * if (authSuccess) {
 *   await closeBrowser();
 * }
 */
export async function closeBrowser(): Promise<void> {
  if (isNative()) {
    await Browser.close();
  }
}

/**
 * Opens legal page (Terms or Privacy) with current locale
 *
 * Convenience wrapper for opening BaselineApp legal pages.
 * Uses openUrl() internally with correct URL construction.
 *
 * @param page - 'terms' | 'privacy'
 * @param locale - Current language code (e.g., 'es', 'en', 'fr', 'pt')
 *
 * @example
 * // Open Terms in Spanish
 * const { i18n } = useTranslation();
 * await openLegalPage('terms', i18n.language);
 *
 * @example
 * // Open Privacy Policy in English
 * await openLegalPage('privacy', 'en');
 */
export async function openLegalPage(
  page: 'terms' | 'privacy',
  locale: string
): Promise<void> {
  const pageSlug = page === 'terms' ? 'terms-of-service' : 'privacy-policy';
  const url = `https://baselineapp.jotatech.org/${locale}/${pageSlug}`;
  await openUrl(url);
}
