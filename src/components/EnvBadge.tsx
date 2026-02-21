import { ENV } from "@/config/env";

/**
 * Environment badge component
 *
 * Shows the current environment (DEV/PROD) at the top of the screen.
 * Only visible in development mode to help developers identify which
 * environment they're working with.
 *
 * Usage:
 * <EnvBadge />
 */
export default function EnvBadge() {
  // Don't render anything in production
  if (ENV.isProd) {
    return null;
  }

  return (
    <div className="fixed top-2 right-2 z-[100] pointer-events-none">
      <div className="flex items-center gap-2 rounded-lg bg-teal-500 px-3 py-1.5 shadow-lg">
        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <span className="text-xs font-semibold text-white uppercase tracking-wide">
          {ENV.name}
        </span>
      </div>
    </div>
  );
}
