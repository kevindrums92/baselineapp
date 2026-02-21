import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/lib/supabaseClient";
import { useAppStore } from "@/state/app.store";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/features/theme";
import { useCurrency } from "@/features/currency";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaywallPurchase } from "@/hooks/usePaywallPurchase";
import { User, UserCircle2, ChevronRight, Shield, Repeat, RefreshCw, Languages, Palette, DollarSign, FileText, Folder, ScrollText, Lock, Fingerprint, Bell, Sparkles, CloudOff, CloudCheck, Crown, Chrome, Apple, AlertTriangle, ArrowRight } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { isNative } from '@/shared/utils/platform';
import PaywallModal from '@/shared/components/modals/PaywallModal';
import { authenticateWithBiometrics, checkBiometricAvailability, getBiometryDisplayName } from "@/features/biometric/services/biometric.service";
import { openLegalPage } from '@/shared/utils/browser.utils';
import { deleteAccount } from "@/features/profile/services/deleteAccount.service";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('profile');
  const { currentLanguageData } = useLanguage();
  const { theme } = useTheme();
  const { currencyInfo } = useCurrency();
  const { isPro, isTrialing, trialEndsAt } = useSubscription();

  // Paywall purchase handler
  const { handleSelectPlan } = usePaywallPurchase({
    onSuccess: () => setShowPaywall(false),
    // Error is shown inline in PaywallModal banner, no need for extra modal
  });

  // ✅ Read from Zustand store (single source of truth)
  const user = useAppStore((s) => s.user);
  const cloudMode = useAppStore((s) => s.cloudMode);
  const cloudStatus = useAppStore((s) => s.cloudStatus);
  const security = useAppStore((s) => s.security);
  const toggleBiometricAuth = useAppStore((s) => s.toggleBiometricAuth);
  const updateLastAuthTimestamp = useAppStore((s) => s.updateLastAuthTimestamp);
  const clearSubscription = useAppStore((s) => s.clearSubscription);

  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [biometryType, setBiometryType] = useState<string>('Face ID');
  const [showPaywall, setShowPaywall] = useState(false);

  // Delete account states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteUnderstanding, setDeleteUnderstanding] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Get current theme name for display
  const currentThemeName = useMemo(() => {
    return t(`preferences.theme.${theme}`);
  }, [theme, t]);

  // Online/offline listeners
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const isLoggedIn = !!user.email;
  const isAnonymousCloud = !isLoggedIn && cloudMode === 'cloud';

  // Auth actions
  async function signOut() {
    setLoading(true);
    // Clear auth persistence flag BEFORE signOut so SIGNED_OUT handler
    // knows this is an explicit logout (not a session expiration)
    localStorage.removeItem('app.wasAuthenticated');
    localStorage.removeItem('app.lastAuthEmail');
    localStorage.removeItem('app.lastAuthProvider');
    await supabase.auth.signOut();

    // Log out from RevenueCat (native only)
    if (isNative()) {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor');
        await Purchases.logOut();
        console.log('[ProfilePage] RevenueCat logged out');
      } catch (error) {
        console.warn('[ProfilePage] Failed to log out from RevenueCat:', error);
        // Continue with logout even if RevenueCat logout fails (graceful degradation)
      }
    }

    // ✅ CRITICAL: Clear subscription from in-memory store AND localStorage
    // Without this, the next user would inherit the previous user's subscription state
    clearSubscription();
    console.log('[ProfilePage] Subscription cleared from store');

    // Clear subscription from localStorage cache
    const { clearSubscriptionCache } = await import('@/services/subscription.service');
    clearSubscriptionCache();

    // Marcar logout para que OnboardingGate redirija a login
    const { markLogout } = await import('@/features/onboarding/utils/onboarding.helpers');
    markLogout();

    setLoading(false);
    navigate("/");
  }

  // Handle delete account
  async function handleDeleteAccount() {
    console.log('[ProfilePage] Starting account deletion process');
    setDeletingAccount(true);
    setDeleteError(null);

    try {
      // Call delete account service
      const { success, error } = await deleteAccount();

      if (!success) {
        console.error('[ProfilePage] Failed to delete account:', error);
        setDeleteError(error || t('account.delete.errorMessage'));
        setDeletingAccount(false);
        setShowDeleteConfirm(false);
        return;
      }

      console.log('[ProfilePage] Account deleted successfully');

      // Close confirmation modal
      setShowDeleteConfirm(false);
      setDeletingAccount(false);

      // Clean up and sign out (SAME AS signOut() FUNCTION)
      console.log('[ProfilePage] Cleaning up after account deletion');

      // Clear auth persistence flag BEFORE signOut (same as signOut function)
      localStorage.removeItem('app.wasAuthenticated');
      localStorage.removeItem('app.lastAuthEmail');
      localStorage.removeItem('app.lastAuthProvider');

      // 1. Sign out from Supabase (CRITICAL - clears auth session)
      await supabase.auth.signOut();
      console.log('[ProfilePage] Supabase auth signed out');

      // 2. Log out from RevenueCat (native only)
      if (isNative()) {
        try {
          const { Purchases } = await import('@revenuecat/purchases-capacitor');
          await Purchases.logOut();
          console.log('[ProfilePage] RevenueCat logged out');
        } catch (error) {
          console.warn('[ProfilePage] Failed to log out from RevenueCat:', error);
          // Continue anyway - graceful degradation
        }
      }

      // 3. Clear subscription from store and localStorage
      clearSubscription();
      console.log('[ProfilePage] Subscription cleared from store');

      const { clearSubscriptionCache } = await import('@/services/subscription.service');
      clearSubscriptionCache();
      console.log('[ProfilePage] Subscription cache cleared');

      // 4. Clear localStorage completely (to remove any residual data)
      const { clearState } = await import('@/services/storage.service');
      clearState();
      console.log('[ProfilePage] localStorage cleared');

      // 5. Mark logout for OnboardingGate to redirect to login
      const { markLogout } = await import('@/features/onboarding/utils/onboarding.helpers');
      markLogout();
      console.log('[ProfilePage] Logout marked for OnboardingGate');

      // 6. Navigate to home (OnboardingGate will redirect to login)
      navigate("/");

    } catch (err: any) {
      console.error('[ProfilePage] Unexpected error during account deletion:', err);
      setDeleteError(err.message || t('account.delete.errorMessage'));
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  }

  // Handle biometric toggle
  async function handleBiometricToggle() {
    const isCurrentlyEnabled = security?.biometricEnabled ?? false;

    // If disabling, just toggle off
    if (isCurrentlyEnabled) {
      console.log('[ProfilePage] Disabling biometric auth');
      toggleBiometricAuth();
      return;
    }

    // If enabling, first check availability then authenticate
    console.log('[ProfilePage] Attempting to enable biometric auth');

    try {
      // Check if biometric is available
      console.log('[ProfilePage] Checking biometric availability...');
      const availability = await checkBiometricAvailability();

      if (!availability.isAvailable) {
        console.log('[ProfilePage] Biometric not available:', availability.reason);
        setErrorMessage(availability.reason || 'Autenticación biométrica no disponible en este dispositivo');
        return;
      }

      // Store the biometry type for display
      const displayName = getBiometryDisplayName(availability.biometryType);
      setBiometryType(displayName);
      console.log('[ProfilePage] Biometry type:', displayName);

      // Request biometric authentication
      const authResult = await authenticateWithBiometrics(t('biometricLock.enableReason'));

      if (authResult.success) {
        console.log('[ProfilePage] Biometric authentication successful, enabling');
        toggleBiometricAuth();
        updateLastAuthTimestamp(); // Mark that user just authenticated to prevent BiometricGate from prompting again
      } else {
        console.log('[ProfilePage] Biometric authentication failed:', authResult.error);
        if (authResult.errorCode === 'NOT_AVAILABLE') {
          setErrorMessage('Face ID no está disponible en este dispositivo');
        } else if (authResult.errorCode !== 'USER_CANCEL') {
          setErrorMessage('No se pudo autenticar. Por favor intenta de nuevo.');
        }
      }
    } catch (error) {
      console.error('[ProfilePage] Error in biometric toggle:', error);
      setErrorMessage('Error al verificar autenticación biométrica');
    }
  }


  // Generate initials for avatar fallback
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  // Sync status badge
  const syncBadge = useMemo(() => {
    if (cloudMode === "guest") {
      return { text: t('account.syncStatus.local').toUpperCase(), color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400", icon: false };
    }
    if (!navigator.onLine || cloudStatus === "offline") {
      return { text: t('account.syncStatus.offline').toUpperCase(), color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400", icon: false };
    }
    if (cloudStatus === "syncing") {
      return { text: t('account.syncStatus.syncing').toUpperCase(), color: "bg-teal-50 dark:bg-teal-900/30 text-[#18B7B0]", icon: true };
    }
    return { text: t('account.syncStatus.synced').toUpperCase(), color: "bg-teal-50 dark:bg-teal-900/30 text-[#18B7B0]", icon: false };
  }, [cloudMode, cloudStatus, t]);

  // Sync indicator dot (matches TopHeader logic)
  const syncDot = useMemo(() => {
    if (cloudMode === "guest") {
      return "bg-gray-400";
    }
    if (!navigator.onLine || cloudStatus === "offline") {
      return "bg-gray-400";
    }
    if (cloudStatus === "syncing") {
      return "bg-[#18B7B0]";
    }
    return "bg-green-500"; // ok
  }, [cloudMode, cloudStatus]);

  // Trial status badge
  const trialBadge = useMemo(() => {
    if (!isTrialing || !trialEndsAt) return null;

    const now = new Date();
    const endsAt = new Date(trialEndsAt);
    const daysRemaining = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) return null; // Trial expired, don't show

    return {
      text: t('account.trial.daysRemaining', { count: daysRemaining, defaultValue: `${daysRemaining} días de prueba` }).toUpperCase(),
      color: "bg-gradient-to-r from-[#18B7B0] to-emerald-500 text-white",
    };
  }, [isTrialing, trialEndsAt, t]);

  // Pro badge
  const proBadge = useMemo(() => {
    if (!isPro) return null;

    return {
      text: "PRO",
      color: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    };
  }, [isPro]);

  // Free badge (only show when not Pro and not trialing)
  const freeBadge = useMemo(() => {
    if (isPro || isTrialing) return null;

    return {
      text: "FREE",
      color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    };
  }, [isPro, isTrialing]);

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 pb-28 transition-colors">
      {/* User Account Card - Logged in users */}
      {isLoggedIn && (
        <div className="px-4 pt-6 pb-4">
          <button
            type="button"
            onClick={() => navigate('/profile/subscription')}
            className="w-full bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border relative overflow-hidden transition active:scale-[0.99] text-left border-gray-100 dark:border-gray-800 hover:border-teal-200 dark:hover:border-teal-700"
          >
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform hover:scale-110 bg-teal-50 dark:bg-teal-900/30" />

            <div className="flex items-center gap-4 relative z-10">
              {/* Avatar with status dot */}
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm text-gray-400 dark:text-gray-500">
                    {initials ? (
                      <span className="text-2xl font-semibold text-gray-600 dark:text-gray-300">
                        {initials}
                      </span>
                    ) : (
                      <User size={32} />
                    )}
                  </div>
                )}
                {/* Status dot */}
                <div className={`absolute bottom-0 right-0 w-5 h-5 ${syncDot} border-2 border-white dark:border-gray-900 rounded-full`} />
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg text-gray-900 dark:text-gray-50 leading-tight truncate">
                  {user.name || "Usuario"}
                </h2>
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  {user.provider === 'google' && (
                    <div className="shrink-0 flex h-4 w-4 items-center justify-center rounded-sm bg-white dark:bg-gray-900 shadow-sm">
                      <Chrome size={12} className="text-gray-700 dark:text-gray-300" />
                    </div>
                  )}
                  {user.provider === 'apple' && (
                    <div className="shrink-0 flex h-4 w-4 items-center justify-center rounded-sm bg-black">
                      <Apple size={12} className="text-white" />
                    </div>
                  )}
                </div>
                {/* Badges */}
                <div className="flex flex-col gap-2">
                  {(proBadge || trialBadge || freeBadge) && (
                    <div className="flex flex-wrap gap-2">
                      {proBadge && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${proBadge.color} text-xs font-bold uppercase tracking-wider shadow-sm`}>
                          <Crown size={12} />
                          {proBadge.text}
                        </span>
                      )}
                      {trialBadge && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${trialBadge.color} text-xs font-bold uppercase tracking-wider shadow-sm`}>
                          <Sparkles size={12} />
                          {trialBadge.text}
                        </span>
                      )}
                      {freeBadge && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${freeBadge.color} text-xs font-bold uppercase tracking-wider`}>
                          {freeBadge.text}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${syncBadge.color} text-xs font-bold uppercase tracking-wider`}>
                      {syncBadge.icon && <RefreshCw size={12} className="animate-spin" />}
                      {!syncBadge.icon && <RefreshCw size={12} />}
                      {syncBadge.text}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chevron indicator */}
              <div className="shrink-0">
                <ChevronRight size={20} className="text-gray-400 dark:text-gray-600" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Guest Banner Card - Anonymous users with cloud sync */}
      {!isLoggedIn && cloudMode === "cloud" && (
        <div className="px-4 pt-6 pb-4">
          <button
            type="button"
            onClick={() => navigate('/onboarding/login')}
            className="w-full relative group text-left"
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#18B7B0]/20 to-transparent rounded-[2rem] blur-xl opacity-50" />

            <div className="relative bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] p-6 border border-gray-200 dark:border-gray-800 flex items-center justify-between active:scale-[0.98] transition-all shadow-lg dark:shadow-2xl">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner">
                    <UserCircle2 size={40} strokeWidth={1} />
                  </div>
                  {/* Status Dot - synced to real sync state */}
                  <div className="absolute -bottom-1 -right-1">
                    <span className="relative flex h-5 w-5">
                      {cloudStatus === 'syncing' && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${syncDot} opacity-40`} />
                      )}
                      <span className={`relative inline-flex rounded-full h-5 w-5 ${syncDot} border-4 border-white dark:border-gray-900`} />
                    </span>
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#18B7B0] uppercase tracking-[0.2em]">
                      {t('account.guest.sessionLabel')}
                    </span>
                    <Sparkles size={12} className="text-amber-400 animate-pulse" />
                  </div>
                  <h4 className="text-l font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                    {t('account.guest.title')}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {t('account.guest.subtitle')}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 shrink-0 ml-4">
                <ArrowRight size={20} />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Pro Subscription Card - Anonymous Pro users need access to manage their subscription */}
      {isPro && !isLoggedIn && cloudMode === "cloud" && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => navigate('/profile/subscription')}
            className="w-full relative overflow-hidden rounded-2xl p-5 shadow-sm text-left active:scale-[0.99] transition-all bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-bl-[6rem] -mr-8 -mt-8" />

            <div className="flex items-center gap-4 relative z-10">
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/30 dark:to-teal-500/30">
                <Crown size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-50">
                    {t('subscriptionCard.pro.title', 'Pro Activo')}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-[10px] font-bold text-white uppercase tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('subscriptionCard.pro.cta', 'Administrar Suscripción')}
                </p>
              </div>

              {/* Chevron */}
              <ChevronRight size={20} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
            </div>
          </button>
        </div>
      )}

      {/* Session Inconsistency Card - Show when Pro but not logged in AND not in cloud mode (and not offline) */}
      {/* Anonymous users in cloud mode have active sessions, so this only shows for true session loss */}
      {isPro && !isLoggedIn && cloudMode !== "cloud" && cloudStatus !== "offline" && (
        <div className="px-4 pt-6 pb-4">
          <div className="relative w-full rounded-2xl p-5 shadow-sm overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30 border border-amber-200 dark:border-amber-800">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-red-500/10 rounded-bl-[6rem] -mr-8 -mt-8" />

            {/* Icon */}
            <div className="mb-4 relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 dark:bg-amber-500/30">
                <Shield size={24} className="text-amber-600 dark:text-amber-400" />
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10">
              <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-50">
                Sesión Expirada
              </h3>
              <p className="mb-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Tu sesión ha expirado pero conservas tu suscripción. Inicia sesión nuevamente para sincronizar tus datos.
              </p>
              <button
                type="button"
                onClick={() => navigate('/onboarding/login')}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
              >
                <CloudCheck size={16} />
                <span>Reconectar Cuenta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Subscription Status Card - Hide when Pro */}
      {!isPro && (
        <div className="px-4 pt-6 pb-4">
          {!isLoggedIn && cloudMode !== "cloud" ? (
            // Guest State: No backup, no cloud session, encourage signup
            <div className="relative w-full rounded-2xl p-5 shadow-sm overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-bl-[6rem] -mr-8 -mt-8" />

              {/* Icon */}
              <div className="mb-4 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 dark:bg-red-500/30">
                  <CloudOff size={24} className="text-red-400" />
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="mb-2 text-lg font-bold text-white">
                  {t('subscriptionCard.guest.title', 'Sin Respaldo en la Nube')}
                </h3>
                <p className="mb-4 text-sm text-gray-300 leading-relaxed">
                  {t('subscriptionCard.guest.subtitle', 'Tus datos están solo en este dispositivo. Si lo pierdes o se daña, perderás todo tu historial financiero.')}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/onboarding/login')}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#18B7B0] to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
                >
                  <CloudCheck size={16} />
                  <span>{t('subscriptionCard.guest.cta', 'Crear Cuenta Gratis')}</span>
                </button>
              </div>
            </div>
          ) : (
            // Free User State: Encourage Pro upgrade with feature highlights
            <div className="relative w-full rounded-2xl p-5 shadow-sm overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-violet-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-violet-950/30 border border-emerald-200 dark:border-emerald-800">
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-violet-500/10 rounded-bl-[6rem] -mr-8 -mt-8" />

              {/* Icon */}
              <div className="mb-4 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 dark:from-emerald-500/30 dark:to-violet-500/30">
                  <Sparkles size={24} className="text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-50">
                  {t('subscriptionCard.free.title', 'Lleva tus Finanzas al Siguiente Nivel')}
                </h3>
                <p className="mb-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('subscriptionCard.free.subtitle', 'Elimina los anuncios y desbloquea registros con IA ilimitados.')}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPaywall(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#18B7B0] to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
                >
                  <Crown size={16} />
                  <span>{t('subscriptionCard.free.cta', 'Descubre Pro')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Menu Sections */}
      <div className={`px-4 ${isLoggedIn ? 'pt-4' : 'pt-6'}`}>
        {/* Apariencia Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('sections.appearance')}
          </h3>
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <MenuItem
              icon={<Languages size={20} />}
              label={t('preferences.language.label')}
              sublabel={currentLanguageData.nativeName}
              onClick={() => navigate('/settings/language')}
            />
            <MenuItem
              icon={<Palette size={20} />}
              label={t('preferences.theme.label')}
              sublabel={currentThemeName}
              onClick={() => navigate('/settings/theme')}
            />
            <MenuItem
              icon={<DollarSign size={20} />}
              label={t('preferences.currency.label')}
              sublabel={`${currencyInfo.flag} ${currencyInfo.code} - ${currencyInfo.name}`}
              onClick={() => navigate('/settings/currency')}
            />
          </div>
        </div>

        {/* Gestión de Gastos Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('sections.expenseManagement')}
          </h3>
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <MenuItem
              icon={<Folder size={20} />}
              label={t('menu.categories')}
              sublabel={t('menu.categoriesSubtitle')}
              onClick={() => navigate("/categories")}
            />
            <MenuItem
              icon={<Repeat size={20} />}
              label={t('menu.scheduled')}
              sublabel={t('menu.scheduledSubtitle')}
              onClick={() => navigate("/scheduled")}
            />
          </div>
        </div>

        {/* Datos y Seguridad Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('sections.dataSecurity')}
          </h3>
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <MenuItem
              icon={<Shield size={20} />}
              label={t('menu.backup')}
              sublabel={t('menu.backupSubtitle')}
              onClick={() => navigate("/backup")}
            />
            {Capacitor.isNativePlatform() && (
              <MenuItem
                icon={<Fingerprint size={20} />}
                label={t('menu.biometric')}
                sublabel={
                  security?.biometricEnabled
                    ? t('menu.biometricEnabled', { type: biometryType })
                    : t('menu.biometricDisabled')
                }
                onClick={handleBiometricToggle}
                showToggle
                toggleValue={security?.biometricEnabled ?? false}
              />
            )}
            <MenuItem
              icon={<FileText size={20} />}
              label={t('menu.exportCSV')}
              sublabel={t('menu.exportCSVSubtitle')}
              onClick={() => navigate('/settings/export-csv')}
            />
            {Capacitor.isNativePlatform() && (
              <MenuItem
                icon={<Bell size={20} />}
                label={t('menu.notifications', 'Notificaciones')}
                sublabel={t('menu.notificationsSubtitle', 'Recordatorios y alertas')}
                onClick={() => navigate('/settings/notifications')}
              />
            )}
          </div>
        </div>

        {/* Legal Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('sections.legal', 'Legal')}
          </h3>
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <MenuItem
              icon={<ScrollText size={20} />}
              label={t('legal.terms.title', 'Términos de Servicio')}
              onClick={() => {
                const locale = i18n.language || 'es';
                openLegalPage('terms', locale);
              }}
            />
            <MenuItem
              icon={<Lock size={20} />}
              label={t('legal.privacy.title', 'Política de Privacidad')}
              onClick={() => {
                const locale = i18n.language || 'es';
                openLegalPage('privacy', locale);
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer with logout and version */}
      <div className="px-4 pt-8 pb-4">
        {/* Logout button - only for logged in users */}
        {isLoggedIn && isOnline && (
          <button
            type="button"
            onClick={signOut}
            disabled={loading}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            <LogoutIcon />
            <span>{loading ? t('loggingOut') : t('logout')}</span>
          </button>
        )}

        {/* Version */}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-4">
          v{__APP_VERSION__} ({__GIT_HASH__})
        </p>

        {/* Delete Account / Delete Data - flat button at bottom */}
        {(isLoggedIn || isAnonymousCloud) && (
          <button
            type="button"
            onClick={() => {
              setDeleteUnderstanding(false);
              setShowDeleteConfirm(true);
            }}
            className="w-full py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 active:scale-[0.98] transition-all text-center"
          >
            {isAnonymousCloud ? t('account.deleteData.buttonLabel') : t('account.delete.buttonLabel')}
          </button>
        )}
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="upgrade_prompt"
        onSelectPlan={handleSelectPlan}
      />

      {/* Error modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setErrorMessage(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              Error
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !deletingAccount && setShowDeleteConfirm(false)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            {/* Warning Icon */}
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Title */}
            <h3 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-gray-50">
              {isAnonymousCloud ? t('account.deleteData.confirmTitle') : t('account.delete.confirmTitle')}
            </h3>

            {/* Warning Message */}
            <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
              {isAnonymousCloud ? t('account.deleteData.confirmMessage') : t('account.delete.confirmMessage')}
            </p>

            {/* Data List */}
            <div className="mb-4 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
              <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400">•</span>
                  <span>{t('account.delete.dataList.transactions')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400">•</span>
                  <span>{t('account.delete.dataList.categories')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400">•</span>
                  <span>{t('account.delete.dataList.settings')}</span>
                </li>
                {isLoggedIn && (
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400">•</span>
                    <span>{t('account.delete.dataList.subscription')}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Warning Badge */}
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 text-center">
                ⚠️ {t('account.delete.warning')}
              </p>
            </div>

            {/* Understanding Checkbox */}
            <label className="mb-4 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteUnderstanding}
                onChange={(e) => setDeleteUnderstanding(e.target.checked)}
                disabled={deletingAccount}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('account.delete.understanding')}
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteUnderstanding(false);
                }}
                disabled={deletingAccount}
                className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {t('account.delete.cancelButton')}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!deleteUnderstanding || deletingAccount}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:bg-red-300 transition-colors"
              >
                {deletingAccount
                  ? t('account.delete.deleting')
                  : isAnonymousCloud
                    ? t('account.deleteData.deleteButton')
                    : t('account.delete.deleteButton')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Error Modal */}
      {deleteError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteError(null)}
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('account.delete.errorTitle')}
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {deleteError}
            </p>
            <button
              type="button"
              onClick={() => setDeleteError(null)}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  showBadge?: boolean;
  showToggle?: boolean;
  toggleValue?: boolean;
};

function MenuItem({ icon, label, sublabel, onClick, showBadge, showToggle, toggleValue }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{label}</span>
        {sublabel && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sublabel}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showBadge && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            !
          </span>
        )}
        {showToggle ? (
          <div className={`relative h-8 w-14 rounded-full transition-all ${
            toggleValue ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
          }`}>
            <span className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
              toggleValue ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </div>
        ) : (
          <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
        )}
      </div>
    </button>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red-500"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
