import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: React.ReactNode;
  onBack?: () => void;
  rightActions?: React.ReactNode;
};

export default function PageHeader({ title, onBack, rightActions }: Props) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between bg-white dark:bg-gray-900 px-4 pb-4 shadow-sm dark:shadow-black/30"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-gray-900 dark:text-gray-50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          aria-label="Volver"
        >
          <ChevronLeft size={24} />
        </button>
        {typeof title === "string" ? (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h1>
        ) : (
          title
        )}
      </div>

      {rightActions && <div className="flex items-center gap-2">{rightActions}</div>}
    </header>
  );
}
