/**
 * OAuth utilities for in-app browser authentication
 * Uses Safari View Controller on iOS, Chrome Custom Tabs on Android
 *
 * Supports anonymous-to-identified user upgrade via linkIdentity():
 * When an anonymous user (from signInAnonymously()) logs in with OAuth,
 * linkIdentity() preserves their user ID, keeping subscriptions and data intact.
 */

import { Browser } from '@capacitor/browser';
import { supabase } from '@/lib/supabaseClient';
import { isNative } from './platform';
import { getOAuthRedirectUrl } from '@/config/env';

/**
 * Sign in with OAuth provider using in-app browser (native) or standard flow (web)
 *
 * If the current user is anonymous (from Supabase Anonymous Auth), uses linkIdentity()
 * to convert the anonymous account to a real one, preserving the same user ID.
 * This keeps RevenueCat subscriptions and user_subscriptions records linked.
 *
 * @param provider - OAuth provider ('google' | 'apple')
 * @param options - Additional OAuth options
 */
export async function signInWithOAuthInAppBrowser(
  provider: 'google' | 'apple',
  options?: {
    queryParams?: Record<string, string>;
    skipLinkIdentity?: boolean; // Force signInWithOAuth even for anonymous users (used after identity_already_exists error)
  }
): Promise<{ error: Error | null }> {
  try {
    const redirectTo = isNative() ? getOAuthRedirectUrl() : window.location.origin;
    console.log(`[OAuth] Starting ${provider} OAuth with redirect:`, redirectTo);

    // Check if current user is anonymous → link identity (preserves user ID + subscriptions)
    // Skip linkIdentity if explicitly requested (e.g., after identity_already_exists error)
    const { data: { user } } = await supabase.auth.getUser();
    const isAnonymous = user?.is_anonymous === true && !options?.skipLinkIdentity;

    if (isAnonymous) {
      console.log(`[OAuth] Linking ${provider} to anonymous user ${user?.id}`);
    } else if (user?.is_anonymous && options?.skipLinkIdentity) {
      console.log(`[OAuth] Skipping linkIdentity (identity_already_exists fallback), using signInWithOAuth`);
    }

    if (isNative()) {
      let url: string | undefined;

      if (isAnonymous) {
        // Link OAuth identity to anonymous account (preserves user ID)
        const { data, error } = await supabase.auth.linkIdentity({
          provider,
          options: {
            redirectTo,
            queryParams: options?.queryParams,
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        url = data.url;
      } else {
        // Regular OAuth flow for non-anonymous or no-session users
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams: options?.queryParams,
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        url = data.url;
      }

      if (!url) throw new Error('No OAuth URL returned');

      console.log(`[OAuth] Opening ${provider} OAuth in in-app browser`);

      // Open OAuth URL in in-app browser (Safari View Controller / Chrome Custom Tabs)
      await Browser.open({
        url,
        presentationStyle: 'fullscreen',
      });

      // Auth callback will be handled by App.tsx deep link listener
      // which calls supabase.auth.getSession() to complete the flow

      return { error: null };
    } else {
      // Web flow (isAnonymous already accounts for skipLinkIdentity)
      if (isAnonymous) {
        const { error } = await supabase.auth.linkIdentity({
          provider,
          options: {
            redirectTo,
            queryParams: options?.queryParams,
          },
        });
        return { error: error || null };
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams: options?.queryParams,
          },
        });
        return { error: error || null };
      }
    }
  } catch (err: any) {
    console.error(`[OAuth] ${provider} OAuth error:`, err);
    return { error: err };
  }
}
