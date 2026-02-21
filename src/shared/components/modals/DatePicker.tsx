import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

type Props = {
  open: boolean;
  onClose: () => void;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
};

export default function DatePicker({ open, onClose, value, onChange }: Props) {
  const { t } = useTranslation('common');
  const { getLocale } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Parse initial date
  const initialDate = value ? new Date(value + "T12:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Reset when opening
  useEffect(() => {
    if (open) {
      const date = value ? new Date(value + "T12:00:00") : new Date();
      setViewYear(date.getFullYear());
      setViewMonth(date.getMonth());
      setSelectedDate(date);
      setShowYearPicker(false);
    }
  }, [open, value]);

  // Animation handling
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day, 12, 0, 0);
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`);
    onClose();
  };

  const handleSelectYear = (year: number) => {
    setViewYear(year);
    setShowYearPicker(false);
  };

  // Generate locale-aware day abbreviations (first letter of each day)
  const DAYS = useMemo(() => {
    const locale = getLocale();
    const days: string[] = [];

    // Start from Sunday (day 0)
    for (let i = 0; i < 7; i++) {
      const day = new Date(2023, 11, 31 + i); // Dec 31, 2023 is Sunday
      const dayName = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day);
      days.push(dayName.charAt(0).toUpperCase());
    }
    return days;
  }, [getLocale]);

  // Generate locale-aware month names
  const MONTHS = useMemo(() => {
    const locale = getLocale();
    const months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(2024, i, 1);
      const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
      months.push(monthName);
    }
    return months;
  }, [getLocale]);

  const formatSelectedDate = useCallback(() => {
    const locale = getLocale();
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(selectedDate);
  }, [selectedDate, getLocale]);

  if (!isVisible) return null;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = new Date();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black"
        onClick={onClose}
        aria-label={t('datePicker.close')}
        style={{
          opacity: isAnimating ? 0.5 : 0,
          transition: "opacity 300ms ease-out",
        }}
      />

      {/* Modal */}
      <div
        className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl"
        style={{
          transform: isAnimating ? "scale(1)" : "scale(0.95)",
          opacity: isAnimating ? 1 : 0,
          transition: "transform 300ms ease-out, opacity 300ms ease-out",
        }}
      >
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 px-6 pt-5 pb-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('datePicker.selectDate')}</p>
          <h2 className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-50">
            {formatSelectedDate()}
          </h2>
        </div>

        {/* Calendar */}
        <div className="px-4 pb-2">
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setShowYearPicker(!showYearPicker)}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {MONTHS[viewMonth]} {viewYear}
              <ChevronLeft className={`h-4 w-4 transition-transform ${showYearPicker ? "rotate-90" : "-rotate-90"}`} />
            </button>
            {!showYearPicker && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {showYearPicker ? (
            /* Year Picker Grid */
            <div className="h-[280px] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2 py-2">
                {Array.from({ length: 24 }, (_, i) => {
                  const year = today.getFullYear() - 12 + i;
                  const isSelected = year === viewYear;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleSelectYear(year)}
                      className={`py-3 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-emerald-500 text-white"
                          : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Days of week header */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((day, i) => (
                  <div
                    key={i}
                    className="flex h-10 items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((day, i) => {
                  if (day === null) {
                    return <div key={i} className="h-10" />;
                  }

                  const isSelected =
                    day === selectedDate.getDate() &&
                    viewMonth === selectedDate.getMonth() &&
                    viewYear === selectedDate.getFullYear();

                  const isToday =
                    day === today.getDate() &&
                    viewMonth === today.getMonth() &&
                    viewYear === today.getFullYear();

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`flex h-10 w-10 mx-auto items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-emerald-500 text-white"
                          : isToday
                          ? "text-emerald-500 dark:text-emerald-400 font-semibold"
                          : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
          >
            {t('buttons.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-semibold text-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
          >
            {t('buttons.ok')}
          </button>
        </div>
      </div>
    </div>
  );
}
