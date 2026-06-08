import { Building2, IdCard } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  AdminProfileHighlightCard,
  AdminProfileMetricCard,
  AdminProfilePeerCompareCard,
  AdminProfileSemiGaugeCard,
  AdminProfileWorkloadDonutCard,
} from "../../components/admin/AdminProfileDashboard";
import {
  AdminPersonProfileBreadcrumbs,
  AdminPersonProfileExpandableList,
  AdminPersonProfileFrame,
  AdminPersonProfileHero,
  AdminPersonProfileMiniCard,
  AdminPersonProfilePillSection,
} from "../../components/admin/AdminPersonProfileChrome";
import AdminProfileGreenScope from "../../components/admin/AdminProfileGreenScope";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import IC from "../../components/IC";
import {
  useEmployee,
  useVcRepositoriesForViewer,
  useVcUserActivity,
  useUser,
} from "../../services/useApi";
import { bucketVcActivityEvents } from "../../utils/vcActivityBuckets";

function profileInitials(fullName) {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || "?";
  return (parts[0]?.slice(0, 2) || "?").toUpperCase();
}

function formatDisplayDate(isoOrDate, locale = undefined) {
  if (isoOrDate == null || isoOrDate === "") return "";
  try {
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(isoOrDate);
  }
}

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale =
    i18n.language === "ps"
      ? "ps-AF"
      : i18n.language === "prs"
        ? "fa-AF"
        : undefined;

  const {
    data: employee,
    isLoading,
    isError,
    isFetching,
  } = useEmployee(id, { notifyOnError: false });

  const ownerKey = String(
    employee?.linkedApplicationUserId ??
      employee?.applicationUserId ??
      employee?.gatewayUserId ??
      "",
  ).trim();

  const userLookupId = String(
    employee?.keycloak ??
      employee?.applicationUserId ??
      employee?.gatewayUserId ??
      employee?.keycloakId ??
      "",
  ).trim();

  const { data: gatewayUser } = useUser(userLookupId, {
    enabled: Boolean(userLookupId),
    notifyOnError: false,
  });

  const vcUsername = String(gatewayUser?.user_name ?? "").trim();

  const { data: repos = [] } = useVcRepositoriesForViewer(ownerKey, {
    enabled: Boolean(ownerKey || vcUsername),
    notifyOnError: false,
    activityUsernameFallback: vcUsername || undefined,
  });

  const { data: rawActivity = [] } = useVcUserActivity(vcUsername, {
    enabled: Boolean(vcUsername),
    notifyOnError: false,
  });

  const buckets = useMemo(
    () => bucketVcActivityEvents(rawActivity),
    [rawActivity],
  );

  const workloadSegments = useMemo(() => {
    const deptScore = employee?.department ? 42 : 12;
    const rankScore =
      typeof employee?.educationRank === "string" &&
      employee.educationRank.trim()
        ? 28
        : 12;
    const tenureScore = employee?.joined ? 30 : 10;
    return [
      {
        key: "dept",
        label: t("adminPersonProfile.employee.segmentDept"),
        value: deptScore,
        color: "var(--color-blue-500)",
      },
      {
        key: "rank",
        label: t("adminPersonProfile.employee.segmentCredential"),
        value: rankScore,
        color: "var(--color-blue-300)",
      },
      {
        key: "tenure",
        label: t("adminPersonProfile.employee.segmentTenure"),
        value: tenureScore,
        color: "#c4b5fd",
      },
    ];
  }, [employee, t]);

  const aspectScore = useMemo(() => {
    const active = employee?.status === "active" ? 12 : 0;
    const base =
      55 + active + Math.min(repos.length * 3 + buckets.pulls.length, 18);
    return Math.min(97, Math.max(46, base));
  }, [employee?.status, repos.length, buckets.pulls.length]);

  const peerCompare = useMemo(
    () => ({
      subject: aspectScore,
      peer: Math.min(
        94,
        Math.max(52, aspectScore + ((employee?.id?.length || 4) % 8) - 4),
      ),
    }),
    [aspectScore, employee?.id],
  );

  if (isLoading || (isFetching && !employee)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-light-app-bg p-6 dark:bg-dark-shell md:p-8">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-(--color-light-card-border) border-t-(--color-light-text-primary) dark:border-(--color-dark-card-border) dark:border-t-(--color-dark-text-primary)"
          aria-hidden
        />
        <p className="text-sm text-muted dark:text-dark-muted">
          {t("adminPersonProfile.loading")}
        </p>
      </div>
    );
  }

  if (isError || !employee?.id) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-light-app-bg p-6 dark:bg-dark-shell md:p-8">
        <p className="text-lg font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
          {t("adminPersonProfile.employee.notFound")}
        </p>
        <Button variant="secondary" onClick={() => navigate("/admin/employee")}>
          {t("adminPersonProfile.backToEmployees")}
        </Button>
      </div>
    );
  }

  const fullName =
    `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
    t("studentProfile.na");
  const statusKey = (employee.status || "active").toLowerCase();

  const sidebarTags = [
    employee.department,
    employee.faculty,
    vcUsername ? `@${vcUsername}` : null,
  ].filter(Boolean);

  const sidebar = (
    <div className="overflow-visible rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) pb-8  dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
      <AdminPersonProfileHero
        onBack={() => navigate("/admin/employee")}
        verifiedLabel={t("adminPersonProfile.verified")}
        initials={profileInitials(fullName)}
      />
      <div className="px-6">
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
              {fullName}
            </h1>
            <p className="mt-0.5 text-xs text-muted dark:text-dark-muted">
              @{vcUsername || t("studentProfile.na")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-(--color-light-admin-profile-violet-soft-border) bg-(--color-light-admin-profile-violet-soft-bg) px-3 py-1 text-[11px] font-semibold text-(--color-light-admin-profile-violet-soft-text) dark:border-(--color-dark-admin-profile-violet-soft-border) dark:bg-(--color-dark-admin-profile-violet-soft-bg) dark:text-(--color-dark-admin-profile-violet-soft-text)">
              {t("adminShared.roles.staff")}
            </span>
            <span className="rounded-full border border-(--color-light-card-border) bg-(--color-light-admin-profile-pill-bg) px-2.5 py-1 text-[11px] font-semibold text-(--color-light-admin-profile-pill-text) dark:border-(--color-dark-card-border) dark:bg-(--color-dark-admin-profile-pill-bg) dark:text-(--color-dark-admin-profile-pill-text)">
              {t(`adminShared.status.${statusKey}`, statusKey)}
            </span>
          </div>
        </div>

        {sidebarTags.length ? (
          <AdminPersonProfilePillSection
            title={t("adminPersonProfile.skills.heading")}
            tags={sidebarTags}
          />
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <AdminPersonProfileMiniCard
            label={t("adminPersonProfile.sidebar.location")}
            value={
              [employee.addressCity, employee.addressProvince]
                .filter(Boolean)
                .join(", ") || t("studentProfile.na")
            }
          />
          <AdminPersonProfileMiniCard
            label={t("adminPersonProfile.mini.timezone")}
            value={t("adminPersonProfile.timezone.unset")}
          />
        </div>

        <div className="mt-6 space-y-2 border-t border-light-divider pt-5 text-[11px] dark:border-dark-divider">
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-muted dark:text-dark-muted">
              {t("adminPersonProfile.fields.employeeId")}
            </dt>
            <dd className="max-w-48 truncate font-mono text-light-text-secondary dark:text-dark-text-secondary">
              {employee.id}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-muted dark:text-dark-muted">
              {t("adminPersonProfile.fields.hireDate")}
            </dt>
            <dd className="text-light-text-secondary dark:text-dark-text-secondary">
              {formatDisplayDate(employee.joined, locale) ||
                formatDisplayDate(employee.hireDate, locale) ||
                t("studentProfile.na")}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-muted dark:text-dark-muted">
              Keycloak ID
            </dt>
            <dd className="max-w-48 truncate font-mono text-light-text-secondary dark:text-dark-text-secondary">
              {employee.keycloak ||
                (employee.linkedApplicationUserId ??
                  employee.applicationUserId ??
                  employee.gatewayUserId ??
                  "")}
            </dd>
          </div>
          {gatewayUser ? (
            <>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-muted dark:text-dark-muted">
                  Username
                </dt>
                <dd className="max-w-48 truncate font-mono text-light-text-secondary dark:text-dark-text-secondary">
                  {gatewayUser.user_name || "-"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-muted dark:text-dark-muted">
                  Email
                </dt>
                <dd className="max-w-[12rem] truncate font-mono text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary)">
                  {gatewayUser.email || "-"}
                </dd>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );

  const children = (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminProfileSemiGaugeCard
          title={t("adminPersonProfile.employee.performanceGauge")}
          score={aspectScore}
        />
        <AdminProfileHighlightCard
          title={t("adminPersonProfile.employee.strengths")}
          badge={t("adminPersonProfile.charts.compliant")}
          items={[
            {
              key: "dept",
              Icon: Building2,
              label: employee.department || t("studentProfile.na"),
            },
            {
              key: "pos",
              Icon: IdCard,
              label:
                employee.facultyPosition ||
                t("adminPersonProfile.employee.noPosition"),
            },
            {
              key: "vc",
              label: t("adminPersonProfile.highlights.repositories", {
                count: repos.length,
              }),
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <h2 className="mb-4 text-sm font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
            {t("adminPersonProfile.sections.publicRecord")}
          </h2>
          <div className="grid gap-3 text-xs  lg:grid-cols-3">
            <div>
              <p className="font-semibold text-muted dark:text-dark-muted">
                {t("studentProfile.fields.email")}
              </p>
              <p className="truncate font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {employee.email || t("studentProfile.na")}
              </p>
            </div>
            <div>
              <p className="font-semibold text-muted dark:text-dark-muted">
                {t("studentProfile.fields.phone")}
              </p>
              <p className="truncate font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {employee.phone || t("studentProfile.na")}
              </p>
            </div>
            <div className="">
              <p className="font-semibold text-muted dark:text-dark-muted">
                {t("adminPersonProfile.fields.street")}
              </p>
              <p className="truncate font-medium text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {[
                  employee.addressStreet,
                  employee.addressCity,
                  employee.addressProvince,
                ]
                  .filter(Boolean)
                  .join(", ") || t("studentProfile.na")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <AdminProfileGreenScope>
      <AdminPersonProfileFrame sidebar={sidebar} children={children} />
    </AdminProfileGreenScope>
  );
}
