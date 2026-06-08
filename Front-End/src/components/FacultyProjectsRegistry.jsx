import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FolderGit2, Plus, UsersRound } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import Field from "./Field";
import GlobalModal from "./GlobalModal";
import Select from "./Select";
import {
  facultyGroupFormSchema,
  facultyProjectFormSchema,
  parseStudentIds,
} from "../lib/schemas/facultyRegistry";
import {
  useCreateFacultyGroup,
  useCreateFacultyProject,
  useFacultyGroups,
  useFacultyProjects,
  useTeachersPage,
} from "../services/useApi";

function displayName(p) {
  if (!p) return "";
  return (
    [p.firstName, p.lastName].filter(Boolean).join(" ") ||
    p.displayName ||
    p.userName ||
    String(p.id ?? "")
  );
}

export default function FacultyProjectsRegistry() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: projects = [], isLoading: pl } = useFacultyProjects({});
  const { data: groups = [], isLoading: gl } = useFacultyGroups({});
  const { data: teacherPage } = useTeachersPage({
    page: 0,
    pageSize: 200,
    notifyOnError: false,
  });

  const teachers = teacherPage?.content ?? [];
  const teacherOptions = useMemo(
    () =>
      teachers.map((x) => ({
        value: String(x.id ?? ""),
        label: `${displayName(x)} (${String(x.id ?? "")})`,
      })),
    [teachers],
  );

  const [groupOpen, setGroupOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [groupDraft, setGroupDraft] = useState({
    name: "",
    groupMembersCsv: "",
    groupLeader: "",
  });
  const [projectDraft, setProjectDraft] = useState({
    projectName: "",
    group: "",
    teacher: "",
    projectRepository: "",
  });

  const groupOptions = useMemo(
    () =>
      (Array.isArray(groups) ? groups : []).map((g) => ({
        value: String(g.id ?? ""),
        label: g.name ?? String(g.id ?? ""),
      })),
    [groups],
  );

  const createGroup = useCreateFacultyGroup({
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty-groups"] });
      setGroupOpen(false);
      setGroupDraft({ name: "", groupMembersCsv: "", groupLeader: "" });
    },
  });

  const createProject = useCreateFacultyProject({
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faculty-projects"] });
      setProjectOpen(false);
      setProjectDraft({
        projectName: "",
        group: "",
        teacher: "",
        projectRepository: "",
      });
    },
  });

  const submitGroup = () => {
    const members = parseStudentIds(groupDraft.groupMembersCsv);
    const parsed = facultyGroupFormSchema.safeParse({
      name: groupDraft.name,
      groupMembersCsv: groupDraft.groupMembersCsv,
      groupLeader: groupDraft.groupLeader,
    });
    if (!parsed.success) {
      gooeyToast.error(t("adminProjects.faculty.validation"));
      return;
    }
    createGroup.mutate({
      name: parsed.data.name,
      groupMembers: members,
      groupLeader: parsed.data.groupLeader,
    });
  };

  const submitProject = () => {
    const parsed = facultyProjectFormSchema.safeParse(projectDraft);
    if (!parsed.success) {
      gooeyToast.error(t("adminProjects.faculty.validation"));
      return;
    }
    createProject.mutate(parsed.data);
  };

  return (
    <section className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) md:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary dark:text-dark-primary">
            {t("adminProjects.faculty.title")}
          </h2>
          <p className="text-sm text-secondary dark:text-dark-secondary">
            {t("adminProjects.faculty.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={() => setGroupOpen(true)}
          >
            <UsersRound className="size-4" aria-hidden />
            {t("adminProjects.faculty.addGroup")}
          </Button>
          <Button
            type="button"
            variant="primary"
            className="gap-2"
            onClick={() => setProjectOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            {t("adminProjects.faculty.addProject")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary dark:text-dark-primary">
            <UsersRound className="size-4 text-muted dark:text-dark-muted" />
            {t("adminProjects.faculty.groups")}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-(--color-light-card-border) dark:border-(--color-dark-card-border)">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="border-b border-light-divider bg-light-app-tertiary text-[11px] font-semibold uppercase text-muted dark:border-dark-divider dark:bg-dark-app-tertiary dark:text-dark-muted">
                <tr>
                  <th className="px-3 py-2">{t("adminProjects.faculty.col.name")}</th>
                  <th className="px-3 py-2">{t("adminProjects.faculty.col.leader")}</th>
                  <th className="px-3 py-2">{t("adminProjects.faculty.col.members")}</th>
                </tr>
              </thead>
              <tbody>
                {gl ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-muted dark:text-dark-muted">
                      {t("adminProjects.faculty.loading")}
                    </td>
                  </tr>
                ) : !(Array.isArray(groups) ? groups : []).length ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-muted dark:text-dark-muted">
                      {t("adminProjects.faculty.emptyGroups")}
                    </td>
                  </tr>
                ) : (
                  (Array.isArray(groups) ? groups : []).map((g) => (
                    <tr
                      key={g.id ?? g.name}
                      className="border-b border-light-divider last:border-0 dark:border-dark-divider"
                    >
                      <td className="px-3 py-2 font-medium text-primary dark:text-dark-primary">
                        {g.name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-secondary dark:text-dark-secondary">
                        {displayName(g.groupLeader) || g.groupLeader?.id || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted dark:text-dark-muted">
                        {Array.isArray(g.groupMembers) ? g.groupMembers.length : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary dark:text-dark-primary">
            <FolderGit2 className="size-4 text-muted dark:text-dark-muted" />
            {t("adminProjects.faculty.projects")}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-(--color-light-card-border) dark:border-(--color-dark-card-border)">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="border-b border-light-divider bg-light-app-tertiary text-[11px] font-semibold uppercase text-muted dark:border-dark-divider dark:bg-dark-app-tertiary dark:text-dark-muted">
                <tr>
                  <th className="px-3 py-2">{t("adminProjects.faculty.col.project")}</th>
                  <th className="px-3 py-2">{t("adminProjects.faculty.col.teacher")}</th>
                  <th className="px-3 py-2">{t("adminProjects.faculty.col.group")}</th>
                </tr>
              </thead>
              <tbody>
                {pl ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-muted dark:text-dark-muted">
                      {t("adminProjects.faculty.loading")}
                    </td>
                  </tr>
                ) : !(Array.isArray(projects) ? projects : []).length ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-muted dark:text-dark-muted">
                      {t("adminProjects.faculty.emptyProjects")}
                    </td>
                  </tr>
                ) : (
                  (Array.isArray(projects) ? projects : []).map((p) => (
                    <tr
                      key={p.id ?? p.projectName}
                      className="border-b border-light-divider last:border-0 dark:border-dark-divider"
                    >
                      <td className="px-3 py-2 font-medium text-primary dark:text-dark-primary">
                        {p.projectName ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-secondary dark:text-dark-secondary">
                        {displayName(p.teacher) || p.teacher?.id || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted dark:text-dark-muted">
                        {p.group?.name ?? p.group?.id ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <GlobalModal
        variant="sheet"
        open={groupOpen}
        setOpen={(o) => {
          if (!o) setGroupOpen(false);
        }}
        title={t("adminProjects.faculty.group.sheetTitle")}
        isClose
        footer={
          <>
            <Button type="button" variant="tertiary" onClick={() => setGroupOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={createGroup.isPending}
              onClick={submitGroup}
            >
              {t("common.save")}
            </Button>
          </>
        }
        sheetClassName="sm:max-w-[min(28rem,92vw)]"
      >
        <div className="grid gap-4">
          <Field
            register={{}}
            label={t("adminProjects.faculty.col.name")}
            value={groupDraft.name}
            onChange={(e) =>
              setGroupDraft((c) => ({ ...c, name: e.target.value }))
            }
          />
          <Field
            register={{}}
            label={t("adminProjects.faculty.group.membersHint")}
            value={groupDraft.groupMembersCsv}
            onChange={(e) =>
              setGroupDraft((c) => ({
                ...c,
                groupMembersCsv: e.target.value,
              }))
            }
          />
          <Field
            register={{}}
            label={t("adminProjects.faculty.group.leader")}
            value={groupDraft.groupLeader}
            onChange={(e) =>
              setGroupDraft((c) => ({ ...c, groupLeader: e.target.value }))
            }
          />
        </div>
      </GlobalModal>

      <GlobalModal
        variant="sheet"
        open={projectOpen}
        setOpen={(o) => {
          if (!o) setProjectOpen(false);
        }}
        title={t("adminProjects.faculty.project.sheetTitle")}
        isClose
        footer={
          <>
            <Button type="button" variant="tertiary" onClick={() => setProjectOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={createProject.isPending}
              onClick={submitProject}
            >
              {t("common.save")}
            </Button>
          </>
        }
        sheetClassName="sm:max-w-[min(30rem,92vw)]"
      >
        <div className="grid gap-4">
          <Field
            register={{}}
            label={t("adminProjects.faculty.project.name")}
            value={projectDraft.projectName}
            onChange={(e) =>
              setProjectDraft((c) => ({
                ...c,
                projectName: e.target.value,
              }))
            }
          />
          {groupOptions.length > 0 ? (
            <div>
              <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
                {t("adminProjects.faculty.project.groupId")}
              </span>
              <Select
                value={projectDraft.group}
                onChange={(v) =>
                  setProjectDraft((c) => ({ ...c, group: v }))
                }
                options={groupOptions}
                placeholder={t("adminProjects.faculty.project.groupId")}
              />
            </div>
          ) : (
            <Field
              register={{}}
              label={t("adminProjects.faculty.project.groupId")}
              value={projectDraft.group}
              onChange={(e) =>
                setProjectDraft((c) => ({
                  ...c,
                  group: e.target.value,
                }))
              }
            />
          )}
          {teacherOptions.length > 0 ? (
            <div>
              <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
                {t("adminProjects.faculty.project.teacherId")}
              </span>
              <Select
                value={projectDraft.teacher}
                onChange={(v) =>
                  setProjectDraft((c) => ({ ...c, teacher: v }))
                }
                options={teacherOptions}
                placeholder={t("adminProjects.faculty.project.teacherId")}
              />
            </div>
          ) : (
            <Field
              register={{}}
              label={t("adminProjects.faculty.project.teacherId")}
              value={projectDraft.teacher}
              onChange={(e) =>
                setProjectDraft((c) => ({
                  ...c,
                  teacher: e.target.value,
                }))
              }
            />
          )}
          <Field
            register={{}}
            label={t("adminProjects.faculty.project.repoId")}
            value={projectDraft.projectRepository}
            onChange={(e) =>
              setProjectDraft((c) => ({
                ...c,
                projectRepository: e.target.value,
              }))
            }
          />
        </div>
      </GlobalModal>
    </section>
  );
}
