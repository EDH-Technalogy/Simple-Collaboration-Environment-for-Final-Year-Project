import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Building2, KeyRound, User } from "lucide-react";
import Button from "./Button";
import Field from "./Field";
import Select from "./Select";
import { useDepartments } from "../services/useApi";
import {
  useAdminEmployees,
  useAdminTeachers,
  useUpsertEmployee,
  useUpsertTeacher,
} from "../hooks/useAdminStaffDirectory";

const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
const PHONE_PATTERN = /^[0-9+-]{7,15}$/;

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
    record?.id ?? record?.departmentId ?? record?.uuid ?? record?.code ?? "";
  const label =
    record?.name ??
    record?.title ??
    record?.departmentName ??
    (id !== "" && id != null ? String(id) : "") ??
    "—";
  const value = String(id !== "" && id != null ? id : label);
  return { value, label: String(label || value), raw: record };
}

function sectionCardBorder() {
  return "rounded-xl border border-default bg-light-card-bg p-5 shadow-sm dark:border-dark-default dark:bg-dark-card-bg dark:shadow-none sm:p-6";
}

function matchDepartment(record, options) {
  if (!record || !options?.length) return "";
  const byId =
    record.departmentId != null && `${record.departmentId}`.trim() !== ""
      ? String(record.departmentId)
      : "";
  if (byId && options.some((o) => o.value === byId)) return byId;
  const name = record.department;
  if (!name) return "";
  const found = options.find(
    (o) =>
      String(o.label).toLowerCase().trim() ===
      String(name).toLowerCase().trim(),
  );
  return found?.value ?? "";
}

function defaultFormValues() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    departmentId: "",
    departmentText: "",
    joined: new Date().toISOString().slice(0, 10),
    status: "pending",
    username: "",
    password: "",
    confirmPassword: "",
  };
}

export default function StaffRegistrationWizard({
  variant = "teacher",
  mode = "create",
  recordId = null,
  onCompleted,
}) {
  const { t } = useTranslation();
  const ns = variant === "teacher" ? "teacherForm" : "employeeForm";
  const isEdit = mode === "edit" && recordId != null && `${recordId}` !== "";

  const [step, setStep] = useState(1);

  const { data: departmentsData } = useDepartments({ notifyOnError: false });
  const teachersQ = useAdminTeachers({
    notifyOnError: false,
    enabled: variant === "teacher" && isEdit,
  });
  const employeesQ = useAdminEmployees({
    notifyOnError: false,
    enabled: variant === "employee" && isEdit,
  });

  const list =
    variant === "teacher"
      ? (teachersQ.data ?? [])
      : (employeesQ.data ?? []);
  const loadingRecord =
    isEdit &&
    (variant === "teacher" ? teachersQ.isPending : employeesQ.isPending);
  const record = useMemo(
    () =>
      list.find(
        (r) => `${r?.id ?? ""}` === `${recordId ?? ""}`,
      ) ?? null,
    [list, recordId],
  );

  const departmentOptions = useMemo(() => {
    return normalizeDepartmentsPayload(departmentsData).map((r) =>
      recordToDepartmentOption(r),
    );
  }, [departmentsData]);
  const hasDeptDirectory = departmentOptions.length > 0;

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: defaultFormValues(),
  });

  useEffect(() => {
    if (!isEdit || !record) return;

    reset({
      firstName: record.firstName ?? "",
      lastName: record.lastName ?? "",
      email: record.email ?? "",
      phone: record.phone ?? "",
      departmentId: hasDeptDirectory ? matchDepartment(record, departmentOptions) : "",
      departmentText: !hasDeptDirectory ? (record.department ?? "") : "",
      joined: (record.joined ?? "").slice(0, 10) || "",
      status: (record.status ?? "pending").toLowerCase(),
      username: record.username ?? "",
      password: "",
      confirmPassword: "",
    });
    setStep(1);
  }, [isEdit, record, reset, departmentOptions, hasDeptDirectory]);

  const upsertTeacher = useUpsertTeacher();
  const upsertEmployee = useUpsertEmployee();
  const saving = upsertTeacher.isPending || upsertEmployee.isPending;

  const steps = [
    { id: 1, label: t(`${ns}.steps.personal`), icon: User },
    { id: 2, label: t(`${ns}.steps.assignment`), icon: Building2 },
    { id: 3, label: t(`${ns}.steps.access`), icon: KeyRound },
  ];

  const statusOptions = useMemo(
    () => [
      { value: "active", label: t("adminShared.status.active") },
      { value: "pending", label: t("adminShared.status.pending") },
      { value: "rejected", label: t("adminShared.status.rejected") },
      { value: "suspended", label: t("adminShared.status.suspended") },
    ],
    [t],
  );

  const onFinalSubmit = async (data) => {
    clearErrors(["password", "confirmPassword"]);

    let departmentLabel = "";
    let depIdStr = "";

    if (hasDeptDirectory) {
      depIdStr = (data.departmentId ?? "").trim();
      departmentLabel =
        departmentOptions.find((o) => o.value === depIdStr)?.label?.trim() ||
        "";
    } else {
      departmentLabel = (data.departmentText ?? "").trim();
    }

    if (hasDeptDirectory && !depIdStr) {
      setError("departmentId", {
        type: "manual",
        message: t(`studentForm.validation.departmentRequired`),
      });
      return;
    }
    if (!hasDeptDirectory && !departmentLabel) {
      setError("departmentText", {
        type: "manual",
        message: t(`${ns}.validation.departmentRequired`),
      });
      return;
    }

    const pwd = (data.password ?? "").trim();
    const cpwd = (data.confirmPassword ?? "").trim();

    if (!isEdit) {
      if (!PASSWORD_PATTERN.test(pwd)) {
        setError("password", {
          type: "manual",
          message: t(`studentForm.validation.passwordPattern`),
        });
        return;
      }
      if (pwd !== cpwd) {
        setError("confirmPassword", {
          type: "manual",
          message: t(`${ns}.validation.passwordMismatch`),
        });
        return;
      }
    } else if (pwd) {
      if (!PASSWORD_PATTERN.test(pwd)) {
        setError("password", {
          type: "manual",
          message: t(`studentForm.validation.passwordPattern`),
        });
        return;
      }
      if (pwd !== cpwd) {
        setError("confirmPassword", {
          type: "manual",
          message: t(`${ns}.validation.passwordMismatch`),
        });
        return;
      }
    }

    const payloadBase = {
      ...(isEdit ? { id: record.id } : {}),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      departmentId: hasDeptDirectory ? depIdStr : "",
      department: departmentLabel,
      status: String(data.status).toLowerCase(),
      joined: data.joined,
      username: data.username.trim(),
    };

    try {
      if (variant === "teacher") {
        await upsertTeacher.mutateAsync(payloadBase);
      } else {
        await upsertEmployee.mutateAsync(payloadBase);
      }
      window.GooeyToaster?.success?.(
        t(isEdit ? `${ns}.toast.updateSuccess` : `${ns}.toast.createSuccess`),
      );
      onCompleted?.();
    } catch (e) {
      window.GooeyToaster?.error?.(
        e?.message || t(isEdit ? `${ns}.toast.updateError` : `${ns}.toast.createError`),
      );
    }
  };

  const goNext = async () => {
    if (step === 1) {
      const ok = await trigger(["firstName", "lastName", "email", "phone"]);
      if (ok) setStep(2);
      return;
    }
    if (step === 2) {
      const depOk = hasDeptDirectory
        ? await trigger("departmentId")
        : await trigger("departmentText");
      const restOk = await trigger(["joined", "status"]);
      if (depOk && restOk) setStep(3);
      return;
    }
  };

  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  if (isEdit && loadingRecord) {
    return (
      <div
        className={`${sectionCardBorder()} mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-12 text-center`}
      >
        <div
          className="size-10 animate-spin rounded-full border-2 border-default border-t-(--color-chart-blue-primary) dark:border-dark-default dark:border-t-(--color-dark-timeline-accent)"
          aria-hidden
        />
        <p className="text-sm text-muted dark:text-dark-muted">
          {t(`${ns}.loadingRecord`)}
        </p>
      </div>
    );
  }

  if (isEdit && !record) {
    return (
      <div
        className={`${sectionCardBorder()} mx-auto flex max-w-lg flex-col items-center gap-3 text-center`}
      >
        <p className="text-sm font-semibold text-primary dark:text-dark-primary">
          {t(`${ns}.recordNotFound`)}
        </p>
      </div>
    );
  }

  const passwordRegister = register("password", {
    required: !isEdit
      ? t(`studentForm.validation.passwordRequired`)
      : false,
    minLength:
      !isEdit || (watch("password") ?? "").trim() !== ""
        ? {
            value: 8,
            message: t(`studentForm.validation.passwordLength`),
          }
        : undefined,
    maxLength:
      !isEdit || (watch("password") ?? "").trim() !== ""
        ? { value: 128, message: t(`studentForm.validation.passwordLength`) }
        : undefined,
    pattern:
      !isEdit || (watch("password") ?? "").trim() !== ""
        ? {
            value: PASSWORD_PATTERN,
            message: t(`studentForm.validation.passwordPattern`),
          }
        : undefined,
  });

  const confirmPwRegister = register("confirmPassword", {
    validate: (v) => {
      const p = watch("password");
      const pt = `${p ?? ""}`.trim();
      const vt = `${v ?? ""}`.trim();
      if (!isEdit) {
        if (vt !== pt) return t(`${ns}.validation.passwordMismatch`);
        return true;
      }
      if (!pt && !vt) return true;
      if (vt !== pt) return t(`${ns}.validation.passwordMismatch`);
      return true;
    },
  });

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="mx-auto flex w-full max-w-5xl flex-col gap-8"
    >
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-primary dark:text-dark-primary md:text-2xl">
          {t(isEdit ? `${ns}.header.editTitle` : `${ns}.header.createTitle`)}
        </h1>
        <p className="text-xs text-muted dark:text-dark-muted">
          {t(`${ns}.header.subtitle`)}
        </p>
      </header>

      {/* Step dots */}
      <ol className="flex flex-wrap gap-4 border-y border-default py-4 dark:border-dark-default">
        {steps.map((s) => {
          const IconCmp = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={[
                  "flex size-10 shrink-0 items-center justify-center rounded-xl border border-default bg-light-card-hover transition-colors dark:border-dark-default dark:bg-dark-card-hover",
                  active
                    ? "border-default bg-light-app-tertiary text-(--color-chart-blue-primary) dark:border-dark-default dark:bg-dark-app-tertiary dark:text-(--color-dark-timeline-accent)"
                    : "",
                  done
                    ? "text-muted dark:text-dark-muted"
                    : "",
                ].join(" ")}
              >
                <IconCmp className="size-5" aria-hidden strokeWidth={1.75} />
              </span>
              <span
                className={[
                  "truncate text-[11px] font-semibold",
                  active
                    ? "text-primary dark:text-dark-primary"
                    : "text-muted dark:text-dark-muted",
                ].join(" ")}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className={sectionCardBorder()}>
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-primary dark:text-dark-primary">
              {t(`${ns}.section.personalTitle`)}
            </h2>
            <p className="text-[11px] text-secondary dark:text-dark-secondary">
              {t(`${ns}.section.personalSub`)}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={`${t(`studentForm.fields.firstName.label`)} *`}
                placeholder={t(`studentForm.fields.firstName.placeholder`)}
                register={register("firstName", {
                  required: t(`studentForm.validation.firstNameRequired`),
                  minLength: {
                    value: 2,
                    message: t(`studentForm.validation.nameLength`),
                  },
                  maxLength: {
                    value: 50,
                    message: t(`studentForm.validation.nameLength`),
                  },
                })}
                error={errors.firstName?.message}
              />
              <Field
                label={`${t(`studentForm.fields.lastName.label`)} *`}
                placeholder={t(`studentForm.fields.lastName.placeholder`)}
                register={register("lastName", {
                  required: t(`studentForm.validation.lastNameRequired`),
                  minLength: {
                    value: 2,
                    message: t(`studentForm.validation.nameLength`),
                  },
                  maxLength: {
                    value: 50,
                    message: t(`studentForm.validation.nameLength`),
                  },
                })}
                error={errors.lastName?.message}
              />
              <Field
                label={`${t(`studentForm.fields.email.label`)} *`}
                type="email"
                placeholder={t(`studentForm.fields.email.placeholder`)}
                register={register("email", {
                  required: t(`studentForm.validation.emailRequired`),
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: t(`studentForm.validation.emailInvalid`),
                  },
                })}
                error={errors.email?.message}
              />
              <Field
                label={t(`studentForm.fields.phone.label`)}
                placeholder={t(`studentForm.fields.phone.placeholder`)}
                register={register("phone", {
                  validate: (v) =>
                    `${v ?? ""}`.trim() === "" ||
                    PHONE_PATTERN.test(`${v}`)
                      ? true
                      : t(`studentForm.validation.phoneInvalid`),
                })}
                error={errors.phone?.message}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-primary dark:text-dark-primary">
              {t(`${ns}.section.assignmentTitle`)}
            </h2>
            <p className="text-[11px] text-secondary dark:text-dark-secondary">
              {t(`${ns}.section.assignmentSub`)}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {hasDeptDirectory ? (
                <Controller
                  name="departmentId"
                  control={control}
                  rules={{
                    required: t(`studentForm.validation.departmentRequired`),
                  }}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Select
                        name="departmentId"
                        label={`${t(`studentForm.fields.department.label`)} *`}
                        placeholder={t(
                          `studentForm.fields.department.placeholder`,
                        )}
                        options={departmentOptions.map((o) => ({
                          value: o.value,
                          label: o.label,
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                      {errors.departmentId?.message ? (
                        <p className="text-[10px] font-medium text-error">
                          {errors.departmentId.message}
                        </p>
                      ) : null}
                    </div>
                  )}
                />
              ) : (
                <div className="sm:col-span-2">
                  <Field
                    label={`${t(`studentForm.fields.department.label`)} *`}
                    placeholder={t(`studentForm.fields.department.placeholder`)}
                    register={register("departmentText", {
                      required: t(`${ns}.validation.departmentRequired`),
                      minLength: { value: 2, message: t(`${ns}.validation.departmentMin`) },
                    })}
                    error={errors.departmentText?.message}
                  />
                  <p className="mt-1 text-[10px] text-muted dark:text-dark-muted">
                    {t(`${ns}.departmentsOfflineHint`)}
                  </p>
                </div>
              )}
              <Field
                label={`${t(`${ns}.fields.joined.label`)} *`}
                type="date"
                register={register("joined", {
                  required: t(`${ns}.validation.joinedRequired`),
                })}
                error={errors.joined?.message}
              />
              <Controller
                name="status"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    label={`${t(`studentForm.fields.status.label`)} *`}
                    options={statusOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-primary dark:text-dark-primary">
              {t(`${ns}.section.accessTitle`)}
            </h2>
            <p className="text-[11px] text-secondary dark:text-dark-secondary">
              {isEdit
                ? t(`${ns}.section.accessSubEdit`)
                : t(`${ns}.section.accessSubCreate`)}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={`${t(`studentForm.fields.username.label`)} *`}
                placeholder={t(`studentForm.fields.username.placeholder`)}
                disabled={isEdit}
                register={register("username", {
                  required: t(`studentForm.validation.usernameRequired`),
                  minLength: {
                    value: 3,
                    message: t(`studentForm.validation.usernameLength`),
                  },
                  maxLength: {
                    value: 50,
                    message: t(`studentForm.validation.usernameLength`),
                  },
                  pattern: {
                    value: USERNAME_PATTERN,
                    message: t(`studentForm.validation.usernamePattern`),
                  },
                })}
                error={errors.username?.message}
              />
              <div className="hidden sm:block" aria-hidden />
              <Field
                label={
                  isEdit
                    ? t(`studentForm.fields.password.optionalLabel`)
                    : `${t(`studentForm.fields.password.label`)} *`
                }
                type="password"
                placeholder={
                  isEdit
                    ? t(`studentForm.fields.password.placeholderEdit`)
                    : t(`studentForm.fields.password.placeholder`)
                }
                register={passwordRegister}
                error={errors.password?.message}
              />
              <Field
                label={
                  isEdit
                    ? t(`${ns}.fields.confirmPassword.optional`)
                    : `${t(`${ns}.fields.confirmPassword.label`)} *`
                }
                type="password"
                placeholder={t(`${ns}.fields.confirmPassword.placeholder`)}
                register={confirmPwRegister}
                error={errors.confirmPassword?.message}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-default border-t pt-6 dark:border-dark-default">
        <div />
        <div className="flex gap-3">
          {step > 1 ? (
            <Button type="button" variant="secondary" onClick={goPrev}>
              {t(`studentForm.actions.back`)}
            </Button>
          ) : null}
          {step < 3 ? (
            <Button
              type="button"
              disabled={loadingRecord || isSubmitting || saving}
              onClick={() => void goNext()}
            >
              {t(`studentForm.actions.next`)}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={loadingRecord || isSubmitting || saving}
              onClick={() => void handleSubmit(onFinalSubmit)()}
            >
              {saving
                ? t(`studentForm.actions.submitting`)
                : t(isEdit ? `${ns}.actions.save` : `${ns}.actions.submitCreate`)}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
