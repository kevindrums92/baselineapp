import { useAppStore } from "@/state/app.store";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

function parseMonthKey(monthKey: string) {
  const [yStr, mStr] = monthKey.split("-");
  return { y: Number(yStr), m: Number(mStr) };
}

function toMonthKey(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

function addMonths(monthKey: string, delta: number) {
  const { y, m } = parseMonthKey(monthKey);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() + delta);
  return toMonthKey(d.getFullYear(), d.getMonth() + 1);
}

export default function MonthSelector() {
  const { t } = useTranslation('common');
  const { getLocale } = useLanguage();
  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const setSelectedMonth = useAppStore((s) => s.setSelectedMonth);

  const { y, m } = parseMonthKey(selectedMonth);

  // Format month using Intl with user's locale
  const date = new Date(y, m - 1, 1);
  const monthLabel = new Intl.DateTimeFormat(getLocale(), {
    month: 'short',
    year: 'numeric'
  }).format(date).toUpperCase();

  return (
    <div data-tour="home-month-selector" className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 active:scale-95 transition-all"
        aria-label={t('date.previousMonth')}
      >
        <ChevronLeft size={18} strokeWidth={2} />
      </button>

      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide min-w-[70px] text-center">
        {monthLabel}
      </span>

      <button
        type="button"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 active:scale-95 transition-all"
        aria-label={t('date.nextMonth')}
      >
        <ChevronRight size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
