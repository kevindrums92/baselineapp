/**
 * FullscreenLayout
 *
 * Shared layout component for fullscreen screens (onboarding, paywall, wizards).
 * Uses h-dvh with flex column: header (shrink-0) + scrollable content (flex-1) + CTA button (shrink-0).
 *
 * Features:
 * - Exact viewport height (h-dvh)
 * - Safe area insets for mobile devices
 * - Three-column header layout (left, center, right)
 * - Scrollable main content area
 * - Fixed CTA button at bottom
 * - Dark mode support
 */

import { type ReactNode } from 'react';

type FullscreenLayoutProps = {
  // Header sections (three-column layout)
  headerLeft?: ReactNode;    // Back button, close button, or spacer
  headerCenter?: ReactNode;  // Progress dots, title, or nothing
  headerRight?: ReactNode;   // Skip button, close button, or spacer

  // Main content (scrollable)
  children: ReactNode;

  // CTA Button at bottom (fixed)
  ctaButton?: ReactNode;

  // Optional styling
  className?: string;          // Additional classes for outer container
  contentClassName?: string;   // Additional classes for main content
};

export default function FullscreenLayout({
  headerLeft,
  headerCenter,
  headerRight,
  children,
  ctaButton,
  className = '',
  contentClassName = '',
}: FullscreenLayoutProps) {
  return (
    <div
      className={`flex h-dvh flex-col bg-gray-50 dark:bg-gray-950 ${className}`}
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
      }}
    >
      {/* Header - shrink-0 (three-column layout) */}
      <header className="z-10 flex shrink-0 items-center justify-between px-6 pb-2 pt-4">
        {/* Left: Back/Close button or spacer */}
        {headerLeft || <div className="h-10 w-10" />}

        {/* Center: Progress dots, title, or nothing */}
        {headerCenter}

        {/* Right: Skip/Close button or spacer */}
        {headerRight || <div className="h-10 w-10" />}
      </header>

      {/* Main Content - flex-1 overflow-y-auto (SCROLLABLE) */}
      <main className={`flex-1 overflow-y-auto px-6 pt-4 ${contentClassName}`}>
        {children}
      </main>

      {/* CTA Button - shrink-0 (FIXED at bottom, NOT absolute) */}
      {ctaButton && (
        <div className="shrink-0 px-6 pt-4 pb-2">
          {ctaButton}
        </div>
      )}
    </div>
  );
}
