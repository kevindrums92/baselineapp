import { useEffect } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  destructive = false,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useTranslation('common');
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
          {title || t('buttons.confirm')}
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {cancelText || t('buttons.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-3 text-sm font-medium text-white ${
              destructive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {confirmText || t('buttons.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
