import { useState } from "react";
import { Globe2, Palette, ShieldCheck, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import SettingsTabs from "../../components/SettingsTabs";
import ThemeSettingsTab from "../../components/ThemeSettingsTab";
import LanguageSettingsTab from "../../components/LanguageSettingsTab";
import UserAccountSettingsTab from "../../components/UserAccountSettingsTab";

const SURFACE_CARD =
  "rounded-md border border-(--color-light-card-border) bg-(--color-light-card-bg)  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)";

export default function StudentSettings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    { id: "account", label: t("settings.tabs.account"), icon: UserCircle },
    { id: "language", label: t("settings.tabs.language"), icon: Globe2 },
    { id: "theme", label: t("settings.tabs.theme"), icon: Palette },
  ];

  return (
    <div className="min-h-screen flex-1 w-full  bg-white p-4 md:p-5 dark:bg-dark-app-secondary">
      <div className="mx-auto w-full max-w-full space-y-6">
        <section className={`${SURFACE_CARD} overflow-hidden`}>
          <div className="border-b border-light-divider px-4 py-5 dark:border-dark-divider md:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-muted">
              <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
              {t("studentSettings.header.eyebrow")}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-primary dark:text-dark-primary md:text-3xl">
              {t("studentSettings.header.title")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-secondary dark:text-dark-secondary">
              {t("studentSettings.header.description")}
            </p>
          </div>
          <div className="px-4 py-4 md:px-6">
            <SettingsTabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </section>

        <div>
          {activeTab === "account" && <UserAccountSettingsTab />}
          {activeTab === "language" && <LanguageSettingsTab />}
          {activeTab === "theme" && <ThemeSettingsTab />}
        </div>
      </div>
    </div>
  );
}
