import { useMemo, useState } from "react";
import {
  Bell,
  FileArchive,
  Globe2,
  KeyRound,
  Lock,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  UserCircle,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import SettingsTabs from "../../components/SettingsTabs";
import SystemSettingsTab from "../../components/SystemSettingsTab";
import PermissionSettingsTab from "../../components/PermissionSettingsTab";
import RoleSettingsTab from "../../components/RoleSettingsTab";
import NotificationSettingsTab from "../../components/NotificationSettingsTab";
import LanguageSettingsTab from "../../components/LanguageSettingsTab";
import ThemeSettingsTab from "../../components/ThemeSettingsTab";
import SecuritySettingsTab from "../../components/SecuritySettingsTab";
import UserAccountSettingsTab from "../../components/UserAccountSettingsTab";
import CliApplicationSettingsTab from "../../components/CliApplicationSettingsTab";

const SURFACE_CARD =
  "rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)";

function Setting() {
  const { t } = useTranslation();
  const location = useLocation();
  const pathname = location.pathname ?? "";
  /** Organization-wide settings (admin shell only). Dean/staff shells use account + personal tabs. */
  const showOrgAdminPanels = pathname.startsWith("/admin");

  const tabs = useMemo(() => {
    const account = {
      id: "account",
      label: t("settings.tabs.account"),
      icon: UserCircle,
    };
    const rest = showOrgAdminPanels
      ? [
          {
            id: "system",
            label: t("settings.tabs.system"),
            icon: SlidersHorizontal,
          },
          {
            id: "permissions",
            label: t("settings.tabs.permissions"),
            icon: KeyRound,
          },
          { id: "roles", label: t("settings.tabs.roles"), icon: UsersRound },
          {
            id: "notifications",
            label: t("settings.tabs.notifications"),
            icon: Bell,
          },
          {
            id: "application",
            label: "Application",
            icon: FileArchive,
          },
        ]
      : [];
    const tail = [
      { id: "language", label: t("settings.tabs.language"), icon: Globe2 },
      { id: "theme", label: t("settings.tabs.theme"), icon: Palette },
      { id: "security", label: t("settings.tabs.security"), icon: Lock },
    ];
    return [account, ...rest, ...tail];
  }, [t, showOrgAdminPanels]);

  const [activeTab, setActiveTab] = useState("account");

  return (
    <div className=" flex-1 bg-white p-4 md:p-5 dark:bg-dark-card-bg min-h-screen">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className={`${SURFACE_CARD} overflow-hidden`}>
          <div className="border-b border-light-divider px-4 py-5 dark:border-dark-divider md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-muted">
                  <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
                  {t("settings.header.eyebrow")}
                </div>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary dark:text-dark-primary md:text-4xl">
                  {t("settings.header.title")}
                </h1>
                <p className="mt-3 text-sm leading-7 text-secondary dark:text-dark-secondary">
                  {t("settings.header.description")}
                </p>
              </div>
            </div>
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
          {activeTab === "system" && showOrgAdminPanels && (
            <SystemSettingsTab />
          )}
          {activeTab === "permissions" && showOrgAdminPanels && (
            <PermissionSettingsTab />
          )}
          {activeTab === "roles" && showOrgAdminPanels && <RoleSettingsTab />}
          {activeTab === "notifications" && showOrgAdminPanels && (
            <NotificationSettingsTab />
          )}
          {activeTab === "application" && showOrgAdminPanels && (
            <CliApplicationSettingsTab />
          )}
          {activeTab === "language" && <LanguageSettingsTab />}
          {activeTab === "theme" && <ThemeSettingsTab />}
          {activeTab === "security" && <SecuritySettingsTab />}
        </div>
      </div>
    </div>
  );
}

export default Setting;
