import { Languages, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Field from "./Field";
import SearchableSelect from "./SearchableSelect";
import Select from "./Select";
import SettingsSectionCard from "./SettingsSectionCard";
import { useLanguage } from "../context/LanguageContext";

const languageOptions = [
  { value: "en", label: "English", description: "Default administrative language" },
  { value: "prs", label: "Dari / Persian", description: "Regional faculty support" },
  { value: "ps", label: "Pashto", description: "Localized student communication" },
];

export default function LanguageSettingsTab() {
  const { t } = useTranslation();
  const { lang, setLang } = useLanguage();

  return (
    <div className="space-y-6">
      <SettingsSectionCard
        icon={Languages}
        title={t("settings.language.title")}
        description={t("settings.language.description")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
                {t("settings.language.fields.defaultPlatformLanguage")}
              </span>
              <Select
                value={lang}
                onChange={setLang}
                options={languageOptions.map(({ value, label }) => ({
                  value,
                  label: t(`settings.language.options.${value}.label`, label),
                }))}
              />
            </div>
            <div>
              <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
                {t("settings.language.fields.enabledLanguages")}
              </span>
              <SearchableSelect
                multiple
                defaultValue={["en", "prs", "ps"]}
                options={languageOptions.map((item) => ({
                  ...item,
                  label: t(`settings.language.options.${item.value}.label`, item.label),
                  description: t(
                    `settings.language.options.${item.value}.description`,
                    item.description,
                  ),
                }))}
                placeholder={t("settings.language.placeholders.chooseLanguages")}
                searchPlaceholder={t("settings.language.placeholders.searchLanguages")}
              />
            </div>
          <Field
            register={{}}
            label={t("settings.language.fields.fallbackLocale")}
            placeholder="en-US"
            value="en-US"
            onChange={() => {}}
          />
          <Field
            register={{}}
            label={t("settings.language.fields.defaultDateFormat")}
            placeholder="dd/MM/yyyy"
            value="dd/MM/yyyy"
            onChange={() => {}}
          />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={Globe2}
        title={t("settings.language.regional.title")}
        description={t("settings.language.regional.description")}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-md border border-default bg-shell px-4 py-3 text-sm font-medium text-primary dark:border-dark-default dark:bg-dark-shell dark:text-dark-primary"
            >
              {t(`settings.language.regional.items.${item}`)}
            </div>
          ))}
        </div>
      </SettingsSectionCard>
    </div>
  );
}
