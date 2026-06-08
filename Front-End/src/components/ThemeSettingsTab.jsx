import { MonitorCog, MoonStar, Palette, SunMedium } from "lucide-react";
import { useTranslation } from "react-i18next";
import Select from "./Select";
import SettingsSectionCard from "./SettingsSectionCard";
import { cn } from "../lib/utils";
import { useTheme } from "../context/themContext";

const themeCards = [
  {
    id: "light",
    title: "Light mode",
    description: "Clean neutral surfaces for daytime administrative work.",
    icon: SunMedium,
  },
  {
    id: "dark",
    title: "Dark mode",
    description: "Reduced glare for long review and monitoring sessions.",
    icon: MoonStar,
  },
  {
    id: "system",
    title: "System preference",
    description: "Match the user operating system automatically.",
    icon: MonitorCog,
  },
];

export default function ThemeSettingsTab() {
  const { t } = useTranslation();
  const { appearance, setAppearance } = useTheme();

  return (
    <div className="space-y-6">
      <SettingsSectionCard
        icon={Palette}
        title={t("settings.theme.title")}
        description={t("settings.theme.description")}
      >
        <div className="grid gap-3">
          {themeCards.map((theme) => {
            const Icon = theme.icon;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setAppearance(theme.id)}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-md border px-4 py-4 text-left transition-colors",
                  appearance === theme.id
                    ? " border-dark-btn-primary-bg     dark:border-dark-primary/20 "
                    : "border-default bg-card dark:border-dark-default dark:bg-dark-card",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-default bg-shell text-primary dark:border-dark-default dark:bg-dark-shell dark:text-dark-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                      {t(`settings.theme.options.${theme.id}.title`)}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-secondary dark:text-dark-secondary">
                      {t(`settings.theme.options.${theme.id}.description`)}
                    </p>
                  </div>
                </div>
                {appearance === theme.id ? (
                  <span className="inline-flex rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white dark:bg-dark-primary dark:text-dark-shell">
                    {t("settings.theme.active")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={MonitorCog}
        title={t("settings.theme.display.title")}
        description={t("settings.theme.display.description")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.theme.fields.dashboardDensity")}
            </span>
            <Select
              defaultValue="comfortable"
              options={[
                {
                  value: "compact",
                  label: t("settings.theme.density.compact"),
                },
                {
                  value: "comfortable",
                  label: t("settings.theme.density.comfortable"),
                },
                {
                  value: "spacious",
                  label: t("settings.theme.density.spacious"),
                },
              ]}
            />
          </div>
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.theme.fields.sidebarBehavior")}
            </span>
            <Select
              defaultValue="sticky"
              options={[
                { value: "sticky", label: t("settings.theme.sidebar.sticky") },
                {
                  value: "collapsible",
                  label: t("settings.theme.sidebar.collapsible"),
                },
                {
                  value: "icon-only",
                  label: t("settings.theme.sidebar.iconOnly"),
                },
              ]}
            />
          </div>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
