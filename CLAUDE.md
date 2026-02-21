# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Project

**BaselineApp** is a reusable app template extracted from a production app. It provides all common infrastructure needed to start building any new mobile/web app:

- Authentication (Email OTP, Google, Apple OAuth)
- Cloud sync (offline-first with Supabase)
- Subscriptions (RevenueCat + App Store/Google Play)
- Push notifications (Firebase Cloud Messaging)
- Biometric authentication
- Internationalization (es, en, pt, fr)
- Theming (light/dark/system)
- Multi-currency support
- Ads (AdMob banners)
- Error tracking (Sentry)
- PWA + Capacitor (iOS/Android)

## Build & Development Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint on all files
npm run test         # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run preview      # Preview production build locally
npm run start        # Run Express server (serves dist/)

# Mobile
npm run ios:dev      # Build + sync + open in Xcode (dev)
npm run ios:prod     # Build + sync + open in Xcode (prod)
npm run android:dev  # Build + sync + open in Android Studio (dev)
```

## Architecture Overview

**Local-first PWA** built with React 19 + TypeScript + Vite. Data is stored in localStorage by default (guest mode) and optionally synced to Supabase when authenticated.

### Key Patterns

**State Management**: Zustand store (`src/state/app.store.ts`) is the single source of truth. It:
- Hydrates from localStorage on init via `loadState()`
- Auto-persists on every mutation via `saveState()`
- Exposes `getSnapshot()` and `replaceAllData()` for cloud sync

**Cloud Sync Flow** (`src/shared/components/providers/CloudSyncGate.tsx`):
- Cloud mode: users with a Supabase session sync to `user_state` table
- Guest mode: fallback only when no session is possible
- Offline-first: pending changes stored via `pendingSync.service.ts`, pushed when online

**Routing**: React Router v7 with lazy-loaded pages. Form routes hide the header/bottom bar.

### Directory Structure

```
src/
├── state/           # Zustand store (app.store.ts)
├── types/           # TypeScript types (app.types.ts)
├── services/        # Business services (storage, cloud, subscription, push, etc.)
├── lib/             # External lib config (Supabase, Sentry)
├── config/          # App config (env vars)
├── constants/       # App constants (pricing)
├── hooks/           # Custom React hooks
├── features/        # Feature modules
│   ├── auth/        # Authentication (OTP, OAuth)
│   ├── biometric/   # Biometric lock
│   ├── currency/    # Multi-currency
│   ├── notifications/ # Push notifications settings
│   ├── onboarding/  # Welcome + First Config flow
│   ├── privacy/     # Privacy overlay
│   ├── profile/     # Profile, settings, subscription management
│   ├── session/     # Session expiration
│   └── theme/       # Light/dark/system theme
├── shared/          # Shared components, utils, contexts
│   ├── components/  # Layout, modals, providers, UI
│   ├── contexts/    # React contexts
│   └── utils/       # Utility functions
├── i18n/            # Internationalization (4 locales)
└── App.tsx          # Root component with provider tree
```

### Path Alias

`@/` maps to `src/` (configured in vite.config.ts)

### Environment Variables

Requires `.env.local` with:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN` (optional)

## Critical Rules

### Git Workflow
**NEVER commit or push without explicit user authorization.**

### Shared Utilities
Always use existing utility services:
- **Dates**: `src/services/dates.service.ts` (use `todayISO()`)
- **Network**: `src/services/network.service.ts` (use `getNetworkStatus()`)
- **Currency**: `src/features/currency` (use `useCurrency()` hook, never hardcode `$`)
- **Browser**: `src/shared/utils/browser.utils.ts` (use `openUrl()` for external links)
- **OAuth**: `src/shared/utils/oauth.utils.ts` (use `signInWithOAuthInAppBrowser()`)

### UI Components
- **Headers**: Use `TopHeader` (main pages) or `PageHeader` (detail pages). Never create custom headers.
- **Modals**: Never use `alert()`, `confirm()`, `prompt()`. Use custom modals.
- **Icons**: Use `lucide-react` exclusively
- **Colors**: Primary accent `#18B7B0`, success `emerald-500`, destructive `red-500`
- **Page backgrounds**: `bg-gray-50` (pages), `bg-white` (cards)
