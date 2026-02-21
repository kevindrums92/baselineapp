import { useAppStore } from "@/state/app.store";
import { monthLabel, currentMonthKey } from "@/services/dates.service";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

function parseMonthKey(monthKey: string) {
  const [yStr, mStr] = monthKey.split("-");
  return { y: Number(yStr), m: Number(mStr) }; // m 1..12
}

function toMonthKey(y: number, m: number) {
  const mm = String(m).padStart(2, "0");
  return `${y}-${mm}`;
}

function addMonths(monthKey: string, delta: number) {
  const { y, m } = parseMonthKey(monthKey);
  const date = new Date(y, m - 1, 1);
  date.setMonth(date.getMonth() + delta);
  return toMonthKey(date.getFullYear(), date.getMonth() + 1);
}

export default function MonthNavigator() {
  const { t } = useTranslation('common');
  const { getLocale } = useLanguage();
  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const setSelectedMonth = useAppStore((s) => s.setSelectedMonth);

  const currentMonth = currentMonthKey(); // YYYY-MM (local timezone)
  const isCurrent = selectedMonth === currentMonth;

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
          className="rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          aria-label={t('date.previousMonth')}
          title={t('date.previousMonth')}
        >
          ◀
        </button>

        <button
          type="button"
          onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
          className="rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
          aria-label={t('date.nextMonth')}
          title={t('date.nextMonth')}
        >
          ▶
        </button>

        <button
          type="button"
          onClick={() => setSelectedMonth(currentMonth)}
          disabled={isCurrent}
          className="rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
          aria-label={t('date.goToCurrentMonth')}
          title={t('date.goToCurrentMonth')}
        >
          {t('date.today')}
        </button>
      </div>

      <div className="text-right">
        <p className="text-xs text-gray-600">{t('date.month')}</p>
        <p className="text-sm font-semibold">{monthLabel(selectedMonth, getLocale())}</p>
      </div>
    </div>
  );
}
