import { NavLink } from "react-router-dom";
import { Home, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

function Tab({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof Home;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] ${
          isActive ? "text-[#18B7B0]" : "text-gray-500 dark:text-gray-400"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
          <span className="leading-none tracking-tight">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomBar() {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-x-0 -bottom-1 z-50 bg-white dark:bg-gray-900 pt-1">
      <div
        className={[
          "relative",
          "border-t border-gray-200/70 dark:border-gray-800/70",
          "bg-white/99 dark:bg-gray-900/99 backdrop-blur-xl",
          "shadow-[0_-10px_30px_rgba(0,0,0,0.10)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.50)]",
          "pt-3 pb-[calc(env(safe-area-inset-bottom)+10px)]",
        ].join(" ")}
      >
        <div className="grid grid-cols-2">
          <Tab to="/" label={t("navigation.home")} icon={Home} />
          <Tab to="/profile" label={t("navigation.settings")} icon={Settings} />
        </div>
      </div>
    </div>
  );
}
