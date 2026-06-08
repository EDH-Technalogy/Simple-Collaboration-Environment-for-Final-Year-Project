import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * Lightweight global feedback on client-side route changes (admin shell).
 */
export default function NavigationRouteLoader() {
  const { t } = useTranslation();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), 360);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search, location.hash, location.key]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-black/10 backdrop-blur-[1px] transition-opacity dark:bg-black/35"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-5 py-3 shadow-lg dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
        <Loader2
          className="size-5 shrink-0 animate-spin text-(--color-chart-success)"
          strokeWidth={2}
          aria-hidden
        />
        <span className="text-sm font-semibold text-primary dark:text-dark-primary">
          {t("app.routeLoading")}
        </span>
      </div>
    </div>
  );
}
