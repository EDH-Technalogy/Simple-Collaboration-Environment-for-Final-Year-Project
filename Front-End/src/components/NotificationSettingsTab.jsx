import { useMemo, useState } from "react";
import { Bell, BellOff, Mail, Save, Smartphone, TimerReset } from "lucide-react";
import { useTranslation } from "react-i18next";
import Select from "./Select";
import SettingsSectionCard from "./SettingsSectionCard";
import SettingsToggleRow from "./SettingsToggleRow";
import RepoOverviewStatCard from "./repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "./repo/repoOverviewStatPalettes";

const initialNotificationItems = [
  {
    id: 1,
    title: "Admission and registration updates",
    description:
      "Notify staff when new applications, approvals and registration windows change.",
    enabled: true,
  },
  {
    id: 2,
    title: "Academic alerts",
    description:
      "Notify lecturers and deans about grade deadlines, exam schedules and course changes.",
    enabled: true,
  },
  {
    id: 3,
    title: "Security notices",
    description:
      "Send high-priority alerts for suspicious sign-ins and permission changes.",
    enabled: true,
  },
  {
    id: 4,
    title: "Guardian attendance alerts",
    description:
      "Send a notice when student attendance drops below the academic policy threshold.",
    enabled: false,
  },
];

export default function NotificationSettingsTab() {
  const { t } = useTranslation();
  const [channel, setChannel] = useState("in-app-email");
  const [frequency, setFrequency] = useState("daily");
  const [emergencyPath, setEmergencyPath] = useState("all-channels");
  const [subscriptions, setSubscriptions] = useState(initialNotificationItems);

  const summary = useMemo(
    () => ({
      enabled: subscriptions.filter((item) => item.enabled).length,
      disabled: subscriptions.filter((item) => !item.enabled).length,
    }),
    [subscriptions],
  );
  const channelLabel = t(
    `settings.notifications.channels.${
      channel === "in-app-email"
        ? "inAppEmail"
        : channel === "in-app"
          ? "inAppOnly"
          : "emailOnly"
    }`,
  );
  const frequencyLabel = t(`settings.notifications.frequency.${frequency}`);
  const summaryTiles = useMemo(
    () => [
      {
        key: "enabled",
        icon: Bell,
        label: t("settings.notifications.summary.enabled"),
        value: summary.enabled,
        hint: t("settings.notifications.subscriptions.title"),
        paletteIndex: 0,
      },
      {
        key: "disabled",
        icon: BellOff,
        label: t("settings.notifications.summary.disabled"),
        value: summary.disabled,
        hint: t("settings.notifications.subscriptions.description"),
        paletteIndex: 1,
      },
      {
        key: "channel",
        icon: Mail,
        label: t("settings.notifications.summary.channelMode"),
        value: channelLabel,
        hint: t("settings.notifications.fields.defaultChannel"),
        paletteIndex: 2,
      },
      {
        key: "digest",
        icon: TimerReset,
        label: t("settings.notifications.summary.digestMode"),
        value: frequencyLabel,
        hint: t("settings.notifications.fields.digestFrequency"),
        paletteIndex: 3,
      },
    ],
    [channelLabel, frequencyLabel, summary.disabled, summary.enabled, t],
  );

  const toggleSubscription = (id) => {
    setSubscriptions((current) =>
      current.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <SettingsSectionCard
        icon={Bell}
        title={t("settings.notifications.title")}
        description={t("settings.notifications.description")}
        action={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white dark:bg-dark-primary dark:text-dark-shell"
          >
            <Save className="h-4 w-4" />
            {t("settings.notifications.actions.save")}
          </button>
        }
      >
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.notifications.fields.defaultChannel")}
            </span>
            <Select
              value={channel}
              onChange={setChannel}
              options={[
                {
                  value: "in-app-email",
                  label: t("settings.notifications.channels.inAppEmail"),
                },
                { value: "in-app", label: t("settings.notifications.channels.inAppOnly") },
                { value: "email", label: t("settings.notifications.channels.emailOnly") },
              ]}
            />
          </div>
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.notifications.fields.digestFrequency")}
            </span>
            <Select
              value={frequency}
              onChange={setFrequency}
              options={[
                { value: "instant", label: t("settings.notifications.frequency.instant") },
                { value: "daily", label: t("settings.notifications.frequency.daily") },
                { value: "weekly", label: t("settings.notifications.frequency.weekly") },
              ]}
            />
          </div>
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.notifications.fields.emergencyPath")}
            </span>
            <Select
              value={emergencyPath}
              onChange={setEmergencyPath}
              options={[
                {
                  value: "all-channels",
                  label: t("settings.notifications.paths.allChannels"),
                },
                { value: "email-sms", label: t("settings.notifications.paths.emailSms") },
                {
                  value: "dashboard-only",
                  label: t("settings.notifications.paths.dashboardOnly"),
                },
              ]}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryTiles.map((card) => (
            <RepoOverviewStatCard
              key={card.key}
              icon={card.icon}
              label={card.label}
              value={card.value}
              hint={card.hint}
              palette={
                REPO_OVERVIEW_STAT_PALETTES[
                  card.paletteIndex % REPO_OVERVIEW_STAT_PALETTES.length
                ]
              }
            />
          ))}
        </div>
      </SettingsSectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsSectionCard
          icon={Mail}
          title={t("settings.notifications.subscriptions.title")}
          description={t("settings.notifications.subscriptions.description")}
        >
          <div className="space-y-3">
            {subscriptions.map((item) => (
              <SettingsToggleRow
                key={item.id}
                title={t(`settings.notifications.items.${item.id}.title`)}
                description={t(`settings.notifications.items.${item.id}.description`)}
                checked={item.enabled}
                onChange={() => toggleSubscription(item.id)}
              />
            ))}
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          icon={Smartphone}
          title={t("settings.notifications.delivery.title")}
          description={t("settings.notifications.delivery.description")}
        >
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-md border border-default bg-shell px-4 py-3 text-sm leading-6 text-primary dark:border-dark-default dark:bg-dark-shell dark:text-dark-primary"
              >
                {t(`settings.notifications.delivery.items.${item}`)}
              </div>
            ))}
          </div>
        </SettingsSectionCard>
      </div>
    </div>
  );
}
