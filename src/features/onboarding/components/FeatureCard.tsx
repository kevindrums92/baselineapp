/**
 * FeatureCard
 * Tarjeta para mostrar características de la app en Welcome Onboarding
 */

import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  iconBgColor?: string;
  iconColor?: string;
  compact?: boolean;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  iconBgColor = 'bg-emerald-100',
  iconColor = 'text-emerald-600',
  compact = false,
}: FeatureCardProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-900 p-3 shadow-sm">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBgColor}`}>
          <Icon size={20} className={iconColor} strokeWidth={2.5} />
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{title}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${iconBgColor}`}>
        <Icon size={24} className={iconColor} strokeWidth={2.5} />
      </div>
      <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
      {description && (
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
}
