import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  FolderGit2,
  GitBranch,
  Network,
  UserRound,
} from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import FacultyFormSectionCard from "../../components/admin/FacultyFormSectionCard";
import Button from "../../components/Button";
import Field from "../../components/Field";
import IC from "../../components/IC";
import Icon from "../../components/Icon";
import SearchableSelect from "../../components/SearchableSelect";
import { useAuth } from "../../context/AuthContext";
import { resolveShellBasePath } from "../../lib/roles";
import {
  useCreateFacultyProject,
  useFacultyGroups,
  useFacultyProject,
  useRepositorySearch,
  useTeacherSearch,
  useTeachersPage,
  useUpdateFacultyProject,
} from "../../services/useApi";

const MotionDiv = motion.div;

const stepMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function displayName(person, fallback = "-") {
  if (!person) return fallback;
  if (typeof person === "string") return person || fallback;
  const full = [person.firstName, person.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    full ||
    person.displayName ||
    person.userName ||
    person.username ||
    (person.id != null ? String(person.id) : fallback)
  );
}

function normalizeGroupOptions(data) {
  const list = Array.isArray(data) ? data : [];
  return list
    .map((item) => {
      const id = item?.id ?? item?.groupId ?? item?.uuid ?? "";
      const label = item?.name ?? item?.title ?? (id ? String(id) : "");
      if (!id || !label) return null;
      return {
        value: String(id),
        label: String(label),
      };
    })
    .filter(Boolean);
}

function normalizeTeacherOptions(page) {
  const list = Array.isArray(page?.content) ? page.content : [];
  return list
    .map((item) => {
      const id = item?.id ?? item?.teacherId ?? "";
      if (!id) return null;
      return {
        value: String(id),
        label: displayName(item, String(id)),
        description: item?.department ?? item?.educationRank ?? undefined,
      };
    })
    .filter(Boolean);
}

function teacherToOption(teacher) {
  if (!teacher) return null;
  const id = teacher?.id ?? teacher?.teacherId ?? "";
  if (!id) return null;
  return {
    value: String(id),
    label: displayName(teacher, String(id)),
    description: teacher?.department ?? teacher?.educationRank ?? undefined,
  };
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
      row?.ownerUsername?.user_name ??
      row?.ownerUsername?.username ??
      row?.owner?.user_name ??
      row?.owner?.username ??
      row?.owner ??
      "",
  ).trim();
  const name = row?.repositoryName ?? row?.name ?? "";
  const repoName = String(name ?? "").trim();
  const label =
    owner && repoName
      ? `${owner}/${repoName}`
      : repoName || owner || (id ? String(id) : "");
  // IMPORTANT: keep `value` as repository id for backend.
  const value = id ? String(id) : `${owner}/${repoName}`.trim();
  if (!value || !label) return null;
  return {
    value,
    label: String(label),
    description:
      typeof row?.description === "string" ? row.description : undefined,
  };
}

function repositorySelectedFallbackOption(
  project,
  formRepoId,
  repoOptions = [],
) {
  const v = String(formRepoId ?? "").trim();
  if (!v) return null;
  const selectedFromOptions = (
    Array.isArray(repoOptions) ? repoOptions : []
  ).find((option) => option?.value === v);
  if (selectedFromOptions) return selectedFromOptions;

  const nested = project?.repository ?? project?.projectRepository;
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
  if (
    project?.projectRepository != null &&
    typeof project.projectRepository !== "object" &&
    String(project.projectRepository) === v
  ) {
    return { value: v, label: v };
  }
  return { value: v, label: v };
}

function initialsFromLabel(label) {
  return String(label ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PersonTile({ title, subtitle, badge }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-(--color-light-card-border) bg-bg-shell px-3 py-3 dark:border-(--color-dark-card-border) dark:bg-dark-shell">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--color-light-card-border) bg-light-app-tertiary text-xs font-semibold text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary">
        {initialsFromLabel(title) || "--"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
          {title}
        </p>
        <p className="truncate text-xs text-muted dark:text-dark-muted">
          {subtitle}
        </p>
      </div>
      {badge ? (
        <span className="shrink-0 rounded-full border border-(--color-light-card-border) px-2 py-0.5 text-[10px] font-semibold text-secondary dark:border-(--color-dark-card-border) dark:text-dark-secondary">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export default function ProjectRegistrationPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  const shellBase = resolveShellBasePath(location.pathname, user?.role);
  const isTeacherShell = shellBase === "/teacher";
  const signedInTeacherId =
    user?.id != null && String(user.id).trim() !== ""
      ? String(user.id).trim()
      : "";
  const projectsPath = `${shellBase}/projects`;
  const [step, setStep] = useState(1);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [debouncedTeacherSearchTerm, setDebouncedTeacherSearchTerm] =
    useState("");
  const [repoSearchTerm, setRepoSearchTerm] = useState("");
  const [debouncedRepoSearchTerm, setDebouncedRepoSearchTerm] = useState("");

  const { data: project, isLoading: projectLoading } = useFacultyProject(id, {
    enabled: isEdit,
    notifyOnError: true,
  });
  const { data: groups = [], isLoading: groupsLoading } = useFacultyGroups(
    {},
    { notifyOnError: false },
  );
  const { data: teacherPage, isLoading: teachersLoading } = useTeachersPage(
    { page: 0, pageSize: 200, notifyOnError: false },
    { staleTime: 60_000 },
  );
  const { data: searchedTeachers = [], isFetching: isSearchingTeachers } =
    useTeacherSearch(debouncedTeacherSearchTerm, {
      enabled: debouncedTeacherSearchTerm.length > 0,
      staleTime: 30_000,
      notifyOnError: false,
    });
  const { data: repoHits = [], isFetching: repoSearchBusy } =
    useRepositorySearch(debouncedRepoSearchTerm, { notifyOnError: false });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedTeacherSearchTerm(teacherSearchTerm.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [teacherSearchTerm]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedRepoSearchTerm(repoSearchTerm.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [repoSearchTerm]);

  const groupOptions = useMemo(() => normalizeGroupOptions(groups), [groups]);
  const teacherOptions = useMemo(
    () => normalizeTeacherOptions(teacherPage),
    [teacherPage],
  );
  const searchedTeacherOptions = useMemo(
    () => searchedTeachers.map(teacherToOption).filter(Boolean),
    [searchedTeachers],
  );

  const steps = useMemo(
    () => [
      {
        id: 1,
        titleKey: "adminProjects.form.project.steps.basics",
        icon: FolderGit2,
        fields: ["projectName"],
      },
      {
        id: 2,
        titleKey: "adminProjects.form.project.steps.repository",
        icon: GitBranch,
        fields: [],
      },
      {
        id: 3,
        titleKey: "adminProjects.form.project.steps.assignment",
        icon: Network,
        fields: ["group", "teacher"],
      },
      {
        id: 4,
        titleKey: "adminProjects.form.project.steps.review",
        icon: CheckCircle2,
        fields: [],
      },
    ],
    [],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      projectName: "",
      group: "",
      teacher: "",
      projectRepository: "",
    },
  });

  useEffect(() => {
    if (!project || !isEdit) return;
    const repoId =
      project?.repository?.id ??
      project?.repositoryId ??
      project?.projectRepository ??
      "";
    reset({
      projectName: project?.projectName ?? "",
      group: String(project?.group?.id ?? project?.group ?? ""),
      teacher: String(project?.teacher?.id ?? project?.teacher ?? ""),
      projectRepository: repoId != null ? String(repoId) : "",
    });
  }, [isEdit, project, reset]);

  useEffect(() => {
    if (!isTeacherShell || isEdit || !signedInTeacherId) return;
    setValue("teacher", signedInTeacherId, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [isEdit, isTeacherShell, setValue, signedInTeacherId]);

  const createProject = useCreateFacultyProject({
    toastSuccess: "adminProjects.form.project.toast.createSuccess",
    toastError: "apiErrors.failed_to_create_faculty_project",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty-projects"] });
      navigate(projectsPath);
    },
  });

  const updateProject = useUpdateFacultyProject({
    toastSuccess: "adminProjects.form.project.toast.updateSuccess",
    toastError: "apiErrors.failed_to_update_faculty_project",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty-projects"] });
      await queryClient.invalidateQueries({
        queryKey: ["faculty-projects", "detail", id],
      });
      navigate(projectsPath);
    },
  });

  const values = useWatch({ control });
  const selectedGroup = groupOptions.find(
    (item) => item.value === values.group,
  );
  const teacherId = String(values?.teacher ?? "").trim();
  const selectedTeacherRecord = !teacherId
    ? null
    : ((Array.isArray(teacherPage?.content)
        ? teacherPage.content.find(
            (teacher) =>
              String(teacher?.id ?? teacher?.teacherId ?? "") === teacherId,
          )
        : null) ??
      searchedTeachers.find(
        (teacher) =>
          String(teacher?.id ?? teacher?.teacherId ?? "") === teacherId,
      ) ??
      (project?.teacher &&
      String(project.teacher?.id ?? project.teacher ?? "") === teacherId
        ? project.teacher
        : null) ??
      null);
  const currentUserTeacherOption = useMemo(() => {
    if (!signedInTeacherId) return null;
    return {
      value: signedInTeacherId,
      label:
        user?.fullName ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
        user?.username ||
        user?.email ||
        signedInTeacherId,
      description: user?.email || undefined,
    };
  }, [signedInTeacherId, user]);

  const teacherSelectOptions = useMemo(() => {
    const baseOptions =
      debouncedTeacherSearchTerm.length > 0
        ? searchedTeacherOptions
        : teacherOptions;
    const selectedOption = teacherToOption(selectedTeacherRecord);
    return mergeOptions(
      isTeacherShell && currentUserTeacherOption
        ? [currentUserTeacherOption]
        : [],
      selectedOption ? [selectedOption] : [],
      baseOptions,
    );
  }, [
    currentUserTeacherOption,
    debouncedTeacherSearchTerm,
    isTeacherShell,
    searchedTeacherOptions,
    selectedTeacherRecord,
    teacherOptions,
  ]);
  const selectedTeacher = teacherSelectOptions.find(
    (item) => item.value === values.teacher,
  );

  const repoSearchOptions = useMemo(
    () => repoHits.map(repositoryRowToOption).filter(Boolean),
    [repoHits],
  );
  const selectedRepoFallback = repositorySelectedFallbackOption(
    project,
    values?.projectRepository,
    repoSearchOptions,
  );
  const repoSelectOptions = useMemo(
    () =>
      mergeOptions(
        selectedRepoFallback ? [selectedRepoFallback] : [],
        repoSearchOptions,
      ),
    [selectedRepoFallback, repoSearchOptions],
  );
  const repositorySummaryLabel =
    repoSelectOptions.find((o) => o.value === values?.projectRepository)
      ?.label ||
    (values?.projectRepository?.trim() ? values.projectRepository.trim() : "");
  const progressPct = Math.round((step / steps.length) * 100);
  const motionEase = [0.22, 1, 0.36, 1];

  const onSubmit = (formValues) => {
    const payload = {
      projectName: formValues.projectName.trim(),
      group: formValues.group,
      teacher: formValues.teacher,
    };
    const repoTrim = formValues.projectRepository?.trim();
    if (repoTrim) payload.projectRepository = repoTrim;

    if (isEdit) {
      updateProject.mutate({ id, ...payload });
      return;
    }
    createProject.mutate(payload);
  };

  const goNext = async () => {
    const current = steps.find((item) => item.id === step);
    if (!current) return;
    const ok = await trigger(current.fields);
    if (ok) {
      setStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const goPrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const completedStepSnippet = (stepId) => {
    switch (stepId) {
      case 1:
        return values?.projectName?.trim() || "—";
      case 2:
        return repositorySummaryLabel || "—";
      case 3:
        return (
          [selectedGroup?.label, selectedTeacher?.label]
            .filter(Boolean)
            .join(" · ") || "—"
        );
      default:
        return "";
    }
  };

  const stepTitleKey = steps.find((s) => s.id === step)?.titleKey;

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <MotionDiv
            key="p-step-1"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FacultyFormSectionCard
              icon={FolderGit2}
              tint="indigo"
              title={t("adminProjects.form.project.sectionTitle")}
              subtitle={t("adminProjects.form.project.section.basicsSub")}
            >
              <Field
                label={`${t("adminProjects.form.project.fields.projectName")} *`}
                placeholder={t(
                  "adminProjects.form.project.placeholders.projectName",
                )}
                register={register("projectName", {
                  required: t(
                    "adminProjects.form.project.validation.projectName",
                  ),
                })}
                error={errors.projectName?.message}
              />
            </FacultyFormSectionCard>
          </MotionDiv>
        );
      case 2:
        return (
          <MotionDiv
            key="p-step-2"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FacultyFormSectionCard
              icon={GitBranch}
              tint="sky"
              title={t("adminProjects.form.project.fields.projectRepository")}
              subtitle={t("adminProjects.form.project.section.repoSub")}
            >
              <Controller
                name="projectRepository"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold text-(--color-light-text-secondary) dark:text-dark-secondary">
                      {t("adminProjects.form.project.fields.projectRepository")}
                      <span className="ms-1 font-normal text-muted dark:text-dark-muted">
                        (
                        {t(
                          "adminProjects.form.project.repositoryOptionalBadge",
                        )}
                        )
                      </span>
                    </p>
                    <SearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      options={repoSelectOptions}
                      placeholder={t(
                        "adminProjects.form.project.placeholders.repository",
                      )}
                      searchPlaceholder={t(
                        "adminProjects.form.project.placeholders.repositorySearch",
                      )}
                      searchValue={repoSearchTerm}
                      onSearchChange={setRepoSearchTerm}
                      loading={repoSearchBusy}
                      clearable
                      clearSearchOnOpen={false}
                      showInlineSearchClear={false}
                      disabled={false}
                      className="min-h-8 bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)"
                    />
                    <p className="text-[11px] text-muted dark:text-dark-muted">
                      {t("adminProjects.form.project.repositorySearchHint")}
                    </p>
                  </div>
                )}
              />
            </FacultyFormSectionCard>
          </MotionDiv>
        );
      case 3:
        return (
          <MotionDiv
            key="p-step-3"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FacultyFormSectionCard
              icon={Network}
              tint="violet"
              title={t("adminProjects.form.project.steps.assignment")}
              subtitle={t("adminProjects.form.project.section.assignmentSub")}
            >
              <div className="rounded-xl border border-(--color-light-card-border) bg-bg-shell p-4 dark:border-(--color-dark-card-border) dark:bg-dark-shell">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-primary dark:text-dark-primary">
                      {t("adminProjects.form.project.fields.group")}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-muted dark:text-dark-muted">
                      {t("adminProjects.form.project.selector.groupHelp")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-(--color-light-card-border) px-2 py-0.5 text-[10px] font-semibold text-secondary dark:border-(--color-dark-card-border) dark:text-dark-secondary">
                    {selectedGroup
                      ? t("adminProjects.form.project.selector.connected")
                      : t("adminProjects.form.group.selector.required")}
                  </span>
                </div>
                <Controller
                  name="group"
                  control={control}
                  rules={{
                    required: t("adminProjects.form.project.validation.group"),
                  }}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2">
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={groupOptions}
                        placeholder={
                          groupsLoading
                            ? t(
                                "adminProjects.form.project.placeholders.loadingGroups",
                              )
                            : t("adminProjects.form.project.placeholders.group")
                        }
                        searchPlaceholder={t(
                          "adminProjects.form.project.placeholders.groupSearch",
                        )}
                        disabled={groupsLoading || groupOptions.length === 0}
                        className="min-h-8 bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)"
                      />
                      {selectedGroup ? (
                        <PersonTile
                          title={selectedGroup.label}
                          subtitle={t(
                            "adminProjects.form.project.selector.groupRow",
                          )}
                          badge={t("adminProjects.form.project.stats.group")}
                        />
                      ) : null}
                      {fieldState.error?.message ? (
                        <p className="text-[11px] text-error dark:text-red-400">
                          {fieldState.error.message}
                        </p>
                      ) : null}
                    </div>
                  )}
                />
              </div>

              <div className="rounded-xl border border-(--color-light-card-border) bg-bg-shell p-4 dark:border-(--color-dark-card-border) dark:bg-dark-shell">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-primary dark:text-dark-primary">
                      {t("adminProjects.form.project.fields.teacher")}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-muted dark:text-dark-muted">
                      {t("adminProjects.form.project.selector.teacherHelp")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-(--color-light-card-border) px-2 py-0.5 text-[10px] font-semibold text-secondary dark:border-(--color-dark-card-border) dark:text-dark-secondary">
                    {t("adminProjects.form.group.selector.required")}
                  </span>
                </div>
                <Controller
                  name="teacher"
                  control={control}
                  rules={{
                    required: t(
                      "adminProjects.form.project.validation.teacher",
                    ),
                  }}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2">
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={teacherSelectOptions}
                        placeholder={
                          teachersLoading
                            ? t(
                                "adminProjects.form.project.placeholders.loadingTeachers",
                              )
                            : t(
                                "adminProjects.form.project.placeholders.teacher",
                              )
                        }
                        searchPlaceholder={t(
                          "adminProjects.form.project.placeholders.teacherSearch",
                        )}
                        loading={isSearchingTeachers}
                        onSearchChange={setTeacherSearchTerm}
                        disabled={teachersLoading || isTeacherShell}
                        className="min-h-8 bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)"
                      />
                      {selectedTeacher ? (
                        <PersonTile
                          title={selectedTeacher.label}
                          subtitle={
                            selectedTeacher.description ||
                            t("adminProjects.form.project.selector.teacherRow")
                          }
                          badge={t(
                            "adminProjects.form.project.selector.ownerBadge",
                          )}
                        />
                      ) : null}
                      {fieldState.error?.message ? (
                        <p className="text-[11px] text-error dark:text-red-400">
                          {fieldState.error.message}
                        </p>
                      ) : null}
                    </div>
                  )}
                />
              </div>
            </FacultyFormSectionCard>
          </MotionDiv>
        );
      case 4:
        return (
          <MotionDiv
            key="p-step-4"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FacultyFormSectionCard
              icon={CheckCircle2}
              tint="emerald"
              title={t("adminProjects.form.project.steps.review")}
              subtitle={t("adminProjects.form.project.section.reviewSub")}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <ReviewRow
                  k={t("adminProjects.form.project.fields.projectName")}
                  v={values?.projectName}
                />
                <ReviewRow
                  k={t("adminProjects.form.project.fields.projectRepository")}
                  v={repositorySummaryLabel || "—"}
                />
                <ReviewRow
                  k={t("adminProjects.form.project.fields.group")}
                  v={selectedGroup?.label}
                />
                <ReviewRow
                  k={t("adminProjects.form.project.fields.teacher")}
                  v={selectedTeacher?.label}
                />
              </div>
            </FacultyFormSectionCard>
          </MotionDiv>
        );
      default:
        return null;
    }
  };

  if (isEdit && projectLoading) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-light-app-bg p-4 dark:bg-dark-card-bg">
        <p className="text-sm text-muted dark:text-dark-muted">
          {t("adminProjects.form.project.loading")}
        </p>
      </div>
    );
  }

  if (isEdit && !projectLoading && !project) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-start gap-4 bg-white p-4 dark:bg-dark-card-bg md:p-5">
        <Button
          variant="tertiary"
          onClick={() => navigate(projectsPath)}
        >
          {t("adminProjects.form.project.actions.back")}
        </Button>
        <div className="rounded-3xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-6 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <p className="text-sm text-secondary dark:text-dark-secondary">
            {t("adminProjects.form.project.notFound")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col gap-4 overflow-y-auto bg-whitep-4 dark:bg-dark-card-bg md:p-5">
      <button
        type="button"
        onClick={() => navigate(projectsPath)}
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-default bg-bg-shell px-3 py-2 text-xs font-semibold text-secondary transition-colors hover:bg-hover dark:border-dark-default dark:bg-dark-shell dark:text-dark-secondary dark:hover:bg-dark-hover"
      >
        <Icon d={IC.chevLeft} className="size-3.5 stroke-2" />
        {t("adminProjects.form.project.actions.back")}
      </button>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="mx-auto w-full max-w-[min(100%,92rem)] pb-20"
      >
        <div className="card rounded-xl px-5 py-8 shadow-sm md:px-8 md:py-10">
          <header className="mb-8 flex flex-col gap-4 border-b border-default pb-6 dark:border-dark-default sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-(--color-light-nav-text-active) dark:text-(--color-dark-nav-text-active)">
                {t("adminProjects.registry.title")}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-[1.65rem] dark:text-dark-primary">
                {isEdit
                  ? t("adminProjects.form.project.editTitle")
                  : t("adminProjects.form.project.createTitle")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary dark:text-dark-secondary">
                {t("adminProjects.form.project.subtitle")}
              </p>
            </div>
          </header>

          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-x-10 2xl:gap-x-14">
            <nav
              aria-label="Project registration steps"
              className="shrink-0 xl:sticky xl:top-6 xl:w-46 xl:max-w-46 2xl:w-52"
            >
              <ol className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] xl:hidden [&::-webkit-scrollbar]:hidden">
                {steps.map((s) => {
                  const active = s.id === step;
                  const done = s.id < step;
                  const IconStep = s.icon;
                  return (
                    <li
                      key={s.id}
                      className={[
                        "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-semibold",
                        done
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : active
                            ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200"
                            : "border-(--color-light-card-border) bg-(--color-light-card-bg) text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted",
                      ].join(" ")}
                    >
                      <IconStep className="size-3.5 shrink-0" strokeWidth={2} />
                      <span className="max-w-32 truncate">{t(s.titleKey)}</span>
                    </li>
                  );
                })}
              </ol>
              <ol className="relative hidden space-y-0 xl:block">
                {steps.map((s, i) => {
                  const active = s.id === step;
                  const done = s.id < step;
                  const IconStep = s.icon;
                  return (
                    <li
                      key={s.id}
                      className="relative flex gap-3 pb-8 last:pb-0"
                    >
                      {i < steps.length - 1 ? (
                        <span
                          className={[
                            "absolute left-[17px] top-9 z-0 w-0.5 rounded-full",
                            done
                              ? "bg-chart-success/50 dark:bg-chart-success/35"
                              : "bg-light-border-subtle dark:bg-(--color-dark-border-subtle)",
                          ].join(" ")}
                          style={{ height: "calc(100% - 0.125rem)" }}
                          aria-hidden
                        />
                      ) : null}
                      <span
                        className={[
                          "relative z-1 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                          done
                            ? "border-chart-success bg-chart-success text-white shadow-[0_0_0_4px_rgba(16,185,129,0.2)]"
                            : active
                              ? "border-(--color-light-timeline-accent) bg-(--color-light-timeline-accent) text-white shadow-[0_0_0_4px_rgba(0,102,255,0.22)] dark:border-(--color-dark-timeline-accent) dark:bg-(--color-dark-timeline-accent)"
                              : "border-(--color-light-card-border) bg-(--color-light-card-bg) text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted",
                        ].join(" ")}
                      >
                        <IconStep className="size-4 shrink-0" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <span
                          className={[
                            "block text-[11px] font-semibold leading-snug wrap-break-word",
                            !active && !done
                              ? "text-secondary dark:text-dark-secondary"
                              : "",
                            active
                              ? "text-light-timeline-text dark:text-(--color-dark-timeline-text)"
                              : "",
                            done
                              ? "text-chart-success dark:text-chart-success"
                              : "",
                          ].join(" ")}
                        >
                          {t(s.titleKey)}
                        </span>
                        <span className="mt-0.5 block text-[9px] text-muted opacity-90 dark:text-dark-muted">
                          {i + 1}/{steps.length}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <div className="min-w-0 flex-1 xl:flex xl:justify-center xl:px-2">
              <div className="w-full space-y-6 xl:max-w-3xl 2xl:max-w-208">
                <div className="overflow-hidden rounded-2xl border border-(--color-light-success-border) bg-light-success-bg p-4 sm:p-5 dark:border-dark-success-border dark:bg-dark-success-bg">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-light-success-text dark:text-(--color-dark-success-text)">
                      {t("adminProjects.form.project.progress.label", {
                        pct: progressPct,
                      })}
                    </p>
                    <p className="mt-1 text-[11px] text-light-success-text opacity-90 dark:text-(--color-dark-success-text)">
                      {t("adminProjects.form.project.progress.hint")}
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, var(--color-chart-success), var(--color-light-timeline-accent))`,
                      }}
                      initial={false}
                      animate={{ width: `${progressPct}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 22,
                        mass: 0.85,
                      }}
                    />
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-primary dark:text-dark-primary">
                  {stepTitleKey ? t(stepTitleKey) : ""}
                </h2>

                <LayoutGroup id="project-reg-flow">
                  <div className="min-h-[200px] space-y-5">
                    <div className="space-y-3">
                      <AnimatePresence initial={false} mode="popLayout">
                        {steps
                          .filter((s) => s.id < step && s.id < 4)
                          .map((s) => {
                            const DoneIcon = s.icon;
                            return (
                              <motion.div
                                key={`p-stack-${s.id}`}
                                layout="position"
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{
                                  duration: 0.36,
                                  ease: motionEase,
                                }}
                                className="flex items-start gap-3 rounded-xl border border-(--color-light-border-default) bg-light-app-secondary px-4 py-3 dark:border-(--color-dark-border-default) dark:bg-(--color-dark-app-secondary)"
                              >
                                <span
                                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)"
                                  style={{
                                    borderColor: "var(--color-chart-success)",
                                    color: "var(--color-chart-success)",
                                  }}
                                >
                                  <DoneIcon
                                    className="size-4"
                                    strokeWidth={2}
                                  />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold text-primary dark:text-dark-primary">
                                    {t(s.titleKey)}
                                  </p>
                                  <p className="mt-0.5 truncate text-[11px] text-secondary dark:text-dark-secondary">
                                    {completedStepSnippet(s.id)}
                                  </p>
                                </div>
                                <CheckCircle2
                                  className="mt-1 size-4 shrink-0 text-chart-success"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                              </motion.div>
                            );
                          })}
                      </AnimatePresence>
                    </div>
                    <AnimatePresence mode="wait">
                      {stepContent()}
                    </AnimatePresence>
                  </div>
                </LayoutGroup>

                <footer className="mt-10 space-y-4 border-t border-default pt-6 dark:border-dark-border-default">
                  <div className="flex items-center gap-2 text-[11px] text-muted dark:text-dark-muted">
                    <Clock3 className="size-3.5 shrink-0 opacity-70" />
                    <span>
                      {t("adminProjects.form.project.progress.footerHint")}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-h-9 min-w-[6.5rem] items-center gap-2">
                      {step > 1 ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={goPrev}
                        >
                          {t("adminProjects.form.group.actions.previous")}
                        </Button>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="tertiary"
                        onClick={() => navigate(projectsPath)}
                      >
                        {t("adminProjects.form.project.actions.cancel")}
                      </Button>
                      {step < steps.length ? (
                        <Button type="button" onClick={() => void goNext()}>
                          {t("adminProjects.form.group.actions.continue")}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={
                            createProject.isPending || updateProject.isPending
                          }
                          onClick={() => void handleSubmit(onSubmit)()}
                        >
                          {createProject.isPending || updateProject.isPending
                            ? t("adminProjects.form.project.actions.submitting")
                            : isEdit
                              ? t("adminProjects.form.project.actions.update")
                              : t("adminProjects.form.project.actions.create")}
                        </Button>
                      )}
                    </div>
                  </div>
                </footer>
              </div>
            </div>

            <aside className="shrink-0 xl:sticky xl:top-6 xl:h-fit xl:w-70 xl:max-w-[280px]">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-primary dark:text-dark-primary">
                  {t("adminProjects.form.project.overviewTitle")}
                </h3>
                <p className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                  {t("adminProjects.form.project.overviewDescription")}
                </p>
                <ul className="mt-5 space-y-3 border-t border-default pt-5 text-[11px] dark:border-dark-default">
                  <SummaryLine
                    label={t("adminProjects.form.project.fields.projectName")}
                    value={values?.projectName?.trim() || "—"}
                  />
                  <SummaryLine
                    label={t(
                      "adminProjects.form.project.fields.projectRepository",
                    )}
                    value={repositorySummaryLabel || "—"}
                  />
                  <SummaryLine
                    label={t("adminProjects.form.project.stats.group")}
                    value={selectedGroup?.label || "—"}
                  />
                  <SummaryLine
                    label={t("adminProjects.form.project.stats.teacher")}
                    value={selectedTeacher?.label || "—"}
                  />
                </ul>
                <div className="mt-6 flex items-center gap-2 rounded-xl bg-(--color-light-nav-hover-bg) px-3 py-2 dark:bg-(--color-dark-card-hover)">
                  <UserRound className="size-3.5 shrink-0 text-(--color-light-timeline-accent) dark:text-(--color-dark-timeline-accent)" />
                  <span className="text-[10px] font-medium text-secondary dark:text-dark-secondary">
                    {t("adminProjects.form.group.stepLabel", { step })} /{" "}
                    {steps.length}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </form>
    </div>
  );
}

function SummaryLine({ label, value }) {
  return (
    <li className="flex justify-between gap-3 border-b border-default pb-2 last:border-0 last:pb-0 dark:border-dark-default">
      <span className="shrink-0 text-muted dark:text-dark-muted">{label}</span>
      <span className="min-w-0 text-right font-medium text-primary dark:text-dark-primary">
        {value}
      </span>
    </li>
  );
}

function ReviewRow({ k, v }) {
  const display = v != null && `${v}`.trim() !== "" ? `${v}` : "—";
  return (
    <div className="rounded-lg bg-bg-shell px-3 py-2 dark:bg-dark-shell">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted dark:text-dark-muted">
        {k}
      </div>
      <div className="mt-1 text-xs font-semibold text-primary dark:text-dark-primary">
        {display}
      </div>
    </div>
  );
}
