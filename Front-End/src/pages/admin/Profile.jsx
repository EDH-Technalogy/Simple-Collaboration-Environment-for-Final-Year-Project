import React, { useMemo } from "react";
import {
  ChevronRight,
  MapPin,
  Clock,
  Briefcase,
  Award,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import AdminProfileGreenScope from "../../components/admin/AdminProfileGreenScope";
import Button from "../../components/Button";
import {
  useEmployee,
  useStudent,
  useTeacher,
  useUser,
  useVcRepositoriesForViewer,
  useVcUserActivity,
} from "../../services/useApi";
import { bucketVcActivityEvents } from "../../utils/vcActivityBuckets";
import { buildPersonInitials, resolveProfilePhotoUrl } from "../../lib/profileMedia";

function safePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const uid = String(id ?? "").trim();

  const { data: user, isLoading, isError, isFetching } = useUser(uid, {
    enabled: Boolean(uid),
    notifyOnError: false,
  });

  const roleKey = String(user?.role ?? user?.user_type ?? "student").toLowerCase();
  const tryStudent =
    roleKey === "student" || roleKey === "user" || roleKey === "author";
  const tryTeacher = roleKey === "teacher";
  const tryStaff = roleKey === "staff" || roleKey === "employee" || roleKey === "admin" || roleKey === "dean";

  const { data: student } = useStudent(uid, {
    enabled: Boolean(uid && tryStudent),
    notifyOnError: false,
    retry: false,
  });

  const { data: teacher } = useTeacher(uid, {
    enabled: Boolean(uid && tryTeacher),
    notifyOnError: false,
    retry: false,
  });

  const { data: employee } = useEmployee(uid, {
    enabled: Boolean(uid && tryStaff),
    notifyOnError: false,
    retry: false,
  });

  const domainRecord = useMemo(() => {
    if (!uid) return null;
    const sid = student?.id != null ? String(student.id) : "";
    const tid = teacher?.id != null ? String(teacher.id) : "";
    const eid = employee?.id != null ? String(employee.id) : "";
    if (tryStudent && sid && sid === uid) return student;
    if (tryTeacher && tid && tid === uid) return teacher;
    if (tryStaff && eid && eid === uid) return employee;
    return null;
  }, [uid, student, teacher, employee, tryStudent, tryTeacher, tryStaff]);

  const displayName = useMemo(() => {
    const first =
      domainRecord?.firstName ?? user?.first_name ?? user?.firstName ?? "";
    const last =
      domainRecord?.lastName ?? user?.last_name ?? user?.lastName ?? "";
    const joined = [first, last].filter(Boolean).join(" ").trim();
    return (
      joined ||
      user?.fullName ||
      user?.user_name ||
      user?.username ||
      user?.email ||
      uid
    );
  }, [domainRecord, user, uid]);

  const roleLabel = useMemo(
    () => t(`adminShared.roles.${roleKey}`, t("adminShared.roles.user")),
    [t, roleKey],
  );

  const photoUrl = useMemo(() => resolveProfilePhotoUrl(user ?? {}), [user]);
  const initials = useMemo(() => buildPersonInitials(user ?? {}), [user]);

  const vcUsername = String(
    domainRecord?.username ?? user?.user_name ?? user?.username ?? "",
  ).trim();

  const ownerKey = String(
    domainRecord?.linkedApplicationUserId ??
      domainRecord?.applicationUserId ??
      domainRecord?.gatewayUserId ??
      "",
  ).trim();

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

  const metrics = useMemo(() => {
    const repoScore = Math.min(100, repos.length * 8);
    const pushScore = Math.min(100, buckets.pushes.length * 4);
    const prScore = Math.min(100, buckets.pulls.length * 7);
    const mergeScore = Math.min(100, buckets.merges.length * 9);
    const activity = Math.min(
      100,
      buckets.pushes.length + buckets.pulls.length * 2 + buckets.merges.length * 2,
    );
    const stability = domainRecord ? 92 : 72;
    return {
      repositories: safePercent(repoScore),
      pushes: safePercent(pushScore),
      pullRequests: safePercent(prScore),
      merges: safePercent(mergeScore),
      activity: safePercent(activity),
      profile: safePercent(stability),
    };
  }, [repos.length, buckets, domainRecord]);

  if (!uid || isLoading || (isFetching && !user)) {
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

  if (isError || !user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-light-app-bg p-6 dark:bg-dark-shell md:p-8">
        <p className="text-lg font-semibold text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
          {t("adminProfile.notFound.title")}
        </p>
        <Button variant="secondary" onClick={() => navigate("/admin/users")}>
          {t("adminProfile.notFound.back")}
        </Button>
      </div>
    );
  }

  const location =
    domainRecord?.addressCity ||
    domainRecord?.addressProvince ||
    domainRecord?.department ||
    t("studentProfile.na");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "—";
  const positionTypes = [
    roleLabel,
    roleKey === "student" ? t("adminShared.roles.student") : t("adminShared.roles.user"),
  ].filter(Boolean);

  const metricCards = [
    { key: "profile", label: t("adminPersonProfile.accountSnapshot"), value: metrics.profile },
    { key: "repositories", label: t("adminPersonProfile.metrics.repositories"), value: metrics.repositories },
    { key: "pushes", label: t("adminPersonProfile.metrics.pushes"), value: metrics.pushes },
    { key: "pullRequests", label: t("adminPersonProfile.metrics.pullRequests"), value: metrics.pullRequests },
    { key: "merges", label: t("adminPersonProfile.metrics.merges"), value: metrics.merges },
    { key: "activity", label: t("adminPersonProfile.sections.repositoryActivity"), value: metrics.activity },
  ];

  return (
    <AdminProfileGreenScope>
      <div className="min-h-[calc(100vh-64px)] bg-light-app-bg p-4 dark:bg-dark-shell md:p-6">
      
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-6">
        {/* Left Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
            <div className="relative mb-6 -mx-5 -mt-5">
              <div className="h-24 rounded-t-2xl bg-linear-to-r from-(--color-light-admin-profile-hero-from) to-(--color-light-admin-profile-hero-to) dark:from-(--color-dark-admin-profile-hero-from) dark:to-(--color-dark-admin-profile-hero-to)" />
              <div className="relative -mb-9 flex justify-center">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-(--color-light-card-bg) bg-light-app-secondary shadow-lg dark:border-(--color-dark-card-bg) dark:bg-(--color-dark-app-secondary)">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary dark:text-dark-primary">
                        {initials}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <h1 className="text-xl font-bold text-primary dark:text-dark-primary">
                {displayName}
              </h1>
              <span className="mt-2 inline-block rounded-full bg-light-success-bg px-3 py-1 text-xs font-semibold text-light-success-text dark:bg-green-950/40 dark:text-green-300">
                {roleLabel}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-light-divider pt-4 text-sm dark:border-dark-divider">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 text-muted dark:text-dark-muted" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted dark:text-dark-muted">
                    {t("adminProfile.contact.department")}
                  </p>
                  <p className="truncate font-semibold text-primary dark:text-dark-primary">
                    {location}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 text-muted dark:text-dark-muted" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted dark:text-dark-muted">
                    {t("settings.tabs.system")}
                  </p>
                  <p className="truncate font-semibold text-primary dark:text-dark-primary">
                    {timezone}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-light-divider pt-4 dark:border-dark-divider">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
                {t("adminProfile.account.title")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {positionTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-lg bg-light-app-secondary px-3 py-1 text-xs font-medium text-secondary dark:bg-dark-shell dark:text-dark-secondary"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3 border-t border-light-divider pt-4 dark:border-dark-divider">
              <Button
                variant="secondary"
                type="button"
                className="flex-1"
                onClick={() => navigate("/admin/users")}
              >
                {t("adminProfile.notFound.back")}
              </Button>
              <Button
                variant="primary"
                type="button"
                className="flex-1"
                onClick={() => navigate(`/admin/notification?user=${encodeURIComponent(uid)}`)}
              >
                {t("sidebar.admin.notification")}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6 lg:col-span-3">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {metricCards.map((m) => (
              <div
                key={m.key}
                className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 text-center shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
              >
                <div className="mb-1 text-2xl font-bold text-light-success-text dark:text-green-300">
                  {safePercent(m.value)}%
                </div>
                <p className="text-xs font-medium text-muted dark:text-dark-muted">
                  {m.label}
                </p>
              </div>
            ))}
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-6 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <h3 className="mb-4 text-sm font-semibold text-primary dark:text-dark-primary">
                {t("adminPersonProfile.charts.accountSignal")}
              </h3>
              <div className="flex items-center justify-center">
                <div className="relative h-40 w-40">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="rgba(148,163,184,0.35)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      strokeDasharray={`${(metrics.activity / 100) * 339.3} 339.3`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-light-admin-profile-hero-from)" />
                        <stop offset="100%" stopColor="var(--color-light-admin-profile-hero-to)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary dark:text-dark-primary">
                      {safePercent(metrics.activity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-6 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary dark:text-dark-primary">
                {t("adminPersonProfile.chapters.accountHighlights")}
                <span className="rounded-full bg-light-success-bg px-2 py-1 text-xs font-semibold text-light-success-text dark:bg-emerald-950/40 dark:text-emerald-200">
                  {t("adminPersonProfile.charts.synced")}
                </span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="mt-1 size-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                      {t("adminPersonProfile.metrics.repositories")}: {repos.length}
                    </p>
                    <p className="text-xs text-muted dark:text-dark-muted">
                      {t("adminPersonProfile.highlights.repositories", { count: repos.length })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="mt-1 size-5 text-light-success-text dark:text-green-300" />
                  <div>
                    <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                      {t("adminProfile.contact.email")}
                    </p>
                    <p className="break-all text-xs text-muted dark:text-dark-muted">
                      {user.email || t("studentProfile.na")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="mt-1 size-5 text-light-success-text dark:text-green-300" />
                  <div>
                    <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                      {t("adminProfile.account.id")}
                    </p>
                    <p className="break-all font-mono text-xs text-muted dark:text-dark-muted">
                      {String(user.id ?? uid)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-6 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <h3 className="mb-4 text-sm font-semibold text-primary dark:text-dark-primary">
                {t("adminPersonProfile.sections.repositoryActivity")}
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: t("adminPersonProfile.activity.pushes"),
                    pct: safePercent((buckets.pushes.length / Math.max(1, buckets.pushes.length + buckets.pulls.length + buckets.merges.length)) * 100),
                  },
                  {
                    label: t("adminPersonProfile.activity.pullRequests"),
                    pct: safePercent((buckets.pulls.length / Math.max(1, buckets.pushes.length + buckets.pulls.length + buckets.merges.length)) * 100),
                  },
                  {
                    label: t("adminPersonProfile.activity.merges"),
                    pct: safePercent((buckets.merges.length / Math.max(1, buckets.pushes.length + buckets.pulls.length + buckets.merges.length)) * 100),
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-primary dark:text-dark-primary">
                        {row.label}
                      </span>
                      <span className="text-sm font-bold text-light-success-text dark:text-green-300">
                        {row.pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-light-app-secondary dark:bg-dark-shell">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-(--color-light-admin-profile-hero-from) to-(--color-light-admin-profile-hero-to) dark:from-(--color-dark-admin-profile-hero-from) dark:to-(--color-dark-admin-profile-hero-to)"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity list */}
          <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-6 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary dark:text-dark-primary">
                {t("adminPersonProfile.sections.repositoryActivity")}
              </h3>
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-light-app-secondary dark:hover:bg-dark-shell"
                aria-label="More"
              >
                <MoreHorizontal size={18} className="text-muted dark:text-dark-muted" />
              </button>
            </div>

            {!vcUsername ? (
              <p className="rounded-xl border border-dashed border-(--color-light-card-border) px-4 py-8 text-center text-sm text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
                {t("adminPersonProfile.activity.noUsername")}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {[
                  { key: "pushes", label: t("adminPersonProfile.activity.pushes"), rows: buckets.pushes },
                  { key: "pulls", label: t("adminPersonProfile.activity.pullRequests"), rows: buckets.pulls },
                  { key: "merges", label: t("adminPersonProfile.activity.merges"), rows: buckets.merges },
                ].map((bucket) => (
                  <div
                    key={bucket.key}
                    className="flex min-h-[180px] flex-col rounded-2xl border border-(--color-light-card-border) bg-light-app-secondary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-shell"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-secondary dark:text-dark-secondary">
                        {bucket.label}
                      </h4>
                      <span className="rounded-full bg-(--color-light-card-bg) px-2 py-0.5 text-[10px] font-bold text-primary dark:bg-(--color-dark-card-bg) dark:text-dark-primary">
                        {bucket.rows.length}
                      </span>
                    </div>
                    <ul className="space-y-2 overflow-y-auto">
                      {bucket.rows.length === 0 ? (
                        <li className="py-8 text-center text-xs text-muted dark:text-dark-muted">
                          {t("adminPersonProfile.activity.empty")}
                        </li>
                      ) : (
                        bucket.rows.slice(0, 8).map((row) => (
                          <li
                            key={row.id}
                            className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-2 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
                          >
                            <p className="truncate text-xs font-semibold text-primary dark:text-dark-primary">
                              {row.label}
                            </p>
                            {row.repo ? (
                              <p className="mt-0.5 truncate font-mono text-[10px] text-muted dark:text-dark-muted">
                                {row.repo}
                              </p>
                            ) : null}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </AdminProfileGreenScope>
  );
}
