import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarRange,
  CheckCircle2,
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
import Field from "./Field";
import Icon from "./Icon";
import IC from "./IC";
import Select from "./Select";
import FacultyRegistrationShell, {
  FacultyReviewRow,
  FacultySummaryLine,
  facultyStepMotion,
} from "./faculty/FacultyRegistrationShell";
import {
  useCreateTeacher,
  useDepartments,
  useTeacher,
  useUpdateTeacher,
  useUser,
} from "../services/useApi";
const MotionDiv = motion.div;

const USERNAME_PATTERN =
  /^(?!.*[._]{2})[A-Za-z][A-Za-z0-9._]{1,48}[A-Za-z0-9]$/;
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
/** Backend TeacherRequest phone pattern */
const TEACHER_PHONE_PATTERN = /^07\d{8}$/;
const PERSON_NAME_PATTERN = /^[\p{L}](?:[\p{L} .'-]{0,48}[\p{L}])$/u;
const TEXT_PATTERN = /^[\p{L}][\p{L}\s.'-]{1,79}$/u;
const ADDRESS_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s,.-]{4,149}$/u;
const POSTAL_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 -]{2,19}$/;
const MIN_BIRTH_AGE_YEARS = 10;

function parseDateOnly(value) {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
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
const EDUCATION_RANK_VALUES = [
  "HIGH_SCHOOL",
  "DIPLOMA",
  "BACHELOR",
  "MASTER",
  "PHD",
];

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

function matchDepartmentSelection(entity, options) {
  if (!entity || !options?.length) return "";
  const byId =
    entity.department != null && `${entity.department}`.trim() !== ""
      ? String(entity.department)
      : "";
  if (byId && options.some((o) => o.value === byId)) return byId;
  const name = entity.department;
  if (!name) return "";
  const found = options.find(
    (o) =>
      String(o.label).toLowerCase().trim() ===
      String(name).toLowerCase().trim(),
  );
  return found?.value ?? "";
}

const tintIconBox = {
  violet:
    "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
  indigo:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300",
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
    <div className="rounded-xl border border-default bg-light-card-bg p-5 shadow-sm backdrop-blur-sm dark:border-dark-card-border dark:bg-dark-card-bg dark:shadow-none sm:p-6">
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

export default function TeacherRegistrationWizard({
  mode = "create",
  teacherId = null,
  onCompleted,
  onCancel,
  className = "",
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const isEdit = mode === "edit" && Boolean(teacherId);

  const {
    data: departmentsData,
    isLoading: departmentsLoading,
    isError: departmentsError,
  } = useDepartments({ notifyOnError: false });

  const {
    data: existingTeacher,
    isLoading: teacherLoading,
    isError: teacherFetchError,
  } = useTeacher(teacherId, {
    enabled: isEdit,
    notifyOnError: false,
  });

  const authUserId =
    existingTeacher?.keycloakId || existingTeacher?.linkedApplicationUserId || "";
  const { data: authUser, isLoading: authUserLoading } = useUser(authUserId, {
    enabled: isEdit && Boolean(authUserId),
    notifyOnError: false,
  });

  const departmentOptions = useMemo(() => {
    return normalizeDepartmentsPayload(departmentsData).map((r) =>
      recordToDepartmentOption(r),
    );
  }, [departmentsData]);

  const deptSelectDisabled =
    departmentsLoading || !!departmentsError || departmentOptions.length === 0;

  const educationRankOptions = useMemo(
    () =>
      EDUCATION_RANK_VALUES.map((v) => ({
        value: v,
        label: t(`teacherForm.educationRank.${v}`),
      })),
    [t],
  );

  const roleOptions = useMemo(
    () => [{ value: "TEACHER_USER", label: t("teacherForm.roles.TEACHER") }],
    [t],
  );

  const steps = useMemo(
    () => [
      { id: 1, titleKey: "teacherForm.steps.account", icon: KeyRound },
      {
        id: 2,
        titleKey: "teacherForm.steps.personal",
        icon: UserCircle2,
      },
      { id: 3, titleKey: "teacherForm.steps.contact", icon: Mail },
      { id: 4, titleKey: "teacherForm.steps.address", icon: MapPin },
      {
        id: 5,
        titleKey: "teacherForm.steps.placement",
        icon: GraduationCap,
      },
      {
        id: 6,
        titleKey: "teacherForm.steps.review",
        icon: CheckCircle2,
      },
    ],
    [],
  );

  const motionEase = [0.22, 1, 0.36, 1];

  const hydratedRef = useRef(null);

  useEffect(() => {
    hydratedRef.current = null;
  }, [teacherId]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
      role: "TEACHER_USER",
      firstName: "",
      lastName: "",
      fatherName: "",
      grandFatherName: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      addressStreet: "",
      addressCity: "",
      addressPostalCode: "",
      addressProvince: "",
      department: "",
      educationRank: "BACHELOR",
      enrollmentDate: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (!isEdit || !teacherId) return;
    if (teacherLoading || !existingTeacher) return;
    if (
      !(
        existingTeacher.username ||
        existingTeacher.userName ||
        existingTeacher.user_name
      ) &&
      authUserId &&
      authUserLoading
    )
      return;
    if (hydratedRef.current === teacherId) return;
    hydratedRef.current = teacherId;

    const deptSel = matchDepartmentSelection(
      existingTeacher,
      departmentOptions,
    );

    reset({
      username:
        firstNonBlank(
          existingTeacher.username,
          existingTeacher.userName,
          existingTeacher.user_name,
          usernameFromAccount(authUser),
        ),
      password: "",
      role: existingTeacher.role ?? "TEACHER_USER",
      firstName: existingTeacher.firstName ?? "",
      lastName: existingTeacher.lastName ?? "",
      fatherName: existingTeacher.fatherName ?? "",
      grandFatherName: existingTeacher.grandFatherName ?? "",
      dateOfBirth: toDateInputValue(existingTeacher.dateOfBirth),
      email: existingTeacher.email ?? "",
      phone: existingTeacher.phone ?? "",
      addressStreet: existingTeacher.addressStreet ?? "",
      addressCity: existingTeacher.addressCity ?? "",
      addressPostalCode: existingTeacher.addressPostalCode ?? "",
      addressProvince: existingTeacher.addressProvince ?? "",
      department:
        deptSel ||
        existingTeacher.departmentId ||
        existingTeacher.department ||
        "",
      educationRank:
        existingTeacher.educationRank &&
        EDUCATION_RANK_VALUES.includes(existingTeacher.educationRank)
          ? existingTeacher.educationRank
          : "BACHELOR",
      enrollmentDate:
        toDateInputValue(existingTeacher.enrollmentDate) ||
        new Date().toISOString().slice(0, 10),
    });
  }, [
    isEdit,
    teacherId,
    teacherLoading,
    existingTeacher,
    authUser,
    authUserId,
    authUserLoading,
    departmentOptions,
    reset,
  ]);

  const watched = useWatch({ control });
  const progressPct = Math.round((step / steps.length) * 100);

  const mapToApiBody = useCallback(
    (values) => {
      const body = {
        userName: firstNonBlank(
          values.username,
          existingTeacher?.username,
          existingTeacher?.userName,
          existingTeacher?.user_name,
          usernameFromAccount(authUser),
        ),
        role: (values.role && values.role.trim()) || "TEACHER_USER",
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        fatherName: values.fatherName.trim(),
        grandFatherName: (values.grandFatherName ?? "").trim() || undefined,
        dateOfBirth: values.dateOfBirth,
        email: values.email.trim(),
        phone: values.phone.trim(),
        educationRank: values.educationRank,
        department: String(values.department ?? "").trim(),
        enrollmentDate: values.enrollmentDate,
        address: {
          street: values.addressStreet.trim(),
          city: values.addressCity.trim(),
          zip: values.addressPostalCode.trim(),
          province: (values.addressProvince ?? "").trim() || undefined,
        },
      };
      if (!isEdit) {
        body.password = values.password;
      } else if (values.password?.trim()) {
        body.password = values.password;
      }
      return body;
    },
    [authUser, existingTeacher, isEdit],
  );

  const createMutation = useCreateTeacher({
    toastSuccess: "teacherForm.toast.createSuccess",
    toastError: "teacherForm.toast.createError",
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "teachers",
      });
      onCompleted?.();
    },
  });

  const updateMutation = useUpdateTeacher({
    toastSuccess: "teacherForm.toast.updateSuccess",
    toastError: "teacherForm.toast.updateError",
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "teachers",
      });
      if (teacherId)
        void queryClient.invalidateQueries({ queryKey: ["teachers", teacherId] });
      onCompleted?.();
    },
  });

  const pending = createMutation.isPending || updateMutation.isPending;

  const onValidSubmit = (values) => {
    const body = mapToApiBody(values);
    if (isEdit && teacherId) updateMutation.mutate({ id: teacherId, ...body });
    else createMutation.mutate(body);
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  const advanceStep = () =>
    setStep((s) => Math.min(s + 1, steps.length));

  const deptName =
    departmentOptions.find((o) => o.value === watched?.department)?.label ??
    "—";

  const educationLabel =
    educationRankOptions.find((o) => o.value === watched?.educationRank)
      ?.label ?? watched?.educationRank ?? "—";

  const summaryName = [watched?.firstName, watched?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const completedSnippet = useCallback(
    (stepId) => {
      switch (stepId) {
        case 1:
          return watched?.username?.trim()
            ? `@${watched.username.trim()}`
            : "—";
        case 2:
          return (
            [
              watched?.firstName,
              watched?.lastName,
              watched?.fatherName,
              watched?.dateOfBirth,
            ]
              .filter(Boolean)
              .join(" · ") || "—"
          );
        case 3:
          return watched?.email?.trim()
            ? `${watched.email} · ${watched?.phone ?? ""}`
            : "—";
        case 4:
          return [watched?.addressCity, watched?.addressPostalCode]
            .filter(Boolean)
            .join(", ") || "—";
        case 5:
          return `${deptName} · ${educationLabel} · ${watched?.enrollmentDate ?? ""}`;
        default:
          return "";
      }
    },
    [
      deptName,
      educationLabel,
      watched,
    ],
  );

  const stepTitle = steps.find((s) => s.id === step)?.titleKey;

  const eduRankOpt = educationRankOptions.find(
    (o) => o.value === watched?.educationRank,
  );
  const erLabel = eduRankOpt?.label ?? watched?.educationRank ?? "—";

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <MotionDiv
            key="ac1"
            variants={facultyStepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
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
                autoComplete="new-password"
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
            key="ac2"
            variants={facultyStepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            className="space-y-5"
          >
            <FormSectionCard
              icon={User}
              tint="violet"
              title={t("studentForm.section.basic")}
              subtitle={t("teacherForm.section.personalTeacherSub")}
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
              subtitle={t("teacherForm.section.dobOnlySub")}
            >
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
            </FormSectionCard>
          </MotionDiv>
        );
      case 3:
        return (
          <MotionDiv
            key="ac3"
            variants={facultyStepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
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
                    value: TEACHER_PHONE_PATTERN,
                    message: t("teacherForm.validation.phonePattern"),
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
            key="ac4"
            variants={facultyStepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            className="space-y-5"
          >
            <FormSectionCard
              icon={MapPin}
              tint="sky"
              title={t("studentForm.section.address")}
              subtitle={t("teacherForm.section.addressTeacherSub")}
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
              <Field
                label={t("teacherForm.fields.addressProvince.label")}
                placeholder={t(
                  "teacherForm.fields.addressProvince.placeholder",
                )}
                register={register("addressProvince", {
                  validate: (value) => {
                    const v = String(value ?? "").trim();
                    if (!v) return true;
                    if (v.length < 2 || v.length > 80)
                      return t("studentForm.validation.textLength");
                    return TEXT_PATTERN.test(v)
                      ? true
                      : t("studentForm.validation.textPattern");
                  },
                })}
                error={errors.addressProvince?.message}
              />
            </FormSectionCard>
          </MotionDiv>
        );
      case 5:
        return (
          <MotionDiv
            key="ac5"
            variants={facultyStepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
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

            <FormSectionCard
              icon={GraduationCap}
              tint="sky"
              title={t("teacherForm.section.placementTitle")}
              subtitle={t("teacherForm.section.placementSub")}
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
                    name="department"
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
                name="educationRank"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    label={`${t("teacherForm.fields.educationRank.label")} *`}
                    placeholder={t(
                      "teacherForm.fields.educationRank.placeholder",
                    )}
                    options={educationRankOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </FormSectionCard>

            <FormSectionCard
              icon={CalendarRange}
              tint="emerald"
              title={t("teacherForm.section.enrollmentTitle")}
              subtitle={t("teacherForm.section.enrollmentSub")}
            >
              <Field
                iconD={IC.calendar}
                label={`${t("studentForm.fields.enrollmentDate.label")} *`}
                type="date"
                register={register("enrollmentDate", {
                  required: t("teacherForm.validation.enrollmentDateRequired"),
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
            </FormSectionCard>
          </MotionDiv>
        );
      case 6: {
        const gName = watched?.grandFatherName?.trim() || "—";
        const addrSummary = [
          watched?.addressStreet,
          watched?.addressCity,
          watched?.addressPostalCode,
          watched?.addressProvince,
        ]
          .filter(Boolean)
          .join(", ");
        return (
          <MotionDiv
            key="ac6"
            variants={facultyStepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.38, ease: motionEase }}
            className="space-y-5"
          >
            <FormSectionCard
              icon={CheckCircle2}
              tint="emerald"
              title={t("studentForm.steps.review")}
              subtitle={t("teacherForm.section.reviewSub")}
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <FacultyReviewRow
                  k={t("studentForm.fields.username.label")}
                  v={watched?.username}
                />
                <FacultyReviewRow
                  k={t("studentForm.summary.fullName")}
                  v={summaryName}
                />
                <FacultyReviewRow
                  k={t("studentForm.fields.fatherName.label")}
                  v={watched?.fatherName}
                />
                <FacultyReviewRow
                  k={t("studentForm.fields.grandFatherName.label")}
                  v={gName}
                />
                <FacultyReviewRow
                  k={t("studentForm.fields.dateOfBirth.label")}
                  v={watched?.dateOfBirth}
                />
                <FacultyReviewRow
                  k={t("studentForm.fields.email.label")}
                  v={watched?.email}
                />
                <FacultyReviewRow
                  k={t("studentForm.fields.phone.label")}
                  v={watched?.phone}
                />
                <FacultyReviewRow
                  k={t("studentForm.summary.address")}
                  v={addrSummary}
                />
                <FacultyReviewRow
                  k={t("studentForm.fields.department.label")}
                  v={deptName}
                />
                <FacultyReviewRow
                  k={t("teacherForm.fields.educationRank.label")}
                  v={erLabel}
                />
                <FacultyReviewRow
                  k={t("studentForm.fields.enrollmentDate.label")}
                  v={watched?.enrollmentDate}
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

  if (isEdit && teacherLoading) {
    return (
      <div
        className={[className, "mx-auto w-full max-w-[min(100%,92rem)] py-24"]
          .filter(Boolean)
          .join(" ")}
      >
        <p className="text-center text-sm text-muted dark:text-dark-muted">
          {t("teacherForm.loadingRecord")}
        </p>
      </div>
    );
  }

  if (isEdit && !teacherLoading && teacherFetchError && !existingTeacher) {
    return (
      <div
        className={[className, "mx-auto w-full max-w-[min(100%,92rem)] py-16"]
          .filter(Boolean)
          .join(" ")}
      >
        <p className="text-center text-sm text-error">
          {t("teacherForm.recordNotFound")}
        </p>
      </div>
    );
  }

  const summaryLines = (
    <>
      <FacultySummaryLine
        label={t("studentForm.fields.username.label")}
        value={
          watched?.username?.trim() ? `@${watched.username.trim()}` : "—"
        }
      />
      <FacultySummaryLine
        label={t("studentForm.summary.fullName")}
        value={summaryName || "—"}
      />
      <FacultySummaryLine
        label={t("teacherForm.summary.educationRank")}
        value={erLabel !== "—" ? erLabel : "—"}
      />
      <FacultySummaryLine
        label={t("studentForm.fields.department.label")}
        value={deptName !== "—" ? deptName : "—"}
      />
      <FacultySummaryLine
        label={t("studentForm.fields.enrollmentDate.label")}
        value={watched?.enrollmentDate || "—"}
      />
    </>
  );

  const fieldsStep1 = isEdit ? [] : ["username", "password", "role"];
  const validateStep = async () => {
    const cfg = steps.find((s) => s.id === step);
    if (!cfg) return false;
    if (step === 5 && deptSelectDisabled) return false;
    if (step === 1 && fieldsStep1.length === 0) return true;
    const fieldsByStep = {
      1: fieldsStep1,
      2: [
        "firstName",
        "lastName",
        "fatherName",
        "grandFatherName",
        "dateOfBirth",
      ],
      3: ["email", "phone"],
      4: ["addressStreet", "addressCity", "addressPostalCode"],
      5: ["department", "educationRank", "enrollmentDate"],
      6: [],
    };
    const flds = fieldsByStep[step] ?? [];
    if (!flds.length) return true;
    return trigger(flds);
  };

  return (
    <FacultyRegistrationShell
      isEdit={isEdit}
      className={className}
      onCancel={onCancel}
      onSubmit={handleSubmit(onValidSubmit)}
      steps={steps}
      step={step}
      progressPct={progressPct}
      stepTitleKey={stepTitle}
      progressPercentKey="studentForm.progress.percent"
      progressHintKey="studentForm.progress.hint"
      stackUpToExclusive={6}
      completedSnippet={completedSnippet}
      stepContent={
        <AnimatePresence mode="wait">{stepContent()}</AnimatePresence>
      }
      summaryLines={summaryLines}
      continueDisabled={
        step === 5 && deptSelectDisabled
      }
      actionPending={pending}
      goPrev={goPrev}
      goNext={async () => {
        const ok = await validateStep();
        if (ok) advanceStep();
      }}
      headerTitleEditKey="teacherForm.header.editTitle"
      headerTitleCreateKey="teacherForm.header.createTitle"
      heroSubtitleKey="teacherForm.header.subtitle"
      lastSubmitEditKey="teacherForm.actions.save"
      lastSubmitCreateKey="teacherForm.actions.submitCreate"
      summaryTitleKey="studentForm.summary.title"
      summarySubtitleKey="teacherForm.summary.subtitle"
    />
  );
}
