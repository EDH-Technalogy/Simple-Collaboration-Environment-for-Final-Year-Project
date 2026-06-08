import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  CalendarRange,
  CheckCircle2,
  Clock3,
  Crown,
  Sparkles,
  UserPlus,
  UsersRound,
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
import Select from "../../components/Select";
import {
  useAcademicYears,
  useCreateFacultyGroup,
  useFacultyGroup,
  useFacultyGroups,
  useStudentSearch,
  useStudentsPage,
  useUpdateFacultyGroup,
} from "../../services/useApi";

const MotionDiv = motion.div;

const ACADEMIC_NONE = "__none__";

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

function studentIdValue(student) {
  const value =
    student?.id ??
    student?.studentId ??
    student?.student_id ??
    student?.studentRecordId ??
    student?.student_record_id ??
    student?.facultyStudentId ??
    student?.faculty_student_id ??
    student?.uuid ??
    "";
  return value != null && value !== "" ? String(value) : "";
}

function studentAlternateIds(student) {
  if (!student || typeof student !== "object") return [];
  return [
    student.keycloakId,
    student.keycloak_id,
    student.keycloak,
    student.linkedApplicationUserId,
    student.applicationUserId,
    student.application_user_id,
    student.gatewayUserId,
    student.gateway_user_id,
    student.user?.id,
  ]
    .map((value) =>
      value != null && String(value).trim() !== "" ? String(value) : "",
    )
    .filter(Boolean);
}

function resolveStudentId(input, students) {
  const rawId =
    typeof input === "string" || typeof input === "number"
      ? String(input)
      : studentIdValue(input);
  if (!rawId) return "";

  const list = Array.isArray(students) ? students : [];
  const match = list.find((student) => {
    const primaryId = studentIdValue(student);
    return primaryId === rawId || studentAlternateIds(student).includes(rawId);
  });

  return studentIdValue(match) || rawId;
}

function normalizeStudentOptions(page) {
  const list = Array.isArray(page?.content) ? page.content : [];
  return list
    .map((item) => {
      const id = studentIdValue(item);
      if (!id) return null;
      return {
        value: id,
        label: displayName(item, id),
        description:
          item?.email ??
          item?.studentCode ??
          item?.code ??
          item?.department?.name ??
          item?.department ??
          undefined,
      };
    })
    .filter(Boolean);
}

function studentToOption(student) {
  if (!student) return null;
  const id = studentIdValue(student);
  if (!id) return null;
  return {
    value: id,
    label: displayName(student, id),
    description:
      student?.email ??
      student?.studentCode ??
      student?.code ??
      student?.department?.name ??
      student?.department ??
      undefined,
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

function normalizeGroupLeader(value) {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  return studentIdValue(value);
}

function normalizeGroupMembers(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string" || typeof item === "number")
        return String(item);
      return studentIdValue(item);
    })
    .filter(Boolean);
}

function groupIdValue(group) {
  const value = group?.id ?? group?.groupId ?? group?.group_id ?? group?.uuid ?? "";
  return value != null && value !== "" ? String(value) : "";
}

function studentIdentityValues(student) {
  if (student == null) return [];
  if (typeof student === "string" || typeof student === "number") {
    const value = String(student).trim();
    return value ? [value] : [];
  }
  return [studentIdValue(student), ...studentAlternateIds(student)]
    .map((value) =>
      value != null && String(value).trim() !== "" ? String(value) : "",
    )
    .filter(Boolean);
}

function collectAssignedStudentIds(groups, currentGroupId = "") {
  const assigned = new Set();
  const currentId = String(currentGroupId ?? "").trim();

  for (const item of Array.isArray(groups) ? groups : []) {
    if (currentId && groupIdValue(item) === currentId) continue;

    for (const value of studentIdentityValues(item?.groupLeader)) {
      assigned.add(value);
    }

    const members =
      item?.groupMembers ??
      item?.members ??
      item?.students ??
      item?.studentResponses ??
      [];

    for (const member of Array.isArray(members) ? members : []) {
      for (const value of studentIdentityValues(member)) {
        assigned.add(value);
      }
    }
  }

  return assigned;
}

function filterUnassignedOptions(options, assignedStudentIds) {
  if (!assignedStudentIds?.size) return Array.isArray(options) ? options : [];
  return (Array.isArray(options) ? options : []).filter(
    (option) => option?.value && !assignedStudentIds.has(option.value),
  );
}

function initialsFromName(person) {
  const label = displayName(person, "");
  return String(label ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function resolveAvatarUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const base = String(import.meta.env.VITE_API_BASE_URL || "").replace(
    /\/$/,
    "",
  );
  if (!base) return t.startsWith("/") ? t : `/${t}`;
  return t.startsWith("/") ? `${base}${t}` : `${base}/${t}`;
}

function normalizeAcademicYearField(group) {
  const nested = group?.academicYearResponse ?? group?.academicYear;
  if (nested && typeof nested === "object") {
    const id = nested.id ?? nested.uuid;
    if (id != null && String(id).trim() !== "") return String(id);
  }
  if (typeof nested === "string" && nested.trim()) return nested.trim();
  return ACADEMIC_NONE;
}

function studentsFromPage(page) {
  return Array.isArray(page?.content) ? page.content : [];
}

function resolveMemberRecord(memberId, pageStudents, group) {
  const fromPage = pageStudents.find((s) => studentIdValue(s) === memberId);
  if (fromPage) return fromPage;
  const gm = group?.groupMembers;
  if (Array.isArray(gm)) {
    const hit = gm.find((m) => studentIdValue(m) === memberId);
    if (hit && typeof hit === "object") return hit;
  }
  return { id: memberId, firstName: "—", lastName: "", email: "" };
}

export default function GroupRegistrationPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [leaderSearchTerm, setLeaderSearchTerm] = useState("");
  const [debouncedLeaderSearchTerm, setDebouncedLeaderSearchTerm] =
    useState("");
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [debouncedMemberSearchTerm, setDebouncedMemberSearchTerm] =
    useState("");
  const returnTo =
    typeof location.state?.returnTo === "string" && location.state.returnTo
      ? location.state.returnTo
      : "/admin/projects?tab=groups";
  const returnState = location.state?.returnTab
    ? { returnTab: location.state.returnTab }
    : undefined;
  const navigateBack = () => navigate(returnTo, { state: returnState });

  const { data: group, isLoading: groupLoading } = useFacultyGroup(id, {
    enabled: isEdit,
    notifyOnError: true,
  });
  const { data: groups = [] } = useFacultyGroups(
    {},
    { notifyOnError: false, staleTime: 60_000 },
  );
  const { data: studentPage, isLoading: studentsLoading } = useStudentsPage(
    { page: 0, pageSize: 500, notifyOnError: false },
    { staleTime: 60_000 },
  );
  const { data: academicYears = [], isLoading: academicYearsLoading } =
    useAcademicYears({}, { notifyOnError: false, staleTime: 120_000 });
  const { data: searchedStudents = [], isFetching: isSearchingStudents } =
    useStudentSearch(debouncedLeaderSearchTerm, {
      enabled: debouncedLeaderSearchTerm.length > 0,
      staleTime: 30_000,
      notifyOnError: false,
    });
  const { data: memberSearchHits = [], isFetching: isSearchingMembers } =
    useStudentSearch(debouncedMemberSearchTerm, {
      enabled: debouncedMemberSearchTerm.length > 0,
      staleTime: 30_000,
      notifyOnError: false,
    });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedLeaderSearchTerm(leaderSearchTerm.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [leaderSearchTerm]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedMemberSearchTerm(memberSearchTerm.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [memberSearchTerm]);

  const pageStudents = useMemo(
    () => studentsFromPage(studentPage),
    [studentPage],
  );
  const studentOptions = useMemo(
    () => normalizeStudentOptions(studentPage),
    [studentPage],
  );
  const searchedStudentOptions = useMemo(
    () => searchedStudents.map(studentToOption).filter(Boolean),
    [searchedStudents],
  );
  const memberSearchOptions = useMemo(
    () => memberSearchHits.map(studentToOption).filter(Boolean),
    [memberSearchHits],
  );
  const assignedStudentIds = useMemo(
    () => collectAssignedStudentIds(groups, id),
    [groups, id],
  );
  const availableStudentOptions = useMemo(
    () => filterUnassignedOptions(studentOptions, assignedStudentIds),
    [assignedStudentIds, studentOptions],
  );
  const availableSearchedStudentOptions = useMemo(
    () => filterUnassignedOptions(searchedStudentOptions, assignedStudentIds),
    [assignedStudentIds, searchedStudentOptions],
  );
  const availableMemberSearchOptions = useMemo(
    () => filterUnassignedOptions(memberSearchOptions, assignedStudentIds),
    [assignedStudentIds, memberSearchOptions],
  );
  const knownStudentRecords = useMemo(
    () =>
      [
        ...pageStudents,
        ...searchedStudents,
        ...memberSearchHits,
        group?.groupLeader,
        ...(Array.isArray(group?.groupMembers) ? group.groupMembers : []),
      ].filter(Boolean),
    [group, memberSearchHits, pageStudents, searchedStudents],
  );

  const academicYearOptions = useMemo(() => {
    const list = Array.isArray(academicYears) ? academicYears : [];
    const opts = list
      .map((y) => {
        const vid = y?.id ?? y?.uuid;
        if (vid == null || String(vid).trim() === "") return null;
        return { value: String(vid), label: String(y?.name ?? vid) };
      })
      .filter(Boolean);
    return [
      {
        value: ACADEMIC_NONE,
        label: t("adminProjects.form.group.academicYearOptional"),
      },
      ...opts,
    ];
  }, [academicYears, t]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      academicYear: ACADEMIC_NONE,
      groupLeader: "",
      groupMembers: [],
    },
  });

  useEffect(() => {
    if (!group || !isEdit) return;
    reset({
      name: group?.name ?? "",
      academicYear: normalizeAcademicYearField(group),
      groupLeader: normalizeGroupLeader(group?.groupLeader),
      groupMembers: normalizeGroupMembers(group?.groupMembers),
    });
  }, [group, isEdit, reset]);

  const steps = useMemo(
    () => [
      {
        id: 1,
        titleKey: "adminProjects.form.group.steps.basic",
        icon: UsersRound,
        fields: ["name"],
      },
      {
        id: 2,
        titleKey: "adminProjects.form.group.steps.leader",
        icon: Crown,
        fields: ["groupLeader"],
      },
      {
        id: 3,
        titleKey: "adminProjects.form.group.steps.members",
        icon: UserPlus,
        fields: ["groupMembers"],
      },
      {
        id: 4,
        titleKey: "adminProjects.form.group.steps.review",
        icon: Sparkles,
        fields: [],
      },
    ],
    [],
  );

  const createGroup = useCreateFacultyGroup({
    toastSuccess: "adminProjects.form.group.toast.createSuccess",
    toastError: "apiErrors.failed_to_create_faculty_group",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty-groups"] });
      navigateBack();
    },
  });

  const updateGroup = useUpdateFacultyGroup({
    toastSuccess: "adminProjects.form.group.toast.updateSuccess",
    toastError: "apiErrors.failed_to_update_faculty_group",
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculty-groups"] });
      await queryClient.invalidateQueries({
        queryKey: ["faculty-groups", "detail", id],
      });
      navigateBack();
    },
  });

  const values = useWatch({ control });
  const leaderId = String(values?.groupLeader ?? "").trim();
  const selectedLeaderRecord = !leaderId
    ? null
    : (pageStudents.find((student) => studentIdValue(student) === leaderId) ??
      searchedStudents.find(
        (student) => studentIdValue(student) === leaderId,
      ) ??
      (studentIdValue(group?.groupLeader) === leaderId
        ? group.groupLeader
        : null) ??
      (Array.isArray(group?.groupMembers)
        ? group.groupMembers.find(
            (member) => studentIdValue(member) === leaderId,
          )
        : null) ??
      null);
  const leaderOptions = useMemo(() => {
    const baseOptions =
      debouncedLeaderSearchTerm.length > 0
        ? availableSearchedStudentOptions
        : availableStudentOptions;
    const selectedOption = studentToOption(selectedLeaderRecord);
    const keepSelected =
      selectedOption && !assignedStudentIds.has(selectedOption.value);
    return mergeOptions(keepSelected ? [selectedOption] : [], baseOptions);
  }, [
    assignedStudentIds,
    availableSearchedStudentOptions,
    availableStudentOptions,
    debouncedLeaderSearchTerm,
    selectedLeaderRecord,
  ]);
  const selectedLeader = leaderOptions.find(
    (item) => item.value === values.groupLeader,
  );
  const memberIds = useMemo(
    () =>
      Array.isArray(values.groupMembers)
        ? values.groupMembers.filter(Boolean)
        : [],
    [values.groupMembers],
  );
  const memberPickerOptions = useMemo(() => {
    const baseOptions =
      debouncedMemberSearchTerm.length > 0
        ? availableMemberSearchOptions
        : availableStudentOptions;
    const forSelected = memberIds
      .map((mid) =>
        studentToOption(resolveMemberRecord(mid, pageStudents, group)),
      )
      .filter((option) => option && !assignedStudentIds.has(option.value))
      .filter(Boolean);
    return mergeOptions(forSelected, baseOptions);
  }, [
    assignedStudentIds,
    availableMemberSearchOptions,
    availableStudentOptions,
    debouncedMemberSearchTerm,
    memberIds,
    pageStudents,
    group,
  ]);
  const progressPct = Math.round((step / steps.length) * 100);
  const motionEase = [0.22, 1, 0.36, 1];

  useEffect(() => {
    if (!assignedStudentIds.size) return;

    if (leaderId && assignedStudentIds.has(leaderId)) {
      setValue("groupLeader", "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    const nextMembers = memberIds.filter(
      (memberId) => !assignedStudentIds.has(String(memberId)),
    );
    if (nextMembers.length !== memberIds.length) {
      setValue("groupMembers", nextMembers, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [assignedStudentIds, leaderId, memberIds, setValue]);

  useEffect(() => {
    const lid = values?.groupLeader;
    if (!lid) return;
    const cur = normalizeGroupMembers(getValues("groupMembers"));
    if (!cur.includes(lid)) {
      setValue("groupMembers", [...cur, lid], {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [values?.groupLeader, getValues, setValue]);

  const onSubmit = (formValues) => {
    const leader = resolveStudentId(formValues.groupLeader, knownStudentRecords);
    const rawMembers = Array.isArray(formValues.groupMembers)
      ? formValues.groupMembers.filter(Boolean)
      : [];
    const ids = new Set(
      [
        ...rawMembers.map((member) =>
          resolveStudentId(member, knownStudentRecords),
        ),
        String(leader),
      ].filter(Boolean),
    );
    const groupMembers = Array.from(ids);

    const payload = {
      name: formValues.name.trim(),
      groupLeader: leader,
      groupMembers,
    };
    const ay = formValues.academicYear;
    if (ay && ay !== ACADEMIC_NONE && String(ay).trim() !== "") {
      payload.academicYear = String(ay).trim();
    }

    if (isEdit) {
      updateGroup.mutate({ id, ...payload });
      return;
    }
    createGroup.mutate(payload);
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

  const setMemberRole = (memberId, role) => {
    const mid = String(memberId);
    if (role === "remove") {
      const next = normalizeGroupMembers(getValues("groupMembers")).filter(
        (x) => x !== mid,
      );
      setValue("groupMembers", next, {
        shouldValidate: true,
        shouldDirty: true,
      });
      if (getValues("groupLeader") === mid) {
        setValue("groupLeader", "", {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      return;
    }
    if (role === "leader") {
      setValue("groupLeader", mid, { shouldValidate: true, shouldDirty: true });
      const cur = normalizeGroupMembers(getValues("groupMembers"));
      if (!cur.includes(mid)) {
        setValue("groupMembers", [...cur, mid], {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  };

  const completedStepSnippet = (stepId) => {
    switch (stepId) {
      case 1:
        return values?.name?.trim() || "—";
      case 2:
        return selectedLeader?.label || "—";
      case 3:
        return t("adminProjects.form.group.selectedCount", {
          count: memberIds.length,
        });
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
            key="g-step-1"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FacultyFormSectionCard
              icon={UsersRound}
              tint="indigo"
              title={t("adminProjects.form.group.sectionTitle")}
              subtitle={t("adminProjects.form.group.sectionDescription")}
            >
              <Field
                label={`${t("adminProjects.form.group.fields.name")} *`}
                placeholder={t("adminProjects.form.group.placeholders.name")}
                register={register("name", {
                  required: t("adminProjects.form.group.validation.name"),
                  minLength: {
                    value: 2,
                    message: t(
                      "adminProjects.form.group.validation.nameLength",
                    ),
                  },
                  maxLength: {
                    value: 50,
                    message: t(
                      "adminProjects.form.group.validation.nameLength",
                    ),
                  },
                })}
                error={errors.name?.message}
              />
              <Controller
                name="academicYear"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t("adminProjects.form.group.fields.academicYear")}
                    placeholder={t(
                      "adminProjects.form.group.placeholders.academicYear",
                    )}
                    options={academicYearOptions}
                    value={field.value || ACADEMIC_NONE}
                    onValueChange={field.onChange}
                    disabled={academicYearsLoading}
                  />
                )}
              />
              {academicYearsLoading ? (
                <p className="text-[11px] text-muted dark:text-dark-muted">
                  {t(
                    "adminProjects.form.group.placeholders.loadingAcademicYears",
                  )}
                </p>
              ) : null}
            </FacultyFormSectionCard>
          </MotionDiv>
        );
      case 2:
        return (
          <MotionDiv
            key="g-step-2"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FacultyFormSectionCard
              icon={Crown}
              tint="violet"
              title={t("adminProjects.form.group.fields.groupLeader")}
              subtitle={t("adminProjects.form.group.selector.leaderHelp")}
            >
              <Controller
                name="groupLeader"
                control={control}
                rules={{
                  required: t(
                    "adminProjects.form.group.validation.groupLeader",
                  ),
                }}
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-2">
                    <SearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      options={leaderOptions}
                      placeholder={
                        studentsLoading
                          ? t(
                              "adminProjects.form.group.placeholders.loadingStudents",
                            )
                          : t(
                              "adminProjects.form.group.placeholders.groupLeader",
                            )
                      }
                      searchPlaceholder={t(
                        "adminProjects.form.group.placeholders.groupLeaderSearch",
                      )}
                      loading={isSearchingStudents}
                      onSearchChange={setLeaderSearchTerm}
                      disabled={studentsLoading}
                      className="min-h-8 bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)"
                    />
                    {fieldState.error?.message ? (
                      <p className="text-[11px] text-error dark:text-red-400">
                        {fieldState.error.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
            </FacultyFormSectionCard>
          </MotionDiv>
        );
      case 3:
        return (
          <MotionDiv
            key="g-step-3"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <div className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-5 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) sm:p-6">
              <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-primary dark:text-dark-primary">
                    {t("adminProjects.form.group.invite.title")}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-secondary dark:text-dark-secondary">
                    {t("adminProjects.form.group.invite.subtitle")}
                  </p>
                </div>
              </div>

              <Controller
                name="groupMembers"
                control={control}
                rules={{
                  validate: (value) =>
                    Array.isArray(value) && value.length > 0
                      ? true
                      : t("adminProjects.form.group.validation.groupMembers"),
                }}
                render={({ field, fieldState }) => (
                  <>
                    <div className="mb-4 flex flex-col gap-2">
                      <span className="text-[11px] font-semibold text-primary dark:text-dark-primary">
                        {t("adminProjects.form.group.fields.groupMembers")}
                      </span>
                      <SearchableSelect
                        multiple
                        value={field.value}
                        onValueChange={field.onChange}
                        options={memberPickerOptions}
                        placeholder={
                          studentsLoading
                            ? t(
                                "adminProjects.form.group.placeholders.loadingStudents",
                              )
                            : t(
                                "adminProjects.form.group.placeholders.membersPicker",
                              )
                        }
                        searchPlaceholder={t(
                          "adminProjects.form.group.placeholders.membersSearch",
                        )}
                        loading={isSearchingMembers}
                        onSearchChange={setMemberSearchTerm}
                        disabled={studentsLoading}
                        clearSearchOnOpen={false}
                        showInlineSearchClear={false}
                        className="min-h-8 bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)"
                      />
                      <p className="text-[11px] text-muted dark:text-dark-muted">
                        {t("adminProjects.form.group.invite.browseHint")}
                      </p>
                    </div>
                    {fieldState.error?.message ? (
                      <p className="mb-3 text-[11px] text-error dark:text-red-400">
                        {fieldState.error.message}
                      </p>
                    ) : null}
                    <p className="mb-3 text-[11px] font-semibold text-primary dark:text-dark-primary">
                      {t("adminProjects.form.group.invite.listTitle")}
                    </p>
                    <ul className="max-h-[min(24rem,55vh)] space-y-2 overflow-y-auto pr-0.5">
                      {memberIds.length === 0 ? (
                        <li className="rounded-xl border border-dashed border-(--color-light-card-border) px-4 py-8 text-center text-xs text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
                          {t("adminProjects.form.group.selector.emptyMembers")}
                        </li>
                      ) : (
                        memberIds.map((mid) => {
                          const rec = resolveMemberRecord(
                            mid,
                            pageStudents,
                            group,
                          );
                          const title = displayName(rec, mid);
                          const email = rec?.email ?? "";
                          const pic = resolveAvatarUrl(rec?.profilePicture);
                          const isLeader =
                            String(values?.groupLeader) === String(mid);
                          const roleValue = isLeader ? "leader" : "member";
                          const roleOptions = [
                            {
                              value: "member",
                              label: t(
                                "adminProjects.form.group.invite.roleMember",
                              ),
                            },
                            {
                              value: "leader",
                              label: t(
                                "adminProjects.form.group.invite.roleLeader",
                              ),
                            },
                            {
                              value: "remove",
                              label: t(
                                "adminProjects.form.group.invite.remove",
                              ),
                            },
                          ];
                          return (
                            <li
                              key={mid}
                              className="flex items-center gap-3 rounded-xl border border-(--color-light-card-border) bg-bg-shell px-3 py-2.5 dark:border-(--color-dark-card-border) dark:bg-dark-shell"
                            >
                              {pic ? (
                                <img
                                  src={pic}
                                  alt=""
                                  className="size-10 shrink-0 rounded-full object-cover ring-1 ring-(--color-light-card-border) dark:ring-(--color-dark-card-border)"
                                />
                              ) : (
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-(--color-light-card-border) bg-light-app-tertiary text-xs font-semibold text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary">
                                  {initialsFromName(rec) || "—"}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-primary dark:text-dark-primary">
                                    {title}
                                  </p>
                                  {isLeader ? (
                                    <span className="shrink-0 rounded-full border border-(--color-light-card-border) bg-(--color-light-card-bg) px-2 py-0.5 text-[10px] font-semibold text-secondary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary">
                                      {t(
                                        "adminProjects.form.group.selector.leaderBadge",
                                      )}
                                    </span>
                                  ) : (
                                    <span className="shrink-0 rounded-full border border-(--color-light-card-border) px-2 py-0.5 text-[10px] font-semibold text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
                                      {t(
                                        "adminProjects.form.group.badge.member",
                                      )}
                                    </span>
                                  )}
                                </div>
                                {email ? (
                                  <p className="truncate text-xs text-muted dark:text-dark-muted">
                                    {email}
                                  </p>
                                ) : null}
                              </div>
                              <div className="w-[min(100%,8.5rem)] shrink-0">
                                <Select
                                  options={roleOptions}
                                  value={roleValue}
                                  onValueChange={(v) => {
                                    if (v === "member" && isLeader) {
                                      setValue("groupLeader", "", {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                      });
                                      return;
                                    }
                                    if (v === "leader")
                                      setMemberRole(mid, "leader");
                                    if (v === "remove")
                                      setMemberRole(mid, "remove");
                                  }}
                                />
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </>
                )}
              />
            </div>
          </MotionDiv>
        );
      case 4:
        return (
          <MotionDiv
            key="g-step-4"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FacultyFormSectionCard
              icon={Sparkles}
              tint="emerald"
              title={t("adminProjects.form.group.steps.review")}
              subtitle={t("adminProjects.form.group.overviewDescription")}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <ReviewRow
                  k={t("adminProjects.form.group.fields.name")}
                  v={values?.name}
                />
                <ReviewRow
                  k={t("adminProjects.form.group.fields.academicYear")}
                  v={
                    values?.academicYear &&
                    values.academicYear !== ACADEMIC_NONE
                      ? academicYearOptions.find(
                          (o) => o.value === values.academicYear,
                        )?.label
                      : t("adminProjects.form.group.academicYearOptional")
                  }
                />
                <ReviewRow
                  k={t("adminProjects.form.group.fields.groupLeader")}
                  v={selectedLeader?.label}
                />
                <ReviewRow
                  k={t("adminProjects.form.group.fields.groupMembers")}
                  v={t("adminProjects.form.group.selectedCount", {
                    count: memberIds.length,
                  })}
                />
              </div>
            </FacultyFormSectionCard>
          </MotionDiv>
        );
      default:
        return null;
    }
  };

  if (isEdit && groupLoading) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-light-app-bg p-4 dark:bg-dark-card-bg">
        <p className="text-sm text-muted dark:text-dark-muted">
          {t("adminProjects.form.group.loading")}
        </p>
      </div>
    );
  }

  if (isEdit && !groupLoading && !group) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-start gap-4 bg-white p-4 dark:bg-dark-card-bg md:p-5">
        <Button
          variant="tertiary"
          onClick={navigateBack}
        >
          {t("adminProjects.form.group.actions.back")}
        </Button>
        <div className="rounded-3xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-6 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <p className="text-sm text-secondary dark:text-dark-secondary">
            {t("adminProjects.form.group.notFound")}
          </p>
        </div>
      </div>
    );
  }

  const aySummary =
    values?.academicYear && values.academicYear !== ACADEMIC_NONE
      ? (academicYearOptions.find((o) => o.value === values.academicYear)
          ?.label ?? "—")
      : t("adminProjects.form.group.academicYearOptional");

  return (
    <div className="flex min-h-screen flex-1 flex-col gap-4 overflow-y-auto bg-light-app-bg p-4 dark:bg-dark-card-bg md:p-5">
      <button
        type="button"
        onClick={navigateBack}
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-default bg-bg-shell px-3 py-2 text-xs font-semibold text-secondary transition-colors hover:bg-hover dark:border-dark-default dark:bg-dark-shell dark:text-dark-secondary dark:hover:bg-dark-hover"
      >
        <Icon d={IC.chevLeft} className="size-3.5 stroke-[2]" />
        {t("adminProjects.form.group.actions.back")}
      </button>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="mx-auto w-full max-w-[min(100%,92rem)] pb-20"
      >
        <div className="card rounded-xl px-5 py-8 shadow-sm md:px-8 md:py-10">
          <header className="mb-8 flex flex-col gap-4 border-b border-default pb-6 dark:border-dark-default sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-(--color-light-nav-text-active) dark:text-(--color-dark-nav-text-active)">
                {t("adminProjects.tabs.groups")}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-[1.65rem] dark:text-dark-primary">
                {isEdit
                  ? t("adminProjects.form.group.editTitle")
                  : t("adminProjects.form.group.createTitle")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary dark:text-dark-secondary">
                {t("adminProjects.form.group.subtitle")}
              </p>
            </div>
          </header>

          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-x-10 2xl:gap-x-14">
            <nav
              aria-label="Group registration steps"
              className="shrink-0 xl:sticky xl:top-6 xl:w-[11.5rem] xl:max-w-[11.5rem] 2xl:w-52"
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
                      <span className="max-w-[8rem] truncate">
                        {t(s.titleKey)}
                      </span>
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
                              ? "bg-[color:var(--color-chart-success)]/50 dark:bg-[color:var(--color-chart-success)]/35"
                              : "bg-(--color-light-border-subtle) dark:bg-(--color-dark-border-subtle)",
                          ].join(" ")}
                          style={{ height: "calc(100% - 0.125rem)" }}
                          aria-hidden
                        />
                      ) : null}
                      <span
                        className={[
                          "relative z-1 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                          done
                            ? "border-[color:var(--color-chart-success)] bg-[color:var(--color-chart-success)] text-white shadow-[0_0_0_4px_rgba(16,185,129,0.2)]"
                            : active
                              ? "border-[color:var(--color-light-timeline-accent)] bg-[color:var(--color-light-timeline-accent)] text-white shadow-[0_0_0_4px_rgba(0,102,255,0.22)] dark:border-[color:var(--color-dark-timeline-accent)] dark:bg-[color:var(--color-dark-timeline-accent)]"
                              : "border-(--color-light-card-border) bg-(--color-light-card-bg) text-muted dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-muted",
                        ].join(" ")}
                      >
                        <IconStep className="size-4 shrink-0" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <span
                          className={[
                            "block text-[11px] font-semibold leading-snug break-words",
                            !active && !done
                              ? "text-secondary dark:text-dark-secondary"
                              : "",
                            active
                              ? "text-(--color-light-timeline-text) dark:text-(--color-dark-timeline-text)"
                              : "",
                            done
                              ? "text-[color:var(--color-chart-success)] dark:text-[color:var(--color-chart-success)]"
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
              <div className="w-full space-y-6 xl:max-w-[48rem] 2xl:max-w-[52rem]">
                <div className="overflow-hidden rounded-2xl border border-(--color-light-success-border) bg-(--color-light-success-bg) p-4 sm:p-5 dark:border-(--color-dark-success-border) dark:bg-(--color-dark-success-bg)">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-(--color-light-success-text) dark:text-(--color-dark-success-text)">
                        {t("adminProjects.form.group.progress", {
                          pct: progressPct,
                        })}
                      </p>
                      <p className="mt-1 text-[11px] text-(--color-light-success-text) opacity-90 dark:text-(--color-dark-success-text)">
                        {t("adminProjects.form.group.progress.hint")}
                      </p>
                    </div>
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

                <LayoutGroup id="group-reg-flow">
                  <div className="min-h-[200px] space-y-5">
                    <div className="space-y-3">
                      <AnimatePresence initial={false} mode="popLayout">
                        {steps
                          .filter((s) => s.id < step && s.id < 4)
                          .map((s) => {
                            const DoneIcon = s.icon;
                            return (
                              <motion.div
                                key={`stack-${s.id}`}
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
                                  className="mt-1 size-4 shrink-0 text-[color:var(--color-chart-success)]"
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

                <footer className="mt-10 flex flex-col gap-4 border-t border-default pt-6 dark:border-dark-border-default sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-muted dark:text-dark-muted">
                    <Clock3 className="size-3.5 shrink-0 opacity-70" />
                    <span>
                      {t("adminProjects.form.group.progress.footerHint")}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {step === 1 ? (
                      <Button
                        type="button"
                        variant="tertiary"
                        onClick={navigateBack}
                      >
                        {t("adminProjects.form.group.actions.cancel")}
                      </Button>
                    ) : null}
                    {step > 1 ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={goPrev}
                      >
                        {t("adminProjects.form.group.actions.previous")}
                      </Button>
                    ) : null}
                    {step < steps.length ? (
                      <Button type="button" onClick={() => void goNext()}>
                        {t("adminProjects.form.group.actions.continue")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={
                          createGroup.isPending || updateGroup.isPending
                        }
                        onClick={() => void handleSubmit(onSubmit)()}
                      >
                        {createGroup.isPending || updateGroup.isPending
                          ? t("adminProjects.form.group.actions.submitting")
                          : isEdit
                            ? t("adminProjects.form.group.actions.update")
                            : t("adminProjects.form.group.actions.create")}
                      </Button>
                    )}
                  </div>
                </footer>
              </div>
            </div>

            <aside className="shrink-0 xl:sticky xl:top-6 xl:h-fit xl:w-[17.5rem] xl:max-w-[280px]">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-primary dark:text-dark-primary">
                  {t("adminProjects.form.group.overviewTitle")}
                </h3>
                <p className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                  {t("adminProjects.form.group.overviewDescription")}
                </p>
                <ul className="mt-5 space-y-3 border-t border-default pt-5 text-[11px] dark:border-dark-default">
                  <SummaryLine
                    label={t("adminProjects.form.group.fields.name")}
                    value={values?.name?.trim() || "—"}
                  />
                  <SummaryLine
                    label={t("adminProjects.form.group.fields.academicYear")}
                    value={aySummary}
                  />
                  <SummaryLine
                    label={t("adminProjects.form.group.stats.leader")}
                    value={selectedLeader?.label || "—"}
                  />
                  <SummaryLine
                    label={t("adminProjects.form.group.stats.members")}
                    value={String(memberIds.length)}
                  />
                </ul>
                <div className="mt-6 flex items-center gap-2 rounded-xl bg-(--color-light-nav-hover-bg) px-3 py-2 dark:bg-(--color-dark-card-hover)">
                  <CalendarRange className="size-3.5 shrink-0 text-(--color-light-timeline-accent) dark:text-(--color-dark-timeline-accent)" />
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
