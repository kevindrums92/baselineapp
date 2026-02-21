/**
 * ConfigScreen
 * Pantalla de configuración inicial - skippeable
 * Por ahora es un placeholder simple hasta implementar features reales
 */

import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { markOnboardingComplete } from '../../utils/onboarding.helpers';
import { useOnboarding } from '../../OnboardingContext';

export default function ConfigScreen() {
  const navigate = useNavigate();
  const { skipConfig } = useOnboarding();

  /**
   * Completa el onboarding y va a la app
   */
  const handleComplete = () => {
    console.log('[ConfigScreen] Completing onboarding → App');
    markOnboardingComplete();
    navigate('/', { replace: true });
  };

  /**
   * Skip config: marca como skipped y completa onboarding
   */
  const handleSkip = () => {
    console.log('[ConfigScreen] Config skipped → App');
    skipConfig();
    markOnboardingComplete();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-16 pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#18B7B0] to-[#0F8580] shadow-lg">
          <Sparkles size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
          ¡Todo listo para
          <br />
          comenzar!
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600">
          Ya puedes empezar a gestionar tus finanzas. Las configuraciones avanzadas estarán disponibles en tu perfil.
        </p>
      </div>

      {/* Features preview */}
      <div className="mx-6 space-y-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">📊 Registra tus movimientos</p>
          <p className="mt-1 text-xs text-gray-600">
            Agrega ingresos y gastos fácilmente
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">💰 Crea presupuestos</p>
          <p className="mt-1 text-xs text-gray-600">
            Controla tus gastos por categorías
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">📈 Analiza tus datos</p>
          <p className="mt-1 text-xs text-gray-600">
            Visualiza tus patrones de gasto
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-16 flex-1 px-6 pb-8">
        <div className="space-y-3">
          {/* Botón principal: Comenzar */}
          <button
            type="button"
            onClick={handleComplete}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#18B7B0] py-4 font-semibold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
          >
            <span>Comenzar a usar BaselineApp</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Link: Omitir (por si quieren configurar después) */}
          <button
            type="button"
            onClick={handleSkip}
            className="flex w-full items-center justify-center py-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            Omitir configuración
          </button>
        </div>

        {/* Nota sobre configuración */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Podrás personalizar idioma, tema y otras opciones desde tu perfil en cualquier momento.
        </p>
      </div>
    </div>
  );
}
