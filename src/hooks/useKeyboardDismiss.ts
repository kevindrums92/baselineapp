import { useEffect } from "react";

/**
 * Hook that automatically dismisses the keyboard when:
 * - User manually scrolls (not auto-scroll from focusing)
 * - User touches outside the active input field
 *
 * This provides a native mobile app feel where the keyboard
 * closes on interaction outside the input area.
 *
 * Usage: Simply call the hook at the top level of any component
 * that has input fields where you want this behavior.
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   useKeyboardDismiss();
 *   return <input type="text" />;
 * }
 * ```
 */
export function useKeyboardDismiss() {
  useEffect(() => {
    let lastFocusTime = 0;
    let touchStartY = 0;
    let touchStartedOnInput = false;

    const SCROLL_THRESHOLD = 15; // px - minimum movement to count as a real scroll

    const handleTouchStart = (e: TouchEvent) => {
      const activeElement = document.activeElement;
      const target = e.target as Node;

      // Track touch origin for touchmove filtering
      touchStartY = e.touches[0].clientY;
      touchStartedOnInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        // Also check if touch is inside the active input (covers wrapper elements)
        (activeElement instanceof HTMLElement && activeElement.contains(target));

      // If touching an input/textarea, don't close keyboard
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // If there's an active input and touch is outside it, close keyboard
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      ) {
        if (!activeElement.contains(target) && activeElement !== target) {
          requestAnimationFrame(() => {
            (activeElement as HTMLElement).blur();
          });
        }
      }
    };

    // Detect user-initiated scroll (via touch)
    const handleTouchMove = (e: TouchEvent) => {
      // Skip if touch started on the active input (user is repositioning cursor)
      if (touchStartedOnInput) return;

      // Only blur on real scroll (movement exceeds threshold)
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
      if (deltaY < SCROLL_THRESHOLD) return;

      const timeSinceFocus = Date.now() - lastFocusTime;
      if (timeSinceFocus > 500) {
        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement
        ) {
          requestAnimationFrame(() => {
            (activeElement as HTMLElement).blur();
          });
        }
      }
    };

    // Track when inputs are focused
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        lastFocusTime = Date.now();
      }
    };

    // Add listeners
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("focusin", handleFocusIn, true);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("focusin", handleFocusIn, true);
    };
  }, []);
}
