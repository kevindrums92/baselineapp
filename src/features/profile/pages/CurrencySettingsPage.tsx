/**
 * CurrencySettingsPage
 * Página completa para seleccionar moneda
 */

import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useCurrency,
  CURRENCY_REGIONS,
  searchCurrencies,
  type CurrencyInfo,
  type CurrencyRegion,
} from '@/features/currency';
import { useKeyboardDismiss } from '@/hooks/useKeyboardDismiss';
import PageHeader from '@/shared/components/layout/PageHeader';

export default function CurrencySettingsPage() {
  const { t, i18n } = useTranslation('profile');
  const { currency, setCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');

  // Dismiss keyboard on scroll or touch outside
  useKeyboardDismiss();

  const isSpanish = i18n.language?.startsWith('es');

  const filteredCurrencies = useMemo(() => {
    return searchCurrencies(searchQuery);
  }, [searchQuery]);

  const groupedCurrencies = useMemo(() => {
    if (searchQuery) {
      // Si hay búsqueda, mostrar resultados sin agrupar
      return null;
    }

    const groups: Record<CurrencyRegion, CurrencyInfo[]> = {
      america: [],
      europe: [],
      asia: [],
      africa: [],
    };

    filteredCurrencies.forEach((c) => {
      groups[c.region].push(c);
    });

    return groups;
  }, [filteredCurrencies, searchQuery]);

  const handleCurrencySelect = (code: string) => {
    setCurrency(code);
  };

  const renderCurrencyButton = (curr: CurrencyInfo) => {
    const isSelected = currency === curr.code;

    return (
      <button
        key={curr.code}
        type="button"
        onClick={() => handleCurrencySelect(curr.code)}
        className={`flex w-full items-center justify-between rounded-xl p-4 shadow-sm transition-colors ${
          isSelected
            ? 'bg-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
            : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{curr.flag}</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              {curr.code}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {curr.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {curr.symbol}
          </span>
          {isSelected && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#18B7B0]">
              <Check className="h-4 w-4 text-white" strokeWidth={3} />
            </div>
          )}
        </div>
      </button>
    );
  };

  const renderRegionGroup = (region: CurrencyRegion, currencies: CurrencyInfo[]) => {
    if (currencies.length === 0) return null;

    const label = isSpanish
      ? CURRENCY_REGIONS[region].labelEs
      : CURRENCY_REGIONS[region].labelEn;

    return (
      <div key={region} className="mb-6">
        <h4 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </h4>
        <div className="space-y-2">
          {currencies.map(renderCurrencyButton)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader title={t('preferences.currency.label')} />

      {/* Search Section */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('preferences.currency.search', 'Buscar moneda...')}
            className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 pl-9 pr-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#18B7B0] shadow-sm"
          />
        </div>
      </div>

      {/* Currency List */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        {groupedCurrencies ? (
          // Mostrar agrupado por región
          <>
            {renderRegionGroup('america', groupedCurrencies.america)}
            {renderRegionGroup('europe', groupedCurrencies.europe)}
            {renderRegionGroup('asia', groupedCurrencies.asia)}
            {renderRegionGroup('africa', groupedCurrencies.africa)}
          </>
        ) : (
          // Mostrar resultados de búsqueda sin agrupar
          <div className="space-y-2">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map(renderCurrencyButton)
            ) : (
              <div className="rounded-xl bg-white dark:bg-gray-900 p-8 text-center shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('preferences.currency.noResults', 'No se encontraron monedas')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
