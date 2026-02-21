/**
 * Screen3_Currency
 * Pantalla 3 de First Config: Selección de moneda
 * Con búsqueda, moneda recomendada y grupos por región
 */

import { DollarSign, Check, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../../../OnboardingContext';
import {
  CURRENCY_REGIONS,
  STORAGE_KEY,
  searchCurrencies,
  getRecommendedCurrency,
  type CurrencyInfo,
  type CurrencyRegion,
} from '@/features/currency';
import FullscreenLayout from '@/shared/components/layout/FullscreenLayout';
import ProgressDots from '../../../components/ProgressDots';

export default function Screen3_Currency() {
  const { t, i18n } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const { state, setCurrency } = useOnboarding();

  const isSpanish = i18n.language?.startsWith('es');

  // Obtener moneda recomendada basada en detección
  const recommendedCurrency = useMemo(() => getRecommendedCurrency(), []);

  const [selected, setSelected] = useState(
    state.selections.currency || recommendedCurrency.code
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar monedas según búsqueda
  const filteredCurrencies = useMemo(() => {
    return searchCurrencies(searchQuery);
  }, [searchQuery]);

  // Agrupar monedas por región (solo si no hay búsqueda)
  const groupedCurrencies = useMemo(() => {
    if (searchQuery) return null;

    const groups: Record<CurrencyRegion, CurrencyInfo[]> = {
      america: [],
      europe: [],
      asia: [],
      africa: [],
    };

    // Excluir la moneda recomendada de los grupos para mostrarla arriba
    filteredCurrencies
      .filter((c) => c.code !== recommendedCurrency.code)
      .forEach((c) => {
        groups[c.region].push(c);
      });

    return groups;
  }, [filteredCurrencies, searchQuery, recommendedCurrency.code]);

  const handleContinue = () => {
    setCurrency(selected);
    // También guardar en localStorage para CurrencyProvider
    localStorage.setItem(STORAGE_KEY, selected);
    navigate('/onboarding/config/4', { replace: true });
  };

  const handleSkip = () => {
    // Guardar la moneda recomendada como default
    localStorage.setItem(STORAGE_KEY, recommendedCurrency.code);
    navigate('/onboarding/config/4', { replace: true });
  };

  const renderCurrencyButton = (currency: CurrencyInfo, highlighted = false) => (
    <button
      key={currency.code}
      type="button"
      onClick={() => setSelected(currency.code)}
      className={`flex w-full items-center justify-between rounded-xl p-3.5 shadow-sm transition-all active:scale-[0.98] ${
        highlighted
          ? 'bg-gradient-to-br from-[#18B7B0]/20 to-[#18B7B0]/10 dark:from-[#18B7B0]/30 dark:to-[#18B7B0]/20 ring-2 ring-[#18B7B0]'
          : selected === currency.code
          ? 'bg-white dark:bg-gray-900 ring-2 ring-[#18B7B0]'
          : 'bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{currency.flag}</div>
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {currency.code}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{currency.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {currency.symbol}
        </span>
        {selected === currency.code && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#18B7B0]">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  );

  const renderRegionGroup = (region: CurrencyRegion, currencies: CurrencyInfo[]) => {
    if (currencies.length === 0) return null;

    const label = isSpanish
      ? CURRENCY_REGIONS[region].labelEs
      : CURRENCY_REGIONS[region].labelEn;

    return (
      <div key={region} className="mb-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </h4>
        <div className="space-y-2">
          {currencies.map((c) => renderCurrencyButton(c))}
        </div>
      </div>
    );
  };

  return (
    <FullscreenLayout
      headerCenter={<ProgressDots total={4} current={3} />}
      headerRight={
        <button
          type="button"
          onClick={handleSkip}
          className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
        >
          {t('currency.skip')}
        </button>
      }
      contentClassName="pb-8 md:pb-12 flex flex-col"
      ctaButton={
        <div className="space-y-3">
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            {t('currency.note')}
          </p>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
          >
            {t('currency.continue')}
          </button>
        </div>
      }
    >
      {/* Header */}
      <div className="flex flex-col items-center pb-4">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#18B7B0] to-[#0F8580] shadow-lg">
          <DollarSign size={32} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-2 text-center text-2xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {t('currency.title')}
        </h1>

        <p className="max-w-md text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {t('currency.description')}
        </p>
      </div>

      {/* Search */}
      <div className="z-10 bg-gray-50 dark:bg-gray-950 -mx-6 px-6 pb-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('currency.search', 'Buscar moneda...')}
            className="w-full rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#18B7B0]"
          />
        </div>
      </div>

      {/* Currency options */}
      <div className="mt-3 flex-1">
        {groupedCurrencies ? (
          <>
            {/* Moneda recomendada */}
            {!searchQuery && (
              <div className="mb-5">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t('currency.recommended', 'Recomendada para ti')}
                </h4>
                {renderCurrencyButton(recommendedCurrency, selected === recommendedCurrency.code)}
              </div>
            )}

            {/* Grupos por región */}
            {renderRegionGroup('america', groupedCurrencies.america)}
            {renderRegionGroup('europe', groupedCurrencies.europe)}
            {renderRegionGroup('asia', groupedCurrencies.asia)}
            {renderRegionGroup('africa', groupedCurrencies.africa)}
          </>
        ) : (
          // Resultados de búsqueda
          <div className="space-y-2">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((c) => renderCurrencyButton(c))
            ) : (
              <div className="py-12 text-center">
                <DollarSign className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700" />
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {t('currency.noResults', 'No se encontró ninguna moneda')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </FullscreenLayout>
  );
}
