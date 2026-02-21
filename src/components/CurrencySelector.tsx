/**
 * CurrencySelector
 * Modal selector para cambiar la moneda de la aplicación
 */

import { useEffect, useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useCurrency,
  CURRENCY_REGIONS,
  searchCurrencies,
  type CurrencyInfo,
  type CurrencyRegion,
} from '@/features/currency';

interface CurrencySelectorProps {
  open: boolean;
  onClose: () => void;
}

export default function CurrencySelector({ open, onClose }: CurrencySelectorProps) {
  const { t, i18n } = useTranslation('profile');
  const { currency, setCurrency } = useCurrency();
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isSpanish = i18n.language?.startsWith('es');

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setSearchQuery('');
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

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

  if (!isVisible) return null;

  const handleCurrencySelect = (code: string) => {
    setCurrency(code);
    onClose();
  };

  const renderCurrencyButton = (curr: CurrencyInfo) => {
    const isSelected = currency === curr.code;

    return (
      <button
        key={curr.code}
        type="button"
        onClick={() => handleCurrencySelect(curr.code)}
        className={`flex w-full items-center justify-between rounded-xl p-3 transition-colors ${
          isSelected
            ? 'bg-[#18B7B0]/10 ring-2 ring-[#18B7B0]'
            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
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
      <div key={region} className="mb-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </h4>
        <div className="space-y-2">
          {currencies.map(renderCurrencyButton)}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 dark:bg-black/70 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative mx-4 w-full max-w-sm max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-xl transform transition-all duration-200 ${
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 pb-3">
          <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t('preferences.currency.label')}
          </h3>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('preferences.currency.search', 'Buscar moneda...')}
              className="w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#18B7B0]"
            />
          </div>
        </div>

        {/* Currency list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
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
                <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t('preferences.currency.noResults', 'No se encontraron monedas')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Cancel button */}
        <div className="p-4 pt-0 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {t('preferences.language.cancel', 'Cancelar')}
          </button>
        </div>
      </div>
    </div>
  );
}
