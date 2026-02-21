/**
 * UI Constants
 * Centralized values for consistent UI behavior across the app
 */

/**
 * Z-Index Layers
 * CRITICAL: Never overlap these values to maintain proper stacking context
 */
export const Z_INDEX = {
  /** Header/PageHeader */
  HEADER: 10,
  /** Sticky elements */
  STICKY: 20,
  /** Fixed bottom buttons */
  FIXED_BUTTON: 30,
  /** FAB button and Drawers/CategoryPicker */
  FAB: 40,
  /** BottomBar and Modals */
  MODAL: 50,
  /** Bottom Sheets */
  BOTTOM_SHEET: 70,
  /** DatePicker and SetLimitModal */
  DATE_PICKER: 80,
  /** Wizard/Onboarding */
  WIZARD: 85,
  /** SplashScreen (highest) */
  SPLASH: 100,
} as const;

/**
 * Timing Constants (milliseconds)
 */
export const TIMING = {
  /** Debounce time for cloud sync operations */
  DEBOUNCE_SYNC_MS: 1200,
  /** Splash screen display duration */
  SPLASH_DURATION_MS: 900,
  /** Animation duration for modals/sheets */
  ANIMATION_DURATION_MS: 300,
  /** Toast notification duration */
  TOAST_DURATION_MS: 3000,
} as const;

/**
 * Layout Constants
 */
export const LAYOUT = {
  /** FAB button bottom offset (above BottomBar) */
  FAB_BOTTOM_OFFSET_PX: 96,
  /** Bottom padding for pages with BottomBar */
  BOTTOM_BAR_PADDING_PX: 112, // pb-28 = 7rem = 112px
} as const;
