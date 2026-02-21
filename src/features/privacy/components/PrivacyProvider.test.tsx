import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@/test/test-utils';
import { PrivacyProvider } from './PrivacyProvider';
import { usePrivacy } from '../hooks/usePrivacy';
import { CurrencyProvider } from '@/features/currency';

// Helper component to test the hook
function TestComponent() {
  const { privacyMode, togglePrivacyMode, formatWithPrivacy } = usePrivacy();

  return (
    <div>
      <p data-testid="privacy-mode">{privacyMode ? 'ON' : 'OFF'}</p>
      <button onClick={togglePrivacyMode}>Toggle</button>
      <p data-testid="formatted-amount">
        {formatWithPrivacy('$ 1.500.000', '$')}
      </p>
    </div>
  );
}

// Wrapper function to render component with required providers
function renderWithProviders(component: React.ReactElement) {
  return render(
    <CurrencyProvider>
      <PrivacyProvider>{component}</PrivacyProvider>
    </CurrencyProvider>
  );
}

describe('PrivacyProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should start with privacy mode OFF by default', () => {
      renderWithProviders(<TestComponent />);

      const mode = screen.getByTestId('privacy-mode');
      expect(mode).toHaveTextContent('OFF');
    });

    it('should load privacy mode from localStorage on mount', () => {
      // Set privacy mode to ON in localStorage
      localStorage.setItem('app_privacy_mode', '1');

      renderWithProviders(<TestComponent />);

      const mode = screen.getByTestId('privacy-mode');
      expect(mode).toHaveTextContent('ON');
    });

    it('should default to OFF when localStorage is empty', () => {
      renderWithProviders(<TestComponent />);

      const mode = screen.getByTestId('privacy-mode');
      expect(mode).toHaveTextContent('OFF');
    });

    it('should handle localStorage read errors gracefully', () => {
      // Mock localStorage.getItem to throw error
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      renderWithProviders(<TestComponent />);

      const mode = screen.getByTestId('privacy-mode');
      expect(mode).toHaveTextContent('OFF'); // Should fallback to default

      getItemSpy.mockRestore();
    });
  });

  describe('Toggle functionality', () => {
    it('should toggle privacy mode from OFF to ON', () => {
      renderWithProviders(<TestComponent />);

      const mode = screen.getByTestId('privacy-mode');
      const toggleButton = screen.getByText('Toggle');

      expect(mode).toHaveTextContent('OFF');

      fireEvent.click(toggleButton);

      expect(mode).toHaveTextContent('ON');
    });

    it('should toggle privacy mode from ON to OFF', () => {
      localStorage.setItem('app_privacy_mode', '1');
      renderWithProviders(<TestComponent />);

      const mode = screen.getByTestId('privacy-mode');
      const toggleButton = screen.getByText('Toggle');

      expect(mode).toHaveTextContent('ON');

      fireEvent.click(toggleButton);

      expect(mode).toHaveTextContent('OFF');
    });

    it('should toggle multiple times correctly', () => {
      renderWithProviders(<TestComponent />);

      const mode = screen.getByTestId('privacy-mode');
      const toggleButton = screen.getByText('Toggle');

      expect(mode).toHaveTextContent('OFF');

      fireEvent.click(toggleButton);
      expect(mode).toHaveTextContent('ON');

      fireEvent.click(toggleButton);
      expect(mode).toHaveTextContent('OFF');

      fireEvent.click(toggleButton);
      expect(mode).toHaveTextContent('ON');
    });
  });

  describe('localStorage persistence', () => {
    it('should persist privacy mode to localStorage when toggled ON', () => {
      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle');
      fireEvent.click(toggleButton);

      expect(localStorage.getItem('app_privacy_mode')).toBe('1');
    });

    it('should remove from localStorage when toggled OFF', () => {
      localStorage.setItem('app_privacy_mode', '1');
      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle');
      fireEvent.click(toggleButton);

      expect(localStorage.getItem('app_privacy_mode')).toBeNull();
    });

    it('should handle localStorage write errors gracefully', () => {
      // Mock localStorage.setItem to throw error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle');

      // Should not crash (this is the important part)
      expect(() => fireEvent.click(toggleButton)).not.toThrow();

      // Privacy mode should still toggle (state update happens despite localStorage error)
      const mode = screen.getByTestId('privacy-mode');
      expect(mode).toHaveTextContent('ON');

      setItemSpy.mockRestore();
    });

    it('should handle localStorage remove errors gracefully', () => {
      localStorage.setItem('app_privacy_mode', '1');

      // Mock localStorage.removeItem to throw error
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      removeItemSpy.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle');

      // Should not crash (this is the important part)
      expect(() => fireEvent.click(toggleButton)).not.toThrow();

      // Privacy mode should still toggle (state update happens despite localStorage error)
      const mode = screen.getByTestId('privacy-mode');
      expect(mode).toHaveTextContent('OFF');

      removeItemSpy.mockRestore();
    });
  });

  describe('formatWithPrivacy function', () => {
    it('should return original amount when privacy mode is OFF', () => {
      renderWithProviders(<TestComponent />);

      const formattedAmount = screen.getByTestId('formatted-amount');
      expect(formattedAmount).toHaveTextContent('$ 1.500.000');
    });

    it('should return censored amount when privacy mode is ON', () => {
      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle');
      fireEvent.click(toggleButton); // Turn ON

      const formattedAmount = screen.getByTestId('formatted-amount');
      expect(formattedAmount).toHaveTextContent('$ -----');
    });

    it('should use correct currency symbol in censored format', () => {
      function TestComponentWithCurrencies() {
        const { formatWithPrivacy, togglePrivacyMode } = usePrivacy();

        return (
          <div>
            <button onClick={togglePrivacyMode}>Toggle</button>
            <p data-testid="cop-amount">{formatWithPrivacy('$ 1.500.000', '$')}</p>
            <p data-testid="usd-amount">{formatWithPrivacy('$ 1,500.00', '$')}</p>
            <p data-testid="eur-amount">{formatWithPrivacy('€ 1.500,00', '€')}</p>
            <p data-testid="gtq-amount">{formatWithPrivacy('Q 1,500.00', 'Q')}</p>
          </div>
        );
      }

      renderWithProviders(<TestComponentWithCurrencies />);

      const toggleButton = screen.getByText('Toggle');
      fireEvent.click(toggleButton); // Turn ON

      expect(screen.getByTestId('cop-amount')).toHaveTextContent('$ -----');
      expect(screen.getByTestId('usd-amount')).toHaveTextContent('$ -----');
      expect(screen.getByTestId('eur-amount')).toHaveTextContent('€ -----');
      expect(screen.getByTestId('gtq-amount')).toHaveTextContent('Q -----');
    });

    it('should handle empty formatted amount', () => {
      function TestComponentEmpty() {
        const { formatWithPrivacy, togglePrivacyMode } = usePrivacy();

        return (
          <div>
            <button onClick={togglePrivacyMode}>Toggle</button>
            <p data-testid="empty-amount">{formatWithPrivacy('', '$')}</p>
          </div>
        );
      }

      renderWithProviders(<TestComponentEmpty />);

      const toggleButton = screen.getByText('Toggle');
      fireEvent.click(toggleButton); // Turn ON

      expect(screen.getByTestId('empty-amount')).toHaveTextContent('$ -----');
    });
  });

  describe('usePrivacy hook', () => {
    it('should throw error when used outside PrivacyProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePrivacy());
      }).toThrow('usePrivacy must be used within PrivacyProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should provide correct context value', () => {
      const { result } = renderHook(() => usePrivacy(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <CurrencyProvider>
            <PrivacyProvider>{children}</PrivacyProvider>
          </CurrencyProvider>
        ),
      });

      expect(result.current).toHaveProperty('privacyMode');
      expect(result.current).toHaveProperty('togglePrivacyMode');
      expect(result.current).toHaveProperty('formatWithPrivacy');
      expect(typeof result.current.privacyMode).toBe('boolean');
      expect(typeof result.current.togglePrivacyMode).toBe('function');
      expect(typeof result.current.formatWithPrivacy).toBe('function');
    });
  });

  describe('React strict mode compatibility', () => {
    it('should not double-toggle in strict mode', () => {
      // React.StrictMode intentionally double-invokes effects in development
      // This test ensures our toggle logic is idempotent
      renderWithProviders(<TestComponent />);

      const mode = screen.getByTestId('privacy-mode');
      expect(mode).toHaveTextContent('OFF');

      const toggleButton = screen.getByText('Toggle');
      fireEvent.click(toggleButton);

      expect(mode).toHaveTextContent('ON');
      expect(localStorage.getItem('app_privacy_mode')).toBe('1');
    });
  });
});
