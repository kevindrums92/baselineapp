import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/config';
import type { ReactElement, ReactNode } from 'react';

// Set language to Spanish for consistent testing
i18n.changeLanguage('es');

// Custom render function that includes common providers
function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>{children}</BrowserRouter>
    </I18nextProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
