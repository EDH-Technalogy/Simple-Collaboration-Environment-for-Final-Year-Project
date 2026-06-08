import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  GitBranch,
  Loader2,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BlogShell } from "../blog/BlogShell";
import {
  usePublishedFacultyProject,
  usePublishedFacultyProjects,
} from "../../services/useApi";
import { getPublishedFacultyProjectDownloadUrl } from "../../services/apiRoute";
import PersonAvatar from "../../components/PersonAvatar";

function listFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function displayName(person, fallback = "-") {
  const full = [person?.firstName, person?.lastName].filter(Boolean).join(" ");
  return full || person?.name || person?.email || fallback;
}

const DOCUMENT_TITLE_HEADINGS = [
  "title",
  "project title",
  "research title",
  "د موضوع عنوان",
  "موضوع عنوان",
  "عنوان موضوع",
  "عنوان",
];

function projectDocumentSource(project) {
  return String(
    project?.documentText ??
      project?.contentText ??
      project?.fullText ??
      project?.extractedText ??
      project?.abstractText ??
      project?.abstract ??
      project?.summary ??
      "",
  ).trim();
}

function cleanDocumentLine(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:：\-–—]+|[\s:：\-–—]+$/g, "")
    .trim();
}

function extractDocumentTitle(project) {
  const direct = cleanDocumentLine(
    project?.documentTitle ??
      project?.monographTitle ??
      project?.researchTitle ??
      project?.publicTitle,
  );
  if (direct) return direct;

  const lines = projectDocumentSource(project)
    .split(/\r?\n/)
    .map(cleanDocumentLine)
    .filter(Boolean);
  if (!lines.length) return "";

  const normalizedHeadings = DOCUMENT_TITLE_HEADINGS.map((heading) =>
    normalizeLanguageText(heading),
  );
  const headingIndex = lines.findIndex((line) =>
    normalizedHeadings.includes(normalizeLanguageText(line)),
  );
  if (headingIndex >= 0) {
    const next = lines.slice(headingIndex + 1).find((line) => {
      const normalized = normalizeLanguageText(line);
      return (
        line.length > 6 &&
        !normalizedHeadings.includes(normalized) &&
        !ABSTRACT_HEADINGS.some((heading) => normalized === normalizeLanguageText(heading))
      );
    });
    if (next) return next;
  }

  const abstractIndex = lines.findIndex((line) =>
    ABSTRACT_HEADINGS.some((heading) => normalizeLanguageText(line) === normalizeLanguageText(heading)),
  );
  const beforeAbstract = lines.slice(0, abstractIndex > 0 ? abstractIndex : 24);
  return (
    beforeAbstract.find((line) => {
      const normalized = normalizeLanguageText(line);
      return (
        line.length >= 12 &&
        line.length <= 180 &&
        !/^(completed|monograph|abstract|abstruct)$/i.test(line) &&
        !normalizedHeadings.includes(normalized)
      );
    }) || ""
  );
}

function projectTitle(project) {
  return (
    extractDocumentTitle(project) ||
    project?.projectName ||
    project?.name ||
    project?.title ||
    project?.projectRepository?.repositoryName ||
    "-"
  );
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

function compactAbstractText(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractAbstractSection(value) {
  const raw = compactAbstractText(value);
  if (!raw) return "";

  const normalizedLines = raw
    .split("\n")
    .map((line) => normalizeLanguageText(line));
  const rawLines = raw.split("\n");
  const startLine = normalizedLines.findIndex((line) =>
    ABSTRACT_HEADINGS.some((heading) => {
      const normalizedHeading = normalizeLanguageText(heading);
      return (
        line === normalizedHeading ||
        line.startsWith(`${normalizedHeading} `) ||
        line.startsWith(`${normalizedHeading}:`)
      );
    }),
  );

  if (startLine >= 0) {
    const headingText = normalizeLanguageText(rawLines[startLine]);
    const inlineHeading = ABSTRACT_HEADINGS.find((heading) =>
      headingText.startsWith(normalizeLanguageText(heading)),
    );
    const inlineRemainder = inlineHeading
      ? rawLines[startLine]
          .replace(new RegExp(`^\\s*${escapeRegExp(inlineHeading)}\\s*[:：-]?\\s*`, "i"), "")
          .trim()
      : "";
    const bodyLines = inlineRemainder ? [inlineRemainder] : [];
    for (let i = startLine + 1; i < rawLines.length; i += 1) {
      const normalized = normalizedLines[i];
      const isStop = ABSTRACT_END_HEADINGS.some((heading) => {
        const normalizedHeading = normalizeLanguageText(heading);
        return (
          normalized === normalizedHeading ||
          normalized.startsWith(`${normalizedHeading} `) ||
          normalized.startsWith(`${normalizedHeading}:`)
        );
      });
      if (isStop) break;
      bodyLines.push(rawLines[i]);
    }
    const section = compactAbstractText(bodyLines.join("\n"));
    if (section) return section;
  }

  const normalizedRaw = normalizeLanguageText(raw);
  const headingIndex = findHeadingIndex(normalizedRaw, ABSTRACT_HEADINGS);
  if (headingIndex >= 0) {
    const afterHeading = normalizedRaw.slice(headingIndex);
    const heading = ABSTRACT_HEADINGS.find((item) =>
      afterHeading.startsWith(normalizeLanguageText(item)),
    );
    const start = heading
      ? headingIndex + normalizeLanguageText(heading).length
      : headingIndex;
    const end = findHeadingIndex(normalizedRaw, ABSTRACT_END_HEADINGS, start);
    const normalizedSection = normalizedRaw.slice(start, end >= 0 ? end : undefined);
    if (normalizedSection.trim()) return compactAbstractText(normalizedSection);
  }

  return raw;
}

function truncateAbstract(value, limit = 520) {
  const text = compactAbstractText(value);
  if (!text) return "";
  const firstParagraph = text.split(/\n{2,}/).find(Boolean) ?? text;
  return firstParagraph.length > limit
    ? `${firstParagraph.slice(0, limit - 3).trim()}...`
    : firstParagraph;
}

function projectAbstract(project, fallback) {
  const source = String(
    project?.abstractText ??
      project?.abstract ??
      project?.summary ??
      project?.description ??
      project?.projectRepository?.description ??
      "",
  ).trim();
  const abstract = extractAbstractSection(source);
  return truncateAbstract(abstract) || fallback;
}

function projectFullAbstract(project, fallback) {
  const source = String(
    project?.abstractText ??
      project?.abstract ??
      project?.summary ??
      project?.description ??
      project?.projectRepository?.description ??
      "",
  ).trim();
  return extractAbstractSection(source) || fallback;
}

function abstractParagraphs(value) {
  return compactAbstractText(value)
    .split(/\n{2,}|\n(?=\S)/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function readingMinutes(value) {
  const words = String(value ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

function finalProjectDownloadUrl(project) {
  return project?.id ? getPublishedFacultyProjectDownloadUrl(project.id) : "#";
}

function personId(person, fallback = "") {
  return String(
    person?.id ??
      person?.studentId ??
      person?.teacherId ??
      person?.email ??
      person?.username ??
      fallback,
  );
}

function personEmail(person) {
  return person?.email ?? person?.mail ?? "";
}

function personSubtitle(person, fallback = "") {
  return (
    person?.department?.name ??
    person?.department ??
    person?.batch?.name ??
    person?.code ??
    personEmail(person) ??
    fallback
  );
}

function groupMembers(project) {
  const group = project?.group ?? {};
  const rows =
    group.groupMembers ??
    group.groupMember ??
    group.members ??
    group.students ??
    [];
  return Array.isArray(rows) ? rows : [];
}

function projectContributors(project) {
  const teacher = project?.teacher;
  const members = groupMembers(project);
  const leaderId = personId(project?.group?.groupLeader ?? project?.group?.leader);
  const contributors = [];
  if (teacher) {
    contributors.push({
      person: teacher,
      role: "Supervisor",
      kind: "supervisor",
      badge: "Supervisor",
    });
  }
  members.forEach((member, index) => {
    const id = personId(member, `student-${index}`);
    contributors.push({
      person: member,
      role: leaderId && id === leaderId ? "Group leader" : "Student contributor",
      kind: "student",
      badge: leaderId && id === leaderId ? "Leader" : "Student",
    });
  });
  return contributors;
}

function textDirection(value) {
  return /[\u0600-\u06FF]/.test(String(value ?? "")) ? "rtl" : "ltr";
}

function profilePathForContributor(item) {
  const person = item?.person ?? {};
  const key = personId(person, personEmail(person));
  const params = new URLSearchParams();
  if (key) params.set("user", key);
  params.set("name", displayName(person, "Contributor"));
  if (personEmail(person)) params.set("email", personEmail(person));
  if (item?.role) params.set("role", item.role);
  if (personSubtitle(person, "")) params.set("bio", personSubtitle(person, ""));
  return `/writer/profile${params.toString() ? `?${params.toString()}` : ""}`;
}

function projectLanguageLabel(value) {
  const text = String(value ?? "");
  if (/[\u0600-\u06FF]/.test(text)) {
    if (/[ټډړږڼېۍځڅښګپچژ]/.test(text)) return "Pashto abstract";
    return "Dari / Persian abstract";
  }
  return "English abstract";
}

function valueLabel(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value !== "object") return "";
  return String(
    value.name ??
      value.title ??
      value.label ??
      value.displayName ??
      value.departmentName ??
      value.batchName ??
      value.academicYearName ??
      value.year ??
      value.code ??
      "",
  ).trim();
}

function firstLabel(...values) {
  return values.map(valueLabel).find(Boolean) || "";
}

function firstDateLike(...values) {
  return values.find((value) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  });
}

function yearFromDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? String(date.getFullYear()) : "";
}

function academicYearLabel(project) {
  const group = project?.group ?? {};
  const members = groupMembers(project);
  const firstMember = members[0] ?? {};
  const semester =
    project?.semesterDetails ??
    project?.semester ??
    group.semesterDetails ??
    group.semester ??
    firstMember.semesterDetails ??
    firstMember.semester;
  const batch =
    project?.batchDetails ??
    project?.batch ??
    group.batchDetails ??
    group.batch ??
    firstMember.batchDetails ??
    firstMember.batch;
  const academicYear =
    project?.academicYearDetails ??
    project?.academicYear ??
    semester?.academicYear ??
    batch?.academicYear ??
    group.academicYearDetails ??
    group.academicYear ??
    firstMember.academicYearDetails ??
    firstMember.academicYear;

  const direct = firstLabel(
    project?.academicYearName,
    project?.academicYearLabel,
    academicYear,
    academicYear?.name,
    academicYear?.title,
    academicYear?.year,
  );
  if (direct) return direct;

  const start = yearFromDate(
    academicYear?.startDate ??
      project?.academicYearStartDate ??
      semester?.academicYear?.startDate,
  );
  const end = yearFromDate(
    academicYear?.endDate ??
      project?.academicYearEndDate ??
      semester?.academicYear?.endDate,
  );
  if (start && end && start !== end) return `${start}-${end}`;
  return start || end || "";
}

function completionYearLabel(project) {
  const academic = academicYearLabel(project);
  const dateValue = firstDateLike(
    project?.completedAt,
    project?.completionDate,
    project?.publishedAt,
    project?.updatedAt,
    project?.createdAt,
  );
  const dateYear = yearFromDate(dateValue);
  if (dateYear) return dateYear;
  const match = String(academic).match(/\b(13\d{2}|14\d{2}|19\d{2}|20\d{2})\b/g);
  return match?.at(-1) || "";
}

function departmentLabel(project) {
  const group = project?.group ?? {};
  const members = groupMembers(project);
  const firstMember = members[0] ?? {};
  return firstLabel(
    project?.department,
    project?.departmentName,
    group.department,
    group.departmentName,
    project?.teacher?.department,
    project?.teacher?.departmentName,
    firstMember.department,
    firstMember.departmentName,
  );
}

function batchLabel(project) {
  const group = project?.group ?? {};
  const firstMember = groupMembers(project)[0] ?? {};
  return firstLabel(
    project?.batchDetails,
    project?.batch,
    project?.batchName,
    group.batchDetails,
    group.batch,
    group.batchName,
    firstMember.batchDetails,
    firstMember.batch,
    firstMember.batchName,
  );
}

function semesterLabel(project) {
  const group = project?.group ?? {};
  const firstMember = groupMembers(project)[0] ?? {};
  const value = firstLabel(
    project?.semesterDetails,
    project?.semester,
    project?.semesterName,
    group.semesterDetails,
    group.semester,
    group.semesterName,
    firstMember.semesterDetails,
    firstMember.semester,
    firstMember.semesterName,
  );
  return value && /^\d+$/.test(value) ? `Semester ${value}` : value;
}

function writerNames(project, limit = 2) {
  const names = projectContributors(project)
    .filter((item) => item.kind === "student")
    .map((item) => displayName(item.person, ""))
    .filter(Boolean);
  if (!names.length) return "No writers listed";
  const visible = names.slice(0, limit).join(", ");
  const extra = names.length - limit;
  return extra > 0 ? `${visible} +${extra} more` : visible;
}

function supervisorName(project) {
  const supervisor = projectContributors(project).find(
    (item) => item.kind === "supervisor",
  );
  return supervisor ? displayName(supervisor.person, "Supervisor") : "No supervisor listed";
}

function projectFactItems(project, abstractText) {
  const repository = project?.projectRepository ?? {};
  return [
    {
      label: "Year",
      value: completionYearLabel(project) || "Not specified",
    },
    {
      label: "Academic year",
      value: academicYearLabel(project) || "Not specified",
    },
    {
      label: "Department",
      value: departmentLabel(project) || "Not specified",
    },
    {
      label: "Batch / semester",
      value: [batchLabel(project), semesterLabel(project)].filter(Boolean).join(" / ") ||
        "Not specified",
    },
    {
      label: "Language",
      value: projectLanguageLabel(abstractText),
    },
    {
      label: "Final file",
      value:
        project?.finalFileName ||
        repository.repositoryName ||
        "Published monograph file",
    },
    {
      label: "Repository",
      value: repository.repositoryName || "Project repository",
    },
  ];
}

function ContributorAvatarStack({ items, max = 4 }) {
  if (!items?.length) return null;
  const shown = items.slice(0, max);
  return (
    <div className="flex -space-x-2">
      {shown.map((item, index) => {
        const name = displayName(item.person, "Contributor");
        return (
          <Link
            key={`${personId(item.person, item.role)}-${index}`}
            to={profilePathForContributor(item)}
            title={`Open ${name} profile`}
            className="inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-(--color-light-card-bg) bg-accent/15 text-[10px] font-semibold text-primary shadow-sm transition-transform hover:-translate-y-0.5 hover:z-10 dark:border-(--color-dark-card-bg) dark:bg-[rgba(0,102,255,0.22)] dark:text-dark-primary"
          >
            <PersonAvatar
              person={item.person}
              sizeClass="inline-flex size-full items-center justify-center overflow-hidden rounded-full"
            />
          </Link>
        );
      })}
      {items.length > shown.length ? (
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-(--color-light-card-bg) bg-light-app-tertiary text-[10px] font-semibold text-secondary shadow-sm dark:border-(--color-dark-card-bg) dark:bg-dark-app-tertiary dark:text-dark-secondary">
          +{items.length - shown.length}
        </span>
      ) : null}
    </div>
  );
}

function ContributorChip({ item, compact = false }) {
  const name = displayName(item.person, "Contributor");
  return (
    <Link
      to={profilePathForContributor(item)}
      className={`group inline-flex min-w-0 items-center gap-2 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary text-left transition-colors hover:border-(--color-light-input-border-focus) hover:bg-(--color-light-card-bg) dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:hover:border-(--color-dark-input-border-focus) dark:hover:bg-(--color-dark-card-bg) ${
        compact ? "px-2 py-1.5" : "px-3 py-2"
      }`}
      title={`Open ${name} profile`}
    >
      <PersonAvatar
        person={item.person}
        sizeClass={`${compact ? "size-7" : "size-9"} inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full`}
        className="bg-(--color-light-card-bg) text-[10px] font-bold text-primary ring-1 ring-light-divider dark:bg-(--color-dark-card-bg) dark:text-dark-primary dark:ring-dark-divider"
      />
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-primary dark:text-dark-primary">
          {name}
        </span>
        {!compact ? (
          <span className="block truncate text-[11px] text-muted dark:text-dark-muted">
            {item.role}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function ProjectContributors({ project, compact = false }) {
  const contributors = projectContributors(project);
  if (!contributors.length) return null;
  const supervisor = contributors.find((item) => item.kind === "supervisor");
  const students = contributors.filter((item) => item.kind !== "supervisor");
  return (
    <div className="space-y-3">
      {supervisor ? (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
            <UserRound className="size-3.5" strokeWidth={1.8} />
            Supervisor
          </p>
          <ContributorChip item={supervisor} compact={compact} />
        </div>
      ) : null}
      {students.length ? (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
            <GraduationCap className="size-3.5" strokeWidth={1.8} />
            Students
          </p>
          <div className="flex flex-wrap gap-2">
            {students.map((item, index) => (
              <ContributorChip
                key={`${personId(item.person, item.role)}-${index}`}
                item={item}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function projectSearchText(project) {
  return [
    projectTitle(project),
    projectAbstract(project, ""),
    project?.finalFileName,
    project?.status,
    project?.group?.name,
    displayName(project?.teacher, ""),
    project?.teacher?.email,
    ...projectContributors(project).map((item) => displayName(item.person, "")),
    project?.projectRepository?.repositoryName,
    project?.projectRepository?.description,
  ]
    .filter(Boolean)
    .join(" ");
}

function searchMatches(project, rawQuery) {
  const terms = normalizeLanguageText(rawQuery)
    .split(/\s+/)
    .filter(Boolean);
  if (!terms.length) return true;
  const haystack = normalizeLanguageText(projectSearchText(project));
  return terms.every((term) => haystack.includes(term));
}

export default function PublicProjects() {
  const { t } = useTranslation();
  const { id: projectId } = useParams();
  const [query, setQuery] = useState("");
  const publicRequestConfig = {
    skipAuthRedirect: true,
    skipAuthToken: true,
  };
  const detailQuery = usePublishedFacultyProject(projectId, {
    enabled: Boolean(projectId),
    notifyOnError: false,
    requestConfig: publicRequestConfig,
  });
  const { data, isLoading, isError } = usePublishedFacultyProjects(
    {
      page: 0,
      pageSize: 48,
      q: query.trim() || undefined,
      search: query.trim() || undefined,
      keyword: query.trim() || undefined,
    },
    {
      enabled: !projectId,
      notifyOnError: false,
      requestConfig: publicRequestConfig,
    },
  );

  const projects = useMemo(() => listFromPayload(data), [data]);
  const heroStats = useMemo(() => {
    const groups = new Set();
    let repositories = 0;
    projects.forEach((project) => {
      if (project?.group?.id || project?.group?.name) {
        groups.add(project.group.id || project.group.name);
      }
      if (project?.projectRepository?.repositoryName) repositories += 1;
    });
    return [
      {
        icon: FolderKanban,
        label: t("publicProjects.hero.stats.projects"),
        value: projects.length,
      },
      {
        icon: Users,
        label: t("publicProjects.hero.stats.groups"),
        value: groups.size,
      },
      {
        icon: GitBranch,
        label: t("publicProjects.hero.stats.repositories"),
        value: repositories,
      },
    ];
  }, [projects, t]);
  const filtered = useMemo(() => {
    if (!query.trim()) return projects;
    return projects.filter((project) => searchMatches(project, query));
  }, [projects, query]);

  if (projectId) {
    const project = detailQuery.data;
    const fullAbstract = projectFullAbstract(
      project,
      t("publicProjects.noDescription"),
    );
    const displayTitle = projectTitle(project);
    const abstractDir = textDirection(fullAbstract);
    const titleDir = textDirection(displayTitle);
    const contributors = projectContributors(project);
    const supervisor = contributors.find((item) => item.kind === "supervisor");
    const students = contributors.filter((item) => item.kind === "student");
    const paragraphs = abstractParagraphs(fullAbstract);
    const factItems = projectFactItems(project, fullAbstract);
    return (
      <BlogShell variant="article">
        <div className="py-10 sm:py-14 lg:pb-24">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-primary dark:text-dark-muted dark:hover:text-dark-primary"
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} />
            {t("publicProjects.detail.back")}
          </Link>

          {detailQuery.isLoading ? (
            <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary px-6 py-14 text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
              <Loader2 className="size-5 animate-spin" strokeWidth={1.8} />
              {t("publicProjects.loading")}
            </div>
          ) : detailQuery.isError || !project ? (
            <div className="mt-8 rounded-2xl border border-dashed border-(--color-light-card-border) bg-light-app-tertiary px-6 py-14 text-center dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              <p className="font-semibold text-primary dark:text-dark-primary">
                {t("publicProjects.error")}
              </p>
            </div>
          ) : (
            <article className="mx-auto mt-6 max-w-6xl pb-6">
              <header className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted dark:text-dark-muted">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-light-app-tertiary px-3 py-1 dark:bg-dark-app-tertiary">
                    <FolderKanban className="size-3.5" strokeWidth={1.8} />
                    {project?.group?.name || t("publicProjects.groupFallback")}
                  </span>
                  <span>{readingMinutes(fullAbstract)} min read</span>
                  <span aria-hidden>&middot;</span>
                  <span>{project?.status || t("publicProjects.statusFallback")}</span>
                </div>

                <h1
                  className={`mt-5 text-3xl font-bold leading-tight tracking-tight text-primary sm:text-4xl dark:text-dark-primary ${
                    titleDir === "rtl" ? "font-persian" : "font-blog-display"
                  }`}
                  dir={titleDir}
                >
                  {displayTitle}
                </h1>

                <div className="mt-7 flex flex-col gap-5 border-t border-light-divider pt-5 dark:border-dark-divider lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-5">
                    {supervisor ? (
                      <Link
                        to={profilePathForContributor(supervisor)}
                        className="flex min-w-0 items-center gap-3 rounded-full"
                        title={`Open ${displayName(supervisor.person, "Supervisor")} profile`}
                      >
                        <PersonAvatar
                          person={supervisor.person}
                          sizeClass="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full"
                          className="bg-light-app-tertiary text-xs font-bold text-primary ring-1 ring-light-divider dark:bg-dark-app-tertiary dark:text-dark-primary dark:ring-dark-divider"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-primary underline-offset-4 hover:underline dark:text-dark-primary">
                            {displayName(supervisor.person, "Supervisor")}
                          </span>
                          <span className="block text-xs text-muted dark:text-dark-muted">
                            Supervisor
                          </span>
                        </span>
                      </Link>
                    ) : null}

                    <div className="flex min-w-0 items-center gap-3">
                      <ContributorAvatarStack items={students} max={6} />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-primary dark:text-dark-primary">
                          {students.length} writer{students.length === 1 ? "" : "s"}
                        </span>
                        <span className="block text-xs text-muted dark:text-dark-muted">
                          Select a profile to view the writer
                        </span>
                      </span>
                    </div>
                  </div>

                  <dl className="flex flex-wrap gap-2 lg:justify-end">
                    {factItems.map((item) => (
                      <div
                        key={item.label}
                        className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-xl border border-(--color-light-card-border) px-3 py-1.5 text-sm font-semibold text-secondary transition-colors dark:border-(--color-dark-card-border) dark:text-dark-secondary"
                        title={`${item.label}: ${item.value}`}
                      >
                        <dt className="shrink-0 text-[11px] uppercase tracking-wide text-muted dark:text-dark-muted">
                          {item.label}
                        </dt>
                        <dd className="min-w-0 max-w-[12rem] truncate text-primary dark:text-dark-primary">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </header>

              <section className="mt-8 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) sm:p-6 lg:p-8">
                <div
                  className={`blog-article-prose mx-auto max-w-3xl text-[15px] leading-8 [&>*:first-child]:mt-0 ${
                    abstractDir === "rtl" ? "font-persian text-right" : ""
                  }`}
                  dir={abstractDir}
                >
                  <h2>{t("publicProjects.detail.abstractTitle")}</h2>
                  {paragraphs.map((paragraph, index) => (
                    <p key={`${paragraph.slice(0, 32)}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </section>

              <footer className="mt-8 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                      {t("publicProjects.detail.readMoreTitle")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-secondary dark:text-dark-secondary">
                      {project?.finalFileName ||
                        t("publicProjects.detail.readMoreDescription")}
                    </p>
                  </div>
                  <a
                    href={finalProjectDownloadUrl(project)}
                    download={project?.finalFileName || undefined}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-light-btn-primary-bg px-4 text-sm font-semibold text-white transition-colors hover:opacity-95 dark:bg-dark-primary dark:text-dark-shell"
                  >
                    <Download className="size-4" strokeWidth={1.8} />
                    {t("publicProjects.detail.download")}
                  </a>
                </div>
              </footer>
            </article>
          )}
        </div>
      </BlogShell>
    );
  }

  return (
    <BlogShell variant="feed">
      <div className="font-persian py-10 sm:py-14 lg:pb-24">
        <section className="relative isolate overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) sm:p-6 lg:p-8">
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=1469&auto=format&fit=crop')",
            }}
          />
          <div className="absolute inset-0 -z-10 bg-(--color-light-card-bg)/88 backdrop-blur-[1px] dark:bg-(--color-dark-card-bg)/90" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-muted">
                <FolderKanban className="size-3.5" strokeWidth={1.8} />
                {t("publicProjects.eyebrow")}
              </p>
              <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-primary dark:text-dark-primary sm:text-5xl">
                {t("publicProjects.title")}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-secondary dark:text-dark-secondary sm:text-base">
                {t("publicProjects.description")}
              </p>
            </div>
            <div className="grid gap-2">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary px-4 py-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-secondary dark:text-dark-secondary">
                    <stat.icon className="size-4 text-(--color-chart-blue-primary) dark:text-(--color-chart-blue-secondary)" />
                    {stat.label}
                  </span>
                  <span className="text-xl font-semibold text-primary dark:text-dark-primary">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted dark:text-dark-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("publicProjects.search")}
              className="h-11 w-full rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) pe-3 ps-10 text-sm text-(--color-light-text-primary) outline-none transition-colors placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
            />
          </div>
        </section>

        {isLoading ? (
          <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-(--color-light-card-border) bg-light-app-tertiary px-6 py-14 text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
            <Loader2 className="size-5 animate-spin" strokeWidth={1.8} />
            {t("publicProjects.loading")}
          </div>
        ) : isError ? (
          <div className="mt-8 rounded-2xl border border-dashed border-(--color-light-card-border) bg-light-app-tertiary px-6 py-14 text-center dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="font-semibold text-primary dark:text-dark-primary">
              {t("publicProjects.error")}
            </p>
          </div>
        ) : filtered.length ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {filtered.map((project) => {
              const abstract = projectAbstract(project, t("publicProjects.noDescription"));
              const writers = writerNames(project);
              const supervisor = supervisorName(project);
              return (
                <article
                  key={project?.id ?? projectTitle(project)}
                  className="group overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm transition-all hover:-translate-y-0.5 hover:border-(--color-light-input-border-focus) hover:shadow-lg dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:hover:border-(--color-dark-input-border-focus)"
                >
                  <div className="border-b border-light-divider bg-light-app-tertiary p-5 dark:border-dark-divider dark:bg-dark-app-tertiary">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="inline-flex items-center gap-1.5 rounded-full border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted">
                          <FolderKanban className="size-3.5" strokeWidth={1.8} />
                          {project?.group?.name || t("publicProjects.groupFallback")}
                        </p>
                        <h2
                          className="mt-3 line-clamp-2 text-xl font-bold leading-snug text-primary dark:text-dark-primary"
                          dir={textDirection(projectTitle(project))}
                        >
                          {projectTitle(project)}
                        </h2>
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted dark:text-dark-muted">
                          <span className="font-semibold text-secondary dark:text-dark-secondary">
                            Writers:
                          </span>{" "}
                          {writers}
                          <span className="mx-2 text-light-divider dark:text-dark-divider">
                            /
                          </span>
                          <span className="font-semibold text-secondary dark:text-dark-secondary">
                            Supervisor:
                          </span>{" "}
                          {supervisor}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {project?.status || t("publicProjects.statusFallback")}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p
                      className="line-clamp-4 text-sm leading-7 text-secondary dark:text-dark-secondary"
                      dir={textDirection(abstract)}
                    >
                      {abstract}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-light-divider pt-4 dark:border-dark-divider">
                      <Link
                        to={`/projects/${encodeURIComponent(project?.id)}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-chart-blue-primary) hover:underline dark:text-(--color-chart-blue-secondary)"
                      >
                        Read abstract
                        <ExternalLink className="size-4" strokeWidth={1.8} />
                      </Link>
                      <a
                        href={finalProjectDownloadUrl(project)}
                        download={project?.finalFileName || undefined}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-(--color-light-input-border) px-3 text-xs font-semibold text-primary transition-colors hover:bg-light-app-tertiary dark:border-dark-input-border dark:text-dark-primary dark:hover:bg-dark-app-tertiary"
                      >
                        <Download className="size-3.5" strokeWidth={1.8} />
                        Download
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-(--color-light-card-border) bg-light-app-tertiary px-6 py-14 text-center dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="font-semibold text-primary dark:text-dark-primary">
              {t("publicProjects.emptyTitle")}
            </p>
            <p className="mt-2 text-sm text-secondary dark:text-dark-secondary">
              {t("publicProjects.emptyDescription")}
            </p>
          </div>
        )}
      </div>
    </BlogShell>
  );
}
