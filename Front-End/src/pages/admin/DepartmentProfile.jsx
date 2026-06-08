import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  GraduationCap,
  Mail,
  Phone,
  ScanText,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import StatusPill, { statusToPillVariant } from "../../components/StatusPill";
import { useDepartment } from "../../services/useApi";

const SURFACE_CARD =
  "rounded-3xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)";

function formatDate(value, locale, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function InfoCard({ icon, label, value }) {
  return (
    <div className={`${SURFACE_CARD} p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted dark:text-dark-muted">
            {label}
          </p>
          <p className="mt-1 text-sm font-medium text-primary dark:text-dark-primary">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}


export default function DepartmentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: department, isLoading } = useDepartment(id, {
    enabled: Boolean(id),
    notifyOnError: true,
  });

  const locale =
    i18n.language === "ps"
      ? "ps-AF"
      : i18n.language === "prs"
        ? "fa-AF"
        : "en-US";

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-light-app-bg p-4 md:p-5 dark:bg-dark-card-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-(--color-light-input-border-focus) border-t-transparent dark:border-(--color-dark-input-border-focus)" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-light-app-bg p-4 text-center md:p-5 dark:bg-dark-card-bg">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-(--color-light-card-border) bg-light-card-bg dark:border-(--color-dark-card-border) dark:bg-dark-card-bg">
          <Building2 className="size-7 text-secondary dark:text-dark-secondary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary dark:text-dark-primary">
            {t("adminDepartments.profile.notFound")}
          </h2>
          <p className="mt-1 text-sm text-muted dark:text-dark-muted">
            {t("adminDepartments.profile.notFoundHint")}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          {t("adminDepartments.profile.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-white p-4 md:p-5 dark:bg-dark-card-bg">
      <div className="rounded-3xl border border-(--color-light-card-border) bg-light-card-bg p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-dark-card-bg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary text-secondary transition-colors hover:bg-light-nav-hover-bg dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary dark:hover:bg-dark-card-hover"
              aria-label={t("adminDepartments.profile.back")}
            >
              <ArrowLeft className="size-4" strokeWidth={2} />
            </button>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
              <Building2 className="size-6" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-primary dark:text-dark-primary">
                  {department.name || t("adminDepartments.fallback.name")}
                </h1>
                <StatusPill variant={statusToPillVariant(department.status)}>
                  {t(
                    `adminShared.status.${String(
                      department.status || "inactive",
                    ).toLowerCase()}`,
                    t("adminDepartments.status.inactive"),
                  )}
                </StatusPill>
              </div>
              <p className="mt-2 text-sm text-secondary dark:text-dark-secondary">
                {department.field ||
                  t("adminDepartments.profile.fieldFallback")}
              </p>
              <p className="mt-1 text-xs text-muted dark:text-dark-muted">
                {department.facultyName ||
                  t("adminDepartments.fallback.faculty")}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[20rem]">
            <InfoCard
              icon={<UserRound className="size-4" strokeWidth={1.8} />}
              label={t("adminDepartments.profile.head")}
              value={department.head || t("adminDepartments.fallback.head")}
            />
            <InfoCard
              icon={<CalendarDays className="size-4" strokeWidth={1.8} />}
              label={t("adminDepartments.profile.updated")}
              value={formatDate(
                department.updatedAt || department.created,
                locale,
                t("adminDepartments.fallback.date"),
              )}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-(--color-light-card-border) bg-light-card-bg p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-dark-card-bg">
            <h2 className="text-lg font-bold text-primary dark:text-dark-primary">
              {t("adminDepartments.profile.detailsTitle")}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCard
                icon={<ScanText className="size-4" strokeWidth={1.8} />}
                label={t("adminDepartments.profile.code")}
                value={department.code || t("adminDepartments.fallback.date")}
              />
              <InfoCard
                icon={<BadgeCheck className="size-4" strokeWidth={1.8} />}
                label={t("adminDepartments.profile.shortName")}
                value={
                  department.shortName || t("adminDepartments.fallback.date")
                }
              />
              <InfoCard
                icon={<GraduationCap className="size-4" strokeWidth={1.8} />}
                label={t("adminDepartments.profile.faculty")}
                value={
                  department.facultyName ||
                  t("adminDepartments.fallback.faculty")
                }
              />
              <InfoCard
                icon={<CalendarDays className="size-4" strokeWidth={1.8} />}
                label={t("adminDepartments.profile.created")}
                value={formatDate(
                  department.created,
                  locale,
                  t("adminDepartments.fallback.date"),
                )}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-(--color-light-card-border) bg-light-card-bg p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-dark-card-bg">
            <h2 className="text-lg font-bold text-primary dark:text-dark-primary">
              {t("adminDepartments.profile.descriptionTitle")}
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-secondary dark:text-dark-secondary">
              {department.description ||
                t("adminDepartments.profile.descriptionFallback")}
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-(--color-light-card-border) bg-light-card-bg p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-dark-card-bg">
            <h2 className="text-lg font-bold text-primary dark:text-dark-primary">
              {t("adminDepartments.profile.contactTitle")}
            </h2>
            <div className="mt-5 space-y-4">
              <InfoCard
                icon={<Mail className="size-4" strokeWidth={1.8} />}
                label={t("adminDepartments.profile.email")}
                value={department.email || t("adminDepartments.fallback.date")}
              />
              <InfoCard
                icon={<Phone className="size-4" strokeWidth={1.8} />}
                label={t("adminDepartments.profile.phone")}
                value={department.phone || t("adminDepartments.fallback.date")}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
