import {
  Activity,
  BadgeCheck,
  Building2,
  CalendarDays,
  FolderGit2,
  Gauge,
  LayoutGrid,
  LayoutList,
  ListChecks,
  UserPlus,
  UserMinus,
  UserCircle2,
  Users,
  UsersRound,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import {
  DropdownContent,
  DropdownItem,
  DropdownMenuRoot,
  DropdownSeparator,
  DropdownTrigger,
} from "../../components/DropdownMenu";
import Field from "../../components/Field";
import GlobalModal from "../../components/GlobalModal";
import IC from "../../components/IC";
import Icon from "../../components/Icon";
import PersonAvatar from "../../components/PersonAvatar";
import SearchableSelect from "../../components/SearchableSelect";
import Select from "../../components/Select";
import SensitiveActionModal from "../../components/SensitiveActionModal";
import StatusPill from "../../components/StatusPill";
import Table from "../../components/Table";
import TableBody from "../../components/TableBody";
import TableColumn from "../../components/TableColumn";
import TableHeader from "../../components/TableHeader";
import TableRow from "../../components/TableRow";
import TableToolbar from "../../components/TableToolbar";
import { useAuth } from "../../context/AuthContext";
import { resolveShellBasePath } from "../../lib/roles";
import {
  useDeleteFacultyGroup,
  useDeleteFacultyProject,
  useFacultyProjects,
  useFacultyProjectsByTeacher,
  useFacultyGroups,
  useLinkedTeacherRecord,
  useStudentsPage,
  useRemoveFacultyGroupMember,
  useUpdateFacultyGroup,
  useUpdateFacultyGroupLeader,
} from "../../services/useApi";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const KANBAN_LANES = ["todo", "in_progress", "in_review", "done"];

function unwrapProjectRow(row) {
  return row?.json && typeof row.json === "object" ? row.json : row;
}

function personDisplayName(person) {
  if (!person) return "";
  return (
    [person.firstName, person.lastName].filter(Boolean).join(" ").trim() ||
    person.name ||
    person.username ||
    person.email ||
    String(person.id ?? "")
  );
}

function memberListFromGroup(group) {
  const members =
    group?.groupMember ?? group?.groupMembers ?? group?.members ?? [];
  return Array.isArray(members) ? members : [];
}

function memberAvatarRecord(member) {
  if (!member || typeof member !== "object") return null;
  return {
    ...member,
    name: personDisplayName(member),
  };
}

function normalizeProjectLane(project) {
  const status =
    project?.laneStatus ??
    project?.status ??
    project?.projectStatus ??
    project?.workflowStatus;
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const statusMap = {
    planned: "todo",
    in_progress: "in_progress",
    in_review: "in_review",
    completed: "done",
    done: "done",
    archived: "stuck",
  };
  if (statusMap[normalized]) return statusMap[normalized];
  if (
    ["todo", "in_progress", "in_review", "done", "stuck"].includes(normalized)
  ) {
    return normalized;
  }
  if (
    project?.projectRepository?.repositoryName ||
    project?.projectRepository?.id
  ) {
    return "in_progress";
  }
  return "todo";
}

function normalizeProjectProgress(project, memberCount) {
  const raw =
    project?.progress ??
    project?.completion ??
    project?.progressPercent ??
    project?.percentage;
  const numeric = Number(raw);
  if (!Number.isNaN(numeric)) return Math.min(100, Math.max(0, numeric));
  if (project?.projectRepository?.repositoryName)
    return Math.min(85, 35 + memberCount * 10);
  return memberCount > 0 ? 20 : 0;
}

function normalizeProjectDate(project) {
  return (
    project?.updatedAt ??
    project?.createdAt ??
    project?.lastModifiedDate ??
    project?.lastModifiedAt ??
    project?.dateCreated ??
    null
  );
}

function academicYearLabel(academicYear) {
  if (!academicYear) return "";
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
  if (!Number.isNaN(end)) return String(end);
  return "";
}

function projectYear(project, currentYear) {
  const academicYear =
    project?.academicYear ?? project?.source?.group?.academicYear;
  const academicYearName = academicYearLabel(academicYear);
  if (academicYearName) return academicYearName;

  const rawDate = project?.createdAt ?? project?.updatedAt;
  const time = rawDate ? new Date(rawDate).getTime() : Number.NaN;
  return Number.isNaN(time)
    ? String(currentYear)
    : String(new Date(time).getFullYear());
}

function normalizeProjectRecord(row) {
  const project = unwrapProjectRow(row);
  const group = project?.group ?? {};
  const repository = project?.projectRepository ?? {};
  const teacher = project?.teacher ?? {};
  const members = memberListFromGroup(group);
  const lead = personDisplayName(teacher);
  const repositoryName =
    repository?.repositoryName ??
    project?.repositoryName ??
    project?.projectName ??
    "untitled-project";
  const ownerUsername =
    repository?.owner ??
    repository?.ownerUsername ??
    teacher?.username ??
    teacher?.email ??
    "";
  const updatedAt = normalizeProjectDate(project);
  const createdAt = project?.createdAt ?? updatedAt;
  const visibility = String(repository?.visibility ?? "PRIVATE").toUpperCase();
  const memberNames = members.map(personDisplayName).filter(Boolean);
  const academicYear = group?.academicYear ?? null;
  return {
    source: project,
    id: String(project?.id ?? repository?.id ?? repositoryName),
    ownerUsername,
    repositoryName,
    description:
      repository?.description ??
      project?.description ??
      project?.projectName ??
      "—",
    visibility,
    createdAt,
    updatedAt,
    academicYear,
    academicYearLabel: academicYearLabel(academicYear),
    facultyDepartment: group?.name ?? "—",
    leadDisplayName: lead || "—",
    laneStatus: normalizeProjectLane(project),
    progress: normalizeProjectProgress(project, members.length),
    tags: [visibility, group?.name].filter(Boolean),
    collaboratorMembers: members.map(memberAvatarRecord).filter(Boolean),
    targetDate: project?.targetDate ?? project?.deadline ?? null,
    canOpenWorkspace: Boolean(project?.id ?? repository?.id ?? repositoryName),
    memberNames,
  };
}

function projectLaneToPillVariant(lane) {
  switch (lane) {
    case "todo":
      return "neutral";
    case "in_progress":
      return "warning";
    case "in_review":
      return "info";
    case "done":
      return "success";
    case "stuck":
      return "error";
    default:
      return "neutral";
  }
}

function normalizeGroupId(group) {
  return String(group?.id ?? group?.groupId ?? group?.uuid ?? "");
}

function groupTitle(group) {
  return (
    group?.name ?? group?.title ?? (group?.id != null ? String(group.id) : "-")
  );
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

function groupMembersList(group) {
  const members =
    group?.groupMembers ??
    group?.members ??
    group?.students ??
    group?.studentIds ??
    group?.groupMemberIds ??
    [];
  return Array.isArray(members) ? members : [];
}

function groupMemberIds(group) {
  return groupMembersList(group).map(studentIdValue).filter(Boolean);
}

function groupLeaderId(group) {
  return studentIdValue(group?.groupLeader ?? group?.leader);
}

function groupMembersCount(group) {
  return groupMembersList(group).length;
}

function studentToOption(student) {
  const id = studentIdValue(student);
  if (!id) return null;
  return {
    value: id,
    label: personDisplayName(student) || id,
    description:
      student?.email ??
      student?.code ??
      student?.studentCode ??
      student?.department?.name ??
      student?.department ??
      undefined,
  };
}

function buildGroupUpdatePayload(group, nextMembers, nextLeader) {
  const leader = String(nextLeader ?? "").trim();
  const members = Array.from(
    new Set([...nextMembers.map(String), leader].filter(Boolean)),
  );
  return {
    name: String(groupTitle(group)).trim(),
    groupLeader: leader,
    groupMembers: members,
  };
}

function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="flex min-w-24 flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-semibold text-muted dark:text-dark-muted">
        <span />
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-light-app-tertiary dark:bg-dark-app-tertiary">
        <div
          className="h-full max-w-full rounded-full bg-(--color-success) transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TeamAvatars({ members }) {
  if (!members?.length)
    return <span className="text-muted dark:text-dark-muted">—</span>;
  const shown = members.slice(0, 4);
  return (
    <div className="flex -space-x-2">
      {shown.map((member, i) => (
        <span
          key={`${member.id ?? member.email ?? member.name ?? "member"}-${i}`}
          title={personDisplayName(member)}
          className="inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-(--color-light-card-bg) bg-accent/15 text-[10px] font-semibold text-primary dark:border-(--color-dark-card-bg) dark:bg-[rgba(0,102,255,0.22)] dark:text-dark-primary"
        >
          <PersonAvatar
            person={member}
            sizeClass="inline-flex size-full items-center justify-center overflow-hidden rounded-full"
          />
        </span>
      ))}
      {members.length > shown.length ? (
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-(--color-light-card-bg) bg-light-app-tertiary text-[10px] font-semibold text-secondary dark:border-(--color-dark-card-bg) dark:bg-dark-app-tertiary dark:text-dark-secondary">
          +{members.length - shown.length}
        </span>
      ) : null}
    </div>
  );
}

function KanbanCard({ project, onOpen, locale }) {
  const due = project.targetDate
    ? new Date(project.targetDate).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <button
      type="button"
      disabled={!project.canOpenWorkspace}
      onClick={() => onOpen(project)}
      className="flex w-full flex-col gap-3 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-3 text-left shadow-sm transition-colors hover:border-(--color-light-input-border-focus) disabled:cursor-not-allowed disabled:opacity-70 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:hover:border-(--color-dark-input-border-focus)"
    >
      <div className="flex flex-wrap gap-1">
        {project.tags?.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-light-app-tertiary px-2 py-0.5 text-[10px] font-semibold text-secondary dark:bg-dark-app-tertiary dark:text-dark-secondary"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-semibold text-primary dark:text-dark-primary">
          {project.repositoryName.replace(/-/g, " ")}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-muted dark:text-dark-muted">
          {project.description}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted dark:text-dark-muted">
        <CalendarDays
          className="size-3.5 shrink-0"
          strokeWidth={2}
          aria-hidden
        />
        <span>{due}</span>
      </div>
      <ProgressBar value={project.progress} />
      <div className="flex items-center justify-between border-t border-light-divider pt-2 dark:border-dark-divider">
        <div className="flex items-center gap-1 text-xs text-muted dark:text-dark-muted">
          <Users className="size-3.5" strokeWidth={2} aria-hidden />
          <span>{project.collaboratorMembers?.length ?? 0}</span>
        </div>
        <TeamAvatars members={project.collaboratorMembers} />
      </div>
    </button>
  );
}

export default function Projects() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const shellBase = resolveShellBasePath(location.pathname, user?.role);
  const isTeacherShell = shellBase === "/teacher";
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
  const { data: adminFacultyProjects = [] } = useFacultyProjects(
    {},
    {
      enabled: !isTeacherShell,
      notifyOnError: false,
    },
  );
  const { data: teacherFacultyProjects = [] } = useFacultyProjectsByTeacher(
    teacherId,
    {
      enabled: isTeacherShell && Boolean(teacherId),
      notifyOnError: false,
    },
  );
  const facultyProjects = isTeacherShell
    ? teacherFacultyProjects
    : adminFacultyProjects;
  const { data: facultyGroups = [] } = useFacultyGroups(
    {},
    { enabled: !isTeacherShell, notifyOnError: false },
  );
  const { data: studentPage } = useStudentsPage(
    { page: 0, pageSize: 500, notifyOnError: false },
    { enabled: !isTeacherShell, staleTime: 60_000 },
  );
  const updateFacultyGroup = useUpdateFacultyGroup({
    showSuccessToast: false,
    showErrorToast: false,
  });
  const updateFacultyGroupLeader = useUpdateFacultyGroupLeader({
    showSuccessToast: false,
    showErrorToast: false,
  });
  const removeFacultyGroupMember = useRemoveFacultyGroupMember({
    showSuccessToast: false,
    showErrorToast: false,
  });
  const deleteFacultyGroup = useDeleteFacultyGroup({
    showSuccessToast: false,
    showErrorToast: false,
  });
  const deleteFacultyProject = useDeleteFacultyProject({
    showSuccessToast: false,
    showErrorToast: false,
  });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("projects");
  const [viewMode, setViewMode] = useState("list");
  const [groupViewMode, setGroupViewMode] = useState("list");
  const [searchInput, setSearchInput] = useState("");
  const [groupSearchInput, setGroupSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const debouncedGroupSearch = useDebouncedValue(groupSearchInput, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [groupOperation, setGroupOperation] = useState(null);
  const [groupOperationDraft, setGroupOperationDraft] = useState({
    studentId: "",
  });
  const [deleteGroup, setDeleteGroup] = useState(null);
  const [archiveProject, setArchiveProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    if (!isTeacherShell && location.state?.returnTab === "groups") {
      setActiveTab("groups");
    }
  }, [isTeacherShell, location.state]);

  useEffect(() => {
    if (isTeacherShell && activeTab !== "projects") {
      setActiveTab("projects");
    }
  }, [activeTab, isTeacherShell]);

  const currentYear = new Date().getFullYear();
  const locale =
    i18n.language === "ps"
      ? "ps-AF"
      : i18n.language === "prs"
        ? "fa-AF"
        : "en-US";

  const studentOptions = useMemo(
    () =>
      (Array.isArray(studentPage?.content) ? studentPage.content : [])
        .map(studentToOption)
        .filter(Boolean),
    [studentPage],
  );

  const filteredGroups = useMemo(() => {
    const q = debouncedGroupSearch.trim().toLowerCase();
    const rows = Array.isArray(facultyGroups) ? facultyGroups : [];
    if (!q) return rows;
    return rows.filter((group) =>
      [
        normalizeGroupId(group),
        groupTitle(group),
        personDisplayName(group?.groupLeader ?? group?.leader),
        ...groupMembersList(group).map(personDisplayName),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [debouncedGroupSearch, facultyGroups]);

  const groupOperationMemberIds = useMemo(
    () => groupMemberIds(groupOperation?.record),
    [groupOperation],
  );
  const groupAddMemberOptions = useMemo(
    () =>
      studentOptions.filter(
        (option) => !groupOperationMemberIds.includes(option.value),
      ),
    [groupOperationMemberIds, studentOptions],
  );
  const groupLeaderOptions = useMemo(() => {
    const memberOptions = groupMembersList(groupOperation?.record)
      .map(studentToOption)
      .filter(Boolean);
    return memberOptions.length ? memberOptions : studentOptions;
  }, [groupOperation, studentOptions]);
  const groupRemoveMemberOptions = useMemo(() => {
    const leader = groupLeaderId(groupOperation?.record);
    return groupMembersList(groupOperation?.record)
      .filter((member) => studentIdValue(member) !== leader)
      .map(studentToOption)
      .filter(Boolean);
  }, [groupOperation]);

  const projects = useMemo(() => {
    const rows = Array.isArray(facultyProjects) ? facultyProjects : [];
    return rows.map(normalizeProjectRecord);
  }, [facultyProjects]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("adminShared.filters.allStatus") },
      { value: "todo", label: t("adminProjects.projectStatus.todo") },
      {
        value: "in_progress",
        label: t("adminProjects.projectStatus.in_progress"),
      },
      {
        value: "in_review",
        label: t("adminProjects.projectStatus.in_review"),
      },
      { value: "done", label: t("adminProjects.projectStatus.done") },
      { value: "stuck", label: t("adminProjects.projectStatus.stuck") },
    ],
    [t],
  );

  const yearOptions = useMemo(() => {
    const years = new Set(projects.map((p) => projectYear(p, currentYear)));
    const sorted = [...years].sort((a, b) =>
      String(b).localeCompare(String(a)),
    );
    return [
      { value: "all", label: t("adminProjects.filters.yearAll") },
      ...sorted.map((y) => ({
        value: String(y),
        label:
          String(y) === String(currentYear)
            ? t("adminProjects.filters.thisYear", { year: y })
            : t("adminProjects.filters.yearOption", { year: y }),
      })),
    ];
  }, [projects, t, currentYear]);

  const filteredProjects = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return projects.filter((p) => {
      const y = projectYear(p, currentYear);
      if (yearFilter !== "all" && String(y) !== yearFilter) return false;
      if (statusFilter !== "all" && p.laneStatus !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        p.source?.projectName,
        p.repositoryName,
        p.description,
        p.facultyDepartment,
        p.leadDisplayName,
        p.ownerUsername,
        ...p.memberNames,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [projects, debouncedSearch, statusFilter, yearFilter, currentYear]);

  const groupedByYear = useMemo(() => {
    const map = new Map();
    for (const p of filteredProjects) {
      const y = projectYear(p, currentYear);
      if (!map.has(y)) map.set(y, []);
      map.get(y).push(p);
    }
    const years = [...map.keys()].sort((a, b) => b - a);
    return years.map((year) => ({
      year,
      heading:
        year === currentYear
          ? t("adminProjects.groups.thisYear", { year })
          : t("adminProjects.groups.priorYear", { year }),
      items: map.get(year),
    }));
  }, [filteredProjects, currentYear, t]);

  const kanbanBuckets = useMemo(() => {
    const buckets = Object.fromEntries(KANBAN_LANES.map((id) => [id, []]));
    for (const p of filteredProjects) {
      if (p.laneStatus === "stuck") {
        buckets.in_progress.push(p);
        continue;
      }
      if (buckets[p.laneStatus]) buckets[p.laneStatus].push(p);
      else buckets.todo.push(p);
    }
    return buckets;
  }, [filteredProjects]);

  const openWorkspace = (p) => {
    if (!p?.id) return;
    navigate(`${shellBase}/projects/workspace/${encodeURIComponent(p.id)}`);
  };

  const openProjectEdit = (project) => {
    if (!project?.id) return;
    navigate(`${shellBase}/projects/register/${encodeURIComponent(project.id)}`);
  };

  const openProjectArchive = (project) => {
    if (!project?.id) return;
    setArchiveProject({
      id: project.id,
      name: project.repositoryName?.replace(/-/g, " ") || project.id,
      meta: `${project.ownerUsername || "—"}/${project.repositoryName || "—"}`,
    });
  };

  const openProjectDelete = (project) => {
    if (!project?.id) return;
    setDeleteProject({
      id: project.id,
      name: project.repositoryName?.replace(/-/g, " ") || project.id,
      meta: `${project.ownerUsername || "—"}/${project.repositoryName || "—"}`,
    });
  };

  const projectHeaderData = useMemo(
    () => [
      {
        title: "",
        tooltip: t("adminProjects.tableHints.selection"),
        icon: (
          <ListChecks
            className="size-3.5 shrink-0 opacity-70"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        title: t("adminProjects.table.team"),
        tooltip: t("adminProjects.tableHints.team"),
        icon: (
          <Users className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        ),
      },
      {
        title: t("adminProjects.table.project"),
        tooltip: t("adminProjects.tableHints.project"),
        icon: (
          <FolderGit2
            className="size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        title: t("adminProjects.table.faculty"),
        tooltip: t("adminProjects.tableHints.faculty"),
        icon: (
          <Building2
            className="size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        title: t("adminProjects.table.lead"),
        tooltip: t("adminProjects.tableHints.lead"),
        icon: (
          <UserCircle2
            className="size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        title: t("adminProjects.table.status"),
        tooltip: t("adminProjects.tableHints.status"),
        icon: (
          <Activity className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        ),
      },
      {
        title: t("adminProjects.table.actions"),
        align: "center",
        tooltip: t("adminProjects.tableHints.actions"),
        icon: (
          <LayoutList
            className="size-3.5 shrink-0 opacity-80"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
    ],
    [t],
  );

  const groupHeaderData = useMemo(
    () => [
      {
        title: "",
        tooltip: t("adminShared.tableHints.bulkSelection"),
        icon: (
          <ListChecks
            className="size-3.5 shrink-0 opacity-70"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        title: t("adminProjects.table.groupId"),
        icon: <FolderGit2 className="size-3.5 shrink-0" strokeWidth={2} />,
      },
      {
        title: t("adminProjects.faculty.col.name"),
        icon: <UsersRound className="size-3.5 shrink-0" strokeWidth={2} />,
      },
      {
        title: t("adminProjects.faculty.col.leader"),
        icon: <UserCircle2 className="size-3.5 shrink-0" strokeWidth={2} />,
      },
      {
        title: t("adminProjects.faculty.col.members"),
        icon: <Users className="size-3.5 shrink-0" strokeWidth={2} />,
      },
      {
        title: t("adminProjects.table.actions"),
        align: "center",
        icon: <LayoutList className="size-3.5 shrink-0" strokeWidth={2} />,
      },
    ],
    [t],
  );

  const openGroupRegistration = (group) => {
    const groupId = normalizeGroupId(group);
    navigate(
      groupId
        ? `${shellBase}/projects/groups/register/${encodeURIComponent(groupId)}`
        : `${shellBase}/projects/groups/register`,
      {
        state: {
          returnTo: `${shellBase}/projects`,
          returnTab: "groups",
        },
      },
    );
  };

  const openGroupOperation = (mode, record) => {
    const leader = groupLeaderId(record);
    setGroupOperation({ mode, record });
    setGroupOperationDraft({
      studentId: mode === "change-leader" ? leader : "",
    });
  };

  const closeGroupOperation = () => {
    setGroupOperation(null);
    setGroupOperationDraft({ studentId: "" });
  };

  const submitGroupOperation = async () => {
    if (
      !groupOperation?.record ||
      updateFacultyGroup.isPending ||
      updateFacultyGroupLeader.isPending ||
      removeFacultyGroupMember.isPending
    )
      return;
    const selectedStudentId = String(groupOperationDraft.studentId ?? "").trim();
    if (!selectedStudentId) {
      gooeyToast.error(t("adminProjects.groups.operations.validation.student"));
      return;
    }

    const record = groupOperation.record;
    const groupId = normalizeGroupId(record);
    const currentMembers = groupMemberIds(record);
    const currentLeader = groupLeaderId(record);
    const nextMembers =
      groupOperation.mode === "add-member"
        ? [...currentMembers, selectedStudentId]
        : currentMembers;
    const nextLeader =
      groupOperation.mode === "change-leader"
        ? selectedStudentId
        : currentLeader;

    try {
      if (groupOperation.mode === "change-leader") {
        await updateFacultyGroupLeader.mutateAsync({
          id: groupId,
          leaderId: nextLeader,
        });
      } else if (groupOperation.mode === "remove-member") {
        await removeFacultyGroupMember.mutateAsync({
          id: groupId,
          studentId: selectedStudentId,
        });
      } else {
        await updateFacultyGroup.mutateAsync({
          id: groupId,
          ...buildGroupUpdatePayload(record, nextMembers, nextLeader),
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["faculty-groups"] });
      await queryClient.invalidateQueries({
        queryKey: ["faculty-groups", "detail", groupId],
      });
      gooeyToast.success(
        groupOperation.mode === "add-member"
          ? t("adminProjects.groups.operations.addMemberSuccess")
          : groupOperation.mode === "remove-member"
            ? t("adminProjects.groups.operations.removeMemberSuccess")
            : t("adminProjects.groups.operations.changeLeaderSuccess"),
      );
      closeGroupOperation();
    } catch (e) {
      gooeyToast.error(
        e?.message || t("adminProjects.groups.operations.updateError"),
      );
    }
  };

  const confirmDeleteGroup = async () => {
    if (!deleteGroup || deleteSubmitting) return;
    setDeleteSubmitting(true);
    try {
      await deleteFacultyGroup.mutateAsync(deleteGroup.id);
      await queryClient.invalidateQueries({ queryKey: ["faculty-groups"] });
      gooeyToast.success(t("adminProjects.delete.success"));
      setDeleteGroup(null);
    } catch (e) {
      gooeyToast.error(e?.message || t("adminProjects.delete.error"));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const confirmArchiveProject = async () => {
    if (!archiveProject || deleteSubmitting) return;
    setDeleteSubmitting(true);
    try {
      await deleteFacultyProject.mutateAsync(archiveProject.id);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "faculty-projects",
      });
      gooeyToast.success(t("adminProjects.archive.success"));
      setArchiveProject(null);
    } catch (e) {
      gooeyToast.error(e?.message || t("adminProjects.archive.error"));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!deleteProject || deleteSubmitting) return;
    setDeleteSubmitting(true);
    try {
      await deleteFacultyProject.mutateAsync(deleteProject.id);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "faculty-projects",
      });
      gooeyToast.success(t("adminProjects.delete.success"));
      setDeleteProject(null);
    } catch (e) {
      gooeyToast.error(e?.message || t("adminProjects.delete.error"));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const renderGroupActions = (group) => (
    <DropdownMenuRoot>
      <DropdownTrigger showArrow={false}>
        <Icon
          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z"
          className="mx-auto size-5 text-muted dark:text-dark-muted"
        />
      </DropdownTrigger>
      <DropdownContent align="end">
        <DropdownItem onClick={() => openGroupRegistration(group)}>
          <span>{t("adminShared.actions.editDetails")}</span>
        </DropdownItem>
        <DropdownItem
          icon={<UserPlus className="size-3.5" />}
          onClick={() => openGroupOperation("add-member", group)}
        >
          <span>{t("adminProjects.groups.operations.addMember")}</span>
        </DropdownItem>
        <DropdownItem
          icon={<UserMinus className="size-3.5" />}
          onClick={() => openGroupOperation("remove-member", group)}
        >
          <span>{t("adminProjects.groups.operations.removeMember")}</span>
        </DropdownItem>
        <DropdownItem
          icon={<BadgeCheck className="size-3.5" />}
          onClick={() => openGroupOperation("change-leader", group)}
        >
          <span>{t("adminProjects.groups.operations.changeLeader")}</span>
        </DropdownItem>
        <DropdownItem
          icon={<UsersRound className="size-3.5" />}
          onClick={() => openGroupRegistration(group)}
        >
          <span>{t("adminProjects.groups.operations.manageRoster")}</span>
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          variant="danger"
          onClick={() =>
            setDeleteGroup({
              id: normalizeGroupId(group),
              name: groupTitle(group),
              meta: personDisplayName(group?.groupLeader ?? group?.leader),
            })
          }
        >
          <span>{t("adminShared.actions.delete")}</span>
        </DropdownItem>
      </DropdownContent>
    </DropdownMenuRoot>
  );

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-white  p-4 md:p-5 dark:bg-dark-card-bg min-h-screen ">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-primary dark:text-dark-primary">
              {t("adminProjects.header.title")}
            </h1>
            <p className="text-muted dark:text-dark-muted">
              {t("adminProjects.header.subtitle")}
            </p>
            <p className="mt-1 text-sm text-muted dark:text-dark-muted">
              {activeTab === "groups"
                ? t("adminProjects.header.groupDescription", {
                    count: filteredGroups.length,
                  })
                : t("adminProjects.header.description", {
                    count: filteredProjects.length,
                  })}
            </p>
          </div>
          {!isTeacherShell ? (
            <Button
              icon={<Icon d={IC.plus} className="size-4" />}
              onClick={() =>
                activeTab === "groups"
                  ? openGroupRegistration()
                  : navigate(`${shellBase}/projects/register`)
              }
            >
              {activeTab === "groups"
                ? t("adminProjects.registry.addGroup")
                : t("adminProjects.actions.new")}
            </Button>
          ) : null}
        </div>
      </div>

      {!isTeacherShell ? (
        <TableToolbar>
          <TableToolbar.Row justify="start">
            <TableToolbar.ViewTabs
              value={activeTab}
              onValueChange={setActiveTab}
              tabs={[
                {
                  id: "projects",
                  label: t("adminProjects.tabs.projects"),
                  icon: (
                    <FolderGit2
                      className="size-3.5 shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ),
                },
                {
                  id: "groups",
                  label: t("adminProjects.tabs.groups"),
                  icon: (
                    <UsersRound
                      className="size-3.5 shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ),
                },
              ]}
            />
          </TableToolbar.Row>
        </TableToolbar>
      ) : null}

      {activeTab === "projects" && viewMode === "list" ? (
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row
                justify="between"
                className="items-stretch gap-3 sm:items-center"
              >
                <TableToolbar.ViewTabs
                  value={viewMode}
                  onValueChange={setViewMode}
                  tabs={[
                    {
                      id: "list",
                      label: t("adminProjects.toolbar.list"),
                      icon: (
                        <LayoutList
                          className="size-3.5 shrink-0"
                          strokeWidth={2}
                          aria-hidden
                        />
                      ),
                    },
                    {
                      id: "kanban",
                      label: t("adminProjects.toolbar.kanban"),
                      icon: (
                        <LayoutGrid
                          className="size-3.5 shrink-0"
                          strokeWidth={2}
                          aria-hidden
                        />
                      ),
                    },
                  ]}
                />
              </TableToolbar.Row>
              <TableToolbar.Row justify="start" className="gap-2">
                <div className="min-w-0 flex-1 sm:min-w-48">
                  <Field
                    id="projects-search"
                    placeholder={t("adminProjects.filters.searchPlaceholder")}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    iconD={IC.search}
                  />
                </div>
                <div className="w-full shrink-0 sm:w-44">
                  <Select
                    options={yearOptions}
                    value={yearFilter}
                    onValueChange={setYearFilter}
                  />
                </div>
                <div className="w-full shrink-0 sm:w-48">
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  />
                </div>
              </TableToolbar.Row>
            </TableToolbar>
          }
        >
          <TableHeader headerData={projectHeaderData} />
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableColumn
                  colSpan={projectHeaderData.length}
                  className="py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-light-app-tertiary dark:bg-dark-app-tertiary">
                      <Icon
                        d={IC.folder}
                        className="size-8 text-muted dark:text-dark-muted"
                      />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-primary dark:text-dark-primary">
                        {t("adminProjects.empty.title")}
                      </h3>
                      <p className="text-sm text-muted dark:text-dark-muted">
                        {debouncedSearch ||
                        statusFilter !== "all" ||
                        yearFilter !== "all"
                          ? t("adminProjects.empty.filtered")
                          : t("adminProjects.empty.default")}
                      </p>
                    </div>
                  </div>
                </TableColumn>
              </TableRow>
            ) : (
              groupedByYear.map((group) => (
                <Fragment key={group.year}>
                  <TableRow>
                    <TableColumn
                      colSpan={projectHeaderData.length}
                      className="bg-light-app-tertiary py-2 dark:bg-dark-app-tertiary"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-secondary dark:text-dark-secondary">
                        {group.heading}
                      </span>
                    </TableColumn>
                  </TableRow>
                  {group.items.map((project) => (
                    <TableRow key={project.id}>
                      <TableColumn className="w-10">
                        <Checkbox />
                      </TableColumn>
                      <TableColumn>
                        <TeamAvatars members={project.collaboratorMembers} />
                      </TableColumn>
                      <TableColumn>
                        <button
                          type="button"
                          disabled={!project.canOpenWorkspace}
                          onClick={() => openWorkspace(project)}
                          className="text-left disabled:cursor-default"
                        >
                          <div className="line-clamp-1 text-sm font-semibold text-primary underline-offset-2 hover:underline dark:text-dark-primary">
                            {project.repositoryName.replace(/-/g, " ")}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] text-muted dark:text-dark-muted">
                            {project.canOpenWorkspace
                              ? `${project.ownerUsername}/${project.repositoryName}`
                              : (project.source?.projectName ?? "—")}
                          </div>
                          <div className="mt-1 line-clamp-1 truncate text-xs text-muted dark:text-dark-muted max-w-8">
                            {project.description}
                          </div>
                        </button>
                      </TableColumn>
                      <TableColumn nowrap={false}>
                        <span className="inline-flex max-w-56 rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                          {project.facultyDepartment}
                        </span>
                      </TableColumn>
                      <TableColumn className="text-sm font-medium text-primary dark:text-dark-primary">
                        {project.leadDisplayName}
                      </TableColumn>
                      <TableColumn>
                        <button type="button" className="inline-flex">
                          <StatusPill
                            variant={projectLaneToPillVariant(
                              project.laneStatus,
                            )}
                          >
                            {t(
                              `adminProjects.projectStatus.${project.laneStatus}`,
                            )}
                          </StatusPill>
                        </button>
                      </TableColumn>

                      <TableColumn className="text-center">
                        <DropdownMenuRoot>
                          <DropdownTrigger showArrow={false}>
                            <Icon
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z"
                              className="mx-auto size-5 text-muted dark:text-dark-muted"
                            />
                          </DropdownTrigger>
                          <DropdownContent align="end">
                            <DropdownItem
                              disabled={!project.canOpenWorkspace}
                              onClick={() => openWorkspace(project)}
                            >
                              {t("adminProjects.actions.openWorkspace")}
                            </DropdownItem>
                            <DropdownItem onClick={() => openProjectEdit(project)}>
                              {t("adminProjects.actions.edit")}
                            </DropdownItem>
                            <DropdownSeparator />
                            <DropdownItem
                              variant="danger"
                              onClick={() => openProjectArchive(project)}
                            >
                              {t("adminShared.actions.archive")}
                            </DropdownItem>
                            <DropdownItem
                              variant="danger"
                              onClick={() => openProjectDelete(project)}
                            >
                              {t("adminShared.actions.delete")}
                            </DropdownItem>
                          </DropdownContent>
                        </DropdownMenuRoot>
                      </TableColumn>
                    </TableRow>
                  ))}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      ) : activeTab === "projects" ? (
        <div className="flex flex-col gap-4">
          <TableToolbar>
            <TableToolbar.Row
              justify="between"
              className="items-stretch gap-3 sm:items-center"
            >
              <TableToolbar.ViewTabs
                value={viewMode}
                onValueChange={setViewMode}
                tabs={[
                  {
                    id: "list",
                    label: t("adminProjects.toolbar.list"),
                    icon: (
                      <LayoutList
                        className="size-3.5 shrink-0"
                        strokeWidth={2}
                        aria-hidden
                      />
                    ),
                  },
                  {
                    id: "kanban",
                    label: t("adminProjects.toolbar.kanban"),
                    icon: (
                      <LayoutGrid
                        className="size-3.5 shrink-0"
                        strokeWidth={2}
                        aria-hidden
                      />
                    ),
                  },
                ]}
              />
            </TableToolbar.Row>
            <TableToolbar.Row justify="start" className="gap-2">
              <div className="min-w-0 flex-1 sm:min-w-[12rem]">
                <Field
                  id="projects-search-kanban"
                  placeholder={t("adminProjects.filters.searchPlaceholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  iconD={IC.search}
                />
              </div>
              <div className="w-full shrink-0 sm:w-44">
                <Select
                  options={yearOptions}
                  value={yearFilter}
                  onValueChange={setYearFilter}
                />
              </div>
              <div className="w-full shrink-0 sm:w-48">
                <Select
                  options={statusOptions}
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                />
              </div>
            </TableToolbar.Row>
          </TableToolbar>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {KANBAN_LANES.map((lane) => (
              <section
                key={lane}
                className="flex min-h-[280px] flex-col gap-3 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-3 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-primary dark:text-dark-primary">
                    {t(`adminProjects.kanban.${lane}`)}
                  </h2>
                  <span className="rounded-full bg-light-app-tertiary px-2 py-0.5 text-[11px] font-semibold text-secondary dark:bg-dark-app-tertiary dark:text-dark-secondary">
                    {kanbanBuckets[lane]?.length ?? 0}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                  {(kanbanBuckets[lane] ?? []).map((project) => (
                    <KanbanCard
                      key={project.id}
                      project={project}
                      onOpen={openWorkspace}
                      locale={locale}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl border border-dashed border-(--color-light-input-border) py-2 text-xs font-semibold text-muted transition-colors hover:border-(--color-light-input-border-focus) hover:text-primary dark:border-dark-input-border dark:hover:border-(--color-dark-input-border-focus) dark:hover:text-dark-primary"
                  onClick={() =>
                    window.GooeyToaster?.info?.(
                      t("adminProjects.toast.addTask"),
                    )
                  }
                >
                  {t("adminProjects.kanban.addTask")}
                </button>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Table
            toolbar={
              <TableToolbar>
                <TableToolbar.Row
                  justify="between"
                  className="items-stretch gap-3 sm:items-center"
                >
                  <TableToolbar.ViewTabs
                    value={groupViewMode}
                    onValueChange={setGroupViewMode}
                    tabs={[
                      {
                        id: "list",
                        label: t("adminProjects.toolbar.list"),
                        icon: (
                          <LayoutList
                            className="size-3.5 shrink-0"
                            strokeWidth={2}
                            aria-hidden
                          />
                        ),
                      },
                      {
                        id: "board",
                        label: t("adminProjects.toolbar.board"),
                        icon: (
                          <LayoutGrid
                            className="size-3.5 shrink-0"
                            strokeWidth={2}
                            aria-hidden
                          />
                        ),
                      },
                    ]}
                  />
                </TableToolbar.Row>
                <TableToolbar.Row justify="start" className="gap-2">
                  <div className="min-w-0 flex-1 sm:min-w-48">
                    <Field
                      id="project-groups-search"
                      placeholder={t("adminProjects.registry.search")}
                      value={groupSearchInput}
                      onChange={(e) => setGroupSearchInput(e.target.value)}
                      iconD={IC.search}
                    />
                  </div>
                </TableToolbar.Row>
              </TableToolbar>
            }
          >
            {groupViewMode === "list" ? (
              <>
                <TableHeader headerData={groupHeaderData} />
                <TableBody>
                  {filteredGroups.map((group) => (
                    <TableRow key={normalizeGroupId(group)}>
                      <TableColumn className="w-10">
                        <Checkbox />
                      </TableColumn>
                      <TableColumn className="font-mono text-xs">
                        #{normalizeGroupId(group)}
                      </TableColumn>
                      <TableColumn nowrap={false}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                            <UsersRound className="size-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <div className="line-clamp-1 text-sm font-medium text-primary dark:text-dark-primary">
                              {groupTitle(group)}
                            </div>
                            <div className="text-xs text-muted dark:text-dark-muted">
                              {t("adminProjects.registry.memberCount", {
                                count: groupMembersCount(group),
                              })}
                            </div>
                          </div>
                        </div>
                      </TableColumn>
                      <TableColumn nowrap={false}>
                        <span className="text-sm text-secondary dark:text-dark-secondary">
                          {personDisplayName(group?.groupLeader ?? group?.leader) ||
                            "—"}
                        </span>
                      </TableColumn>
                      <TableColumn className="text-sm text-secondary dark:text-dark-secondary">
                        {t("adminProjects.registry.memberCount", {
                          count: groupMembersCount(group),
                        })}
                      </TableColumn>
                      <TableColumn className="text-center">
                        {renderGroupActions(group)}
                      </TableColumn>
                    </TableRow>
                  ))}

                  {filteredGroups.length === 0 ? (
                    <TableRow className="table-advanced-tr--empty cursor-default">
                      <TableColumn
                        colSpan={groupHeaderData.length}
                        nowrap={false}
                        className="py-12 text-center text-muted dark:text-dark-muted"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <UsersRound className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">
                            {t("adminProjects.faculty.emptyGroups")}
                          </span>
                          <span className="text-xs opacity-75">
                            {t("adminProjects.registry.emptyHint")}
                          </span>
                        </div>
                      </TableColumn>
                    </TableRow>
                  ) : null}
                </TableBody>
              </>
            ) : null}
          </Table>

          {groupViewMode === "board" ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredGroups.map((group) => (
                <article
                  key={`group-card-${normalizeGroupId(group)}`}
                  className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-xs dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Checkbox />
                    {renderGroupActions(group)}
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                      {groupTitle(group)}
                    </p>
                    <p className="mt-1 text-xs text-muted dark:text-dark-muted">
                      #{normalizeGroupId(group)}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                      {t("adminProjects.registry.memberCount", {
                        count: groupMembersCount(group),
                      })}
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-secondary dark:text-dark-secondary">
                    {personDisplayName(group?.groupLeader ?? group?.leader) ||
                      "—"}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {groupOperation ? (
        <GlobalModal
          open={true}
          setOpen={(open) => {
            if (
              !open &&
              !updateFacultyGroup.isPending &&
              !updateFacultyGroupLeader.isPending &&
              !removeFacultyGroupMember.isPending
            )
              closeGroupOperation();
          }}
          isClose
          title={
            groupOperation.mode === "add-member"
              ? t("adminProjects.groups.operations.addMemberTitle")
              : groupOperation.mode === "remove-member"
                ? t("adminProjects.groups.operations.removeMemberTitle")
              : t("adminProjects.groups.operations.changeLeaderTitle")
          }
          subtitle={t("adminProjects.groups.operations.subtitle", {
            group: groupTitle(groupOperation.record),
          })}
          footer={
            <>
              <Button
                type="button"
                variant="tertiary"
                onClick={closeGroupOperation}
                disabled={
                  updateFacultyGroup.isPending ||
                  updateFacultyGroupLeader.isPending ||
                  removeFacultyGroupMember.isPending
                }
              >
                {t("adminProjects.form.group.actions.cancel")}
              </Button>
              <Button
                type="button"
                onClick={() => void submitGroupOperation()}
                loading={
                  updateFacultyGroup.isPending ||
                  updateFacultyGroupLeader.isPending ||
                  removeFacultyGroupMember.isPending
                }
                disabled={
                  updateFacultyGroup.isPending ||
                  updateFacultyGroupLeader.isPending ||
                  removeFacultyGroupMember.isPending ||
                  !String(groupOperationDraft.studentId ?? "").trim()
                }
              >
                {updateFacultyGroup.isPending ||
                updateFacultyGroupLeader.isPending ||
                removeFacultyGroupMember.isPending
                  ? t("adminProjects.form.group.actions.submitting")
                  : groupOperation.mode === "add-member"
                    ? t("adminProjects.groups.operations.addMember")
                    : groupOperation.mode === "remove-member"
                      ? t("adminProjects.groups.operations.removeMember")
                      : t("adminProjects.groups.operations.changeLeader")}
              </Button>
            </>
          }
          className="max-w-xl"
        >
          <div className="grid gap-4">
            <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-secondary px-4 py-3 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-app-secondary)">
              <div className="text-[11px] font-semibold text-primary dark:text-dark-primary">
                {groupTitle(groupOperation.record)}
              </div>
              <div className="mt-1 text-[11px] text-secondary dark:text-dark-secondary">
                {t("adminProjects.groups.operations.currentSummary", {
                  leader: personDisplayName(groupOperation.record?.groupLeader),
                  count: groupMembersCount(groupOperation.record),
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-primary dark:text-dark-primary">
                {groupOperation.mode === "add-member"
                  ? t("adminProjects.groups.operations.memberLabel")
                  : groupOperation.mode === "remove-member"
                    ? t("adminProjects.groups.operations.removeMemberLabel")
                  : t("adminProjects.groups.operations.leaderLabel")}
              </span>
              <SearchableSelect
                value={groupOperationDraft.studentId}
                onValueChange={(value) =>
                  setGroupOperationDraft({ studentId: value ?? "" })
                }
                options={
                  groupOperation.mode === "add-member"
                    ? groupAddMemberOptions
                    : groupOperation.mode === "remove-member"
                      ? groupRemoveMemberOptions
                    : groupLeaderOptions
                }
                placeholder={
                  groupOperation.mode === "add-member"
                    ? t("adminProjects.groups.operations.memberPlaceholder")
                    : groupOperation.mode === "remove-member"
                      ? t("adminProjects.groups.operations.removeMemberPlaceholder")
                    : t("adminProjects.groups.operations.leaderPlaceholder")
                }
                searchPlaceholder={t(
                  "adminProjects.form.group.placeholders.groupLeaderSearch",
                )}
                disabled={
                  updateFacultyGroup.isPending ||
                  updateFacultyGroupLeader.isPending ||
                  removeFacultyGroupMember.isPending ||
                  (groupOperation.mode === "add-member" &&
                    groupAddMemberOptions.length === 0) ||
                  (groupOperation.mode === "remove-member" &&
                    groupRemoveMemberOptions.length === 0)
                }
              />
              {groupOperation.mode === "add-member" &&
              groupAddMemberOptions.length === 0 ? (
                <p className="text-[11px] text-muted dark:text-dark-muted">
                  {t("adminProjects.groups.operations.noAvailableStudents")}
                </p>
              ) : null}
              {groupOperation.mode === "remove-member" &&
              groupRemoveMemberOptions.length === 0 ? (
                <p className="text-[11px] text-muted dark:text-dark-muted">
                  {t("adminProjects.groups.operations.noRemovableMembers")}
                </p>
              ) : null}
            </div>
          </div>
        </GlobalModal>
      ) : null}

      {deleteGroup ? (
        <SensitiveActionModal
          open={true}
          setOpen={(open) => {
            if (!open && !deleteSubmitting) setDeleteGroup(null);
          }}
          title={t("adminProjects.delete.title")}
          subtitle={t("adminProjects.delete.description", {
            name: deleteGroup.name,
          })}
          summaryItems={[
            {
              label: t("adminProjects.delete.meta"),
              value: deleteGroup.meta || "—",
              mono: true,
            },
          ]}
          warning={t("adminProjects.delete.warning")}
          cancelLabel={t("adminProjects.form.group.actions.cancel")}
          confirmLabel={
            deleteSubmitting
              ? t("adminProjects.form.group.actions.submitting")
              : t("adminShared.actions.delete")
          }
          onConfirm={confirmDeleteGroup}
          submitting={deleteSubmitting}
        />
      ) : null}

      {archiveProject ? (
        <SensitiveActionModal
          open={true}
          setOpen={(open) => {
            if (!open && !deleteSubmitting) setArchiveProject(null);
          }}
          title={t("adminProjects.archive.title")}
          subtitle={t("adminProjects.archive.description", {
            name: archiveProject.name,
          })}
          summaryItems={[
            {
              label: t("adminProjects.delete.meta"),
              value: archiveProject.meta || "—",
              mono: true,
            },
          ]}
          warning={t("adminProjects.archive.warning")}
          cancelLabel={t("adminProjects.form.group.actions.cancel")}
          confirmLabel={
            deleteSubmitting
              ? t("adminProjects.form.group.actions.submitting")
              : t("adminShared.actions.archive")
          }
          onConfirm={confirmArchiveProject}
          submitting={deleteSubmitting}
        />
      ) : null}

      {deleteProject ? (
        <SensitiveActionModal
          open={true}
          setOpen={(open) => {
            if (!open && !deleteSubmitting) setDeleteProject(null);
          }}
          title={t("adminProjects.delete.title")}
          subtitle={t("adminProjects.delete.description", {
            name: deleteProject.name,
          })}
          summaryItems={[
            {
              label: t("adminProjects.delete.meta"),
              value: deleteProject.meta || "—",
              mono: true,
            },
          ]}
          warning={t("adminProjects.delete.warning")}
          confirmLabel={
            deleteSubmitting
              ? t("adminProjects.form.group.actions.submitting")
              : t("adminShared.actions.delete")
          }
          onConfirm={confirmDeleteProject}
          submitting={deleteSubmitting}
        />
      ) : null}
    </div>
  );
}
