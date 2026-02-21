import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage with proper Object.keys() support
function createLocalStorageMock() {
  let store: Record<string, string> = {};

  // Create a proxy that makes stored keys enumerable
  return new Proxy(
    {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key(index: number) {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
    },
    {
      ownKeys: () => {
        // Return store keys for Object.keys(localStorage)
        return Object.keys(store);
      },
      getOwnPropertyDescriptor: (target, prop) => {
        if (typeof prop === 'string' && prop in store) {
          return {
            enumerable: true,
            configurable: true,
            value: store[prop],
          };
        }
        return Object.getOwnPropertyDescriptor(target, prop);
      },
    }
  );
}

beforeEach(() => {
  // Create a fresh localStorage mock for each test
  const localStorageMock = createLocalStorageMock();

  // Mock localStorage (works in both jsdom and node)
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  } else {
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  }
});

// Mock window.matchMedia (only in jsdom)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock navigator (only in node environment)
if (typeof navigator === 'undefined') {
  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent:
        'Mozilla/5.0 (Node.js) AppleWebKit/537.36 (KHTML, like Gecko) vitest/2.1.9',
    },
    writable: true,
    configurable: true,
  });
}

// Mock Intl.DateTimeFormat (node has it, but just to be safe)
if (!Intl.DateTimeFormat) {
  Object.defineProperty(global.Intl, 'DateTimeFormat', {
    value: function () {
      return {
        resolvedOptions: () => ({ timeZone: 'America/New_York' }),
      };
    },
    writable: true,
    configurable: true,
  });
}
