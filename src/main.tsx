import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n/config"; // IMPORTANT: Import before React
import { initSentry } from "@/lib/sentry";
import App from "./App";
import "./index.css";

// Initialize Sentry early, before any React rendering
initSentry();

import { registerSW } from "virtual:pwa-register";
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { isNative, isAndroid } from '@/shared/utils/platform';

// Load PWA elements for Capacitor web support (camera modal, etc.)
defineCustomElements(window);

registerSW({
  immediate: true,
});

// Initialize Capacitor plugins (native only)
if (isNative()) {
  StatusBar.setOverlaysWebView({ overlay: true }).catch((err) => {
    console.error('[StatusBar] setOverlaysWebView error:', err);
  });
  StatusBar.setStyle({ style: Style.Light }).catch((err) => {
    console.error('[StatusBar] setStyle error:', err);
  });
  if (isAndroid()) {
    StatusBar.setBackgroundColor({ color: '#00000000' }).catch((err) => {
      console.error('[StatusBar] setBackgroundColor error:', err);
    });
  }

  // Handle Android back button
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      CapacitorApp.exitApp();
    } else {
      window.history.back();
    }
  });

  // Handle deep links (OAuth callbacks)
  CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
    console.log('[DeepLink] Received URL:', url);

    // Check if this is an OAuth callback
    if (url.includes('auth/callback') || url.includes('code=') || url.includes('access_token')) {
      try {
        const { closeBrowser } = await import('@/shared/utils/browser.utils');
        await closeBrowser();
        console.log('[DeepLink] In-app browser closed');

        const urlObj = new URL(url);

        // Check for OAuth error in callback URL
        const errorParam = urlObj.searchParams.get('error');
        const errorCode = urlObj.searchParams.get('error_code');
        const errorDescription = urlObj.searchParams.get('error_description');

        if (errorParam) {
          console.warn(`[DeepLink] OAuth error in callback: ${errorCode || errorParam} - ${errorDescription}`);

          if (errorCode === 'identity_already_exists') {
            console.log('[DeepLink] Identity already exists, dispatching retry event');
            window.dispatchEvent(new CustomEvent('oauth-identity-exists'));
          } else {
            window.dispatchEvent(new CustomEvent('oauth-error', {
              detail: {
                error: errorDescription?.replace(/\+/g, ' ') || errorParam,
                code: 0,
                isRetryable: true,
              }
            }));
          }
          return;
        }

        const { supabase } = await import('@/lib/supabaseClient');

        const code = urlObj.searchParams.get('code');
        const hashParams = new URLSearchParams(url.split('#')[1] || '');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (code) {
          console.log('[DeepLink] Exchanging code for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[DeepLink] Error exchanging code:', error);
            window.dispatchEvent(new CustomEvent('oauth-error', {
              detail: {
                error: error.message || 'Error connecting to OAuth provider',
                code: error.status || 0,
                isRetryable: error.name === 'AuthRetryableFetchError' || error.status === 0,
              }
            }));
          } else {
            console.log('[DeepLink] Session established successfully');
          }
        } else if (accessToken && refreshToken) {
          console.log('[DeepLink] Setting session from tokens...');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[DeepLink] Error setting session:', error);
            window.dispatchEvent(new CustomEvent('oauth-error', {
              detail: {
                error: error.message || 'Error setting session',
                code: error.status || 0,
                isRetryable: true,
              }
            }));
          } else {
            console.log('[DeepLink] Session set successfully');
          }
        } else {
          console.warn('[DeepLink] No code or tokens found in URL');
          window.dispatchEvent(new CustomEvent('oauth-error', {
            detail: {
              error: 'No authentication code received',
              code: 0,
              isRetryable: true,
            }
          }));
        }
      } catch (err) {
        console.error('[DeepLink] Error processing OAuth callback:', err);
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove HTML splash screen after app renders
requestAnimationFrame(() => {
  setTimeout(() => {
    const splash = document.getElementById('app-splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 400);
    }
  }, 800);
});
