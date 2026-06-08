import { createElement, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  LayoutDashboard,
  Link2,
  ListChecks,
  Milestone,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../components/Button";
import GlobalModal from "../../components/GlobalModal";
import PersonAvatar from "../../components/PersonAvatar";
import ProjectRepositoryDocsPanel from "../../components/project/ProjectRepositoryDocsPanel";
import RepoOverviewStatCard from "../../components/repo/RepoOverviewStatCard";
import { REPO_OVERVIEW_STAT_PALETTES } from "../../components/repo/repoOverviewStatPalettes";
import SearchableSelect from "../../components/SearchableSelect";
import { useAuth } from "../../context/AuthContext";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { resolveShellBasePath } from "../../lib/roles";
import { cn } from "../../lib/utils";
import {
  useFacultyProject,
  useFacultyProjectByTeacher,
  useCompleteFacultyProject,
  useInviteFacultyProjectMembers,
  useLinkedTeacherRecord,
  usePublishFacultyProject,
  useRepositorySearch,
  useStudentSearch,
  useStudentsPage,
  useUnpublishFacultyProject,
  useUpdateFacultyProject,
  useUpdateFacultyProjectPublicResult,
  useVcRepoContributors,
  useVcRepoMilestones,
  useVcRepoStatistics,
  useVcRepoTasks,
  useVcUserActivity,
} from "../../services/useApi";
import { VC } from "../../services/RouteConfig";
import { extractDocxPlainText } from "../../services/documentRenderingService";
import {
  fetchFileContent,
  fetchRepositoryTree,
} from "../../services/versionControlService";
import { getFileExtension, tryDecodeUtf8 } from "../../utils/binaryFileHandlers";

const SURFACE_CARD =
  "rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-xs dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)";
const SURFACE_INSET =
  "rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary";
const PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary";

const activityColors = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
];

function unwrapProjectRow(row) {
  return row?.json && typeof row.json === "object" ? row.json : row;
}

function displayName(person, fallback = "-") {
  if (!person) return fallback;
  if (typeof person === "string") return person || fallback;
  const full = [
    person.firstName ?? person.first_name,
    person.lastName ?? person.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    full ||
    person.displayName ||
    person.name ||
    person.userName ||
    person.username ||
    person.email ||
    (person.id != null ? String(person.id) : fallback)
  );
}

function initialsFromName(value, fallback = "?") {
  const parts = String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return fallback;
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase?.() ?? "")
    .join("");
}

function numberValue(raw) {
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizeListPayload(payload, ...keys) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function safePercent(raw) {
  return Math.max(0, Math.min(100, Math.round(numberValue(raw))));
}

function memberListFromGroup(group) {
  const members =
    group?.groupMembers ?? group?.groupMember ?? group?.members ?? [];
  return Array.isArray(members) ? members : [];
}

function studentIdValue(student) {
  const value =
    student?.id ??
    student?.studentId ??
    student?.student_id ??
    student?.uuid ??
    "";
  return value != null && value !== "" ? String(value) : "";
}

function groupLeaderId(group) {
  return studentIdValue(
    group?.groupLeader ?? group?.leader ?? group?.group_leader,
  );
}

function studentToOption(student) {
  const id = studentIdValue(student);
  if (!id) return null;
  return {
    value: id,
    label: displayName(student, id),
    description:
      student?.email ??
      student?.code ??
      student?.department?.name ??
      student?.batch?.name ??
      undefined,
  };
}

function normalizeStudentOptions(page) {
  const list = Array.isArray(page?.content) ? page.content : [];
  return list.map(studentToOption).filter(Boolean);
}

function mergeOptions(...groups) {
  const merged = [];
  const seen = new Set();
  for (const group of groups) {
    for (const option of Array.isArray(group) ? group : []) {
      if (!option?.value || seen.has(option.value)) continue;
      seen.add(option.value);
      merged.push(option);
    }
  }
  return merged;
}

function repositoryRowToOption(row) {
  const id = row?.id ?? row?.repositoryId ?? row?.uuid ?? "";
  const owner = String(
    row?.ownerUsername ??
      row?.owner?.user_name ??
      row?.owner?.username ??
      row?.owner ??
      "",
  ).trim();
  const name = String(row?.repositoryName ?? row?.name ?? "").trim();
  const label =
    owner && name ? `${owner}/${name}` : name || owner || String(id || "");
  const value = id ? String(id) : `${owner}/${name}`.trim();
  if (!value || !label) return null;
  return {
    value,
    label,
    description:
      typeof row?.description === "string" ? row.description : undefined,
  };
}

function repositorySelectedFallbackOption(project, formRepoId, repoOptions = []) {
  const v = String(formRepoId ?? "").trim();
  if (!v) return null;
  const selectedFromOptions = repoOptions.find((option) => option?.value === v);
  if (selectedFromOptions) return selectedFromOptions;
  const nested = project?.projectRepository ?? project?.repository;
  const nestedId = nested?.id ?? nested?.repositoryId;
  if (nested && String(nestedId ?? "") === v) {
    const owner =
      nested.ownerUsername ??
      nested.owner?.username ??
      nested.owner?.user_name ??
      nested.owner ??
      "";
    const name = nested.repositoryName ?? nested.name ?? "";
    const label = owner && name ? `${owner}/${name}` : name || owner || v;
    return { value: v, label: String(label) };
  }
  return { value: v, label: v };
}

function buildProjectUpdatePayload(project, extra = {}) {
  const repositoryId =
    project?.projectRepository?.id ??
    project?.projectRepository?.repositoryId ??
    project?.repository?.id ??
    project?.repository ??
    "";
  return {
    projectName: project?.projectName ?? "",
    group: String(project?.group?.id ?? project?.group ?? ""),
    teacher: String(project?.teacher?.id ?? project?.teacher ?? ""),
    projectRepository: String(repositoryId),
    ...extra,
  };
}

function projectAcademicYearLabel(project) {
  const academicYear = project?.group?.academicYear;
  if (!academicYear) return "—";
  const direct =
    academicYear?.name ??
    academicYear?.label ??
    academicYear?.title ??
    academicYear?.year;
  if (String(direct ?? "").trim()) return String(direct).trim();
  const start = academicYear?.startDate
    ? new Date(academicYear.startDate).getFullYear()
    : Number.NaN;
  const end = academicYear?.endDate
    ? new Date(academicYear.endDate).getFullYear()
    : Number.NaN;
  if (!Number.isNaN(start) && !Number.isNaN(end)) return `${start}-${end}`;
  if (!Number.isNaN(start)) return String(start);
  return "—";
}

function contributorKey(row) {
  return String(row?.username ?? row?.userName ?? row?.email ?? row?.id ?? "")
    .trim()
    .toLowerCase();
}

function contributorKeys(row) {
  return [
    row?.username,
    row?.userName,
    row?.displayName,
    row?.email,
    row?.id,
    row?.userId,
    row?.code,
  ]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean);
}

function firstContributorMatch(index, row) {
  for (const key of contributorKeys(row)) {
    if (index.has(key)) return index.get(key);
  }
  return null;
}

function taskStatus(value) {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("complete")) return "completed";
  if (raw.includes("review")) return "review";
  if (raw.includes("progress")) return "progress";
  if (raw.includes("cancel")) return "cancelled";
  return "open";
}

const ABSTRACT_HEADINGS = [
  "abstract",
  "abstruct",
  "لنډیز",
  "لنډيز",
  "لندیز",
  "لنديز",
  "زيډنل",
  "زیدنل",
  "چکیده",
  "چکيده",
  "خلاصه",
];

const ABSTRACT_END_HEADINGS = [
  "keywords",
  "key words",
  "introduction",
  "chapter",
  "contents",
  "table of contents",
  "کلیدي کلمې",
  "کلیدي کلمي",
  "کلیدی کلمات",
  "کلمات کلیدی",
  "واژگان کلیدی",
  "سریزه",
  "مقدمه",
  "فهرست",
  "لومړی څپرکی",
  "لمړی څپرکی",
  "فصل اول",
];

function normalizeLanguageText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۀ/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ی")
    .replace(/‌/g, " ")
    .replace(/[“”"'.،,:;؛!؟?()[\]{}<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function compactAbstractText(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findHeadingIndex(normalizedText, headings, from = 0) {
  let best = -1;
  headings.forEach((heading) => {
    const normalizedHeading = normalizeLanguageText(heading);
    if (!normalizedHeading) return;
    const pattern = new RegExp(
      `(?:^|\\n|\\s)${escapeRegExp(normalizedHeading)}(?:\\s|$)`,
      "i",
    );
    const slice = normalizedText.slice(from);
    const match = pattern.exec(slice);
    if (!match) return;
    const index = from + match.index + match[0].indexOf(normalizedHeading);
    if (best === -1 || index < best) best = index;
  });
  return best;
}

function extractProjectAbstract(value) {
  const raw = compactAbstractText(value);
  if (!raw) return "";
  const normalizedRaw = normalizeLanguageText(raw);
  const start = findHeadingIndex(normalizedRaw, ABSTRACT_HEADINGS);
  if (start < 0) return raw;
  const heading = ABSTRACT_HEADINGS.find((item) =>
    normalizedRaw.slice(start).startsWith(normalizeLanguageText(item)),
  );
  const bodyStart = heading
    ? start + normalizeLanguageText(heading).length
    : start;
  const end = findHeadingIndex(normalizedRaw, ABSTRACT_END_HEADINGS, bodyStart);
  return compactAbstractText(normalizedRaw.slice(bodyStart, end >= 0 ? end : undefined));
}

function treeNodeLabel(entry) {
  return (
    entry?.name ??
    entry?.path?.split?.("/")?.pop?.() ??
    entry?.fileName ??
    entry?.filename ??
    entry?.key ??
    ""
  );
}

function treeNodePath(entry, parentPath = "") {
  const direct = String(entry?.path ?? entry?.fullPath ?? "").replace(/^\/+/, "");
  if (direct) return direct;
  const parent = String(parentPath ?? "").replace(/^\/+|\/+$/g, "");
  const label = String(treeNodeLabel(entry) ?? "").replace(/^\/+/, "");
  return [parent, label].filter(Boolean).join("/");
}

function isTreeDirectory(entry) {
  return Boolean(
    entry?.type === "directory" ||
      entry?.type === "dir" ||
      entry?.type === "tree" ||
      entry?.isDirectory,
  );
}

function isPublishableFinalFile(path) {
  return ["docx", "doc", "txt", "text", "md"].includes(getFileExtension(path));
}

function finalFileScore(path) {
  const clean = String(path ?? "").replace(/\\/g, "/").toLowerCase();
  const base = clean.split("/").pop() ?? clean;
  const stem = base.replace(/\.[^.]+$/, "");
  if (base === "project.docx") return 1000;
  if (base === "project.txt" || base === "project.text") return 990;
  if (base === "project.md") return 980;
  if (stem === "project") return 950;
  if (base.includes("final") && base.endsWith(".docx")) return 860;
  if (base.includes("monograph") && base.endsWith(".docx")) return 840;
  if (base.includes("thesis") && base.endsWith(".docx")) return 830;
  if (base.includes("project") && base.endsWith(".docx")) return 820;
  if (base.includes("final")) return 700;
  if (base.includes("project")) return 650;
  return 100;
}

function isFacultyProjectCompleted(project) {
  const rawStatus = String(
    project?.status ??
      project?.projectStatus ??
      project?.workflowStatus ??
      project?.state ??
      "",
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (rawStatus === "completed" || rawStatus === "complete" || rawStatus === "done") {
    return true;
  }
  if (project?.completed === true || project?.isCompleted === true) {
    return true;
  }
  return numberValue(project?.completion ?? project?.progress) >= 100;
}

function peopleFromStats(rows) {
  return (Array.isArray(rows) ? rows : []).map((row, index) => {
    const name = displayName(row, row?.username || `Contributor ${index + 1}`);
    return {
      id: String(row?.userId ?? row?.id ?? row?.username ?? `contributor-${index}`),
      name,
      email: row?.email ?? "",
      profilePicture: row?.profile ?? row?.profilePicture ?? "",
      tasks: numberValue(row?.completedTasks ?? row?.assignedTasks),
      commits: numberValue(row?.commits),
      pulls: numberValue(row?.pullRequests),
      score: safePercent(row?.marksPercentage ?? row?.activityScore),
    };
  });
}

function SectionHeader({ icon, eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-light-divider px-4 py-4 dark:border-dark-divider md:px-5 md:py-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted dark:text-dark-muted">
          {createElement(icon, {
            className: "size-3.5",
            strokeWidth: 1.8,
            "aria-hidden": true,
          })}
          {eyebrow}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-primary dark:text-dark-primary">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-secondary dark:text-dark-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function ProgressBar({ value, className = "" }) {
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-light-app-tertiary dark:bg-dark-app-tertiary ${className}`}
    >
      <div
        className="h-full rounded-full bg-(--color-light-input-border-focus) transition-[width] duration-700 dark:bg-(--color-dark-input-border-focus)"
        style={{ width: `${safePercent(value)}%` }}
      />
    </div>
  );
}

function ActivityStrip({ seed, points = [] }) {
  const values = Array.isArray(points) && points.length ? points : [0];
  const max = Math.max(1, ...values.map((point) => numberValue(point?.value)));
  return (
    <div className="flex items-end gap-1">
      {values.map((point, index) => {
        const value = numberValue(point?.value);
        const height = Math.max(10, (value / max) * 72);
        const label = point?.label ?? `Point ${index + 1}`;
        return (
          <span
            key={`${seed}-${index}`}
            className="group relative w-1.5 rounded-full bg-light-app-tertiary transition-colors hover:bg-(--color-light-input-border-focus) dark:bg-dark-app-tertiary dark:hover:bg-(--color-dark-input-border-focus)"
            style={{ height }}
          >
            {value > 0 ? (
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 rounded-full",
                  activityColors[index % activityColors.length],
                )}
                style={{ height: "100%" }}
              />
            ) : null}
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden min-w-28 -translate-x-1/2 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2 py-1 text-center text-[10px] font-semibold text-primary shadow-md group-hover:block dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-primary">
              {label}: {value}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function AxisActivityChart({
  seed,
  points = [],
  xAxisLabel = "Timeline",
  yAxisLabel = "Events",
}) {
  const values = Array.isArray(points) && points.length ? points : [];
  const max = Math.max(1, ...values.map((point) => numberValue(point?.value)));
  const firstLabel = values[0]?.label ?? "";
  const lastLabel = values.at(-1)?.label ?? "";

  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2">
      <div className="flex items-center justify-center">
        <span className="-rotate-90 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
          {yAxisLabel}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex h-28 items-end gap-1 border-b border-l border-light-divider pl-2 dark:border-dark-divider">
          {values.length ? (
            values.map((point, index) => {
              const value = numberValue(point?.value);
              const height = Math.max(8, (value / max) * 96);
              const label = point?.label ?? `Point ${index + 1}`;
              return (
                <span
                  key={`${seed}-${index}`}
                  className="group relative flex min-w-1 flex-1 items-end"
                  style={{ height }}
                >
                  <span
                    className={cn(
                      "block w-full rounded-t-md",
                      activityColors[index % activityColors.length],
                    )}
                    style={{ height: "100%" }}
                  />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden min-w-32 -translate-x-1/2 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2 py-1 text-center text-[10px] font-semibold text-primary shadow-md group-hover:block dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-primary">
                    {label}: {value}
                  </span>
                </span>
              );
            })
          ) : (
            <span className="pb-4 text-xs text-muted dark:text-dark-muted">
              No activity yet
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted dark:text-dark-muted">
          <span>{firstLabel}</span>
          <span className="font-semibold uppercase tracking-wide">
            {xAxisLabel}
          </span>
          <span>{lastLabel}</span>
        </div>
      </div>
    </div>
  );
}

function PersonCard({ person, selected, onClick }) {
  const BadgeIcon = person.badgeIcon ?? UserCheck;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-light-input-border-focus) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-light-card-bg) dark:focus-visible:ring-(--color-dark-input-border-focus) dark:focus-visible:ring-offset-(--color-dark-card-bg)",
        selected
          ? "border-sky-300 bg-sky-50 shadow-md ring-2 ring-sky-200/70 dark:border-(--color-dark-input-border-focus) dark:bg-dark-app-tertiary dark:ring-blue-400/15"
          : "border-(--color-light-card-border) bg-(--color-light-card-bg) hover:bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:hover:bg-dark-app-tertiary",
      )}
    >
      <div className="flex items-start gap-3">
        <PersonAvatar
          person={person}
          sizeClass="inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
          className="bg-light-btn-primary-bg text-xs font-bold text-white dark:bg-dark-primary dark:text-dark-shell"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-primary dark:text-dark-primary">
              {person.name}
            </p>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                person.badgeClass,
              )}
            >
              {createElement(BadgeIcon, {
                className: "size-3",
                strokeWidth: 1.9,
                "aria-hidden": true,
              })}
              {person.badgeLabel}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted dark:text-dark-muted">
            {person.role}
          </p>
          {person.academicLabel ? (
            <p className="mt-1 truncate text-[11px] text-secondary dark:text-dark-secondary">
              {person.academicLabel}
            </p>
          ) : null}
          {person.email ? (
            <p className="mt-1 truncate text-[11px] text-muted dark:text-dark-muted">
              {person.email}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className={SURFACE_INSET + " px-2 py-2 text-center"}>
          <p className="text-[10px] text-muted dark:text-dark-muted">Tasks</p>
          <p className="mt-1 text-sm font-semibold text-primary dark:text-dark-primary">
            {person.tasks}
          </p>
        </div>
        <div className={SURFACE_INSET + " px-2 py-2 text-center"}>
          <p className="text-[10px] text-muted dark:text-dark-muted">Commits</p>
          <p className="mt-1 text-sm font-semibold text-primary dark:text-dark-primary">
            {person.commits}
          </p>
        </div>
        <div className={SURFACE_INSET + " px-2 py-2 text-center"}>
          <p className="text-[10px] text-muted dark:text-dark-muted">Score</p>
          <p className="mt-1 text-sm font-semibold text-primary dark:text-dark-primary">
            {person.score}%
          </p>
        </div>
      </div>
    </button>
  );
}

export default function ProjectWorkspace() {
  const { id, owner, repo } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shellBase = resolveShellBasePath(location.pathname, user?.role);
  const isTeacherShell = shellBase === "/teacher";
  const isAdminShell = shellBase === "/admin";
  const sessionTeacherId = String(
    user?.teacherId ??
      user?.teacher_id ??
      user?.facultyTeacherId ??
      user?.faculty_teacher_id ??
      user?.teacher?.id ??
      "",
  ).trim();
  const { data: linkedTeacher } = useLinkedTeacherRecord(user, {
    enabled: isTeacherShell && !sessionTeacherId,
    notifyOnError: false,
  });
  const teacherId =
    sessionTeacherId ||
    (linkedTeacher?.id != null ? String(linkedTeacher.id).trim() : "");
  const urlOwner = owner ? decodeURIComponent(owner) : "";
  const urlRepo = repo ? decodeURIComponent(repo) : "";

  const [activePanel, setActivePanel] = useState("overview");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [connectRepoOpen, setConnectRepoOpen] = useState(false);
  const [inviteSearchTerm, setInviteSearchTerm] = useState("");
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [repoSearchTerm, setRepoSearchTerm] = useState("");
  const [selectedRepoId, setSelectedRepoId] = useState("");

  const debouncedInviteSearchTerm = useDebouncedValue(inviteSearchTerm, 300);
  const debouncedRepoSearchTerm = useDebouncedValue(repoSearchTerm, 300);

  const { data: projectResponse, isLoading: projectLoading } =
    useFacultyProject(id, {
      enabled: Boolean(id),
      notifyOnError: true,
    });
  const { data: teacherProjectResponse, isLoading: teacherProjectLoading } =
    useFacultyProjectByTeacher(id, teacherId, {
      enabled: Boolean(id && teacherId && isTeacherShell),
      notifyOnError: false,
    });
  const project = useMemo(
    () =>
      unwrapProjectRow(
        isTeacherShell
          ? (teacherProjectResponse ?? projectResponse)
          : projectResponse,
      ),
    [isTeacherShell, projectResponse, teacherProjectResponse],
  );
  const activeProjectLoading = isTeacherShell
    ? projectLoading || (Boolean(teacherId) && teacherProjectLoading)
    : projectLoading;

  const projectMembers = useMemo(
    () => memberListFromGroup(project?.group),
    [project],
  );

  const repository = project?.projectRepository ?? project?.repository ?? {};
  const displayOwner =
    repository?.owner ??
    repository?.ownerUsername ??
    repository?.owner?.username ??
    urlOwner;
  const displayRepo = repository?.repositoryName ?? repository?.name ?? urlRepo;
  const hasRepository = Boolean(displayOwner && displayRepo);
  const repoPath = hasRepository ? `${displayOwner}/${displayRepo}` : "No repository connected";
  const repositoryWorkspacePath = hasRepository
    ? `${shellBase}/repository/${encodeURIComponent(displayOwner)}/${encodeURIComponent(displayRepo)}`
    : "";

  const statsQ = useVcRepoStatistics(displayOwner, displayRepo, {
    enabled: hasRepository,
    notifyOnError: false,
  });
  const tasksQ = useVcRepoTasks(displayOwner, displayRepo, {}, {
    enabled: hasRepository,
    notifyOnError: false,
  });
  const milestonesQ = useVcRepoMilestones(displayOwner, displayRepo, {}, {
    enabled: hasRepository,
    notifyOnError: false,
  });
  const contributorsQ = useVcRepoContributors(displayOwner, displayRepo, {
    enabled: hasRepository,
    notifyOnError: false,
  });
  const activityQ = useVcUserActivity(displayOwner, {
    enabled: hasRepository && Boolean(displayOwner),
    notifyOnError: false,
    limit: 100,
  });

  const { data: studentPage } = useStudentsPage(
    { page: 0, pageSize: 500, notifyOnError: false },
    { staleTime: 60_000 },
  );
  const { data: searchedStudents = [], isFetching: isSearchingInvitees } =
    useStudentSearch(debouncedInviteSearchTerm, {
      enabled: debouncedInviteSearchTerm.length > 0,
      staleTime: 30_000,
      notifyOnError: false,
    });
  const { data: repoHits = [], isFetching: repoSearchBusy } =
    useRepositorySearch(debouncedRepoSearchTerm, { notifyOnError: false });

  const inviteProjectMembers = useInviteFacultyProjectMembers({
    toastSuccess: "adminProjectWorkspace.invite.success",
    toastError: "apiErrors.failed_to_update_faculty_project",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty-projects"] });
      await queryClient.invalidateQueries({
        queryKey: ["faculty-projects", "detail", id],
      });
      setInviteOpen(false);
      setSelectedInvitees([]);
      setInviteSearchTerm("");
    },
  });

  const connectRepository = useUpdateFacultyProject({
    toastSuccess: "adminProjectWorkspace.repository.success",
    toastError: "apiErrors.failed_to_update_faculty_project",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty-projects"] });
      await queryClient.invalidateQueries({
        queryKey: ["faculty-projects", "detail", id],
      });
      setConnectRepoOpen(false);
      setSelectedRepoId("");
      setRepoSearchTerm("");
    },
  });

  const refreshProjectQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ["faculty-projects"] });
    await queryClient.invalidateQueries({
      queryKey: ["faculty-projects", "detail", id],
    });
  };

  const updatePublicResult = useUpdateFacultyProjectPublicResult({
    toastSuccess: "Public project result saved",
    toastError: "apiErrors.failed_to_update_faculty_project",
    onSuccess: refreshProjectQueries,
  });

  const completeProject = useCompleteFacultyProject({
    toastSuccess: "Project marked as completed",
    toastError: "apiErrors.failed_to_update_faculty_project",
    onSuccess: refreshProjectQueries,
  });

  const publishProject = usePublishFacultyProject({
    toastSuccess: "Project published",
    toastError: "apiErrors.failed_to_update_faculty_project",
    onSuccess: refreshProjectQueries,
  });

  const unpublishProject = useUnpublishFacultyProject({
    toastSuccess: "Project unpublished",
    toastError: "apiErrors.failed_to_update_faculty_project",
    onSuccess: refreshProjectQueries,
  });

  const tasks = useMemo(
    () => normalizeListPayload(tasksQ.data, "tasks"),
    [tasksQ.data],
  );
  const milestones = useMemo(
    () => normalizeListPayload(milestonesQ.data, "milestones"),
    [milestonesQ.data],
  );
  const rawContributors = useMemo(() => {
    const data = contributorsQ.data;
    const statsRows = Array.isArray(statsQ.data?.contributors)
      ? statsQ.data.contributors
      : [];
    const rows = [];
    const seen = new Set();
    const add = (row) => {
      if (!row || typeof row !== "object") return;
      const key = contributorKey(row) || String(rows.length);
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(row);
    };
    statsRows.forEach(add);
    if (Array.isArray(data)) data.forEach(add);
    if (Array.isArray(data?.contributors)) data.contributors.forEach(add);
    return rows;
  }, [contributorsQ.data, statsQ.data]);
  const activityEvents = useMemo(
    () => (Array.isArray(activityQ.data) ? activityQ.data : []),
    [activityQ.data],
  );

  const overview = statsQ.data?.overview ?? {};
  const completedTasks = tasks.filter((task) => taskStatus(task?.status) === "completed").length;
  const reviewTasks = tasks.filter((task) => taskStatus(task?.status) === "review").length;
  const progressTasks = tasks.filter((task) => taskStatus(task?.status) === "progress").length;
  const totalCommits =
    numberValue(overview?.totalCommits) ||
    rawContributors.reduce((sum, row) => sum + numberValue(row?.commits), 0);
  const totalPulls =
    numberValue(overview?.totalPullRequests) ||
    rawContributors.reduce(
      (sum, row) => sum + numberValue(row?.pullRequests),
      0,
    );
  const completion =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const activityPoints = useMemo(() => {
    const buckets = new Map();
    for (const event of activityEvents) {
      const rawDate =
        event?.createdAt ??
        event?.timestamp ??
        event?.time ??
        event?.date ??
        event?.occurredAt;
      const date = rawDate ? new Date(rawDate) : null;
      const key =
        date && !Number.isNaN(date.getTime())
          ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
          : "Recent";
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    if (!buckets.size) {
      return peopleFromStats(rawContributors).map((person) => ({
        label: person.name,
        value: person.commits + person.pulls + person.tasks,
      }));
    }
    return [...buckets.entries()]
      .slice(-18)
      .map(([label, value]) => ({ label, value }));
  }, [activityEvents, rawContributors]);

  const people = useMemo(() => {
    const byKey = new Map();
    rawContributors.forEach((row) => {
      contributorKeys(row).forEach((key) => byKey.set(key, row));
    });
    const leaderId = groupLeaderId(project?.group);

    const supervisorName = displayName(project?.teacher, "Supervisor");
    const supervisorStats = firstContributorMatch(byKey, project?.teacher) ?? {};
    const supervisor = {
      id: `teacher-${project?.teacher?.id ?? supervisorName}`,
      name: supervisorName,
      role: "Lead supervisor",
      badgeLabel: "Teacher",
      badgeIcon: ShieldCheck,
      badgeClass:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
      email: project?.teacher?.email ?? supervisorStats?.email ?? "",
      profilePicture:
        project?.teacher?.profilePicture ??
        supervisorStats?.profile ??
        supervisorStats?.profilePicture ??
        "",
      initials: initialsFromName(supervisorName, "TS"),
      tasks: numberValue(
        supervisorStats?.completedTasks ?? supervisorStats?.assignedTasks,
      ),
      commits: numberValue(supervisorStats?.commits),
      pulls: numberValue(supervisorStats?.pullRequests),
      score: safePercent(
        supervisorStats?.marksPercentage ?? supervisorStats?.activityScore,
      ),
      kind: "teacher",
      note: "Reviews direction, milestones, and repository readiness.",
    };

    const students = projectMembers.map((member, index) => {
      const vc = firstContributorMatch(byKey, member) ?? {};
      const name = displayName(member, `Student ${index + 1}`);
      const isLeader = Boolean(
        leaderId && studentIdValue(member) === String(leaderId),
      );
      return {
        id: studentIdValue(member) || `student-${index}`,
        name,
        email: member?.email ?? vc?.email ?? "",
        profilePicture:
          member?.profilePicture ?? vc?.profile ?? vc?.profilePicture ?? "",
        role: isLeader ? "Group leader" : "Project member",
        badgeLabel: isLeader ? "Leader" : "Member",
        badgeIcon: isLeader ? UserCheck : Users,
        badgeClass: isLeader
          ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
        academicLabel:
          member?.department?.name ??
          member?.batch?.name ??
          "Project contributor",
        initials: initialsFromName(name, "ST"),
        tasks: numberValue(vc?.completedTasks ?? vc?.assignedTasks),
        commits: numberValue(vc?.commits),
        pulls: numberValue(vc?.pullRequests),
        score: safePercent(vc?.marksPercentage ?? vc?.activityScore),
        kind: "student",
        note: "Contributes implementation, documents, and project evidence.",
      };
    });

    return [supervisor, ...students];
  }, [project?.group, project?.teacher, projectMembers, rawContributors]);

  const overviewStatTiles = useMemo(
    () => [
      {
        key: "people",
        icon: Users,
        label: "People",
        value: people.length,
        hint: "Supervisor plus project contributors.",
        paletteIndex: 0,
      },
      {
        key: "tasks",
        icon: ListChecks,
        label: "Tasks",
        value: tasks.length,
        hint: `${completedTasks} completed, ${reviewTasks} in review.`,
        paletteIndex: 1,
      },
      {
        key: "milestones",
        icon: Milestone,
        label: "Milestones",
        value: milestones.length,
        hint: "Project delivery checkpoints.",
        paletteIndex: 2,
      },
      {
        key: "commits",
        icon: GitCommitHorizontal,
        label: "Commits",
        value: totalCommits,
        hint: "Repository activity signal.",
        paletteIndex: 3,
      },
    ],
    [
      completedTasks,
      milestones.length,
      people.length,
      reviewTasks,
      tasks.length,
      totalCommits,
    ],
  );

  const selectedPerson =
    people.find((person) => person.id === selectedPersonId) ?? people[0];

  const inviteeOptions = useMemo(
    () => normalizeStudentOptions(studentPage),
    [studentPage],
  );
  const searchedInviteeOptions = useMemo(
    () => searchedStudents.map(studentToOption).filter(Boolean),
    [searchedStudents],
  );
  const existingMemberIds = useMemo(
    () =>
      new Set(
        projectMembers.map((member) => studentIdValue(member)).filter(Boolean),
      ),
    [projectMembers],
  );
  const selectedInviteeOptions = useMemo(() => {
    const byId = new Map();
    inviteeOptions.forEach((option) => byId.set(option.value, option));
    searchedInviteeOptions.forEach((option) => byId.set(option.value, option));
    return selectedInvitees.map((value) => byId.get(value)).filter(Boolean);
  }, [inviteeOptions, searchedInviteeOptions, selectedInvitees]);
  const inviteSelectOptions = useMemo(
    () =>
      mergeOptions(selectedInviteeOptions, searchedInviteeOptions, inviteeOptions)
        .filter((option) => !existingMemberIds.has(option.value)),
    [
      existingMemberIds,
      inviteeOptions,
      searchedInviteeOptions,
      selectedInviteeOptions,
    ],
  );

  const repoSearchOptions = useMemo(
    () => repoHits.map(repositoryRowToOption).filter(Boolean),
    [repoHits],
  );
  const selectedRepoFallback = repositorySelectedFallbackOption(
    project,
    selectedRepoId,
    repoSearchOptions,
  );
  const repoSelectOptions = useMemo(
    () =>
      mergeOptions(
        selectedRepoFallback ? [selectedRepoFallback] : [],
        repoSearchOptions,
      ),
    [repoSearchOptions, selectedRepoFallback],
  );

  const academicYearLabel = projectAcademicYearLabel(project);
  const groupName = project?.group?.name ?? "—";
  const projectTitle =
    displayRepo ||
    project?.projectName ||
    t("adminProjectWorkspace.defaultTitle");
  const projectDescription =
    project?.description ||
    t("adminProjectWorkspace.defaultDescription");
  const [abstractDraft, setAbstractDraft] = useState("");
  const isProjectCompleted = isFacultyProjectCompleted(project);
  const isProjectPublished = Boolean(project?.published);
  const finalFileName = String(project?.finalFileName ?? "").trim();
  const savedFinalFileDownloadUrl = String(project?.finalFileDownloadUrl ?? "").trim();
  const generatedFinalFileDownloadUrl =
    !savedFinalFileDownloadUrl && displayOwner && displayRepo && finalFileName
      ? VC.REPO_FILE_AT_REF(displayOwner, displayRepo, "main", finalFileName)
      : "";
  const finalFileDownloadUrl =
    savedFinalFileDownloadUrl || generatedFinalFileDownloadUrl;
  const publicAbstract = String(project?.abstractText ?? "").trim();
  const draftPublicAbstract = String(abstractDraft ?? "").trim();
  const effectivePublicAbstract = publicAbstract || draftPublicAbstract;
  const publishReady = Boolean(
    isProjectCompleted &&
      finalFileName &&
      finalFileDownloadUrl &&
      effectivePublicAbstract,
  );

  useEffect(() => {
    setAbstractDraft(project?.abstractText ?? "");
  }, [project?.id, project?.abstractText]);

  const taskFlow = [
    { label: "Open", value: Math.max(0, tasks.length - completedTasks - progressTasks - reviewTasks) },
    { label: "In progress", value: progressTasks },
    { label: "Review", value: reviewTasks },
    { label: "Complete", value: completedTasks },
  ];
  const maxTaskFlow = Math.max(1, ...taskFlow.map((item) => item.value));

  const recentActivity = [
    {
      icon: GitCommitHorizontal,
      title: `${totalCommits || 0} commits tracked`,
      detail: hasRepository
        ? `Implementation activity for ${repoPath}`
        : "Connect a repository to show live commit activity.",
      to: repositoryWorkspacePath,
    },
    {
      icon: GitPullRequest,
      title: `${totalPulls || 0} pull requests`,
      detail: "Review flow across students and supervisors.",
      to: `${repositoryWorkspacePath}/pull-requests`,
    },
    {
      icon: CheckCircle2,
      title: `${completedTasks} tasks completed`,
      detail: `${reviewTasks} tasks are waiting for review.`,
      to: `${repositoryWorkspacePath}/tasks`,
    },
  ];

  const connectRepositorySubmit = () => {
    const repoId = String(selectedRepoId ?? "").trim();
    if (!repoId || !id || !project) return;
    connectRepository.mutate({
      id,
      ...buildProjectUpdatePayload(project, { projectRepository: repoId }),
    });
  };

  const inviteMembersSubmit = () => {
    if (!id || !selectedInvitees.length) return;
    inviteProjectMembers.mutate({
      id,
      invitations: selectedInvitees,
    });
  };

  const completeProjectSubmit = () => {
    if (!id || completeProject.isPending || isProjectCompleted) return;
    completeProject.mutate({ id });
  };

  const findAutomaticFinalFile = async () => {
    if (!displayOwner || !displayRepo) return null;
    const ref = "main";
    const found = [];
    const visit = async (path = "", depth = 0) => {
      if (depth > 5) return;
      const rows = await fetchRepositoryTree(displayOwner, displayRepo, {
        ref,
        path,
      });
      await Promise.all(
        rows.map(async (entry) => {
          const fullPath = treeNodePath(entry, path);
          if (!fullPath) return;
          if (isTreeDirectory(entry)) {
            await visit(fullPath, depth + 1);
            return;
          }
          if (isPublishableFinalFile(fullPath)) {
            found.push(fullPath);
          }
        }),
      );
    };
    try {
      await visit("");
    } catch {
      return null;
    }
    if (!found.length) return null;
    found.sort((a, b) => finalFileScore(b) - finalFileScore(a) || a.localeCompare(b));
    return { path: found[0], ref };
  };

  const extractAbstractFromFinalFile = async (fileName = finalFileName) => {
    const targetFileName = String(fileName ?? "").trim();
    if (!displayOwner || !displayRepo || !targetFileName) return "";
    try {
      const bytes = await fetchFileContent(
        displayOwner,
        displayRepo,
        targetFileName,
        "main",
      );
      const ext = getFileExtension(targetFileName);
      const plainText =
        ext === "docx" || ext === "doc"
          ? await extractDocxPlainText(bytes)
          : tryDecodeUtf8(bytes);
      return extractProjectAbstract(plainText);
    } catch {
      return "";
    }
  };

  const publishProjectSubmit = async () => {
    if (!id || publishProject.isPending || updatePublicResult.isPending) return;
    if (!isProjectCompleted) {
      gooeyToast.error("Project must be completed by the teacher before publishing.");
      return;
    }
    let nextFinalFileName = finalFileName;
    let nextFinalFileDownloadUrl = finalFileDownloadUrl;
    if (!nextFinalFileName || !nextFinalFileDownloadUrl) {
      const autoFinal = await findAutomaticFinalFile();
      if (autoFinal?.path) {
        nextFinalFileName = autoFinal.path;
        nextFinalFileDownloadUrl = VC.REPO_FILE_AT_REF(
          displayOwner,
          displayRepo,
          autoFinal.ref,
          autoFinal.path,
        );
      }
    }
    if (!nextFinalFileName || !nextFinalFileDownloadUrl) {
      gooeyToast.error("Choose one final result file before publishing.");
      return;
    }
    let nextAbstract = effectivePublicAbstract;
    if (!nextAbstract) {
      nextAbstract = await extractAbstractFromFinalFile(nextFinalFileName);
      if (nextAbstract) {
        setAbstractDraft(nextAbstract);
      }
    }
    if (!nextAbstract) {
      gooeyToast.error("Add the public abstract before publishing.");
      return;
    }
    const needsMetadataSave =
      project &&
      (nextFinalFileName !== finalFileName ||
        nextFinalFileDownloadUrl !== savedFinalFileDownloadUrl ||
        nextAbstract !== publicAbstract);
    if (needsMetadataSave) {
      try {
        await updatePublicResult.mutateAsync({
          id,
          abstractText: nextAbstract,
          finalFileName: nextFinalFileName,
          finalFileDownloadUrl: nextFinalFileDownloadUrl,
        });
      } catch {
        return;
      }
    }
    publishProject.mutate({ id });
  };

  const unpublishProjectSubmit = () => {
    if (!id || unpublishProject.isPending) return;
    unpublishProject.mutate({ id });
  };

  const savePublicResultMetadata = () => {
    if (!id || !project || updatePublicResult.isPending) return;
    updatePublicResult.mutate({
      id,
      abstractText: abstractDraft,
      finalFileName: project?.finalFileName ?? "",
      finalFileDownloadUrl: finalFileDownloadUrl || project?.finalFileDownloadUrl || "",
    });
  };

  const setPublicResultFile = ({ path, ref: fileRef }) => {
    if (!id || !project || !displayOwner || !displayRepo || !path) return;
    const selectedRef = String(fileRef || "main").trim();
    updatePublicResult.mutate({
      id,
      abstractText: abstractDraft || project?.abstractText || "",
      finalFileName: path,
      finalFileDownloadUrl: VC.REPO_FILE_AT_REF(
        displayOwner,
        displayRepo,
        selectedRef,
        path,
      ),
    });
  };

  if (id && activeProjectLoading) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-white p-4 dark:bg-dark-card-bg">
        <p className="text-sm text-muted dark:text-dark-muted">
          {t("adminProjectWorkspace.loading")}
        </p>
      </div>
    );
  }

  if (id && !activeProjectLoading && !project) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-white p-4 dark:bg-dark-card-bg">
        <p className="text-sm text-muted dark:text-dark-muted">
          {t("adminProjectWorkspace.notFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-1 overflow-y-auto bg-white p-4 dark:bg-dark-card-bg md:p-5">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <Link
          to={`${shellBase}/projects`}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-primary dark:text-dark-muted dark:hover:text-dark-primary"
        >
          <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
          {t("adminProjectWorkspace.backToProjects")}
        </Link>

        <section className="overflow-hidden rounded-3xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="p-5 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className={PILL}>
                  <LayoutDashboard className="size-3.5" strokeWidth={1.8} />
                  Project command center
                </span>
                <span className={PILL}>
                  <GitBranch className="size-3.5" strokeWidth={1.8} />
                  {repoPath}
                </span>
              </div>
              <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-primary dark:text-dark-primary md:text-4xl">
                {String(projectTitle).replace(/-/g, " ")}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-secondary dark:text-dark-secondary">
                {projectDescription}
              </p>
            </div>

            <aside className="border-t border-light-divider bg-light-app-tertiary p-5 dark:border-dark-divider dark:bg-dark-app-tertiary xl:border-l xl:border-t-0">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
                    Supervisor
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-full bg-light-btn-primary-bg text-xs font-bold text-white dark:bg-dark-primary dark:text-dark-shell">
                      {initialsFromName(displayName(project?.teacher), "TS")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                        {displayName(project?.teacher)}
                      </p>
                      <p className="text-xs text-muted dark:text-dark-muted">
                        Lead review and academic direction
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`${SURFACE_CARD} p-3`}>
                    <p className="text-[11px] text-muted dark:text-dark-muted">
                      Academic year
                    </p>
                    <p className="mt-1 text-sm font-semibold text-primary dark:text-dark-primary">
                      {academicYearLabel}
                    </p>
                  </div>
                  <div className={`${SURFACE_CARD} p-3`}>
                    <p className="text-[11px] text-muted dark:text-dark-muted">
                      Group
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-primary dark:text-dark-primary">
                      {groupName}
                    </p>
                  </div>
                </div>

                <div className={`${SURFACE_CARD} space-y-3 p-3`}>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted dark:text-dark-muted">
                      {t("adminProjectWorkspace.actions.title")}
                    </p>
                    <p className="mt-1 text-xs text-muted dark:text-dark-muted">
                      {t("adminProjectWorkspace.actions.helper")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={hasRepository ? "secondary" : "primary"}
                    icon={<Link2 className="size-4" aria-hidden />}
                    onClick={() => setConnectRepoOpen(true)}
                    className="w-full justify-center"
                  >
                    {hasRepository
                      ? t("adminProjectWorkspace.actions.changeRepository")
                      : t("adminProjectWorkspace.actions.connectRepository")}
                  </Button>
                  {isTeacherShell ? (
                    <Button
                      type="button"
                      variant={isProjectCompleted ? "secondary" : "primary"}
                      icon={<CheckCircle2 className="size-4" aria-hidden />}
                      disabled={completeProject.isPending || isProjectCompleted}
                      onClick={completeProjectSubmit}
                      className="w-full justify-center"
                    >
                      {isProjectCompleted
                        ? t("adminProjectWorkspace.actions.completed")
                        : t("adminProjectWorkspace.actions.markCompleted")}
                    </Button>
                  ) : null}
                  {isAdminShell ? (
                    <Button
                      type="button"
                      variant={isProjectPublished ? "secondary" : "primary"}
                      icon={<BookOpenCheck className="size-4" aria-hidden />}
                      disabled={
                        publishProject.isPending ||
                        unpublishProject.isPending ||
                        updatePublicResult.isPending
                      }
                      onClick={
                        isProjectPublished
                          ? unpublishProjectSubmit
                          : publishProjectSubmit
                      }
                      className="w-full justify-center"
                    >
                      {isProjectPublished
                        ? t("adminProjectWorkspace.actions.unpublish")
                        : t("adminProjectWorkspace.actions.publish")}
                    </Button>
                  ) : null}
                </div>
                {isAdminShell && !publishReady && !isProjectPublished ? (
                  <p className="text-xs text-muted dark:text-dark-muted">
                    {!isProjectCompleted
                      ? t("adminProjectWorkspace.publishRequiresCompletion")
                      : !effectivePublicAbstract
                        ? "Add the public abstract before publishing."
                        : !finalFileName || !finalFileDownloadUrl
                          ? "Choose one final result file before publishing."
                          : "Project is ready to publish."}
                  </p>
                ) : null}
              </div>
            </aside>
          </div>
        </section>

        <nav className="sticky top-0 z-20 flex gap-2 overflow-x-auto rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg)/95 p-1 shadow-xs backdrop-blur dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)/95">
          {[
            ["overview", "Overview", LayoutDashboard],
            ["repository", "Repository", GitBranch],
            ["people", "People", Users],
            ["activity", "Activity", Activity],
          ].map(([idKey, label, icon]) => (
            <button
              key={idKey}
              type="button"
              onClick={() => {
                if (idKey === "repository" && repositoryWorkspacePath) {
                  navigate(repositoryWorkspacePath);
                  return;
                }
                setActivePanel(idKey);
              }}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors",
                activePanel === idKey
                  ? "bg-light-app-tertiary text-primary dark:bg-dark-app-tertiary dark:text-dark-primary"
                  : "text-secondary hover:bg-light-app-tertiary hover:text-primary dark:text-dark-secondary dark:hover:bg-dark-app-tertiary dark:hover:text-dark-primary",
              )}
            >
              {createElement(icon, {
                className: "size-4",
                strokeWidth: 1.8,
                "aria-hidden": true,
              })}
              {label}
            </button>
          ))}
        </nav>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overviewStatTiles.map((card) => (
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
        </section>

        {activePanel === "overview" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <section className={SURFACE_CARD}>
              <SectionHeader
                icon={Sparkles}
                eyebrow="Project brief"
                title="What everyone should understand first"
                description="A quick read of the project structure, repository state, and where work currently stands."
              />
              <div className="grid gap-4 p-4 md:p-5 lg:grid-cols-2">
                <div className={`${SURFACE_INSET} p-4`}>
                  <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                    Repository connection
                  </p>
                  <p className="mt-2 font-mono text-xs text-secondary dark:text-dark-secondary">
                    {repoPath}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className={hasRepository ? PILL : `${PILL} border-amber-300 text-amber-700 dark:text-amber-300`}>
                      {hasRepository ? "Connected" : "Missing"}
                    </span>
                    <span className={PILL}>{totalPulls} pull requests</span>
                  </div>
                </div>

                <div className={`${SURFACE_INSET} p-4`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                        Project completion
                      </p>
                      <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
                        Based on completed repository tasks.
                      </p>
                    </div>
                    <span className="text-2xl font-semibold tabular-nums text-primary dark:text-dark-primary">
                      {completion}%
                    </span>
                  </div>
                  <ProgressBar value={completion} className="mt-4" />
                </div>

                <div className={`${SURFACE_INSET} p-4 lg:col-span-2`}>
                  <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                    Work pipeline
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    {taskFlow.map((item, index) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-secondary dark:text-dark-secondary">
                            {item.label}
                          </span>
                          <span className="font-semibold text-primary dark:text-dark-primary">
                            {item.value}
                          </span>
                        </div>
                        <div className="mt-2 h-20 rounded-xl bg-(--color-light-card-bg) p-2 dark:bg-(--color-dark-card-bg)">
                          <div className="flex h-full items-end">
                            <span
                              className={`w-full rounded-lg ${activityColors[index % activityColors.length]}`}
                              style={{
                                height: `${Math.max(10, (item.value / maxTaskFlow) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className={SURFACE_CARD}>
              <SectionHeader
                icon={Clock3}
                eyebrow="Recent signal"
                title="Activity summary"
                description="Live repository totals when available, with a simple fallback for empty projects."
              />
              <div className="space-y-3 p-4 md:p-5">
                {recentActivity.map((item) => (
                  <Link
                    key={item.title}
                    to={item.to}
                    className="flex items-start gap-3 rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--color-light-card-bg) text-primary dark:bg-(--color-dark-card-bg) dark:text-dark-primary">
                      <item.icon className="size-4" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-secondary dark:text-dark-secondary">
                        {item.detail}
                      </p>
                    </div>
                    <ChevronRight
                      className="mt-2 size-4 text-muted dark:text-dark-muted"
                      strokeWidth={1.8}
                    />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activePanel === "repository" ? (
          <section className={SURFACE_CARD}>
            <SectionHeader
              icon={GitBranch}
              eyebrow="Repository"
              title={t("adminProjectWorkspace.repositoryPanel.title")}
              description={t("adminProjectWorkspace.repositoryPanel.description")}
              action={
                <Button
                  type="button"
                  variant="secondary"
                  icon={<Link2 className="size-4" aria-hidden />}
                  onClick={() => setConnectRepoOpen(true)}
                >
                  {hasRepository
                    ? t("adminProjectWorkspace.actions.changeRepository")
                    : t("adminProjectWorkspace.actions.connectRepository")}
                </Button>
              }
            />
            {hasRepository ? (
              <div className="p-4 md:p-5">
                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <div className={`${SURFACE_INSET} p-4`}>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
                      Repository
                    </p>
                    <p className="mt-2 font-mono text-sm font-semibold text-primary dark:text-dark-primary">
                      {repoPath}
                    </p>
                  </div>
                  <div className={`${SURFACE_INSET} p-4`}>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
                      Commits
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-primary dark:text-dark-primary">
                      {totalCommits}
                    </p>
                  </div>
                  <div className={`${SURFACE_INSET} p-4`}>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted dark:text-dark-muted">
                      Pull requests
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-primary dark:text-dark-primary">
                      {totalPulls}
                    </p>
                  </div>
                </div>
                <div className={`${SURFACE_INSET} mb-4 p-4`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                        {t("adminProjectWorkspace.repositoryPanel.fullTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-secondary dark:text-dark-secondary">
                        {t("adminProjectWorkspace.repositoryPanel.fullDescription")}
                      </p>
                    </div>
                    <Link
                      to={repositoryWorkspacePath}
                      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-(--color-light-input-border) bg-(--color-light-card-bg) px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:border-(--color-light-input-border-focus) hover:text-primary dark:border-dark-input-border dark:bg-(--color-dark-card-bg) dark:text-dark-secondary dark:hover:border-(--color-dark-input-border-focus) dark:hover:text-dark-primary"
                    >
                      <LayoutDashboard className="size-4" strokeWidth={1.8} />
                      {t("adminProjectWorkspace.repositoryPanel.openWorkspace")}
                    </Link>
                  </div>
                </div>
                <div className={`${SURFACE_INSET} mb-4 p-4`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                        Public project result
                      </p>
                      <p className="mt-1 text-xs leading-5 text-secondary dark:text-dark-secondary">
                        Select one final repository file for the public download. The public page shows this abstract first and does not expose the rest of the repository files.
                      </p>
                      <div className="mt-3 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-2 text-xs dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                        <span className="font-semibold text-primary dark:text-dark-primary">
                          Current final file:
                        </span>{" "}
                        <span className="font-mono text-secondary dark:text-dark-secondary">
                          {finalFileName || "Not selected"}
                        </span>
                      </div>
                    </div>
                    <div className="w-full lg:w-[26rem]">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted dark:text-dark-muted">
                        Public abstract
                      </label>
                      <textarea
                        value={abstractDraft}
                        onChange={(event) => setAbstractDraft(event.target.value)}
                        rows={5}
                        placeholder="Paste the abstract that readers should see before downloading the final file."
                        className="mt-2 w-full resize-y rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3 py-2 text-sm leading-6 text-(--color-light-text-primary) outline-none placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus)"
                      />
                      <div className="mt-2 flex justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9"
                          disabled={updatePublicResult.isPending}
                          onClick={savePublicResultMetadata}
                        >
                          Save public abstract
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <ProjectRepositoryDocsPanel
                  owner={displayOwner}
                  repo={displayRepo}
                  finalFileName={finalFileName}
                  onUseAsFinalFile={setPublicResultFile}
                  savingFinalFile={updatePublicResult.isPending}
                />
              </div>
            ) : (
              <div className="p-4 md:p-5">
                <div className="rounded-2xl border border-dashed border-(--color-light-card-border) bg-light-app-tertiary p-8 text-center dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
                  <GitBranch className="mx-auto size-10 text-muted dark:text-dark-muted" />
                  <p className="mt-4 text-sm font-semibold text-primary dark:text-dark-primary">
                    {t("adminProjectWorkspace.documents.noRepoTitle")}
                  </p>
                  <p className="mx-auto mt-2 max-w-lg text-sm text-secondary dark:text-dark-secondary">
                    {t("adminProjectWorkspace.documents.noRepoHint")}
                  </p>
                  <Button
                    type="button"
                    className="mt-5"
                    icon={<Link2 className="size-4" aria-hidden />}
                    onClick={() => setConnectRepoOpen(true)}
                  >
                    {t("adminProjectWorkspace.actions.connectRepository")}
                  </Button>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {activePanel === "people" ? (
          <section className={SURFACE_CARD}>
            <SectionHeader
              icon={Users}
              eyebrow="People"
              title="Teachers, students, and contribution ownership"
              description="This section separates academic supervision from student implementation work so responsibilities are easy to scan."
              action={
                <Button
                  type="button"
                  icon={<UserPlus className="size-4" aria-hidden />}
                  onClick={() => setInviteOpen(true)}
                >
                  {t("adminProjectWorkspace.actions.inviteMembers")}
                </Button>
              }
            />
            <div className="grid gap-5 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid gap-3 md:grid-cols-2">
                {people.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    selected={selectedPerson?.id === person.id}
                    onClick={() => setSelectedPersonId(person.id)}
                  />
                ))}
              </div>
              <aside className={`${SURFACE_INSET} p-4`}>
                <div className="flex items-center gap-3">
                  <PersonAvatar
                    person={selectedPerson}
                    sizeClass="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full"
                    className="bg-light-btn-primary-bg text-sm font-bold text-white dark:bg-dark-primary dark:text-dark-shell"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-primary dark:text-dark-primary">
                      {selectedPerson?.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-muted dark:text-dark-muted">
                        {selectedPerson?.role}
                      </p>
                      {selectedPerson?.badgeLabel ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            selectedPerson.badgeClass,
                          )}
                        >
                          {createElement(selectedPerson.badgeIcon ?? UserCheck, {
                            className: "size-3",
                            strokeWidth: 1.9,
                            "aria-hidden": true,
                          })}
                          {selectedPerson.badgeLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-secondary dark:text-dark-secondary">
                  {selectedPerson?.note}
                </p>
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted dark:text-dark-muted">
                        Review score
                      </span>
                      <span className="font-semibold text-primary dark:text-dark-primary">
                        {selectedPerson?.score}%
                      </span>
                    </div>
                    <ProgressBar value={selectedPerson?.score} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-muted dark:text-dark-muted">
                      Activity rhythm
                    </p>
                    <ActivityStrip
                      seed={selectedPerson?.id}
                      points={[
                        { label: "Tasks", value: selectedPerson?.tasks },
                        { label: "Commits", value: selectedPerson?.commits },
                        { label: "Pull requests", value: selectedPerson?.pulls },
                        { label: "Score", value: selectedPerson?.score },
                      ]}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`${SURFACE_CARD} p-3 text-center`}>
                      <p className="text-[10px] text-muted dark:text-dark-muted">
                        Tasks
                      </p>
                      <p className="mt-1 text-lg font-semibold text-primary dark:text-dark-primary">
                        {selectedPerson?.tasks}
                      </p>
                    </div>
                    <div className={`${SURFACE_CARD} p-3 text-center`}>
                      <p className="text-[10px] text-muted dark:text-dark-muted">
                        Commits
                      </p>
                      <p className="mt-1 text-lg font-semibold text-primary dark:text-dark-primary">
                        {selectedPerson?.commits}
                      </p>
                    </div>
                    <div className={`${SURFACE_CARD} p-3 text-center`}>
                      <p className="text-[10px] text-muted dark:text-dark-muted">
                        PRs
                      </p>
                      <p className="mt-1 text-lg font-semibold text-primary dark:text-dark-primary">
                        {selectedPerson?.pulls}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        {activePanel === "activity" ? (
          <section className={SURFACE_CARD}>
            <SectionHeader
              icon={Activity}
              eyebrow="Activity"
              title="Repository and task movement"
              description="A compact activity view for supervisors and admins to understand work progress without reading every file."
            />
            <div className="space-y-5 p-4 md:p-5">
              <div className={`${SURFACE_INSET} p-4`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                      Team activity rhythm
                    </p>
                    <p className="mt-1 text-xs text-secondary dark:text-dark-secondary">
                      Each row summarizes one contributor.
                    </p>
                  </div>
                  <span className={PILL}>{repoPath}</span>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-3 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-primary dark:text-dark-primary">
                        Repository events
                      </p>
                      <span className="text-[10px] text-muted dark:text-dark-muted">
                        Hover bars for details
                      </span>
                    </div>
                    <AxisActivityChart
                      seed="repository-events"
                      points={activityPoints}
                      xAxisLabel="Date"
                      yAxisLabel="Events"
                    />
                  </div>
                  {people.map((person) => (
                    <div
                      key={`activity-${person.id}`}
                      className="grid gap-3 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-3 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) md:grid-cols-[180px_minmax(0,1fr)_80px]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-light-app-tertiary text-xs font-semibold text-primary dark:bg-dark-app-tertiary dark:text-dark-primary">
                          {person.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                            {person.name}
                          </p>
                          <p className="truncate text-xs text-muted dark:text-dark-muted">
                            {person.kind === "teacher" ? "Supervisor" : "Student"}
                          </p>
                        </div>
                      </div>
                      <AxisActivityChart
                        seed={`${person.id}-wide`}
                        points={[
                          { label: "Tasks", value: person.tasks },
                          { label: "Commits", value: person.commits },
                          { label: "Pull requests", value: person.pulls },
                          { label: "Score", value: person.score },
                        ]}
                        xAxisLabel="Metric"
                        yAxisLabel="Value"
                      />
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                          {person.commits}
                        </p>
                        <p className="text-[10px] text-muted dark:text-dark-muted">
                          commits
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="grid gap-4 lg:grid-cols-2">
                <div className={`${SURFACE_INSET} p-4`}>
                  <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                    Milestones
                  </p>
                  <div className="mt-4 space-y-3">
                    {(milestones.length ? milestones : [{ title: "Connect tasks and milestones", status: "pending" }])
                      .slice(0, 5)
                      .map((milestone, index) => (
                        <div key={milestone?.id ?? milestone?.number ?? index}>
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="truncate text-secondary dark:text-dark-secondary">
                              {milestone?.title ?? `Milestone ${index + 1}`}
                            </span>
                            <span className="shrink-0 font-semibold text-primary dark:text-dark-primary">
                              {milestone?.completionPercentage != null
                                ? `${safePercent(milestone.completionPercentage)}%`
                                : "—"}
                            </span>
                          </div>
                          <ProgressBar
                            value={milestone?.completionPercentage ?? 0}
                            className="mt-2"
                          />
                        </div>
                      ))}
                  </div>
                </div>
                <div className={`${SURFACE_INSET} p-4`}>
                  <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                    Read this page
                  </p>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-secondary dark:text-dark-secondary">
                    <li className="flex gap-2">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                      Supervisors show academic ownership.
                    </li>
                    <li className="flex gap-2">
                      <UserCheck className="mt-0.5 size-4 shrink-0" />
                      Students show delivery and repository effort.
                    </li>
                    <li className="flex gap-2">
                      <BookOpenCheck className="mt-0.5 size-4 shrink-0" />
                      Repository files remain available under Repository.
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        <GlobalModal
          variant="sheet"
          open={inviteOpen}
          setOpen={setInviteOpen}
          title={t("adminProjectWorkspace.invite.title")}
          subtitle={t("adminProjectWorkspace.invite.subtitle")}
          isClose
          footer={
            <>
              <Button
                type="button"
                variant="tertiary"
                onClick={() => setInviteOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!selectedInvitees.length || inviteProjectMembers.isPending}
                onClick={inviteMembersSubmit}
              >
                {inviteProjectMembers.isPending
                  ? t("adminProjects.form.project.actions.submitting")
                  : t("adminProjectWorkspace.invite.submit")}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold text-muted dark:text-dark-muted">
                {t("adminProjectWorkspace.invite.search")}
              </p>
              <SearchableSelect
                multiple
                value={selectedInvitees}
                onValueChange={setSelectedInvitees}
                options={inviteSelectOptions}
                placeholder={t("adminProjectWorkspace.invite.search")}
                searchPlaceholder={t("adminProjectWorkspace.invite.search")}
                searchValue={inviteSearchTerm}
                onSearchChange={setInviteSearchTerm}
                loading={isSearchingInvitees}
                clearSearchOnOpen={false}
                className="min-h-8 bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)"
              />
              <p className="mt-2 text-[11px] text-muted dark:text-dark-muted">
                {t("adminProjectWorkspace.invite.hint")}
              </p>
            </div>

            <div className={`${SURFACE_INSET} p-4`}>
              <p className="text-[11px] font-semibold text-muted dark:text-dark-muted">
                {t("adminProjectWorkspace.invite.selected")}
              </p>
              <div className="mt-3 space-y-2">
                {selectedInviteeOptions.length ? (
                  selectedInviteeOptions.map((option) => (
                    <div
                      key={option.value}
                      className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-2 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
                    >
                      <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                        {option.label}
                      </p>
                      <p className="mt-1 text-xs text-muted dark:text-dark-muted">
                        {option.description || option.value}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted dark:text-dark-muted">
                    {t("adminProjectWorkspace.empty.noStudentsFound")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </GlobalModal>

        <GlobalModal
          variant="sheet"
          open={connectRepoOpen}
          setOpen={setConnectRepoOpen}
          title={t("adminProjectWorkspace.repository.title")}
          subtitle={t("adminProjectWorkspace.repository.subtitle")}
          isClose
          footer={
            <>
              <Button
                type="button"
                variant="tertiary"
                onClick={() => setConnectRepoOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={
                  !String(selectedRepoId ?? "").trim() ||
                  connectRepository.isPending
                }
                onClick={connectRepositorySubmit}
              >
                {connectRepository.isPending
                  ? t("adminProjects.form.project.actions.submitting")
                  : t("adminProjectWorkspace.repository.submit")}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold text-muted dark:text-dark-muted">
                {t("adminProjectWorkspace.repository.search")}
              </p>
              <SearchableSelect
                value={selectedRepoId}
                onValueChange={setSelectedRepoId}
                options={repoSelectOptions}
                placeholder={t("adminProjectWorkspace.repository.search")}
                searchPlaceholder={t("adminProjectWorkspace.repository.search")}
                searchValue={repoSearchTerm}
                onSearchChange={setRepoSearchTerm}
                loading={repoSearchBusy}
                clearable
                clearSearchOnOpen={false}
                className="min-h-8 bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)"
              />
              <p className="mt-2 text-[11px] text-muted dark:text-dark-muted">
                {t("adminProjectWorkspace.repository.hint")}
              </p>
            </div>

            <div className={`${SURFACE_INSET} p-4`}>
              <div className="flex items-center gap-2">
                <Search className="size-4 text-muted dark:text-dark-muted" />
                <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                  Repository lookup
                </p>
              </div>
              <p className="mt-2 text-xs leading-5 text-secondary dark:text-dark-secondary">
                Search by owner, repository name, or catalogue label. The saved
                value remains the repository id expected by the project API.
              </p>
            </div>
          </div>
        </GlobalModal>
      </div>
    </div>
  );
}
