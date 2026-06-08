import { Building2, CheckCircle2, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import Button from "../../components/Button";
import Field from "../../components/Field";
import Select from "../../components/Select";
import SearchableSelect from "../../components/SearchableSelect";
import {
  useCreateDepartment,
  useEmployees,
  useFaculties,
} from "../../services/useApi";

function normalizeFacultyOptions(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.data)
        ? data.data
        : [];

  return list
    .map((item) => {
      const id = item?.id ?? item?.facultyId ?? item?.uuid ?? item?.code ?? "";
      const label =
        item?.name ??
        item?.title ??
        item?.facultyName ??
        (id !== "" && id != null ? String(id) : "");

      if (id === "" || id == null || !label) return null;
      return { value: String(id), label: String(label) };
    })
    .filter(Boolean);
}

function normalizeEmployeeOptions(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.data)
        ? data.data
        : [];

  return list
    .map((item) => {
      const id = item?.id ?? item?.employeeId ?? "";
      if (id === "" || id == null) return null;

      const fullName = [item?.firstName, item?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      const metaParts = [item?.facultyPosition, item?.educationRank].filter(
        Boolean,
      );

      return {
        value: String(id),
        label: fullName || item?.username || String(id),
        description: metaParts.join(" • "),
      };
    })
    .filter(Boolean);
}

export default function AddDepartmentForm({ onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: facultiesData, isLoading: facultiesLoading } = useFaculties({
    notifyOnError: false,
  });
  const { data: employeesData, isLoading: employeesLoading } = useEmployees({
    notifyOnError: false,
  });
  const facultyOptions = normalizeFacultyOptions(facultiesData);
  const employeeOptions = normalizeEmployeeOptions(employeesData);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      field: "",
      description: "",
      faculty: "",
      email: "",
      phone: "",
      shortName: "",
      headOfDepartment: "",
    },
  });

  const createDepartment = useCreateDepartment({
    toastSuccess: "adminDepartments.form.toast.createSuccess",
    toastError: "apiErrors.failed_to_create_department",
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["departments"] });
      onSuccess?.();
      onClose?.();
    },
  });

  const onSubmit = (values) => {
    createDepartment.mutate({
      name: values.name.trim(),
      field: values.field.trim(),
      description: values.description.trim() || undefined,
      faculty: values.faculty,
      email: values.email.trim() || undefined,
      phone: values.phone.trim() || undefined,
      shortName: values.shortName.trim() || undefined,
      headOfDepartment: values.headOfDepartment || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="">
        <div className="flex items-start justify-between gap-4 border-b border-light-divider px-5 py-4 dark:border-dark-divider">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
              <Building2 className="size-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-primary dark:text-dark-primary">
                {t("adminDepartments.form.title")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-secondary dark:text-dark-secondary">
                {t("adminDepartments.form.description")}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={`${t("adminDepartments.form.fields.name")} *`}
              placeholder={t("adminDepartments.form.placeholders.name")}
              register={register("name", {
                required: t("adminDepartments.form.validation.nameRequired"),
              })}
              error={errors.name?.message}
            />

            <Field
              label={`${t("adminDepartments.form.fields.field")} *`}
              placeholder={t("adminDepartments.form.placeholders.field")}
              register={register("field", {
                required: t("adminDepartments.form.validation.fieldRequired"),
              })}
              error={errors.field?.message}
            />

            <Controller
              name="faculty"
              control={control}
              rules={{
                required: t("adminDepartments.form.validation.facultyRequired"),
              }}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <Select
                    label={`${t("adminDepartments.form.fields.faculty")} *`}
                    placeholder={
                      facultiesLoading
                        ? t("adminDepartments.form.placeholders.facultyLoading")
                        : t("adminDepartments.form.placeholders.faculty")
                    }
                    value={field.value}
                    onValueChange={field.onChange}
                    options={facultyOptions}
                    disabled={facultiesLoading || facultyOptions.length === 0}
                  />
                  {fieldState.error?.message ? (
                    <p className="text-[11px] text-error dark:text-red-400">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <Field
              label={t("adminDepartments.form.fields.shortName")}
              placeholder={t("adminDepartments.form.placeholders.shortName")}
              register={register("shortName")}
              error={errors.shortName?.message}
            />

            <Controller
              name="headOfDepartment"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-primary dark:text-dark-primary">
                    {t("adminDepartments.form.fields.head")}
                  </label>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={employeeOptions}
                    placeholder={
                      employeesLoading
                        ? t("adminDepartments.form.placeholders.headLoading")
                        : t("adminDepartments.form.placeholders.head")
                    }
                    searchPlaceholder={t(
                      "adminDepartments.form.placeholders.headSearch",
                    )}
                    disabled={employeesLoading || employeeOptions.length === 0}
                    className="min-h-9"
                    contentClassName="z-[1300]"
                  />
                </div>
              )}
            />

            <Field
              label={t("adminDepartments.form.fields.phone")}
              placeholder={t("adminDepartments.form.placeholders.phone")}
              register={register("phone", {
                pattern: {
                  value: /^\+?[0-9]{7,15}$/,
                  message: t("adminDepartments.form.validation.phoneInvalid"),
                },
              })}
              error={errors.phone?.message}
            />

            <div className="md:col-span-2">
              <Field
                label={t("adminDepartments.form.fields.email")}
                type="email"
                placeholder={t("adminDepartments.form.placeholders.email")}
                register={register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: t("adminDepartments.form.validation.emailInvalid"),
                  },
                })}
                error={errors.email?.message}
              />
            </div>
            <div className="md:col-span-2">
              <Field
                label={t("adminDepartments.form.fields.description")}
                error={errors.description?.message}
              >
                <textarea
                  {...register("description")}
                  rows={4}
                  placeholder={t(
                    "adminDepartments.form.placeholders.description",
                  )}
                  className="
                    w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition-colors
                    bg-(--color-light-input-bg) text-(--color-light-text-primary) border-(--color-light-input-border)
                    placeholder:text-(--color-light-input-placeholder)
                    focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15
                    dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:border-dark-input-border
                    dark:placeholder:text-(--color-dark-input-placeholder)
                    dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15
                  "
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-light-divider px-5 py-4 dark:border-dark-divider">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createDepartment.isPending}
          >
            {t("adminDepartments.form.actions.cancel")}
          </Button>
          <Button type="submit" disabled={createDepartment.isPending}>
            {createDepartment.isPending
              ? t("adminDepartments.form.actions.creating")
              : t("adminDepartments.form.actions.create")}
          </Button>
        </div>
      </div>
    </form>
  );
}
