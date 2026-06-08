import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookMarked,
  CalendarRange,
  ChevronRight,
  GraduationCap,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import Checkbox from "./Checkbox";
import Field from "./Field";
import GlobalModal from "./GlobalModal";
import Select from "./Select";
import SettingsSectionCard from "./SettingsSectionCard";
import {
  academicYearFormSchema,
  batchFormSchema,
} from "../lib/schemas/facultyRegistry";
import {
  useAcademicYears,
  useBatch,
  useBatches,
  useCreateAcademicYear,
  useCreateBatch,
  useCreateDepartment,
  useDeleteAcademicYear,
  useDeleteBatch,
  useDeleteDepartment,
  useDepartments,
} from "../services/useApi";

function normalizeDepartmentList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export default function AcademicRegistrySettingsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: departmentsRaw, isLoading: depLoading } = useDepartments();
  const { data: batches = [], isLoading: batchLoading } = useBatches();
  const { data: years = [], isLoading: yearsLoading } = useAcademicYears({});

  const departments = useMemo(
    () => normalizeDepartmentList(departmentsRaw),
    [departmentsRaw],
  );

  const [batchDetailId, setBatchDetailId] = useState(null);
  const [deptSheetOpen, setDeptSheetOpen] = useState(false);
  const [deptDraft, setDeptDraft] = useState({
    name: "",
    head: "",
    status: "active",
  });
  const [deleteDeptId, setDeleteDeptId] = useState(null);

  const [yearSheetOpen, setYearSheetOpen] = useState(false);
  const [yearDraft, setYearDraft] = useState({
    name: "",
    startDate: "",
    endDate: "",
    calendarType: "SOLAR",
  });
  const [deleteYearId, setDeleteYearId] = useState(null);

  const [batchSheetOpen, setBatchSheetOpen] = useState(false);
  const [batchDraft, setBatchDraft] = useState({
    name: "",
    year: new Date().getFullYear(),
    type: "",
    startDate: "",
    endDate: "",
    description: "",
    isActive: true,
    academicYearId: "",
  });
  const [deleteBatchId, setDeleteBatchId] = useState(null);

  const { data: batchDetail, isFetching: batchDetailFetching } = useBatch(
    batchDetailId,
    { enabled: Boolean(batchDetailId) },
  );

  const createDept = useCreateDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDeptSheetOpen(false);
      setDeptDraft({ name: "", head: "", status: "active" });
    },
  });

  const deleteDept = useDeleteDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDeleteDeptId(null);
    },
  });

  const createYear = useCreateAcademicYear({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      setYearSheetOpen(false);
      setYearDraft({
        name: "",
        startDate: "",
        endDate: "",
        calendarType: "SOLAR",
      });
    },
  });

  const deleteYear = useDeleteAcademicYear({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setDeleteYearId(null);
    },
  });

  const createBatchMut = useCreateBatch({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setBatchSheetOpen(false);
      setBatchDraft({
        name: "",
        year: new Date().getFullYear(),
        type: "",
        startDate: "",
        endDate: "",
        description: "",
        isActive: true,
        academicYearId: "",
      });
    },
  });

  const deleteBatchMut = useDeleteBatch({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setDeleteBatchId(null);
    },
  });

  const deptCount = departments.length;
  const batchCount = Array.isArray(batches) ? batches.length : 0;

  const statusOptions = [
    { value: "active", label: t("settings.academic.department.statusActive") },
    {
      value: "inactive",
      label: t("settings.academic.department.statusInactive"),
    },
  ];

  const yearOptionsForBatch = useMemo(() => {
    const list = Array.isArray(years) ? years : [];
    return list.map((y) => ({
      value: String(y.id ?? y.uuid ?? ""),
      label: y.name ?? String(y.id ?? ""),
    }));
  }, [years]);

  const calendarOptions = [
    { value: "SOLAR", label: t("settings.academic.year.calendarSolar") },
    { value: "LUNAR", label: t("settings.academic.year.calendarLunar") },
  ];

  const submitDepartment = () => {
    if (!deptDraft.name.trim()) return;
    createDept.mutate({
      name: deptDraft.name.trim(),
      head: deptDraft.head.trim() || "",
      status: deptDraft.status,
    });
  };

  const closeDeptSheet = (openFlag) => {
    if (!openFlag) {
      setDeptSheetOpen(false);
      setDeptDraft({ name: "", head: "", status: "active" });
    }
  };

  const submitYear = () => {
    const parsed = academicYearFormSchema.safeParse(yearDraft);
    if (!parsed.success) {
      gooeyToast.error(t("settings.academic.year.validation"));
      return;
    }
    createYear.mutate(parsed.data);
  };

  const submitBatch = () => {
    const body = {
      name: batchDraft.name,
      year: batchDraft.year,
      type: batchDraft.type,
      startDate: batchDraft.startDate,
      endDate: batchDraft.endDate,
      description: batchDraft.description || undefined,
      isActive: batchDraft.isActive,
      academicYear: batchDraft.academicYearId,
    };
    const parsed = batchFormSchema.safeParse(body);
    if (!parsed.success) {
      gooeyToast.error(t("settings.academic.batch.validation"));
      return;
    }
    createBatchMut.mutate(parsed.data);
  };

  return (
    <div className="space-y-6">
      <SettingsSectionCard
        icon={Layers}
        title={t("settings.academic.intro.title")}
        description={t("settings.academic.intro.description")}
      >
        <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 text-sm leading-6 text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
          <p>{t("settings.academic.intro.apiNote")}</p>
          <code className="mt-3 block whitespace-pre-wrap rounded-lg border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 py-2 font-mono text-xs text-primary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-primary">
            {`/api/academic-year · /api/batch · /api/department
/api/semester · /api/project · /api/group`}
          </code>
          <Link
            to="/admin/departments"
            className="mt-4 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline dark:text-dark-primary"
          >
            {t("settings.academic.intro.openDepartmentsAdmin")}
          </Link>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={CalendarRange}
        title={t("settings.academic.years.title")}
        description={t("settings.academic.years.description")}
        action={
          <Button
            type="button"
            variant="primary"
            className="gap-2"
            onClick={() => setYearSheetOpen(true)}
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            {t("settings.academic.years.add")}
          </Button>
        }
      >
        <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
          {yearsLoading && (
            <p className="text-sm text-muted dark:text-dark-muted">
              {t("settings.academic.years.loading")}
            </p>
          )}
          {!yearsLoading &&
            (Array.isArray(years) ? years : []).map((y) => {
              const id = y.id ?? y.uuid;
              const label = y.name ?? (id != null ? String(id) : "—");
              return (
                <div
                  key={id ?? label}
                  className="flex flex-col gap-3 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 sm:flex-row sm:items-center sm:justify-between dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                      {label}
                    </p>
                    {id != null ? (
                      <p className="mt-1 font-mono text-[11px] text-muted dark:text-dark-muted">
                        id: {String(id)}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="tertiary"
                    className="shrink-0 gap-2 text-(--color-light-error-text) dark:text-(--color-dark-error-text)"
                    disabled={id == null || deleteYear.isPending}
                    onClick={() => setDeleteYearId(id)}
                  >
                    <Trash2 className="size-4" strokeWidth={2} aria-hidden />
                    {t("settings.academic.departments.remove")}
                  </Button>
                </div>
              );
            })}
          {!yearsLoading &&
            !(Array.isArray(years) ? years : []).length && (
              <p className="text-sm text-muted dark:text-dark-muted">
                {t("settings.academic.years.empty")}
              </p>
            )}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={GraduationCap}
        title={t("settings.academic.departments.title")}
        description={t("settings.academic.departments.description")}
        action={
          <Button
            type="button"
            variant="primary"
            className="gap-2"
            onClick={() => setDeptSheetOpen(true)}
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            {t("settings.academic.departments.add")}
          </Button>
        }
      >
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
              {t("settings.academic.departments.count")}
            </p>
            <p className="mt-2 text-3xl font-bold text-primary dark:text-dark-primary">
              {depLoading ? "—" : deptCount}
            </p>
          </div>
          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-sm text-secondary dark:text-dark-secondary">
              {t("settings.academic.departments.hint")}
            </p>
          </div>
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {depLoading && (
            <p className="text-sm text-muted dark:text-dark-muted">
              {t("settings.academic.departments.loading")}
            </p>
          )}
          {!depLoading &&
            departments.map((d) => {
              const id = d.id ?? d.uuid;
              const name = d.name ?? d.title ?? "—";
              const head =
                d.head ?? d.headName ?? d.head_name ?? d.dean ?? "—";
              return (
                <div
                  key={id ?? name}
                  className="flex flex-col gap-3 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 sm:flex-row sm:items-center sm:justify-between dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary dark:text-dark-primary">
                      {name}
                    </p>
                    <p className="mt-1 text-xs text-muted dark:text-dark-muted">
                      {t("settings.academic.departments.headLabel")}
                      {": "}
                      {head}
                    </p>
                    {id != null ? (
                      <p className="mt-1 font-mono text-[11px] text-muted dark:text-dark-muted">
                        id: {String(id)}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="tertiary"
                    className="shrink-0 gap-2 text-(--color-light-error-text) dark:text-(--color-dark-error-text)"
                    disabled={id == null || deleteDept.isPending}
                    onClick={() => setDeleteDeptId(id)}
                  >
                    <Trash2 className="size-4" strokeWidth={2} aria-hidden />
                    {t("settings.academic.departments.remove")}
                  </Button>
                </div>
              );
            })}
          {!depLoading && !departments.length && (
            <p className="text-sm text-muted dark:text-dark-muted">
              {t("settings.academic.departments.empty")}
            </p>
          )}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={BookMarked}
        title={t("settings.academic.batches.title")}
        description={t("settings.academic.batches.description")}
        action={
          <Button
            type="button"
            variant="primary"
            className="gap-2"
            onClick={() => {
              const first = yearOptionsForBatch[0]?.value ?? "";
              setBatchDraft((c) => ({
                ...c,
                academicYearId: first || c.academicYearId,
              }));
              setBatchSheetOpen(true);
            }}
            disabled={!yearOptionsForBatch.length}
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            {t("settings.academic.batches.add")}
          </Button>
        }
      >
        <p className="mb-4 text-sm text-secondary dark:text-dark-secondary">
          {t("settings.academic.batches.assignYear")}
        </p>
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-dark-muted">
              {t("settings.academic.batches.count")}
            </p>
            <p className="mt-2 text-3xl font-bold text-primary dark:text-dark-primary">
              {batchLoading ? "—" : batchCount}
            </p>
          </div>
          <div className="rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <p className="text-sm text-secondary dark:text-dark-secondary">
              {t("settings.academic.batches.semanticNote")}
            </p>
          </div>
        </div>

        <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
          {batchLoading && (
            <p className="text-sm text-muted dark:text-dark-muted">
              {t("settings.academic.batches.loading")}
            </p>
          )}
          {!batchLoading &&
            (Array.isArray(batches) ? batches : []).map((b) => {
              const id = b.id ?? b.uuid ?? b.batchId;
              const label =
                b.name ??
                b.title ??
                b.code ??
                b.batchCode ??
                (id != null ? String(id) : "—");
              const ayLabel =
                typeof b.academicYear === "string"
                  ? b.academicYear
                  : (b.academicYear?.name ?? "");
              return (
                <div
                  key={id ?? label}
                  className="flex flex-col gap-2 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() =>
                      id != null ? setBatchDetailId(String(id)) : undefined
                    }
                    disabled={id == null}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 text-start transition-colors hover:text-primary disabled:opacity-60 dark:hover:text-dark-primary"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-primary dark:text-dark-primary">
                        {label}
                      </span>
                      {ayLabel ? (
                        <span className="mt-0.5 block text-[11px] text-muted dark:text-dark-muted">
                          {ayLabel}
                        </span>
                      ) : null}
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted dark:text-dark-muted"
                      aria-hidden
                    />
                  </button>
                  <Button
                    type="button"
                    variant="tertiary"
                    className="gap-2 text-(--color-light-error-text) dark:text-(--color-dark-error-text)"
                    disabled={id == null || deleteBatchMut.isPending}
                    onClick={() => setDeleteBatchId(id)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    {t("settings.academic.batches.delete")}
                  </Button>
                </div>
              );
            })}
          {!batchLoading &&
            !(Array.isArray(batches) ? batches : []).length && (
              <p className="text-sm text-muted dark:text-dark-muted">
                {t("settings.academic.batches.empty")}
              </p>
            )}
        </div>
      </SettingsSectionCard>

      <GlobalModal
        variant="sheet"
        open={Boolean(batchDetailId)}
        setOpen={(o) => {
          if (!o) setBatchDetailId(null);
        }}
        title={t("settings.academic.batches.sheetTitle")}
        subtitle={t("settings.academic.batches.sheetSubtitle")}
        isClose
      >
        {batchDetailFetching && (
          <p className="text-sm text-muted dark:text-dark-muted">
            {t("settings.academic.batches.sheetLoading")}
          </p>
        )}
        {!batchDetailFetching && batchDetail != null && (
          <pre className="max-h-[55vh] overflow-auto rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 font-mono text-xs leading-relaxed text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary">
            {JSON.stringify(batchDetail, null, 2)}
          </pre>
        )}
      </GlobalModal>

      <GlobalModal
        variant="sheet"
        open={deptSheetOpen}
        setOpen={closeDeptSheet}
        title={t("settings.academic.department.sheetTitle")}
        subtitle={t("settings.academic.department.sheetSubtitle")}
        isClose
        footer={
          <>
            <Button
              type="button"
              variant="tertiary"
              onClick={() => closeDeptSheet(false)}
            >
              {t("settings.academic.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={createDept.isPending || !deptDraft.name.trim()}
              onClick={submitDepartment}
            >
              {t("settings.academic.department.submit")}
            </Button>
          </>
        }
        sheetClassName="sm:max-w-[min(32rem,92vw)]"
      >
        <div className="grid gap-4">
          <Field
            register={{}}
            label={t("settings.academic.department.fieldName")}
            placeholder={t("settings.academic.department.placeholderName")}
            value={deptDraft.name}
            onChange={(e) =>
              setDeptDraft((c) => ({ ...c, name: e.target.value }))
            }
          />
          <Field
            register={{}}
            label={t("settings.academic.department.fieldHead")}
            placeholder={t("settings.academic.department.placeholderHead")}
            value={deptDraft.head}
            onChange={(e) =>
              setDeptDraft((c) => ({ ...c, head: e.target.value }))
            }
          />
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.academic.department.fieldStatus")}
            </span>
            <Select
              value={deptDraft.status}
              onChange={(v) => setDeptDraft((c) => ({ ...c, status: v }))}
              options={statusOptions}
            />
          </div>
        </div>
      </GlobalModal>

      <GlobalModal
        variant="sheet"
        open={yearSheetOpen}
        setOpen={(o) => {
          if (!o) {
            setYearSheetOpen(false);
            setYearDraft({
              name: "",
              startDate: "",
              endDate: "",
              calendarType: "SOLAR",
            });
          }
        }}
        title={t("settings.academic.year.sheetTitle")}
        subtitle={t("settings.academic.year.sheetSubtitle")}
        isClose
        footer={
          <>
            <Button
              type="button"
              variant="tertiary"
              onClick={() => setYearSheetOpen(false)}
            >
              {t("settings.academic.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={createYear.isPending}
              onClick={submitYear}
            >
              {t("settings.academic.year.submit")}
            </Button>
          </>
        }
        sheetClassName="sm:max-w-[min(30rem,92vw)]"
      >
        <div className="grid gap-4">
          <Field
            register={{}}
            label={t("settings.academic.year.fieldName")}
            value={yearDraft.name}
            onChange={(e) =>
              setYearDraft((c) => ({ ...c, name: e.target.value }))
            }
          />
          <Field
            register={{}}
            label={t("settings.academic.year.fieldStart")}
            type="date"
            value={yearDraft.startDate}
            onChange={(e) =>
              setYearDraft((c) => ({ ...c, startDate: e.target.value }))
            }
          />
          <Field
            register={{}}
            label={t("settings.academic.year.fieldEnd")}
            type="date"
            value={yearDraft.endDate}
            onChange={(e) =>
              setYearDraft((c) => ({ ...c, endDate: e.target.value }))
            }
          />
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.academic.year.fieldCalendar")}
            </span>
            <Select
              value={yearDraft.calendarType}
              onChange={(v) =>
                setYearDraft((c) => ({ ...c, calendarType: v }))
              }
              options={calendarOptions}
            />
          </div>
        </div>
      </GlobalModal>

      <GlobalModal
        variant="sheet"
        open={batchSheetOpen}
        setOpen={(o) => {
          if (!o) setBatchSheetOpen(false);
        }}
        title={t("settings.academic.batch.sheetTitle")}
        subtitle={t("settings.academic.batch.sheetSubtitle")}
        isClose
        footer={
          <>
            <Button
              type="button"
              variant="tertiary"
              onClick={() => setBatchSheetOpen(false)}
            >
              {t("settings.academic.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={
                createBatchMut.isPending || !yearOptionsForBatch.length
              }
              onClick={submitBatch}
            >
              {t("settings.academic.batch.submit")}
            </Button>
          </>
        }
        sheetClassName="sm:max-w-[min(32rem,94vw)]"
      >
        <div className="grid gap-4">
          <div>
            <span className="mb-2 block text-[11px] font-semibold text-primary dark:text-dark-primary">
              {t("settings.academic.batch.fieldAcademicYear")}
            </span>
            <Select
              value={batchDraft.academicYearId}
              onChange={(v) =>
                setBatchDraft((c) => ({ ...c, academicYearId: v }))
              }
              options={yearOptionsForBatch}
            />
          </div>
          <Field
            register={{}}
            label={t("settings.academic.batch.fieldName")}
            value={batchDraft.name}
            onChange={(e) =>
              setBatchDraft((c) => ({ ...c, name: e.target.value }))
            }
          />
          <Field
            register={{}}
            label={t("settings.academic.batch.fieldYear")}
            type="number"
            value={String(batchDraft.year)}
            onChange={(e) =>
              setBatchDraft((c) => ({
                ...c,
                year: Number(e.target.value) || 0,
              }))
            }
          />
          <Field
            register={{}}
            label={t("settings.academic.batch.fieldType")}
            value={batchDraft.type}
            onChange={(e) =>
              setBatchDraft((c) => ({ ...c, type: e.target.value }))
            }
          />
          <Field
            register={{}}
            label={t("settings.academic.batch.fieldStart")}
            type="date"
            value={batchDraft.startDate}
            onChange={(e) =>
              setBatchDraft((c) => ({ ...c, startDate: e.target.value }))
            }
          />
          <Field
            register={{}}
            label={t("settings.academic.batch.fieldEnd")}
            type="date"
            value={batchDraft.endDate}
            onChange={(e) =>
              setBatchDraft((c) => ({ ...c, endDate: e.target.value }))
            }
          />
          <Field
            register={{}}
            label={t("settings.academic.batch.fieldDesc")}
            value={batchDraft.description}
            onChange={(e) =>
              setBatchDraft((c) => ({ ...c, description: e.target.value }))
            }
          />
          <Checkbox
            id="academic-batch-active"
            checked={batchDraft.isActive}
            onChange={(e) =>
              setBatchDraft((c) => ({
                ...c,
                isActive: e.target.checked,
              }))
            }
            label={t("settings.academic.batch.fieldActive")}
          />
        </div>
      </GlobalModal>

      <GlobalModal
        variant="center"
        open={Boolean(deleteDeptId)}
        setOpen={(o) => {
          if (!o) setDeleteDeptId(null);
        }}
        isClose
        title={t("settings.academic.departments.deleteTitle")}
        subtitle={t("settings.academic.departments.deleteMessage")}
        footer={
          <>
            <Button type="button" variant="tertiary" onClick={() => setDeleteDeptId(null)}>
              {t("settings.academic.cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteDept.isPending}
              onClick={() => {
                if (deleteDeptId != null) deleteDept.mutate(deleteDeptId);
              }}
            >
              {t("settings.academic.departments.confirmDelete")}
            </Button>
          </>
        }
        className="max-w-md"
      >
        <span className="sr-only">department delete</span>
      </GlobalModal>

      <GlobalModal
        variant="center"
        open={Boolean(deleteYearId)}
        setOpen={(o) => {
          if (!o) setDeleteYearId(null);
        }}
        isClose
        title={t("settings.academic.years.deleteTitle")}
        subtitle={t("settings.academic.years.deleteMessage")}
        footer={
          <>
            <Button type="button" variant="tertiary" onClick={() => setDeleteYearId(null)}>
              {t("settings.academic.cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteYear.isPending}
              onClick={() => {
                if (deleteYearId != null) deleteYear.mutate(deleteYearId);
              }}
            >
              {t("settings.academic.years.confirmDelete")}
            </Button>
          </>
        }
        className="max-w-md"
      >
        <span className="sr-only">confirm</span>
      </GlobalModal>

      <GlobalModal
        variant="center"
        open={Boolean(deleteBatchId)}
        setOpen={(o) => {
          if (!o) setDeleteBatchId(null);
        }}
        isClose
        title={t("settings.academic.batches.deleteTitle")}
        subtitle={t("settings.academic.batches.deleteMessage")}
        footer={
          <>
            <Button type="button" variant="tertiary" onClick={() => setDeleteBatchId(null)}>
              {t("settings.academic.cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteBatchMut.isPending}
              onClick={() => {
                if (deleteBatchId != null)
                  deleteBatchMut.mutate(deleteBatchId);
              }}
            >
              {t("settings.academic.batches.confirmDelete")}
            </Button>
          </>
        }
        className="max-w-md"
      >
        <span className="sr-only">confirm</span>
      </GlobalModal>
    </div>
  );
}
