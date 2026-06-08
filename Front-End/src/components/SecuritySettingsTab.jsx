import { Lock, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import Select from "./Select";
import SettingsSectionCard from "./SettingsSectionCard";
import SettingsToggleRow from "./SettingsToggleRow";

export default function SecuritySettingsTab() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <SettingsSectionCard
        icon={Lock}
        title={t("settings.security.title")}
        description={t("settings.security.description")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.security.fields.sessionTimeout")}
            </span>
            <Select
              defaultValue="20"
              options={[
                { value: "15", label: t("settings.security.timeout.15") },
                { value: "20", label: t("settings.security.timeout.20") },
                { value: "30", label: t("settings.security.timeout.30") },
                { value: "60", label: t("settings.security.timeout.60") },
              ]}
            />
          </div>
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.security.fields.passwordPolicy")}
            </span>
            <Select
              defaultValue="strong"
              options={[
                { value: "standard", label: t("settings.security.policy.standard") },
                { value: "strong", label: t("settings.security.policy.strong") },
                { value: "strict", label: t("settings.security.policy.strict") },
              ]}
            />
          </div>
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.security.fields.auditRetention")}
            </span>
            <Select
              defaultValue="365"
              options={[
                { value: "90", label: t("settings.security.retention.90") },
                { value: "180", label: t("settings.security.retention.180") },
                { value: "365", label: t("settings.security.retention.365") },
              ]}
            />
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={ShieldAlert}
        title={t("settings.security.protections.title")}
        description={t("settings.security.protections.description")}
      >
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <SettingsToggleRow
              key={item}
              title={t(`settings.security.protections.items.${item}.title`)}
              description={t(
                `settings.security.protections.items.${item}.description`,
              )}
              checked
              onChange={() => {}}
            />
          ))}
        </div>
      </SettingsSectionCard>
    </div>
  );
}
