import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/shared/components/layout/PageHeader';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  const { t } = useTranslation('legal');

  // Reset scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader title={t('terms.title', 'Términos de Servicio')} />

      <div className="flex-1 px-4 pt-6 pb-20">
        <div className="mx-auto max-w-2xl">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/30">
              <FileText className="h-8 w-8 text-[#18B7B0]" />
            </div>
          </div>

          {/* Last Updated */}
          <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('lastUpdated', 'Última actualización')}: {t('lastUpdatedDate', '1 de febrero de 2026')}
          </p>

          {/* Content */}
          <div className="space-y-6 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">

            {/* Introduction */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                1. {t('terms.introduction.title', 'Introducción')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.introduction.content', 'Bienvenido a BaselineApp. Al usar nuestra aplicación, aceptas estos términos de servicio. BaselineApp es una aplicación de gestión de finanzas personales diseñada para ayudarte a rastrear tus gastos, ingresos y presupuestos.')}
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                2. {t('terms.service.title', 'Descripción del Servicio')}
              </h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.service.content', 'BaselineApp ofrece:')}
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>{t('terms.service.features.transactions', 'Seguimiento de transacciones (ingresos y gastos)')}</li>
                <li>{t('terms.service.features.categories', 'Gestión de categorías y presupuestos')}</li>
                <li>{t('terms.service.features.stats', 'Visualización de estadísticas financieras')}</li>
                <li>{t('terms.service.features.sync', 'Sincronización opcional en la nube')}</li>
                <li>{t('terms.service.features.guest', 'Modo invitado con almacenamiento local')}</li>
                <li>{t('terms.service.features.backup', 'Respaldo y exportación de datos')}</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                3. {t('terms.accounts.title', 'Cuentas de Usuario')}
              </h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.accounts.content', 'Puedes usar BaselineApp en dos modos:')}
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li><strong>{t('terms.accounts.guestMode', 'Modo Invitado:')}</strong> {t('terms.accounts.guestDescription', 'Tus datos se almacenan localmente en tu dispositivo. No se requiere cuenta.')}</li>
                <li><strong>{t('terms.accounts.cloudMode', 'Modo Cloud:')}</strong> {t('terms.accounts.cloudDescription', 'Al crear una cuenta, tus datos se sincronizan con nuestros servidores usando Supabase. Eres responsable de mantener la confidencialidad de tu cuenta.')}</li>
              </ul>
            </section>

            {/* Subscriptions and Payments */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                4. {t('terms.subscription.title', 'Suscripciones y Pagos')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.subscription.content', 'BaselineApp ofrece una suscripción Pro opcional que desbloquea funciones premium. Los pagos se procesan de forma segura a través de RevenueCat y las tiendas de aplicaciones (App Store, Google Play). Las suscripciones se renuevan automáticamente a menos que las canceles antes de la fecha de renovación. Puedes gestionar tu suscripción desde la configuración de tu cuenta en la tienda de aplicaciones correspondiente.')}
              </p>
            </section>

            {/* Data Ownership */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                5. {t('terms.ownership.title', 'Propiedad de Datos')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.ownership.content', 'Todos tus datos financieros son de tu propiedad. BaselineApp no comparte, vende ni utiliza tus datos para publicidad. Puedes exportar o eliminar tus datos en cualquier momento desde la configuración de la aplicación.')}
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                6. {t('terms.use.title', 'Uso Aceptable')}
              </h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.use.content', 'Al usar BaselineApp, aceptas:')}
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>{t('terms.use.rules.legal', 'Usar la aplicación solo para fines legales y personales')}</li>
                <li>{t('terms.use.rules.noAccess', 'No intentar acceder a datos de otros usuarios')}</li>
                <li>{t('terms.use.rules.noModify', 'No modificar, copiar o distribuir la aplicación sin autorización')}</li>
                <li>{t('terms.use.rules.noDamage', 'No usar la aplicación de manera que pueda dañar o interrumpir el servicio')}</li>
              </ul>
            </section>

            {/* Limitations */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                7. {t('terms.limitations.title', 'Limitación de Responsabilidad')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.limitations.content', 'BaselineApp se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables de pérdidas financieras, daños o imprecisiones en los datos. Es tu responsabilidad verificar la exactitud de tus registros financieros y realizar respaldos regulares de tus datos.')}
              </p>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                8. {t('terms.availability.title', 'Disponibilidad del Servicio')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.availability.content', 'Hacemos nuestro mejor esfuerzo para mantener BaselineApp disponible, pero no garantizamos un tiempo de actividad del 100%. Podemos suspender o descontinuar el servicio en cualquier momento con previo aviso.')}
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                9. {t('terms.changes.title', 'Cambios a los Términos')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.changes.content', 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios se publicarán en esta página con una fecha de actualización. Tu uso continuado de BaselineApp después de los cambios constituye tu aceptación de los nuevos términos.')}
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                10. {t('terms.contact.title', 'Contacto')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.contact.content', 'Si tienes preguntas sobre estos términos, puedes contactarnos a través de:')}
              </p>
              <p className="mt-2 text-sm font-medium text-[#18B7B0]">
                support@jotatech.org
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
