import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarRange,
  Check,
  Globe2,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Field from "./Field";
import Select from "./Select";
import SearchableSelect from "./SearchableSelect";
import SettingsSectionCard from "./SettingsSectionCard";
import RepoOverviewStatCard from "./repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "./repo/repoOverviewStatPalettes";
import {
  useAcademicYears,
  useFaculties,
  useSemesters,
} from "../services/useApi";

const SYSTEM_SETTINGS_KEY = "faculty-system-settings";

function loadStoredSystemSettings() {
  try {
    const raw = window.localStorage.getItem(SYSTEM_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function listFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function recordLabel(record, fallback = "") {
  return (
    record?.name ||
    record?.title ||
    record?.code ||
    record?.academicYear?.name ||
    fallback
  );
}

export default function SystemSettingsTab() {
  const { t } = useTranslation();
  const [systemProfile, setSystemProfile] = useState(() => ({
    ...{
      institutionName: "Faculty Management System",
      portalTitle: "University Faculty Portal",
      supportEmail: "support@faculty.edu",
      helpDeskPhone: "+93 70 000 0000",
      academicYear: "",
      activeSemester: "",
      timezone: "asia-kabul",
      campus: "",
    },
    ...(loadStoredSystemSettings() ?? {}),
  }));
  const [publicVisibility, setPublicVisibility] = useState([
    "Show admission announcement banner",
    "Display active semester on homepage",
    "Publish maintenance notices in portal header",
  ]);
  const { data: facultiesPayload = [] } = useFaculties({ notifyOnError: false });
  const { data: academicYearsPayload = [] } = useAcademicYears(
    {},
    { notifyOnError: false },
  );
  const { data: semestersPayload = [] } = useSemesters(
    {},
    { notifyOnError: false },
  );
  const faculties = useMemo(() => listFromPayload(facultiesPayload), [facultiesPayload]);
  const academicYears = useMemo(
    () => listFromPayload(academicYearsPayload),
    [academicYearsPayload],
  );
  const semesters = useMemo(() => listFromPayload(semestersPayload), [semestersPayload]);

  useEffect(() => {
    document.title = systemProfile.portalTitle || systemProfile.institutionName;
  }, [systemProfile.institutionName, systemProfile.portalTitle]);

  const effectiveAcademicYear =
    systemProfile.academicYear || (academicYears[0]?.id ? String(academicYears[0].id) : "");
  const effectiveSemester =
    systemProfile.activeSemester || (semesters[0]?.id ? String(semesters[0].id) : "");
  const effectiveCampus =
    systemProfile.campus || (faculties[0]?.id ? String(faculties[0].id) : "");
  const activeAcademicYear = academicYears.find(
    (item) => String(item?.id) === String(effectiveAcademicYear),
  );
  const activeSemester = semesters.find(
    (item) => String(item?.id) === String(effectiveSemester),
  );

  const summaryItems = useMemo(
    () => [
      {
        icon: SlidersHorizontal,
        label: t("settings.system.summary.status"),
        value: t("settings.system.values.operational"),
        hint: t("settings.system.title"),
        paletteIndex: 0,
      },
      {
        icon: CalendarRange,
        label: t("settings.system.summary.academicYear"),
        value: recordLabel(activeAcademicYear, t("settings.system.values.unknown")),
        hint: t("settings.system.academic.title"),
        paletteIndex: 1,
      },
      {
        icon: CalendarRange,
        label: t("settings.system.summary.activeTerm"),
        value: recordLabel(activeSemester, t("settings.system.values.unknown")),
        hint: t("settings.system.fields.activeSemester"),
        paletteIndex: 2,
      },
      {
        icon: Globe2,
        label: t("settings.system.summary.publicProperties"),
        value: t("settings.system.summary.activeCount", {
          count: publicVisibility.length,
        }),
        hint: t("settings.system.visibility.title"),
        paletteIndex: 3,
      },
    ],
    [activeAcademicYear, activeSemester, publicVisibility.length, t],
  );

  const handleProfileChange = (key, value) => {
    setSystemProfile((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleRemoveVisibility = (item) => {
    setPublicVisibility((current) => current.filter((entry) => entry !== item));
  };

  const saveSystemSettings = () => {
    const nextSettings = {
      ...systemProfile,
      academicYear: effectiveAcademicYear,
      activeSemester: effectiveSemester,
      campus: effectiveCampus,
    };
    setSystemProfile(nextSettings);
    window.localStorage.setItem(
      SYSTEM_SETTINGS_KEY,
      JSON.stringify(nextSettings),
    );
    window.dispatchEvent(
      new CustomEvent("faculty-system-settings-updated", {
        detail: nextSettings,
      }),
    );
    window.GooeyToaster?.success?.(t("settings.system.actions.save"));
  };

  return (
    <div className="space-y-6">
      <SettingsSectionCard
        icon={SlidersHorizontal}
        title={t("settings.system.title")}
        description={t("settings.system.description")}
        action={
          <button
            type="button"
            onClick={saveSystemSettings}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white dark:bg-dark-primary dark:text-dark-shell"
          >
            <Save className="h-4 w-4" />
            {t("settings.system.actions.save")}
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:gap-4">
          {summaryItems.map((item) => (
            <RepoOverviewStatCard
              key={item.label}
              icon={item.icon}
              label={item.label}
              value={item.value}
              hint={item.hint}
              palette={
                REPO_OVERVIEW_STAT_PALETTES[
                  item.paletteIndex % REPO_OVERVIEW_STAT_PALETTES.length
                ]
              }
            />
          ))}
        </div>
      </SettingsSectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <SettingsSectionCard
          icon={Building2}
          title={t("settings.system.identity.title")}
          description={t("settings.system.identity.description")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              register={{}}
              label={t("settings.system.fields.institutionName")}
              placeholder={t("settings.system.placeholders.institutionName")}
              value={systemProfile.institutionName}
              onChange={(e) =>
                handleProfileChange("institutionName", e.target.value)
              }
            />
            <Field
              register={{}}
              label={t("settings.system.fields.portalTitle")}
              placeholder={t("settings.system.placeholders.portalTitle")}
              value={systemProfile.portalTitle}
              onChange={(e) => handleProfileChange("portalTitle", e.target.value)}
            />
            <Field
              register={{}}
              label={t("settings.system.fields.supportEmail")}
              type="email"
              placeholder={t("settings.system.placeholders.supportEmail")}
              value={systemProfile.supportEmail}
              onChange={(e) => handleProfileChange("supportEmail", e.target.value)}
            />
            <Field
              register={{}}
              label={t("settings.system.fields.helpDeskPhone")}
              placeholder={t("settings.system.placeholders.helpDeskPhone")}
              value={systemProfile.helpDeskPhone}
              onChange={(e) => handleProfileChange("helpDeskPhone", e.target.value)}
            />
            <div className="md:col-span-2">
              <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
                {t("settings.system.fields.defaultCampus")}
              </span>
              <SearchableSelect
                options={faculties.map((item) => ({
                  value: String(item.id),
                  label: recordLabel(item, String(item.id)),
                  description: item.code || item.email || item.phone || "",
                }))}
                value={effectiveCampus}
                onChange={(value) => handleProfileChange("campus", value)}
                placeholder={t("settings.system.placeholders.chooseCampus")}
                searchPlaceholder={t("settings.system.placeholders.searchCampus")}
              />
            </div>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          icon={CalendarRange}
          title={t("settings.system.academic.title")}
          description={t("settings.system.academic.description")}
        >
          <div className="space-y-4">
            <Select
              label={t("settings.system.fields.academicYear")}
              value={effectiveAcademicYear}
              onChange={(value) => handleProfileChange("academicYear", value)}
              placeholder={t("settings.system.placeholders.academicYear")}
              options={academicYears.map((item) => ({
                value: String(item.id),
                label: recordLabel(item, String(item.id)),
              }))}
            />
            <div>
              <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
                {t("settings.system.fields.activeSemester")}
              </span>
              <Select
                value={effectiveSemester}
                onChange={(value) => handleProfileChange("activeSemester", value)}
                placeholder={t("settings.system.placeholders.selectSemester")}
                options={semesters.map((item) => ({
                  value: String(item.id),
                  label: recordLabel(item, String(item.id)),
                }))}
              />
            </div>
            <div>
              <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
                {t("settings.system.fields.defaultTimezone")}
              </span>
              <Select
                value={systemProfile.timezone}
                onChange={(value) => handleProfileChange("timezone", value)}
                placeholder={t("settings.system.placeholders.chooseTimezone")}
                options={[
                  {
                    value: "asia-kabul",
                    label: t("settings.system.timezones.kabul"),
                  },
                  {
                    value: "asia-dubai",
                    label: t("settings.system.timezones.dubai"),
                  },
                  {
                    value: "asia-tehran",
                    label: t("settings.system.timezones.tehran"),
                  },
                ]}
              />
            </div>
          </div>
        </SettingsSectionCard>
      </div>

      <SettingsSectionCard
        icon={Globe2}
        title={t("settings.system.visibility.title")}
        description={t("settings.system.visibility.description")}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {publicVisibility.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between gap-3 rounded-md border border-default bg-shell px-4 py-3 dark:border-dark-default dark:bg-dark-shell"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Check className="h-4 w-4" />
                </span>
                <p className="text-sm font-medium text-primary dark:text-dark-primary">
                  {t(
                    `settings.system.visibility.items.${item
                      .toLowerCase()
                      .replaceAll(" ", "")
                      .replaceAll("-", "")}`,
                    { defaultValue: item },
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveVisibility(item)}
                className="text-xs font-semibold text-secondary hover:text-primary dark:text-dark-secondary dark:hover:text-dark-primary"
              >
                {t("settings.actions.remove")}
              </button>
            </div>
          ))}
        </div>
      </SettingsSectionCard>
    </div>
  );
}
