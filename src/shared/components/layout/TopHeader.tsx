import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/state/app.store";
import { useSubscription } from "@/hooks/useSubscription";
import { useHeaderActions } from "@/shared/contexts/headerActions.context";
import { usePrivacy } from "@/features/privacy";
import MonthSelector from "@/shared/components/navigation/MonthSelector";
import { User, Eye, EyeOff } from "lucide-react";

type Props = {
  showMonthSelector?: boolean;
  isProfilePage?: boolean;
};

export default function TopHeader({ showMonthSelector = true, isProfilePage = false }: Props) {
  const { t } = useTranslation('common');

  // ✅ Read from Zustand store (single source of truth)
  const user = useAppStore((s) => s.user);
  const cloudMode = useAppStore((s) => s.cloudMode);
  const cloudStatus = useAppStore((s) => s.cloudStatus);

  // ✅ Check Pro status
  const { isPro } = useSubscription();

  // ✅ Privacy mode
  const { privacyMode, togglePrivacyMode } = usePrivacy();

  // ✅ Reactive network status (triggers re-render on online/offline)
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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

  const AvatarContent = useMemo(() => {
    if (user.avatarUrl) {
      return (
        <img
          src={user.avatarUrl}
          alt="Avatar"
          className="h-10 w-10 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        <User size={20} strokeWidth={1.8} />
      </div>
    );
  }, [user.avatarUrl]);

  // Sync indicator dot (for default mode)
  const syncDot = useMemo(() => {
    if (cloudMode === "guest") {
      return "bg-gray-400";
    }
    if (!isOnline || cloudStatus === "offline") {
      return "bg-gray-400";
    }
    if (cloudStatus === "syncing") {
      return "bg-[#18B7B0]";
    }
    if (cloudStatus === "error") {
      return "bg-amber-400";
    }
    return "bg-green-500"; // ok
  }, [cloudMode, cloudStatus, isOnline]);

  // Header actions from context (page-specific buttons)
  const { action: headerAction } = useHeaderActions();

  // Safe area padding for status bar (edge-to-edge on both platforms)
  const headerPaddingTop = 'max(env(safe-area-inset-top), 16px)';

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.30)]">
      <div
        className="mx-auto max-w-xl px-4 pb-2"
        style={{ paddingTop: headerPaddingTop }}
      >
        <div className="flex items-start justify-between">
          {/* Left: Logo + Content */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl bg-[#18B7B0] shadow-lg shadow-[#18B7B0]/20">
              <svg width="26" height="26" viewBox="0 0 60 60" fill="none">
                <rect x="10" y="35" width="8" height="15" rx="1" fill="white" fillOpacity="0.5"/>
                <rect x="26" y="25" width="8" height="25" rx="1" fill="white" fillOpacity="0.5"/>
                <rect x="42" y="20" width="8" height="30" rx="1" fill="white" fillOpacity="0.5"/>
                <path d="M8 40 L22 28 L36 32 L52 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Profile Mode: Configuration Title */}
            {isProfilePage ? (
              <div>
                <h1 className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-50">{t('settings.title')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight">{t('settings.subtitle')}</p>
              </div>
            ) : (
              /* Default Mode: App Name + Month Selector */
              <div>
                <h1 className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-50">BaselineApp</h1>
                {showMonthSelector && (
                  <div className="mt-1">
                    <MonthSelector />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Privacy Toggle + Avatar - only show in default mode */}
          {!isProfilePage && (
            <div className="flex items-center gap-3">
              {/* Page-specific action or default privacy toggle */}
              {headerAction ?? (
                <button
                  type="button"
                  onClick={togglePrivacyMode}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 active:bg-gray-100 dark:active:bg-gray-800"
                  aria-label={privacyMode ? "Mostrar montos" : "Ocultar montos"}
                >
                  {privacyMode ? (
                    <EyeOff size={20} className="text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              )}

              {/* Avatar with Pro styling or default */}
              {isPro ? (
                <div className="relative shrink-0">
                  {/* Pro gradient border wrapper - Neon tech teal/purple */}
                  <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-[#18B7B0] via-purple-500 to-[#18B7B0] shadow-md shadow-[#18B7B0]/20">
                    {AvatarContent}
                    {/* Sync indicator dot (bottom-right) */}
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${syncDot}`} />
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-center">
                  {AvatarContent}
                  {/* Sync indicator dot */}
                  <span className={`absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${syncDot}`} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
