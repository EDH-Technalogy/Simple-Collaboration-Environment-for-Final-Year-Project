import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  CalendarRange,
  CheckCircle2,
  Clock3,
  GraduationCap,
  IdCard,
  KeyRound,
  Mail,
  MapPin,
  ShieldCheck,
  User,
  UserCircle2,
} from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import Button from "./Button";
import Field from "./Field";
import Icon from "./Icon";
import IC from "./IC";
import SearchableSelect from "./SearchableSelect";
import Select from "./Select";
import {
  useAcademicYears,
  useBatches,
  useCreateStudent,
  useDepartments,
  useSemestersByAcademicYear,
  useStudent,
  useUpdateStudent,
  useUser,
} from "../services/useApi";

const MotionDiv = motion.div;

const USERNAME_PATTERN =
  /^(?!.*[._]{2})[A-Za-z][A-Za-z0-9._]{1,48}[A-Za-z0-9]$/;
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
const PHONE_PATTERN = /^07\d{8}$/;
const PERSON_NAME_PATTERN = /^[\p{L}](?:[\p{L} .'-]{0,48}[\p{L}])$/u;
const TEXT_PATTERN = /^[\p{L}][\p{L}\s.'-]{1,79}$/u;
const ADDRESS_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s,.-]{4,149}$/u;
const POSTAL_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 -]{2,19}$/;
const KANKOR_ID_PATTERN = /^[A-Z][0-9]{7}$/;
const MIN_BIRTH_AGE_YEARS = 10;

function parseDateOnly(value) {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateInputValue(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value).trim();
  const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  if (dateOnly) return dateOnly[1];
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function usernameFromAccount(account) {
  return (
    account?.username ??
    account?.userName ??
    account?.user_name ??
    account?.preferred_username ??
    ""
  );
}

function firstNonBlank(...values) {
  for (const value of values) {
    const text = value == null ? "" : String(value).trim();
    if (text) return text;
  }
  return "";
}

function isAtLeastAge(value, years) {
  const date = parseDateOnly(value);
  if (!date) return false;
  const latestAllowed = new Date();
  latestAllowed.setFullYear(latestAllowed.getFullYear() - years);
  latestAllowed.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date <= latestAllowed;
}

function normalizeDepartmentsPayload(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.departments)) return data.departments;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function recordToDepartmentOption(record) {
  const id =
    record?.id ?? record?.department ?? record?.uuid ?? record?.code ?? "";
  const label =
    record?.name ??
    record?.title ??
    record?.departmentName ??
    (id !== "" && id != null ? String(id) : "") ??
    "—";
  const value = String(id !== "" && id != null ? id : label);
  return { value, label: String(label || value), raw: record };
}

function normalizeBatchesPayload(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.batches)) return data.batches;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function recordToBatchOption(record) {
  const id = String(record?.id ?? "");
  const name = record?.name ?? id;
  const year = record?.year;
  const ty = record?.type ? String(record.type) : "";
  const academic = record?.academicYear;
  const ayName =
    typeof academic === "object" && academic != null
      ? (academic.name ?? "")
      : "";
  const shortHead = [name, year != null ? String(year) : ""]
    .filter(Boolean)
    .join(" · ");
  const label = shortHead || name;
  const detailParts = [
    ty,
    ayName && String(ayName).trim() !== "" ? String(ayName) : "",
  ].filter(Boolean);
  const description = detailParts.length ? detailParts.join(" — ") : undefined;
  return { value: id, label, description, raw: record };
}

function matchDepartmentSelection(student, options) {
  if (!student || !options?.length) return "";
  const byId =
    student.department != null && `${student.department}`.trim() !== ""
      ? String(student.department)
      : "";
  if (byId && options.some((o) => o.value === byId)) return byId;
  const name = student.department;
  if (!name) return "";
  const found = options.find(
    (o) =>
      String(o.label).toLowerCase().trim() ===
      String(name).toLowerCase().trim(),
  );
  return found?.value ?? "";
}

function matchBatchSelection(student, options) {
  if (!student || !options?.length) return "";
  const byId =
    student.batchId != null && `${student.batchId}`.trim() !== ""
      ? String(student.batchId)
      : "";
  if (byId && options.some((o) => o.value === byId)) return byId;
  return "";
}

function normalizeAcademicYearsPayload(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.academicYears)) return data.academicYears;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function recordToAcademicYearOption(record) {
  const id = record?.id ?? record?.academicYearId ?? "";
  const label =
    record?.name ??
    record?.title ??
    record?.label ??
    (record?.year != null ? String(record.year) : "") ??
    "";
  const value = String(id);
  const display = label && String(label).trim() !== "" ? String(label) : value;
  return { value, label: display || value, raw: record };
}

function recordToSemesterApiOption(record) {
  const id = record?.id ?? record?.semesterId ?? "";
  if (!id) return null;
  const label =
    record?.name ??
    record?.semesterName ??
    record?.title ??
    record?.code ??
    String(id);
  return { value: String(id), label: String(label), raw: record };
}

const stepMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const tintIconBox = {
  violet:
    "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300",
  indigo:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300",
  emerald:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-300",
};

function FormSectionCard({
  icon,
  tint = "violet",
  title,
  subtitle,
  children,
}) {
  const IconGlyph = icon;
  return (
    <div className="rounded-xl border bg-light-card-bg p-5 shadow-sm backdrop-blur-sm dark:border-dark-card-border border-default dark:bg-dark-card-bg dark:shadow-none sm:p-6">
      <div className="mb-5 flex gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tintIconBox[tint]}`}
        >
          <IconGlyph className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-primary dark:text-dark-primary">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] leading-snug text-secondary dark:text-dark-secondary">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/**
 * Layout inspired by university multi-step apps: vertical step rail, summary column, soft cards.
 */
export default function StudentRegistrationWizard({
  mode = "create",
  studentId = null,
  onCompleted,
  onCancel,
  className = "",
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const isEdit = mode === "edit" && Boolean(studentId);

  const {
    data: departmentsData,
    isLoading: departmentsLoading,
    isError: departmentsError,
  } = useDepartments({ notifyOnError: false });

  const {
    data: batchesData,
    isLoading: batchesLoading,
    isError: batchesError,
  } = useBatches({ notifyOnError: false });

  const {
    data: academicYearsData,
    isLoading: academicYearsLoading,
    isError: academicYearsError,
  } = useAcademicYears({}, { notifyOnError: false });

  const {
    data: existingStudent,
    isLoading: studentLoading,
    isError: studentFetchError,
  } = useStudent(studentId ?? "", {
    enabled: isEdit,
    notifyOnError: false,
  });

  const authUserId =
    existingStudent?.keycloakId || existingStudent?.linkedApplicationUserId || "";
  const { data: authUser, isLoading: authUserLoading } = useUser(authUserId, {
    enabled: isEdit && Boolean(authUserId),
    notifyOnError: false,
  });

  const departmentRecords = useMemo(
    () => normalizeDepartmentsPayload(departmentsData),
    [departmentsData],
  );

  const departmentOptions = useMemo(
    () => departmentRecords.map((r) => recordToDepartmentOption(r)),
    [departmentRecords],
  );

  const batchRecords = useMemo(
    () => normalizeBatchesPayload(batchesData),
    [batchesData],
  );

  const batchOptions = useMemo(
    () => batchRecords.map((r) => recordToBatchOption(r)),
    [batchRecords],
  );

  const academicYearRecords = useMemo(
    () => normalizeAcademicYearsPayload(academicYearsData),
    [academicYearsData],
  );

  const academicYearOptions = useMemo(
    () =>
      academicYearRecords
        .map((r) => recordToAcademicYearOption(r))
        .filter((o) => o.value),
    [academicYearRecords],
  );

  const genderOptions = useMemo(
    () => [
      { value: "male", label: t("studentForm.options.genderMale") },
      { value: "female", label: t("studentForm.options.genderFemale") },
      { value: "other", label: t("studentForm.options.genderOther") },
    ],
    [t],
  );

  const statusOptions = useMemo(
    () => [
      { value: "ACTIVE", label: t("adminShared.status.active") },
      { value: "PENDING", label: t("adminShared.status.pending") },
      { value: "REJECTED", label: t("adminShared.status.rejected") },
      { value: "SUSPENDED", label: t("adminShared.status.suspended") },
    ],
    [t],
  );

  const roleOptions = useMemo(
    () => [{ value: "STUDENT_USER", label: t("studentForm.options.roleStudent") }],
    [t],
  );

  const steps = useMemo(
    () => [
      {
        id: 1,
        titleKey: "studentForm.steps.account",
        icon: KeyRound,
        fields: isEdit ? [] : ["username", "password"],
      },
      {
        id: 2,
        titleKey: "studentForm.steps.personal",
        icon: UserCircle2,
        fields: [
          "firstName",
          "lastName",
          "fatherName",
          "nationality",
          "gender",
          "dateOfBirth",
        ],
      },
      {
        id: 3,
        titleKey: "studentForm.steps.contact",
        icon: Mail,
        fields: ["email", "phone"],
      },
      {
        id: 4,
        titleKey: "studentForm.steps.address",
        icon: MapPin,
        fields: ["addressStreet", "addressCity", "addressPostalCode"],
      },
      {
        id: 5,
        titleKey: "studentForm.steps.academic",
        icon: GraduationCap,
        fields: [
          "department",
          "academicYearId",
          "semester",
          "batchId",
          "enrollmentDate",
          "kankorId",
          "status",
        ],
      },
      {
        id: 6,
        titleKey: "studentForm.steps.review",
        icon: CheckCircle2,
        fields: [],
      },
    ],
    [isEdit],
  );

  const hydratedStudentIdRef = useRef(null);
  const prevAcademicYearIdRef = useRef("");

  useEffect(() => {
    hydratedStudentIdRef.current = null;
    prevAcademicYearIdRef.current = "";
  }, [studentId]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    trigger,
    setValue,
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
      role: "STUDENT_USER",
      firstName: "",
      lastName: "",
      fatherName: "",
      grandFatherName: "",
      nationality: "",
      gender: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      addressStreet: "",
      addressCity: "",
      addressPostalCode: "",
      department: "",
      academicYearId: "",
      enrollmentDate: new Date().toISOString().slice(0, 10),
      kankorId: "",
      semester: "",
      batchId: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!isEdit || !studentId) return;
    if (studentLoading || !existingStudent) return;
    if (
      !(
        existingStudent.username ||
        existingStudent.userName ||
        existingStudent.user_name
      ) &&
      authUserId &&
      authUserLoading
    )
      return;
    if (departmentsLoading || batchesLoading) return;
    if (hydratedStudentIdRef.current === studentId) return;
    hydratedStudentIdRef.current = studentId;

    const deptSel = matchDepartmentSelection(
      existingStudent,
      departmentOptions,
    );
    const batchSel = matchBatchSelection(existingStudent, batchOptions);

    reset({
      username:
        firstNonBlank(
          existingStudent.username,
          existingStudent.userName,
          existingStudent.user_name,
          usernameFromAccount(authUser),
        ),
      password: "",
      role: existingStudent.role ?? "STUDENT_USER",
      firstName: existingStudent.firstName ?? "",
      lastName: existingStudent.lastName ?? "",
      fatherName: existingStudent.fatherName ?? "",
      grandFatherName: existingStudent.grandFatherName ?? "",
      nationality: existingStudent.nationality ?? "",
      gender: existingStudent.gender ?? "",
      dateOfBirth: toDateInputValue(existingStudent.dateOfBirth),
      email: existingStudent.email ?? "",
      phone: existingStudent.phone ?? "",
      addressStreet: existingStudent.addressStreet ?? "",
      addressCity: existingStudent.addressCity ?? "",
      addressPostalCode: existingStudent.addressPostalCode ?? "",
      department:
        deptSel || existingStudent.departmentId || existingStudent.department || "",
      academicYearId: existingStudent.academicYearId
        ? String(existingStudent.academicYearId)
        : "",
      enrollmentDate:
        toDateInputValue(existingStudent.enrollmentDate) ||
        new Date().toISOString().slice(0, 10),
      kankorId: existingStudent.kankorId ?? "",
      semester:
        existingStudent.semester != null &&
        String(existingStudent.semester).trim() !== ""
          ? String(existingStudent.semester)
          : existingStudent.semesterId != null &&
              String(existingStudent.semesterId).trim() !== ""
            ? String(existingStudent.semesterId)
            : "",
      batchId: batchSel || existingStudent.batchId || "",
      status: existingStudent.status || "ACTIVE",
    });
    prevAcademicYearIdRef.current = existingStudent.academicYearId
      ? String(existingStudent.academicYearId)
      : "";
  }, [
    isEdit,
    studentId,
    studentLoading,
    existingStudent,
    departmentsLoading,
    batchesLoading,
    departmentOptions,
    batchOptions,
    authUser,
    authUserId,
    authUserLoading,
    reset,
  ]);

  const watched = useWatch({ control });

  const { data: semesterRows = [], isFetching: semestersFetching } =
    useSemestersByAcademicYear(watched?.academicYearId, {
      enabled: Boolean(String(watched?.academicYearId ?? "").trim()),
      notifyOnError: false,
    });

  const semesterOptions = useMemo(
    () =>
      semesterRows
        .map((r) => recordToSemesterApiOption(r))
        .filter(Boolean),
    [semesterRows],
  );

  useEffect(() => {
    const cur = watched?.academicYearId ?? "";
    const prev = prevAcademicYearIdRef.current ?? "";
    if (prev === cur) return;
    prevAcademicYearIdRef.current = cur;
    const initialFromEmpty = prev === "" && cur !== "";
    if (!initialFromEmpty) {
      setValue("semester", "");
    }
  }, [watched?.academicYearId, setValue]);

  const progressPct = Math.round((step / steps.length) * 100);

  const createMutation = useCreateStudent({
    toastSuccess: "studentForm.toast.createSuccess",
    toastError: "studentForm.toast.createError",
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "students",
      });
      onCompleted?.();
    },
  });

  const updateMutation = useUpdateStudent({
    toastSuccess: "studentForm.toast.updateSuccess",
    toastError: "studentForm.toast.updateError",
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "students",
      });
      if (studentId)
        void queryClient.invalidateQueries({
          queryKey: ["students", studentId],
        });
      onCompleted?.();
    },
  });

  const mapToApiBody = useCallback(
    (values) => {
      const trimmedKankor = values.kankorId.trim();
      const deptId = String(values.department ?? "").trim();
      const semId = String(values.semester ?? "").trim();
      const ayId = String(values.academicYearId ?? "").trim();
      const batchIdTrim = String(values.batchId ?? "").trim();
      const body = {
        role: (values.role && values.role.trim()) || "STUDENT_USER",
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        fatherName: values.fatherName.trim(),
        grandFatherName: values.grandFatherName.trim(),
        nationality: values.nationality.trim(),
        gender: values.gender,
        dateOfBirth: values.dateOfBirth,
        email: values.email.trim(),
        phone: values.phone.trim(),
        enrollmentDate: values.enrollmentDate,
        kankorId: trimmedKankor,
        department: deptId,
        academicYearId: ayId || undefined,
        semesterId: semId,
        semester: semId,
        status: values.status,
        batchId: batchIdTrim || undefined,
        batch: batchIdTrim ? batchIdTrim : "",
        address: {
          street: values.addressStreet.trim(),
          city: values.addressCity.trim(),
          zip: values.addressPostalCode.trim(),
        },
      };

      if (!isEdit) {
        body.username = values.username.trim();
        body.password = values.password;
      } else if (values.password?.trim()) {
        body.password = values.password;
      }

      return body;
    },
    [isEdit],
  );

  const onSubmit = (values) => {
    const body = mapToApiBody(values);
    if (isEdit && studentId) {
      updateMutation.mutate({ id: studentId, ...body });
    } else {
      createMutation.mutate(body);
    }
  };

  const goNext = async () => {
    const cfg = steps.find((s) => s.id === step);
    if (!cfg) return;
    if (
      step === 5 &&
      (departmentOptions.length === 0 ||
        batchOptions.length === 0 ||
        academicYearOptions.length === 0)
    )
      return;
    const ok = await trigger(cfg.fields);
    if (ok) setStep((s) => Math.min(s + 1, steps.length));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  const deptSelectDisabled =
    departmentsLoading || !!departmentsError || departmentOptions.length === 0;

  const batchSelectDisabled =
    batchesLoading || !!batchesError || batchOptions.length === 0;

  const academicYearSelectDisabled =
    academicYearsLoading ||
    !!academicYearsError ||
    academicYearOptions.length === 0;

  const semesterSelectDisabled =
    !String(watched?.academicYearId ?? "").trim() ||
    semestersFetching ||
    semesterOptions.length === 0;

  const deptName =
    departmentOptions.find((o) => o.value === watched?.department)?.label ??
    "—";
  const batchName =
    batchOptions.find((o) => o.value === watched?.batchId)?.label ?? "—";
  const academicYearName =
    academicYearOptions.find((o) => o.value === watched?.academicYearId)
      ?.label ?? "—";
  const semName =
    semesterOptions.find((o) => o.value === watched?.semester)?.label ?? "—";
  const summaryName = [watched?.firstName, watched?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const summaryStatusLabel =
    statusOptions.find((o) => o.value === watched?.status)?.label ??
    watched?.status ??
    "—";

  const stepTitle = steps.find((s) => s.id === step)?.titleKey;

  const completedStepSnippet = useCallback(
    (stepId) => {
      switch (stepId) {
        case 1:
          return watched?.username?.trim()
            ? `@${watched.username.trim()}`
            : "—";
        case 2:
          return (
            [watched?.firstName, watched?.lastName].filter(Boolean).join(" ") ||
            "—"
          );
        case 3:
          return watched?.email?.trim() || "—";
        case 4:
          return (
            [watched?.addressCity, watched?.addressPostalCode]
              .filter(Boolean)
              .join(", ") || "—"
          );
        case 5:
          return (
            [deptName, academicYearName, semName, batchName]
              .filter((x) => x && x !== "—")
              .join(" · ") || "—"
          );
        default:
          return "";
      }
    },
    [
      deptName,
      academicYearName,
      semName,
      batchName,
      watched,
    ],
  );

  const motionEase = [0.22, 1, 0.36, 1];

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <MotionDiv
            key="active-1"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FormSectionCard
              icon={ShieldCheck}
              tint="indigo"
              title={t("studentForm.section.account")}
              subtitle={
                isEdit
                  ? t("studentForm.section.accountEditSub")
                  : t("studentForm.section.accountSub")
              }
            >
              {isEdit ? (
                <>
                  <input type="hidden" {...register("username")} />
                  <Field
                    iconD={IC.contact}
                    label={t("studentForm.fields.username.label")}
                    autoComplete="username"
                    disabled
                    value={watched?.username ?? ""}
                  />
                </>
              ) : (
                <Field
                  iconD={IC.contact}
                  label={`${t("studentForm.fields.username.label")} *`}
                  placeholder={t("studentForm.fields.username.placeholder")}
                  autoComplete="username"
                  register={register("username", {
                    required: t("studentForm.validation.usernameRequired"),
                    minLength: {
                      value: 3,
                      message: t("studentForm.validation.usernameLength"),
                    },
                    maxLength: {
                      value: 50,
                      message: t("studentForm.validation.usernameLength"),
                    },
                    pattern: {
                      value: USERNAME_PATTERN,
                      message: t("studentForm.validation.usernamePattern"),
                    },
                  })}
                  error={errors.username?.message}
                />
              )}
              <Field
                iconD={IC.contact}
                label={
                  isEdit
                    ? t("studentForm.fields.password.optionalLabel")
                    : `${t("studentForm.fields.password.label")} *`
                }
                type="password"
                autoComplete={isEdit ? "new-password" : "new-password"}
                placeholder={
                  isEdit
                    ? t("studentForm.fields.password.placeholderEdit")
                    : t("studentForm.fields.password.placeholder")
                }
                register={register("password", {
                  required: isEdit
                    ? false
                    : t("studentForm.validation.passwordRequired"),
                  validate: (v) => {
                    if (!v || !`${v}`.trim()) return true;
                    const s = `${v}`;
                    if (s.length < 8 || s.length > 128)
                      return t("studentForm.validation.passwordLength");
                    return PASSWORD_PATTERN.test(s)
                      ? true
                      : t("studentForm.validation.passwordPattern");
                  },
                })}
                error={errors.password?.message}
              />
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t("studentForm.fields.role.label")}
                    placeholder={t("studentForm.fields.role.placeholder")}
                    options={roleOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEdit}
                  />
                )}
              />
            </FormSectionCard>
          </MotionDiv>
        );
      case 2:
        return (
          <MotionDiv
            key="active-2"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FormSectionCard
              icon={User}
              tint="violet"
              title={t("studentForm.section.basic")}
              subtitle={t("studentForm.section.basicSub")}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  iconD={IC.contact}
                  label={`${t("studentForm.fields.firstName.label")} *`}
                  placeholder={t("studentForm.fields.firstName.placeholder")}
                  readOnly={isEdit}
                  register={register("firstName", {
                    required: t("studentForm.validation.firstNameRequired"),
                    minLength: {
                      value: 2,
                      message: t("studentForm.validation.nameLength"),
                    },
                    maxLength: {
                      value: 50,
                      message: t("studentForm.validation.nameLength"),
                    },
                    pattern: {
                      value: PERSON_NAME_PATTERN,
                      message: t("studentForm.validation.namePattern"),
                    },
                  })}
                  error={errors.firstName?.message}
                />
                <Field
                  iconD={IC.contact}
                  label={`${t("studentForm.fields.lastName.label")} *`}
                  placeholder={t("studentForm.fields.lastName.placeholder")}
                  readOnly={isEdit}
                  register={register("lastName", {
                    required: t("studentForm.validation.lastNameRequired"),
                    minLength: {
                      value: 2,
                      message: t("studentForm.validation.nameLength"),
                    },
                    maxLength: {
                      value: 50,
                      message: t("studentForm.validation.nameLength"),
                    },
                    pattern: {
                      value: PERSON_NAME_PATTERN,
                      message: t("studentForm.validation.namePattern"),
                    },
                  })}
                  error={errors.lastName?.message}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label={`${t("studentForm.fields.fatherName.label")} *`}
                  placeholder={t("studentForm.fields.fatherName.placeholder")}
                  readOnly={isEdit}
                  register={register("fatherName", {
                    required: t("studentForm.validation.fatherNameRequired"),
                    minLength: {
                      value: 2,
                      message: t("studentForm.validation.nameLength"),
                    },
                    maxLength: {
                      value: 50,
                      message: t("studentForm.validation.nameLength"),
                    },
                    pattern: {
                      value: PERSON_NAME_PATTERN,
                      message: t("studentForm.validation.namePattern"),
                    },
                  })}
                  error={errors.fatherName?.message}
                />
                <Field
                  label={t("studentForm.fields.grandFatherName.label")}
                  placeholder={t(
                    "studentForm.fields.grandFatherName.placeholder",
                  )}
                  readOnly={isEdit}
                  register={register("grandFatherName", {
                    validate: (value) => {
                      const v = String(value ?? "").trim();
                      if (!v) return true;
                      if (v.length < 2 || v.length > 50)
                        return t("studentForm.validation.nameLength");
                      return PERSON_NAME_PATTERN.test(v)
                        ? true
                        : t("studentForm.validation.namePattern");
                    },
                  })}
                  error={errors.grandFatherName?.message}
                />
              </div>
            </FormSectionCard>

            <FormSectionCard
              icon={IdCard}
              tint="indigo"
              title={t("studentForm.section.identity")}
              subtitle={t("studentForm.section.identitySub")}
            >
              <Field
                iconD={IC.globe}
                label={`${t("studentForm.fields.nationality.label")} *`}
                placeholder={t("studentForm.fields.nationality.placeholder")}
                readOnly={isEdit}
                register={register("nationality", {
                  required: t("studentForm.validation.nationalityRequired"),
                  minLength: {
                    value: 2,
                    message: t("studentForm.validation.textLength"),
                  },
                  maxLength: {
                    value: 80,
                    message: t("studentForm.validation.textLength"),
                  },
                  pattern: {
                    value: TEXT_PATTERN,
                    message: t("studentForm.validation.textPattern"),
                  },
                })}
                error={errors.nationality?.message}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Controller
                  name="gender"
                  control={control}
                  rules={{
                    required: t("studentForm.validation.genderRequired"),
                  }}
                  render={({ field }) => (
                    <Select
                      label={`${t("studentForm.fields.gender.label")} *`}
                      placeholder={t("studentForm.fields.gender.placeholder")}
                      options={genderOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit}
                    />
                  )}
                />
                {isEdit ? (
                  <>
                    <input type="hidden" {...register("dateOfBirth")} />
                    <Field
                      iconD={IC.calendar}
                      label={`${t("studentForm.fields.dateOfBirth.label")} *`}
                      type="date"
                      disabled
                      value={watched?.dateOfBirth ?? ""}
                      error={errors.dateOfBirth?.message}
                    />
                  </>
                ) : (
                  <Field
                    iconD={IC.calendar}
                    label={`${t("studentForm.fields.dateOfBirth.label")} *`}
                    type="date"
                    register={register("dateOfBirth", {
                      required: t("studentForm.validation.dateOfBirthRequired"),
                      validate: (v) => {
                        if (!v) return true;
                        return isAtLeastAge(v, MIN_BIRTH_AGE_YEARS)
                          ? true
                          : t("studentForm.validation.dateOfBirthMinimumAge", {
                              years: MIN_BIRTH_AGE_YEARS,
                            });
                      },
                    })}
                    error={errors.dateOfBirth?.message}
                  />
                )}
              </div>
              {errors.gender ? (
                <p className="text-[11px] font-medium text-error">
                  {errors.gender.message}
                </p>
              ) : null}
            </FormSectionCard>
          </MotionDiv>
        );
      case 3:
        return (
          <MotionDiv
            key="active-3"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FormSectionCard
              icon={Mail}
              tint="rose"
              title={t("studentForm.section.contact")}
              subtitle={t("studentForm.section.contactSub")}
            >
              <Field
                iconD={IC.mail}
                label={`${t("studentForm.fields.email.label")} *`}
                type="email"
                placeholder={t("studentForm.fields.email.placeholder")}
                readOnly={isEdit}
                register={register("email", {
                  required: t("studentForm.validation.emailRequired"),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
                    message: t("studentForm.validation.emailInvalid"),
                  },
                })}
                error={errors.email?.message}
              />
              <Field
                iconD={IC.contact}
                label={`${t("studentForm.fields.phone.label")} *`}
                type="tel"
                placeholder={t("studentForm.fields.phone.placeholder")}
                readOnly={isEdit}
                register={register("phone", {
                  required: t("studentForm.validation.phoneRequired"),
                  pattern: {
                    value: PHONE_PATTERN,
                    message: t("studentForm.validation.phoneInvalid"),
                  },
                })}
                error={errors.phone?.message}
              />
            </FormSectionCard>
          </MotionDiv>
        );
      case 4:
        return (
          <MotionDiv
            key="active-4"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FormSectionCard
              icon={MapPin}
              tint="sky"
              title={t("studentForm.section.address")}
              subtitle={t("studentForm.section.addressSub")}
            >
              <Field
                iconD={IC.contact}
                label={`${t("studentForm.fields.addressStreet.label")} *`}
                placeholder={t("studentForm.fields.addressStreet.placeholder")}
                register={register("addressStreet", {
                  required: t("studentForm.validation.addressStreetRequired"),
                  minLength: {
                    value: 2,
                    message: t("studentForm.validation.addressPattern"),
                  },
                  maxLength: {
                    value: 120,
                    message: t("studentForm.validation.addressPattern"),
                  },
                  pattern: {
                    value: ADDRESS_PATTERN,
                    message: t("studentForm.validation.addressPattern"),
                  },
                })}
                error={errors.addressStreet?.message}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  iconD={IC.globe}
                  label={`${t("studentForm.fields.addressCity.label")} *`}
                  placeholder={t("studentForm.fields.addressCity.placeholder")}
                  register={register("addressCity", {
                    required: t("studentForm.validation.addressCityRequired"),
                    minLength: {
                      value: 2,
                      message: t("studentForm.validation.textLength"),
                    },
                    maxLength: {
                      value: 80,
                      message: t("studentForm.validation.textLength"),
                    },
                    pattern: {
                      value: TEXT_PATTERN,
                      message: t("studentForm.validation.textPattern"),
                    },
                  })}
                  error={errors.addressCity?.message}
                />
                <Field
                  label={`${t("studentForm.fields.addressPostalCode.label")} *`}
                  placeholder={t(
                    "studentForm.fields.addressPostalCode.placeholder",
                  )}
                  register={register("addressPostalCode", {
                    required: t("studentForm.validation.addressPostalRequired"),
                    pattern: {
                      value: POSTAL_CODE_PATTERN,
                      message: t("studentForm.validation.postalPattern"),
                    },
                  })}
                  error={errors.addressPostalCode?.message}
                />
              </div>
            </FormSectionCard>
          </MotionDiv>
        );
      case 5:
        return (
          <MotionDiv
            key="active-5"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            {departmentsLoading ? (
              <p className="text-xs text-muted dark:text-dark-muted">
                {t("studentForm.departmentsLoading")}
              </p>
            ) : null}
            {departmentsError ? (
              <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-[11px] text-error">
                {t("studentForm.departmentsError")}
              </p>
            ) : null}
            {!departmentsLoading &&
            !departmentsError &&
            departmentOptions.length === 0 ? (
              <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] text-warning">
                {t("studentForm.departmentsEmpty")}
              </p>
            ) : null}

            {batchesLoading ? (
              <p className="text-xs text-muted dark:text-dark-muted">
                {t("studentForm.batchesLoading")}
              </p>
            ) : null}
            {batchesError ? (
              <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-[11px] text-error">
                {t("studentForm.batchesError")}
              </p>
            ) : null}
            {!batchesLoading && !batchesError && batchOptions.length === 0 ? (
              <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] text-warning">
                {t("studentForm.batchesEmpty")}
              </p>
            ) : null}

            {academicYearsLoading ? (
              <p className="text-xs text-muted dark:text-dark-muted">
                {t("studentForm.academicYearsLoading")}
              </p>
            ) : null}
            {academicYearsError ? (
              <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-[11px] text-error">
                {t("studentForm.academicYearsError")}
              </p>
            ) : null}
            {!academicYearsLoading &&
            !academicYearsError &&
            academicYearOptions.length === 0 ? (
              <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] text-warning">
                {t("studentForm.academicYearsEmpty")}
              </p>
            ) : null}

            <FormSectionCard
              icon={GraduationCap}
              tint="sky"
              title={t("studentForm.section.program")}
              subtitle={t("studentForm.section.programSub")}
            >
              <Controller
                name="department"
                control={control}
                rules={{
                  required:
                    departmentOptions.length > 0
                      ? t("studentForm.validation.departmentRequired")
                      : false,
                }}
                render={({ field }) => (
                  <Select
                    label={`${t("studentForm.fields.department.label")} *`}
                    placeholder={t("studentForm.fields.department.placeholder")}
                    options={departmentOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={deptSelectDisabled}
                  />
                )}
              />
              {errors.department ? (
                <p className="text-[11px] font-medium text-error">
                  {errors.department.message}
                </p>
              ) : null}
              <Controller
                name="academicYearId"
                control={control}
                rules={{
                  required:
                    academicYearOptions.length > 0
                      ? t("studentForm.validation.academicYearRequired")
                      : false,
                }}
                render={({ field }) => (
                  <Select
                    label={`${t("studentForm.fields.academicYear.label")} *`}
                    placeholder={t(
                      "studentForm.fields.academicYear.placeholder",
                    )}
                    options={academicYearOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={academicYearSelectDisabled}
                  />
                )}
              />
              {errors.academicYearId ? (
                <p className="text-[11px] font-medium text-error">
                  {errors.academicYearId.message}
                </p>
              ) : null}
            </FormSectionCard>

            <FormSectionCard
              icon={CalendarRange}
              tint="emerald"
              title={t("studentForm.section.schedule")}
              subtitle={t("studentForm.section.scheduleSub")}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  iconD={IC.calendar}
                  label={`${t("studentForm.fields.enrollmentDate.label")} *`}
                  type="date"
                  register={register("enrollmentDate", {
                    required: t(
                      "studentForm.validation.enrollmentDateRequired",
                    ),
                    validate: (v) => {
                      if (!v) return true;
                      const d = new Date(v);
                      const today = new Date();
                      d.setHours(0, 0, 0, 0);
                      today.setHours(0, 0, 0, 0);
                      return (
                        d <= today ||
                        t("studentForm.validation.enrollmentDateFuture")
                      );
                    },
                  })}
                  error={errors.enrollmentDate?.message}
                />
                <Field
                  label={`${t("studentForm.fields.kankorId.label")} *`}
                  placeholder={t("studentForm.fields.kankorId.placeholder")}
                  register={register("kankorId", {
                    required: t("studentForm.validation.kankorIdRequired"),
                    setValueAs: (value) => String(value ?? "").trim(),
                    validate: (value) => {
                      const v = String(value ?? "").trim();
                      return KANKOR_ID_PATTERN.test(v)
                        ? true
                        : t("studentForm.validation.kankorIdPattern");
                    },
                  })}
                  error={errors.kankorId?.message}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Controller
                  name="semester"
                  control={control}
                  rules={{
                    required:
                      semesterOptions.length > 0
                        ? t("studentForm.validation.semesterRequired")
                        : false,
                  }}
                  render={({ field }) => (
                    <Select
                      label={`${t("studentForm.fields.semester.label")} *`}
                      placeholder={
                        !String(watched?.academicYearId ?? "").trim()
                          ? t("studentForm.fields.semester.placeholderNoYear")
                          : semestersFetching
                            ? t("studentForm.semestersLoading")
                            : t("studentForm.fields.semester.placeholder")
                      }
                      options={semesterOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={semesterSelectDisabled}
                    />
                  )}
                />
                <Controller
                  name="batchId"
                  control={control}
                  rules={{
                    required:
                      batchOptions.length > 0
                        ? t("studentForm.validation.batchRequired")
                        : false,
                  }}
                  render={({ field }) => (
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-primary dark:text-dark-primary">
                        {`${t("studentForm.fields.batch.label")} *`}
                      </span>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={batchOptions}
                        placeholder={t(
                          "studentForm.fields.batch.placeholderSelect",
                        )}
                        searchPlaceholder={t(
                          "studentForm.fields.batch.searchPlaceholder",
                        )}
                        disabled={batchSelectDisabled}
                        clearSearchOnOpen={false}
                        className="min-h-8"
                      />
                    </div>
                  )}
                />
              </div>

              <Controller
                name="status"
                control={control}
                rules={{
                  required: t("studentForm.validation.statusRequired"),
                }}
                render={({ field }) => (
                  <Select
                    label={`${t("studentForm.fields.status.label")} *`}
                    options={statusOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
              {errors.semester ? (
                <p className="text-[11px] font-medium text-error">
                  {errors.semester.message}
                </p>
              ) : null}
              {errors.batchId ? (
                <p className="text-[11px] font-medium text-error">
                  {errors.batchId.message}
                </p>
              ) : null}
              {errors.status ? (
                <p className="text-[11px] font-medium text-error">
                  {errors.status.message}
                </p>
              ) : null}
            </FormSectionCard>
          </MotionDiv>
        );
      case 6: {
        const gName =
          genderOptions.find((o) => o.value === watched?.gender)?.label ?? "—";
        const stLabel =
          statusOptions.find((o) => o.value === watched?.status)?.label ??
          watched?.status ??
          "—";
        const roleLabel =
          roleOptions.find((o) => o.value === watched?.role)?.label ??
          watched?.role ??
          "—";
        const addrSummary = [
          watched?.addressStreet,
          watched?.addressCity,
          watched?.addressPostalCode,
        ]
          .filter(Boolean)
          .join(", ");
        return (
          <MotionDiv
            key="active-6"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            layout
            className="space-y-5"
          >
            <FormSectionCard
              icon={CheckCircle2}
              tint="emerald"
              title={t("studentForm.steps.review")}
              subtitle={t("studentForm.summary.subtitle")}
            >
              <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                <ReviewRow
                  k={t("studentForm.fields.username.label")}
                  v={watched?.username}
                />
                <ReviewRow
                  k={t("studentForm.fields.role.label")}
                  v={roleLabel}
                />
                <ReviewRow
                  k={t("studentForm.summary.passwordMasked")}
                  v="••••••••"
                />
                <ReviewRow
                  k={t("studentForm.fields.firstName.label")}
                  v={watched?.firstName}
                />
                <ReviewRow
                  k={t("studentForm.fields.lastName.label")}
                  v={watched?.lastName}
                />
                <ReviewRow
                  k={t("studentForm.fields.fatherName.label")}
                  v={watched?.fatherName}
                />
                <ReviewRow
                  k={t("studentForm.fields.grandFatherName.label")}
                  v={watched?.grandFatherName}
                />
                <ReviewRow
                  k={t("studentForm.fields.nationality.label")}
                  v={watched?.nationality}
                />
                <ReviewRow k={t("studentForm.fields.gender.label")} v={gName} />
                <ReviewRow
                  k={t("studentForm.fields.dateOfBirth.label")}
                  v={watched?.dateOfBirth}
                />
                <ReviewRow
                  k={t("studentForm.fields.email.label")}
                  v={watched?.email}
                />
                <ReviewRow
                  k={t("studentForm.fields.phone.label")}
                  v={watched?.phone}
                />
                <ReviewRow
                  k={t("studentForm.summary.address")}
                  v={addrSummary}
                />
                <ReviewRow
                  k={t("studentForm.fields.department.label")}
                  v={deptName}
                />
                <ReviewRow
                  k={t("studentForm.fields.academicYear.label")}
                  v={academicYearName !== "—" ? academicYearName : "—"}
                />
                <ReviewRow
                  k={t("studentForm.fields.semester.label")}
                  v={semName}
                />
                <ReviewRow
                  k={t("studentForm.fields.batch.label")}
                  v={batchName}
                />
                <ReviewRow
                  k={t("studentForm.fields.enrollmentDate.label")}
                  v={watched?.enrollmentDate}
                />
                <ReviewRow
                  k={t("studentForm.fields.kankorId.label")}
                  v={watched?.kankorId}
                />
                <ReviewRow
                  k={t("studentForm.fields.status.label")}
                  v={stLabel}
                />
              </div>
            </FormSectionCard>
          </MotionDiv>
        );
      }
      default:
        return null;
    }
  };

  if (isEdit && studentLoading) {
    return (
      <div
        className={[className, "mx-auto w-full max-w-[min(100%,92rem)] py-24"]
          .filter(Boolean)
          .join(" ")}
      >
        <p className="text-center text-sm text-muted dark:text-dark-muted">
          {t("studentForm.loadingStudent")}
        </p>
      </div>
    );
  }

  if (isEdit && !studentLoading && studentFetchError && !existingStudent) {
    return (
      <div
        className={[className, "mx-auto w-full max-w-[min(100%,92rem)] py-16"]
          .filter(Boolean)
          .join(" ")}
      >
        <p className="text-center text-sm text-error">
          {t("studentForm.studentLoadFailed")}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className={["mx-auto w-full max-w-[min(100%,92rem)] pb-28", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="card rounded-xl px-6 py-8 md:px-10 md:py-10">
        <header className="mb-8 border-default  flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between dark:border-dark-default">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-light-nav-text-active)" }}
            >
              {t("sidebar.brand")}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-[1.65rem] dark:text-dark-primary">
              {isEdit
                ? t("studentForm.header.editTitle")
                : t("studentForm.header.createTitle")}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary dark:text-dark-secondary">
              {t("studentForm.hero.subtitle")}
            </p>
          </div>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="btn-tertiary shrink-0 rounded-xl px-4 py-2 text-xs shadow-sm"
            >
              {t("studentForm.actions.cancel")}
            </button>
          ) : null}
        </header>

        {/* References form.jpg: narrow step rail in the corner + centered form lane + summary */}
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-x-10 2xl:gap-x-14">
          {/* ── Vertical step rail (desktop) / horizontal pills (mobile) ── */}
          <nav
            aria-label="Registration steps"
            className="shrink-0 xl:sticky xl:top-6 xl:w-[11.5rem] xl:max-w-[11.5rem] 2xl:w-52 2xl:max-w-none"
          >
            {/* Mobile: horizontal step chips */}
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
                          : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
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
            {/* Desktop: vertical timeline */}
            <ol className="relative hidden space-y-0 xl:block">
              {steps.map((s, i) => {
                const active = s.id === step;
                const done = s.id < step;
                const IconStep = s.icon;
                return (
                  <li key={s.id} className="relative flex gap-3 pb-8 last:pb-0">
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
                        style={
                          active
                            ? { color: "var(--color-light-timeline-text)" }
                            : done
                              ? { color: "var(--color-chart-success)" }
                              : undefined
                        }
                        className={[
                          "block text-[11px] font-semibold leading-snug break-words",
                          !active && !done
                            ? "text-secondary dark:text-dark-secondary"
                            : "",
                          active
                            ? "dark:!text-[color:var(--color-dark-timeline-text)]"
                            : "",
                          done
                            ? "dark:!text-[color:var(--color-chart-success)]"
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

          {/* ── Center form column (bounded width, visually centered between rails) ── */}
          <div className="min-w-0 flex-1 xl:flex xl:justify-center xl:px-2">
            <div className="w-full space-y-6 xl:max-w-[48rem] 2xl:max-w-[52rem]">
              <div className="overflow-hidden rounded-2xl border border-(--color-light-success-border) bg-(--color-light-success-bg) p-4 sm:p-5 dark:border-(--color-dark-success-border) dark:bg-(--color-dark-success-bg)">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-(--color-light-success-text) dark:text-(--color-dark-success-text)">
                      {t("studentForm.progress.percent", {
                        pct: progressPct,
                      })}
                    </p>
                    <p className="mt-1 text-[11px] text-(--color-light-success-text) opacity-90 dark:text-(--color-dark-success-text)">
                      {t("studentForm.progress.hint")}
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
                {stepTitle ? t(stepTitle) : ""}
              </h2>

              <LayoutGroup id="student-reg-flow">
                <div className="min-h-[200px] space-y-5">
                  <div className="space-y-3">
                    <AnimatePresence initial={false} mode="popLayout">
                      {steps
                        .filter((s) => s.id < step && s.id < 6)
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
                              className="flex items-start gap-3 rounded-xl border border-(--color-light-border-default) bg-light-app-secondary px-4 py-3 shadow--xs dark:border-(--color-dark-border-default) dark:bg-(--color-dark-app-secondary) dark:shadow-[var(--shadow-dark-xs)]"
                            >
                              <span
                                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-(--color-light-card-bg) dark:bg-(--color-dark-card-bg)"
                                style={{
                                  borderColor: "var(--color-chart-success)",
                                  color: "var(--color-chart-success)",
                                }}
                              >
                                <DoneIcon className="size-4" strokeWidth={2} />
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
                                className="mt-1 size-4 shrink-0"
                                strokeWidth={2}
                                aria-hidden
                                style={{ color: "var(--color-chart-success)" }}
                              />
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </div>
                  <AnimatePresence mode="wait">{stepContent()}</AnimatePresence>
                </div>
              </LayoutGroup>

              <footer className="mt-10 space-y-4 border-t pt-6 dark:border-dark-border-default">
                <div className="flex items-center gap-2 text-[11px] text-muted dark:text-dark-muted">
                  <Clock3 className="size-3.5 shrink-0 opacity-70" />
                  <span>{t("studentForm.savedHint")}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-h-9 min-w-[6.5rem]">
                    {step > 1 ? (
                      <Button type="button" variant="secondary" onClick={goPrev}>
                        {t("studentForm.actions.back")}
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {step < steps.length ? (
                      <button
                        type="button"
                        onClick={() => void goNext()}
                        disabled={
                          (step === 5 &&
                            (deptSelectDisabled ||
                              batchSelectDisabled ||
                              academicYearSelectDisabled ||
                              semesterSelectDisabled)) ||
                          createMutation.isPending ||
                          updateMutation.isPending
                        }
                        className="btn-primary min-h-9 px-6 text-xs"
                      >
                        {t("studentForm.actions.continue")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          createMutation.isPending || updateMutation.isPending
                        }
                        onClick={() => void handleSubmit(onSubmit)()}
                        className="btn-primary min-h-9 min-w-40 rounded-full px-6 text-xs"
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? t("studentForm.actions.submitting")
                          : isEdit
                            ? t("studentForm.actions.save")
                            : t("studentForm.actions.create")}
                      </button>
                    )}
                  </div>
                </div>
              </footer>
            </div>
          </div>

          {/* ── Summary column ── */}
          <aside className="shrink-0 xl:sticky xl:top-6 xl:h-fit xl:w-[17.5rem] xl:max-w-[280px]">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-primary dark:text-dark-primary">
                {t("studentForm.summary.title")}
              </h3>
              <p className="mt-1 text-[11px] text-muted dark:text-dark-muted">
                {t("studentForm.summary.subtitle")}
              </p>
              <ul className="mt-5 space-y-3 border-t pt-5 text-[11px] dark:border-dark-default border-default">
                <SummaryLine
                  label={t("studentForm.fields.username.label")}
                  value={
                    watched?.username?.trim()
                      ? `@${watched.username.trim()}`
                      : "—"
                  }
                />
                <SummaryLine
                  label={t("studentForm.summary.fullName")}
                  value={summaryName || "—"}
                />
                <SummaryLine
                  label={t("studentForm.summary.email")}
                  value={watched?.email || "—"}
                />
                <SummaryLine
                  label={t("studentForm.summary.phone")}
                  value={watched?.phone || "—"}
                />
                <SummaryLine
                  label={t("studentForm.summary.department")}
                  value={deptName}
                />
                <SummaryLine
                  label={t("studentForm.fields.academicYear.label")}
                  value={academicYearName !== "—" ? academicYearName : "—"}
                />
                <SummaryLine
                  label={t("studentForm.summary.semester")}
                  value={semName !== "—" ? semName : "—"}
                />
                <SummaryLine
                  label={t("studentForm.fields.batch.label")}
                  value={
                    watched?.batchId
                      ? batchName !== "—"
                        ? batchName
                        : watched.batchId
                      : "—"
                  }
                />
                <SummaryLine
                  label={t("studentForm.summary.statusLabel")}
                  value={summaryStatusLabel}
                />
              </ul>
              <div className="mt-6 flex items-center gap-2 rounded-xl px-3 py-2 dark:bg-(--color-dark-card-hover) bg-(--color-light-nav-hover-bg)">
                <Icon
                  d={IC.check}
                  className="size-3"
                  style={{ color: "var(--color-chart-success)" }}
                />
                <span className="text-[10px] font-medium text-secondary dark:text-dark-secondary">
                  Step {step} / {steps.length}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </form>
  );
}

function SummaryLine({ label, value }) {
  return (
    <li className="flex justify-between gap-3 border-b pb-2 last:border-0 last:pb-0 dark:border-dark-default border-default">
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
    <div className="rounded-lg bg-slate-50/90 px-3 py-2 dark:bg-slate-800/60">
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
        {k}
      </div>
      <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
        {display}
      </div>
    </div>
  );
}
