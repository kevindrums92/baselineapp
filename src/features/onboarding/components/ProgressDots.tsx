/**
 * ProgressDots
 * Indicadores de progreso para navegación del onboarding
 */


interface ProgressDotsProps {
  total: number;
  current: number;
  variant?: 'default' | 'bar';
}

export default function ProgressDots({
  total,
  current,
  variant = 'default',
}: ProgressDotsProps) {
  if (variant === 'bar') {
    // Progress bar variant
    const percentage = (current / total) * 100;

    return (
      <div className="flex h-2 w-24 items-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-[#18B7B0] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }

  // Dots variant (default)
  return (
    <div className="flex flex-row items-center gap-2">
      {Array.from({ length: total }).map((_, index) => {
        const dotNumber = index + 1;
        const isActive = dotNumber === current;
        const isPast = dotNumber < current;

        return (
          <div
            key={dotNumber}
            className={`h-2 rounded-full transition-all duration-300 ${
              isActive
                ? 'w-6 bg-[#18B7B0]'
                : isPast
                  ? 'w-2 bg-[#18B7B0] opacity-50'
                  : 'w-2 bg-gray-300 dark:bg-gray-600'
            }`}
            aria-label={`Paso ${dotNumber} de ${total}`}
            aria-current={isActive ? 'step' : undefined}
          />
        );
      })}
    </div>
  );
}
