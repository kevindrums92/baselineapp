import { useMemo } from "react";
import { useAppStore } from "@/state/app.store";

export default function CloudStatusMini() {
  const mode = useAppStore((s) => s.cloudMode);
  const status = useAppStore((s) => s.cloudStatus);

  const view = useMemo(() => {
    if (mode === "guest") {
      return { text: "Local", dot: "bg-gray-400", textClass: "text-gray-500" };
    }

    if (!navigator.onLine || status === "offline") {
      return { text: "Offline", dot: "bg-gray-400", textClass: "text-gray-500" };
    }

    if (status === "syncing") {
      return { text: "Sincronizando", dot: "bg-[#18B7B0]", textClass: "text-gray-600" };
    }

    if (status === "error") {
      return { text: "online", dot: "bg-amber-400", textClass: "text-gray-600" };
    }

    // ok por defecto
    return { text: "online", dot: "bg-green-500", textClass: "text-gray-600" };
  }, [mode, status]);

  return (
    <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${view.textClass}`}>
      <span className={`h-2 w-2 rounded-full ${view.dot}`} />
      <span className="font-medium">{view.text}</span>
    </div>
  );
}
