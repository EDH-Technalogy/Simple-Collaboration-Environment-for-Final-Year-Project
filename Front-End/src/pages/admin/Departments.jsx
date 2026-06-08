import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  BadgeCheck,
  BookMarked,
  Building2,
  CalendarDays,
  Columns3,
  EyeOff,
  Filter,
  GraduationCap,
  Hash,
  ImageUp,
  Layers,
  LayoutGrid,
  LayoutList,
  Plus,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gooeyToast } from "goey-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import {
  AdminRecordsBoard,
  AdminTableToolDropdowns,
} from "../../components/admin/AdminTableControls";
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
import OperationsDropdown from "../../components/OperationsDropdown";
import Pagination from "../../components/Pagination";
import SearchableSelect from "../../components/SearchableSelect";
import Select from "../../components/Select";
import SensitiveActionModal from "../../components/SensitiveActionModal";
import SettingsTabs from "../../components/SettingsTabs";
import StatusPill, { statusToPillVariant } from "../../components/StatusPill";
import Table from "../../components/Table";
import TableBody from "../../components/TableBody";
import TableColumn from "../../components/TableColumn";
import TableHeader from "../../components/TableHeader";
import TableRow from "../../components/TableRow";
import TableToolbar from "../../components/TableToolbar";
import TextArea from "../../components/TextArea";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  useCreateAcademicYear,
  useAcademicYears,
  useBatches,
  useCreateBatch,
  useCreateFaculty,
  useCreateSemester,
  useDeleteAcademicYear,
  useDeleteBatch,
  useDeleteDepartment,
  useDeleteFaculty,
  useDeleteFacultyGroup,
  useDeleteSemester,
  useDepartments,
  useFaculties,
  useFacultyGroups,
  useStudentsPage,
  useSemesters,
  useUniversities,
  useUpdateAcademicYear,
  useUpdateBatch,
  useUpdateFaculty,
  useUpdateFacultyGroup,
  useUpdateFacultyGroupLeader,
  useUpdateSemester,
  useUploadDepartmentLogo,
} from "../../services/useApi";
import AddDepartmentForm from "./AddDepartmentForm";
import EditDepartmentForm from "./EditDepartmentForm";

const EMPTY = [];
const STATUS_ALL = "all";
const SEMESTER_TYPE_OPTIONS = ["FALL", "SUMMER", "SPRING"];
/** Minimum calendar span between batch start / end dates (inclusive boundary check). */
const BATCH_MIN_SPAN_MONTHS = 4;
const FACULTY_TEXT_PATTERN = /^[\p{L}][\p{L}\s.'’&()/-]{4,119}$/u;
const FACULTY_PHONE_PATTERN = /^[0-9+\-() ]{7,20}$/;
const FACULTY_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const FACULTY_SHORT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9]{1,9}$/;

function parseDateInputOnly(isoDate) {
  if (!isoDate || typeof isoDate !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d))
    return null;
  const dt = new Date(y, mo - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function batchDatesInOrder(startStr, endStr) {
  const start = parseDateInputOnly(startStr);
  const end = parseDateInputOnly(endStr);
  if (!start || !end) return false;
  return end > start;
}

/** `endDate` must be strictly on/after calendar date `startDate + minMonths`. */
function batchSpansMinMonths(startStr, endStr, minMonths) {
  const start = parseDateInputOnly(startStr);
  const end = parseDateInputOnly(endStr);
  if (!start || !end || end <= start) return false;
  const minEnd = new Date(
    start.getFullYear(),
    start.getMonth() + minMonths,
    start.getDate(),
  );
  return end >= minEnd;
}

function formatRegistryDate(value, locale, fallback = "-") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(start, end, locale, fallback = "-") {
  const from = formatRegistryDate(start, locale, "");
  const to = formatRegistryDate(end, locale, "");
  if (!from && !to) return fallback;
  if (from && to) return `${from} - ${to}`;
  return from || to || fallback;
}

function normalizeId(value, fallback = "-") {
  if (value == null || value === "") return fallback;
  return String(value);
}

function inferTimelineStatus(start, end) {
  const now = new Date();
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  if (endDate && !Number.isNaN(endDate.getTime()) && endDate < now) {
    return "inactive";
  }
  if (startDate && !Number.isNaN(startDate.getTime()) && startDate > now) {
    return "pending";
  }
  return "active";
}

function getAcademicYearLabel(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (
    value.name ??
    value.label ??
    value.title ??
    (value.id != null ? String(value.id) : "")
  );
}

function getBatchStatus(record) {
  if (typeof record?.status === "string" && record.status.trim()) {
    return record.status.trim().toLowerCase();
  }
  return record?.isActive === false ? "inactive" : "active";
}

function getSemesterStatus(record) {
  if (typeof record?.status === "string" && record.status.trim()) {
    return record.status.trim().toLowerCase();
  }
  return inferTimelineStatus(record?.startDate, record?.endDate);
}

function getFacultyStatus(record) {
  if (typeof record?.status === "string" && record.status.trim()) {
    return record.status.trim().toLowerCase();
  }
  return "";
}

function getDepartmentMetaLine(record, t) {
  const parts = [record?.shortName, record?.facultyName].filter(Boolean);
  return parts.length
    ? parts.join(" • ")
    : t("adminDepartments.fallback.faculty");
}

function getFacultyMetaLine(record) {
  const parts = [
    record?.code ? `Code: ${record.code}` : "",
    record?.shortName ? `Short: ${record.shortName}` : "",
  ].filter(Boolean);
  return parts.join(" • ");
}

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

function normalizeGroupId(group) {
  return String(group?.id ?? group?.groupId ?? group?.uuid ?? "");
}

function groupTitle(group) {
  return (
    group?.name ?? group?.title ?? (group?.id != null ? String(group.id) : "-")
  );
}

function groupMembersCount(group) {
  const members =
    group?.groupMembers ??
    group?.members ??
    group?.studentIds ??
    group?.groupMemberIds ??
    [];
  return Array.isArray(members) ? members.length : 0;
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

function studentToOption(student) {
  const id = studentIdValue(student);
  if (!id) return null;
  return {
    value: id,
    label: displayName(student, id),
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

function getRegistryTabs(t) {
  return [
    {
      id: "departments",
      label: t("settings.academic.departments.title"),
      icon: GraduationCap,
    },
    {
      id: "academic-years",
      label: t("settings.academic.years.title"),
      icon: CalendarDays,
    },
    {
      id: "semesters",
      label: t("adminRegistry.tabs.semesters"),
      icon: CalendarDays,
    },
    {
      id: "batches",
      label: t("settings.academic.batches.title"),
      icon: BookMarked,
    },
    {
      id: "faculties",
      label: t("adminRegistry.tabs.faculties"),
      icon: Building2,
    },
  ];
}

function getDefaultFormValues(tabId) {
  switch (tabId) {
    case "academic-years":
      return {
        name: "",
        startDate: "",
        endDate: "",
        calendarType: "SOLAR",
      };
    case "semesters":
      return {
        academicYear: "",
        type: "",
        name: "",
        startDate: "",
        endDate: "",
      };
    case "batches":
      return {
        academicYear: "",
        name: "",
        year: String(new Date().getFullYear()),
        type: "",
        startDate: "",
        endDate: "",
        description: "",
        isActive: true,
      };
    case "faculties":
      return {
        name: "",
        establishDate: "",
        university: "",
        email: "",
        phone: "",
        shortName: "",
        description: "",
      };
    default:
      return {};
  }
}

function getEditFormValues(tabId, record) {
  if (!record) return getDefaultFormValues(tabId);
  switch (tabId) {
    case "academic-years":
      return {
        name: String(record?.name ?? record?.label ?? ""),
        startDate: String(record?.startDate ?? ""),
        endDate: String(record?.endDate ?? ""),
        calendarType: String(record?.calendarType ?? "SOLAR"),
      };
    case "semesters":
      return {
        academicYear: normalizeId(
          record?.academicYear?.id ?? record?.academicYear ?? "",
          "",
        ),
        type: String(record?.type ?? ""),
        name: String(record?.name ?? ""),
        startDate: String(record?.startDate ?? ""),
        endDate: String(record?.endDate ?? ""),
      };
    case "batches":
      return {
        academicYear: normalizeId(
          record?.academicYear?.id ?? record?.academicYear ?? "",
          "",
        ),
        name: String(record?.name ?? record?.title ?? ""),
        year: String(record?.year ?? ""),
        type: String(record?.type ?? ""),
        startDate: String(record?.startDate ?? ""),
        endDate: String(record?.endDate ?? ""),
        description: String(record?.description ?? ""),
        isActive: record?.isActive !== false,
      };
    case "faculties":
      return {
        name: String(record?.name ?? ""),
        establishDate: String(
          record?.establishDate ?? record?.establishedDate ?? "",
        ),
        university: normalizeId(
          record?.university?.id ??
            record?.university?.uuid ??
            record?.universityId ??
            record?.university_id ??
            (typeof record?.university === "string" ? record.university : "") ??
            "",
          "",
        ),
        email: String(record?.email ?? ""),
        phone: String(record?.phone ?? ""),
        shortName: String(record?.shortName ?? ""),
        description: String(record?.description ?? ""),
      };
    default:
      return {};
  }
}

function buildPayload(tabId, values) {
  switch (tabId) {
    case "academic-years":
      return {
        name: values.name.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        calendarType: values.calendarType,
      };
    case "semesters": {
      const ayId = String(values.academicYear ?? "").trim();
      return {
        academicYearId: ayId,
        academicYear: ayId,
        type: String(values.type ?? "")
          .trim()
          .toUpperCase(),
        name: values.name.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
      };
    }
    case "batches": {
      const ayId = String(values.academicYear ?? "").trim();
      return {
        academicYearId: ayId,
        academicYear: ayId,
        name: values.name.trim(),
        year: Number(values.year),
        type: values.type.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        description: values.description.trim() || undefined,
        isActive: Boolean(values.isActive),
      };
    }
    case "faculties":
      return {
        name: values.name.trim(),
        establishDate: values.establishDate,
        description: values.description.trim(),
        university: values.university.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        shortName: values.shortName.trim(),
      };
    default:
      return values;
  }
}

/** Field-level errors shown under inputs (semesters, batches, academic-year & faculty modals). */
function getRegistryFieldErrors(tabId, values, academicYears = [], t) {
  const tr = typeof t === "function" ? t : (key) => key;
  const req = () => tr("adminRegistry.validation.generic");

  /** @type {Record<string, string>} */
  const err = {};

  if (tabId === "academic-years") {
    if (!values.name?.trim()) err.name = req();
    if (!values.startDate) err.startDate = req();
    if (!values.endDate) err.endDate = req();
    if (!values.calendarType) err.calendarType = req();
    return err;
  }

  if (tabId === "semesters") {
    if (!values.name?.trim()) {
      err.name = tr("adminRegistry.validation.semesterNameRequired");
    }
    if (!values.academicYear) {
      err.academicYear = tr(
        "adminRegistry.validation.semesterAcademicYearRequired",
      );
    }
    if (
      !SEMESTER_TYPE_OPTIONS.includes(
        String(values.type ?? "")
          .trim()
          .toUpperCase(),
      )
    ) {
      err.type = tr("adminRegistry.validation.semesterTypeInvalid");
    }

    if (!values.startDate && !values.endDate) {
      const m = tr("adminRegistry.validation.semesterDatesRequired");
      err.startDate = m;
      err.endDate = m;
    } else {
      if (!values.startDate)
        err.startDate = tr("adminRegistry.validation.semesterDatesRequired");
      if (!values.endDate)
        err.endDate = tr("adminRegistry.validation.semesterDatesRequired");
    }

    if (values.startDate && values.endDate) {
      if (!batchDatesInOrder(values.startDate, values.endDate)) {
        err.endDate = tr("adminRegistry.validation.semesterDateOrder");
      } else {
        const academicYear = academicYears.find(
          (item) =>
            normalizeId(item?.id ?? item?.uuid, "") === values.academicYear,
        );
        if (
          academicYear?.startDate &&
          new Date(values.startDate) < new Date(academicYear.startDate)
        ) {
          err.startDate = tr(
            "adminRegistry.validation.semesterStartWithinYear",
          );
        }
        if (
          academicYear?.endDate &&
          new Date(values.endDate) > new Date(academicYear.endDate)
        ) {
          err.endDate = tr("adminRegistry.validation.semesterEndWithinYear");
        }
      }
    }
    return err;
  }

  if (tabId === "batches") {
    if (!values.name?.trim()) err.name = req();
    if (!values.type?.trim()) err.type = req();
    if (!values.academicYear) err.academicYear = req();

    if (!values.startDate && !values.endDate) {
      const m = req();
      err.startDate = m;
      err.endDate = m;
    } else {
      if (!values.startDate) err.startDate = req();
      if (!values.endDate) err.endDate = req();
    }

    if (!(Number(values.year) > 0)) err.year = req();

    if (values.startDate && values.endDate) {
      if (!batchDatesInOrder(values.startDate, values.endDate)) {
        err.endDate = tr("adminRegistry.validation.batchDateOrder");
      } else if (
        !batchSpansMinMonths(
          values.startDate,
          values.endDate,
          BATCH_MIN_SPAN_MONTHS,
        )
      ) {
        err.endDate = tr("adminRegistry.validation.batchMinSpanMonths", {
          months: BATCH_MIN_SPAN_MONTHS,
        });
      }
    }
    return err;
  }

  if (tabId === "faculties") {
    if (!values.name?.trim()) err.name = req();
    else if (!FACULTY_TEXT_PATTERN.test(values.name.trim()))
      err.name = tr("adminRegistry.validation.facultyNameInvalid");
    if (!values.establishDate) {
      err.establishDate = req();
    } else {
      const established = parseDateInputOnly(values.establishDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!established || established > today) {
        err.establishDate = tr("adminRegistry.validation.facultyDateInvalid");
      }
    }
    if (!values.university?.trim()) err.university = req();
    // `university` holds the university id. Skip strict text-pattern validation
    // since the value may be numeric or UUID-shaped.
    if (!values.email?.trim()) err.email = req();
    else if (!FACULTY_EMAIL_PATTERN.test(values.email.trim()))
      err.email = tr("adminRegistry.validation.facultyEmailInvalid");
    if (!values.phone?.trim()) err.phone = req();
    else if (!FACULTY_PHONE_PATTERN.test(values.phone.trim()))
      err.phone = tr("adminRegistry.validation.facultyPhoneInvalid");
    if (!values.shortName?.trim()) err.shortName = req();
    else if (!FACULTY_SHORT_NAME_PATTERN.test(values.shortName.trim()))
      err.shortName = tr("adminRegistry.validation.facultyShortNameInvalid");
    if (!values.description?.trim()) err.description = req();
    else if (values.description.trim().length > 500)
      err.description = tr(
        "adminRegistry.validation.facultyDescriptionInvalid",
      );
    return err;
  }

  return err;
}

function RegistryFields({
  tabId,
  values,
  setValues,
  academicYearOptions,
  universityOptions = EMPTY,
  t,
  fieldErrors = {},
}) {
  const fe = fieldErrors;
  if (tabId === "academic-years") {
    return (
      <div className="grid gap-4">
        <Field
          register={{}}
          label={t("settings.academic.year.fieldName")}
          placeholder={t("settings.academic.year.placeholderName")}
          value={values.name}
          error={fe.name}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
        />
        <Field
          register={{}}
          type="date"
          label={t("settings.academic.year.fieldStart")}
          value={values.startDate}
          error={fe.startDate}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              startDate: event.target.value,
            }))
          }
        />
        <Field
          register={{}}
          type="date"
          label={t("settings.academic.year.fieldEnd")}
          value={values.endDate}
          error={fe.endDate}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              endDate: event.target.value,
            }))
          }
        />
        <Select
          label={t("settings.academic.year.fieldCalendar")}
          value={values.calendarType}
          error={fe.calendarType}
          onValueChange={(value) =>
            setValues((current) => ({ ...current, calendarType: value }))
          }
          placeholder={t("settings.academic.year.placeholderCalendar")}
          options={[
            {
              value: "SOLAR",
              label: t("settings.academic.year.calendarSolar"),
            },
            {
              value: "LUNAR",
              label: t("settings.academic.year.calendarLunar"),
            },
          ]}
        />
      </div>
    );
  }

  if (tabId === "semesters") {
    return (
      <div className="grid gap-4">
        <Select
          label={t("settings.academic.batch.fieldAcademicYear")}
          value={values.academicYear}
          error={fe.academicYear}
          onValueChange={(value) =>
            setValues((current) => ({ ...current, academicYear: value }))
          }
          options={academicYearOptions}
          placeholder={t("adminRegistry.form.semesterAcademicYearPlaceholder")}
        />
        <Field
          register={{}}
          label={t("adminRegistry.form.semesterName")}
          placeholder={t("adminRegistry.form.semesterNamePlaceholder")}
          value={values.name}
          error={fe.name}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
        />
        <Select
          label={t("adminRegistry.form.semesterType")}
          value={values.type}
          error={fe.type}
          onValueChange={(value) =>
            setValues((current) => ({ ...current, type: value }))
          }
          options={SEMESTER_TYPE_OPTIONS.map((value) => ({
            value,
            label: value.charAt(0) + value.slice(1).toLowerCase(),
          }))}
          placeholder={t("adminRegistry.form.semesterTypePlaceholder")}
        />
        <Field
          register={{}}
          type="date"
          label={t("settings.academic.batch.fieldStart")}
          value={values.startDate}
          error={fe.startDate}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              startDate: event.target.value,
            }))
          }
        />
        <Field
          register={{}}
          type="date"
          label={t("settings.academic.batch.fieldEnd")}
          value={values.endDate}
          error={fe.endDate}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              endDate: event.target.value,
            }))
          }
        />
      </div>
    );
  }

  if (tabId === "batches") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Select
            label={t("settings.academic.batch.fieldAcademicYear")}
            value={values.academicYear}
            error={fe.academicYear}
            onValueChange={(value) =>
              setValues((current) => ({ ...current, academicYear: value }))
            }
            options={academicYearOptions}
            placeholder={t("settings.academic.batch.placeholderAcademicYear")}
          />
        </div>
        <Field
          register={{}}
          label={t("settings.academic.batch.fieldName")}
          placeholder={t("settings.academic.batch.placeholderName")}
          value={values.name}
          error={fe.name}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
        />
        <Field
          register={{}}
          type="number"
          label={t("settings.academic.batch.fieldYear")}
          placeholder={t("settings.academic.batch.placeholderYear")}
          value={values.year}
          error={fe.year}
          onChange={(event) =>
            setValues((current) => ({ ...current, year: event.target.value }))
          }
        />
        <Field
          register={{}}
          label={t("settings.academic.batch.fieldType")}
          placeholder={t("settings.academic.batch.placeholderType")}
          value={values.type}
          error={fe.type}
          onChange={(event) =>
            setValues((current) => ({ ...current, type: event.target.value }))
          }
        />
        <Field
          register={{}}
          type="date"
          label={t("settings.academic.batch.fieldStart")}
          value={values.startDate}
          error={fe.startDate}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              startDate: event.target.value,
            }))
          }
        />
        <Field
          register={{}}
          type="date"
          label={t("settings.academic.batch.fieldEnd")}
          value={values.endDate}
          error={fe.endDate}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              endDate: event.target.value,
            }))
          }
        />
        <div className="md:col-span-2">
          <TextArea
            label={t("settings.academic.batch.fieldDesc")}
            placeholder={t("settings.academic.batch.placeholderDesc")}
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={4}
          />
        </div>
        <div className="md:col-span-2">
          <Checkbox
            id="batch-active"
            checked={values.isActive}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                isActive: event.target.checked,
              }))
            }
            label={t("settings.academic.batch.fieldActive")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      <div className="md:col-span-6">
        <Field
          register={{}}
          label={`${t("adminRegistry.form.facultyName")} *`}
          placeholder={t("adminRegistry.form.facultyNamePlaceholder")}
          value={values.name}
          error={fe.name}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
        />
      </div>
      <div className="md:col-span-6">
        <Field
          register={{}}
          label={`${t("adminRegistry.form.facultyShortName")} *`}
          placeholder={t("adminRegistry.form.facultyShortNamePlaceholder")}
          value={values.shortName}
          error={fe.shortName}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              shortName: event.target.value,
            }))
          }
        />
      </div>

      <div className="flex flex-col gap-1 md:col-span-6">
        <span className="text-[11px] font-semibold text-primary dark:text-dark-primary">
          {t("adminRegistry.form.facultyUniversity")} *
        </span>
        <SearchableSelect
          value={values.university}
          onValueChange={(value) =>
            setValues((current) => ({
              ...current,
              university: value ?? "",
            }))
          }
          options={universityOptions}
          placeholder={t("adminRegistry.form.facultyUniversityPlaceholder")}
          searchPlaceholder={t("adminRegistry.form.facultyUniversitySearch")}
          disabled={universityOptions.length === 0}
          className={
            fe.university
              ? "border-(--color-light-error-border) dark:border-(--color-dark-error-border)"
              : ""
          }
        />
        {fe.university ? (
          <p className="text-[11px] font-medium text-error">{fe.university}</p>
        ) : null}
      </div>
      <div className="md:col-span-6">
        <Field
          register={{}}
          type="date"
          label={`${t("adminRegistry.form.facultyEstablishDate")} *`}
          value={values.establishDate}
          error={fe.establishDate}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              establishDate: event.target.value,
            }))
          }
        />
      </div>
      <div className="md:col-span-6">
        <Field
          register={{}}
          type="email"
          label={`${t("adminRegistry.form.facultyEmail")} *`}
          placeholder={t("adminRegistry.form.facultyEmailPlaceholder")}
          value={values.email}
          error={fe.email}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
        />
      </div>
      <div className="md:col-span-6">
        <Field
          register={{}}
          type="tel"
          label={`${t("adminRegistry.form.facultyPhone")} *`}
          placeholder={t("adminRegistry.form.facultyPhonePlaceholder")}
          value={values.phone}
          error={fe.phone}
          onChange={(event) =>
            setValues((current) => ({ ...current, phone: event.target.value }))
          }
        />
      </div>
      <TextArea
        className="md:col-span-12"
        label={`${t("adminDepartments.form.fields.description")} *`}
        placeholder={t("adminRegistry.form.facultyDescriptionPlaceholder")}
        value={values.description}
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            description: event.target.value,
          }))
        }
        rows={5}
        error={fe.description}
      />
    </div>
  );
}

export default function Departments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState("departments");
  const [viewTab, setViewTab] = useState("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [hiddenColumns, setHiddenColumns] = useState(() => new Set());
  const [compactRows, setCompactRows] = useState(false);
  const [sortKey, setSortKey] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [groupOperation, setGroupOperation] = useState(null);
  const [groupOperationDraft, setGroupOperationDraft] = useState({
    studentId: "",
  });
  const [logoUploadRecord, setLogoUploadRecord] = useState(null);
  const logoFileInputRef = useRef(null);
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const [formValues, setFormValues] = useState(
    getDefaultFormValues("semesters"),
  );
  const [registryFieldErrors, setRegistryFieldErrors] = useState({});

  const registrySetValues = useCallback((updater) => {
    setRegistryFieldErrors({});
    setFormValues(updater);
  }, []);

  const {
    data: departments = EMPTY,
    isError,
    error,
  } = useDepartments({
    notifyOnError: true,
  });
  const { data: semesters = EMPTY } = useSemesters({}, { notifyOnError: true });
  const { data: batches = EMPTY } = useBatches({ notifyOnError: true });
  const { data: faculties = EMPTY } = useFaculties({ notifyOnError: true });
  const { data: universities = EMPTY } = useUniversities({
    notifyOnError: false,
  });
  const { data: groups = EMPTY } = useFacultyGroups(
    {},
    { notifyOnError: true },
  );
  const { data: studentPage } = useStudentsPage(
    { page: 0, pageSize: 500, notifyOnError: false },
    { staleTime: 60_000 },
  );
  const { data: academicYears = EMPTY } = useAcademicYears(
    {},
    { notifyOnError: false },
  );

  const createSemester = useCreateSemester();
  const updateSemester = useUpdateSemester();
  const deleteSemester = useDeleteSemester();

  const createAcademicYear = useCreateAcademicYear();
  const updateAcademicYear = useUpdateAcademicYear();
  const deleteAcademicYear = useDeleteAcademicYear();

  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const deleteBatch = useDeleteBatch();

  const createFaculty = useCreateFaculty();
  const updateFaculty = useUpdateFaculty();
  const deleteFaculty = useDeleteFaculty();
  const deleteFacultyGroup = useDeleteFacultyGroup({
    showSuccessToast: false,
    showErrorToast: false,
  });
  const updateFacultyGroup = useUpdateFacultyGroup({
    showSuccessToast: false,
    showErrorToast: false,
  });
  const updateFacultyGroupLeader = useUpdateFacultyGroupLeader({
    showSuccessToast: false,
    showErrorToast: false,
  });

  const deleteDepartmentMutation = useDeleteDepartment({
    showSuccessToast: false,
    showErrorToast: false,
  });
  const uploadDepartmentLogo = useUploadDepartmentLogo({
    showSuccessToast: false,
    toastError: "apiErrors.failed_to_upload_department_logo",
  });

  const tabs = useMemo(() => getRegistryTabs(t), [t]);
  const locale =
    i18n.language === "ps"
      ? "ps-AF"
      : i18n.language === "prs"
        ? "fa-AF"
        : "en-US";

  const academicYearOptions = useMemo(
    () =>
      (Array.isArray(academicYears) ? academicYears : []).map((year) => ({
        value: normalizeId(year?.id ?? year?.uuid, ""),
        label:
          year?.name ??
          year?.label ??
          (year?.id != null ? String(year.id) : ""),
      })),
    [academicYears],
  );
  const studentOptions = useMemo(
    () =>
      (Array.isArray(studentPage?.content) ? studentPage.content : [])
        .map(studentToOption)
        .filter(Boolean),
    [studentPage],
  );
  const universityOptions = useMemo(() => {
    const seen = new Set();
    return (Array.isArray(universities) ? universities : [])
      .map((record) => {
        const value = normalizeId(record?.id ?? record?.uuid, "");
        const label = String(
          record?.name ??
            record?.title ??
            record?.universityName ??
            value ??
            "",
        ).trim();
        if (!value || !label) return null;
        return {
          value,
          label,
          description: record?.code ? String(record.code) : undefined,
          searchText: [label, record?.code, value].filter(Boolean).join(" "),
        };
      })
      .filter((option) => {
        if (!option) return false;
        const key = option.value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [universities]);
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

  useEffect(() => {
    setPage(1);
    setStatusFilter(STATUS_ALL);
    setSearchInput("");
    setHiddenColumns(new Set());
    setSelectedIds(new Set());
    setSortKey("name");
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  const activeData = useMemo(() => {
    if (activeTab === "departments") return departments;
    if (activeTab === "academic-years") return academicYears;
    if (activeTab === "semesters") return semesters;
    if (activeTab === "batches") return batches;
    if (activeTab === "groups") return groups;
    return faculties;
  }, [
    activeTab,
    academicYears,
    batches,
    departments,
    faculties,
    groups,
    semesters,
  ]);

  const filteredRows = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase();

    return activeData.filter((record) => {
      let status = "";
      let fields = [];

      if (activeTab === "departments") {
        status = String(record?.status ?? "").toLowerCase();
        fields = [
          record?.id,
          record?.code,
          record?.name,
          record?.shortName,
          record?.head,
          record?.facultyName,
          record?.field,
        ];
      } else if (activeTab === "academic-years") {
        status = inferTimelineStatus(record?.startDate, record?.endDate);
        fields = [
          record?.id,
          record?.name,
          record?.calendarType,
          record?.startDate,
          record?.endDate,
        ];
      } else if (activeTab === "semesters") {
        status = getSemesterStatus(record);
        fields = [
          record?.id,
          record?.name,
          record?.type,
          getAcademicYearLabel(record?.academicYear),
        ];
      } else if (activeTab === "batches") {
        status = getBatchStatus(record);
        fields = [
          record?.id,
          record?.name,
          record?.type,
          record?.year,
          getAcademicYearLabel(record?.academicYear),
        ];
      } else if (activeTab === "groups") {
        fields = [
          normalizeGroupId(record),
          groupTitle(record),
          displayName(record?.groupLeader, ""),
          groupMembersCount(record),
        ];
      } else {
        status = getFacultyStatus(record);
        fields = [
          record?.id,
          record?.name,
          record?.code,
          record?.email,
          record?.phone,
          record?.shortName,
          record?.description,
        ];
      }

      const matchesSearch =
        search === "" ||
        fields.some((field) =>
          String(field ?? "")
            .toLowerCase()
            .includes(search),
        );

      const matchesStatus =
        statusFilter === STATUS_ALL ||
        (status && status === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [activeData, activeTab, debouncedSearch, statusFilter]);

  const availableStatuses = useMemo(() => {
    const values = new Set();

    filteredRows.forEach((record) => {
      if (activeTab === "departments")
        values.add(String(record?.status ?? "").toLowerCase());
      if (activeTab === "academic-years") {
        values.add(inferTimelineStatus(record?.startDate, record?.endDate));
      }
      if (activeTab === "semesters") values.add(getSemesterStatus(record));
      if (activeTab === "batches") values.add(getBatchStatus(record));
      if (activeTab === "groups") return;
      if (activeTab === "faculties") {
        const status = getFacultyStatus(record);
        if (status) values.add(status);
      }
    });

    return Array.from(values).filter(Boolean);
  }, [activeTab, filteredRows]);

  const totalElements = filteredRows.length;
  const totalPages =
    totalElements > 0 ? Math.ceil(totalElements / pageSize) : 0;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const sortedRows = useMemo(() => {
    const accessors = {
      id: (record) =>
        activeTab === "groups"
          ? normalizeGroupId(record)
          : normalizeId(record?.id ?? record?.code, ""),
      name: (record) =>
        activeTab === "groups"
          ? groupTitle(record)
          : String(record?.name ?? record?.title ?? record?.code ?? ""),
      status: (record) => {
        if (activeTab === "academic-years")
          return inferTimelineStatus(record?.startDate, record?.endDate);
        if (activeTab === "semesters") return getSemesterStatus(record);
        if (activeTab === "batches") return getBatchStatus(record);
        return String(record?.status ?? "");
      },
      date: (record) =>
        record?.createdAt ?? record?.startDate ?? record?.endDate ?? "",
    };
    const getValue = accessors[sortKey] ?? accessors.name;
    return [...filteredRows].sort((a, b) => {
      const result = String(getValue(a)).localeCompare(
        String(getValue(b)),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        },
      );
      return sortDirection === "desc" ? -result : result;
    });
  }, [activeTab, filteredRows, sortDirection, sortKey]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const statusOptions = useMemo(() => {
    if (!availableStatuses.length) return [];
    return [
      { value: STATUS_ALL, label: t("adminShared.filters.allStatus") },
      ...availableStatuses.map((status) => ({
        value: status,
        label: t(`adminShared.status.${status}`),
      })),
    ];
  }, [availableStatuses, t]);
  const effectiveStatusOptions = statusOptions.length
    ? statusOptions
    : [{ value: STATUS_ALL, label: t("adminShared.filters.allStatus") }];
  const sortOptions = useMemo(
    () => [
      { value: "name", label: t("adminTable.sort.name") },
      { value: "id", label: t("adminDepartments.table.id") },
      { value: "status", label: t("adminDepartments.table.status") },
      { value: "date", label: t("adminDepartments.table.created") },
    ],
    [t],
  );
  const toggleSelected = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleColumn = (id) => {
    setHiddenColumns((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toolbarTitle = useMemo(() => {
    if (activeTab === "departments") return t("adminDepartments.header.title");
    if (activeTab === "academic-years") {
      return t("settings.academic.years.title");
    }
    if (activeTab === "semesters") {
      return t("adminRegistry.titles.semesters");
    }
    if (activeTab === "batches") {
      return t("adminRegistry.titles.batches");
    }
    if (activeTab === "groups") {
      return t("adminProjects.registry.title");
    }
    return t("adminRegistry.titles.faculties");
  }, [activeTab, t]);

  const toolbarDescription = useMemo(() => {
    if (activeTab === "departments") {
      return t("adminDepartments.header.description", {
        count: departments.length,
      });
    }
    if (activeTab === "academic-years") {
      return t("adminRegistry.descriptions.academicYears", {
        count: academicYears.length,
      });
    }
    if (activeTab === "semesters") {
      return t("adminRegistry.descriptions.semesters", {
        count: semesters.length,
      });
    }
    if (activeTab === "batches") {
      return t("adminRegistry.descriptions.batches", {
        count: batches.length,
      });
    }
    if (activeTab === "groups") {
      return t("adminProjects.header.description", {
        count: groups.length,
      });
    }
    return t("adminRegistry.descriptions.faculties", {
      count: faculties.length,
    });
  }, [
    activeTab,
    academicYears.length,
    batches.length,
    departments.length,
    faculties.length,
    groups.length,
    semesters.length,
    t,
  ]);

  const columnDefs = useMemo(() => {
    if (activeTab === "departments") {
      return [
        { id: "select", title: "", required: true },
        {
          id: "id",
          title: t("adminDepartments.table.id"),
          icon: <Hash className="size-3.5 shrink-0" strokeWidth={2} />,
        },
        {
          id: "primary",
          title: t("adminDepartments.table.department"),
          icon: <Building2 className="size-3.5 shrink-0" strokeWidth={2} />,
        },
        {
          id: "secondary",
          title: t("adminDepartments.table.head"),
          icon: <UserRound className="size-3.5 shrink-0" strokeWidth={2} />,
        },
        {
          id: "status",
          title: t("adminDepartments.table.status"),
          icon: <BadgeCheck className="size-3.5 shrink-0" strokeWidth={2} />,
        },
        {
          id: "date",
          title: t("adminDepartments.table.created"),
          icon: <CalendarDays className="size-3.5 shrink-0" strokeWidth={2} />,
        },
        {
          id: "actions",
          title: t("adminDepartments.table.actions"),
          align: "center",
          required: true,
        },
      ];
    }

    if (activeTab === "academic-years") {
      return [
        { id: "select", title: "", required: true },
        { id: "id", title: t("adminDepartments.table.id") },
        { id: "primary", title: t("settings.academic.year.fieldName") },
        { id: "secondary", title: t("adminRegistry.table.range") },
        { id: "type", title: t("settings.academic.year.fieldCalendar") },
        { id: "status", title: t("adminDepartments.table.status") },
        {
          id: "actions",
          title: t("adminDepartments.table.actions"),
          align: "center",
          required: true,
        },
      ];
    }

    if (activeTab === "semesters") {
      return [
        { id: "select", title: "", required: true },
        { id: "id", title: t("adminDepartments.table.id") },
        {
          id: "primary",
          title: t("adminRegistry.table.semester"),
        },
        {
          id: "secondary",
          title: t("settings.academic.batch.fieldAcademicYear"),
        },
        {
          id: "date",
          title: t("adminRegistry.table.range"),
        },
        { id: "status", title: t("adminDepartments.table.status") },
        {
          id: "actions",
          title: t("adminDepartments.table.actions"),
          align: "center",
          required: true,
        },
      ];
    }

    if (activeTab === "batches") {
      return [
        { id: "select", title: "", required: true },
        { id: "id", title: t("adminDepartments.table.id") },
        { id: "primary", title: t("settings.academic.batch.fieldName") },
        {
          id: "secondary",
          title: t("settings.academic.batch.fieldAcademicYear"),
        },
        { id: "type", title: t("settings.academic.batch.fieldType") },
        { id: "status", title: t("adminDepartments.table.status") },
        {
          id: "actions",
          title: t("adminDepartments.table.actions"),
          align: "center",
          required: true,
        },
      ];
    }

    if (activeTab === "groups") {
      return [
        { id: "select", title: "", required: true },
        { id: "id", title: t("adminProjects.table.groupId") },
        { id: "primary", title: t("adminProjects.faculty.col.name") },
        { id: "secondary", title: t("adminProjects.faculty.col.leader") },
        { id: "status", title: t("adminProjects.faculty.col.members") },
        {
          id: "actions",
          title: t("adminDepartments.table.actions"),
          align: "center",
          required: true,
        },
      ];
    }

    return [
      { id: "select", title: "", required: true },
      { id: "id", title: t("adminDepartments.table.id") },
      {
        id: "primary",
        title: t("adminRegistry.table.faculty"),
      },
      {
        id: "secondary",
        title: t("adminDepartments.form.fields.description"),
      },
      {
        id: "actions",
        title: t("adminDepartments.table.actions"),
        align: "center",
        required: true,
      },
    ];
  }, [activeTab, t]);
  const visibleColumnDefs = useMemo(
    () => columnDefs.filter((column) => !hiddenColumns.has(column.id)),
    [columnDefs, hiddenColumns],
  );
  const headerData = useMemo(
    () =>
      visibleColumnDefs.map((column) => ({
        title: column.title,
        tooltip: column.tooltip,
        icon: column.icon,
        align: column.align,
        className: column.className,
      })),
    [visibleColumnDefs],
  );

  const activeMutationState = useMemo(() => {
    if (activeTab === "academic-years") {
      return {
        create: createAcademicYear,
        update: updateAcademicYear,
        delete: deleteAcademicYear,
        queryKey: ["academic-years"],
      };
    }
    if (activeTab === "semesters") {
      return {
        create: createSemester,
        update: updateSemester,
        delete: deleteSemester,
        queryKey: ["semesters"],
      };
    }
    if (activeTab === "batches") {
      return {
        create: createBatch,
        update: updateBatch,
        delete: deleteBatch,
        queryKey: ["batches"],
      };
    }
    if (activeTab === "faculties") {
      return {
        create: createFaculty,
        update: updateFaculty,
        delete: deleteFaculty,
        queryKey: ["faculties"],
      };
    }
    if (activeTab === "groups") {
      return {
        create: null,
        update: updateFacultyGroup,
        delete: deleteFacultyGroup,
        queryKey: ["faculty-groups"],
      };
    }
    return {
      create: null,
      update: null,
      delete: deleteDepartmentMutation,
      queryKey: ["departments"],
    };
  }, [
    activeTab,
    createAcademicYear,
    createBatch,
    createFaculty,
    createSemester,
    deleteAcademicYear,
    deleteBatch,
    deleteDepartmentMutation,
    deleteFaculty,
    deleteFacultyGroup,
    deleteSemester,
    updateAcademicYear,
    updateBatch,
    updateFaculty,
    updateFacultyGroup,
    updateSemester,
  ]);

  const exportToCSV = () => {
    const rows = filteredRows.map((record) => {
      if (activeTab === "departments") {
        return [
          normalizeId(record?.id ?? record?.code),
          record?.name ?? "",
          record?.head ?? "",
          record?.facultyName ?? "",
          record?.status ?? "",
        ];
      }
      if (activeTab === "academic-years") {
        return [
          normalizeId(record?.id),
          record?.name ?? "",
          record?.calendarType ?? "",
          formatDateRange(record?.startDate, record?.endDate, locale),
          inferTimelineStatus(record?.startDate, record?.endDate),
        ];
      }
      if (activeTab === "semesters") {
        return [
          normalizeId(record?.id),
          record?.name ?? "",
          record?.type ?? "",
          getAcademicYearLabel(record?.academicYear),
          getSemesterStatus(record),
        ];
      }
      if (activeTab === "batches") {
        return [
          normalizeId(record?.id),
          record?.name ?? "",
          record?.year ?? "",
          record?.type ?? "",
          getAcademicYearLabel(record?.academicYear),
          getBatchStatus(record),
        ];
      }
      if (activeTab === "groups") {
        return [
          normalizeGroupId(record),
          groupTitle(record),
          displayName(record?.groupLeader),
          groupMembersCount(record),
        ];
      }
      return [
        normalizeId(record?.id),
        record?.name ?? "",
        record?.code ?? "",
        record?.shortName ?? "",
      ];
    });

    const csvContent = rows
      .map((row) =>
        row
          .map((field) => `"${String(field ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCreateModal = () => {
    if (activeTab === "departments") {
      setShowAddModal(true);
      return;
    }
    if (activeTab === "groups") {
      navigate("/admin/projects/groups/register", {
        state: { returnTo: "/admin/department", returnTab: "groups" },
      });
      return;
    }
    setRegistryFieldErrors({});
    setFormValues(getDefaultFormValues(activeTab));
    setShowAddModal(true);
  };

  const openEditModal = (record) => {
    if (activeTab === "groups") {
      navigate(
        `/admin/projects/groups/register/${encodeURIComponent(normalizeGroupId(record))}`,
        { state: { returnTo: "/admin/department", returnTab: "groups" } },
      );
      return;
    }
    setRegistryFieldErrors({});
    setSelectedRecord(record);
    if (activeTab !== "departments") {
      setFormValues(getEditFormValues(activeTab, record));
    }
    setShowEditModal(true);
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

  const closeFormModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedRecord(null);
    setRegistryFieldErrors({});
    setFormValues(getDefaultFormValues(activeTab));
  };

  const submitGroupOperation = async () => {
    if (
      !groupOperation?.record ||
      updateFacultyGroup.isPending ||
      updateFacultyGroupLeader.isPending
    )
      return;
    const selectedStudentId = String(
      groupOperationDraft.studentId ?? "",
    ).trim();
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
          : t("adminProjects.groups.operations.changeLeaderSuccess"),
      );
      closeGroupOperation();
    } catch (e) {
      gooeyToast.error(
        e?.message || t("adminProjects.groups.operations.updateError"),
      );
    }
  };

  const submitGenericForm = async (mode) => {
    const nextErrors = getRegistryFieldErrors(
      activeTab,
      formValues,
      academicYears,
      t,
    );
    if (Object.keys(nextErrors).length > 0) {
      setRegistryFieldErrors(nextErrors);
      return;
    }
    setRegistryFieldErrors({});

    const payload = buildPayload(activeTab, formValues);
    const mutation =
      mode === "create"
        ? activeMutationState.create
        : activeMutationState.update;
    if (!mutation) return;

    try {
      if (mode === "create") {
        await mutation.mutateAsync(payload);
      } else {
        const rid =
          selectedRecord?.id ??
          selectedRecord?.uuid ??
          selectedRecord?.batchId ??
          selectedRecord?.semesterId;
        await mutation.mutateAsync({
          id: rid,
          ...payload,
        });
      }
      await queryClient.invalidateQueries({
        queryKey: activeMutationState.queryKey,
      });
      if (activeTab === "semesters" || activeTab === "batches") {
        await queryClient.invalidateQueries({ queryKey: ["semesters"] });
        await queryClient.invalidateQueries({ queryKey: ["batches"] });
      }
      closeFormModals();
    } catch {
      // toast handled by mutation
    }
  };

  const confirmDelete = async () => {
    if (!deleteRecord || deleteSubmitting) return;
    setDeleteSubmitting(true);
    try {
      if (activeTab === "departments") {
        await deleteDepartmentMutation.mutateAsync(deleteRecord.id);
      } else if (activeTab === "groups") {
        await deleteFacultyGroup.mutateAsync(deleteRecord.id);
      } else {
        await activeMutationState.delete.mutateAsync(deleteRecord.id);
      }
      await queryClient.invalidateQueries({
        queryKey: activeMutationState.queryKey,
      });
      const successMessage =
        activeTab === "departments"
          ? t("adminDepartments.delete.success")
          : activeTab === "groups"
            ? t("adminProjects.delete.success")
            : t("adminRegistry.delete.success");
      gooeyToast.success(successMessage);
      setDeleteRecord(null);
    } catch (e) {
      gooeyToast.error(e?.message || t("adminRegistry.delete.error"));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openDeleteRecord = (record) => {
    setDeleteRecord({
      id: activeTab === "groups" ? normalizeGroupId(record) : record?.id,
      name:
        (activeTab === "groups" ? groupTitle(record) : null) ??
        record?.name ??
        record?.title ??
        record?.code ??
        normalizeId(record?.id),
      meta:
        activeTab === "departments"
          ? record?.head || t("adminDepartments.fallback.head")
          : activeTab === "academic-years"
            ? record?.calendarType || "-"
            : activeTab === "semesters"
              ? record?.type || "-"
              : activeTab === "batches"
                ? getAcademicYearLabel(record?.academicYear) || "-"
                : activeTab === "groups"
                  ? displayName(record?.groupLeader)
                  : record?.code || "-",
    });
  };

  const openDepartmentLogoUpload = (record) => {
    if (!record?.id) return;
    setLogoUploadRecord(record);
    window.setTimeout(() => logoFileInputRef.current?.click?.(), 0);
  };

  const handleDepartmentLogoFile = async (event) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file || !logoUploadRecord?.id) return;

    try {
      await uploadDepartmentLogo.mutateAsync({
        id: logoUploadRecord.id,
        file,
      });
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      await queryClient.invalidateQueries({
        queryKey: ["departments", logoUploadRecord.id],
      });
      gooeyToast.success(t("adminDepartments.form.toast.logoUploadSuccess"));
    } catch (e) {
      gooeyToast.error(
        e?.message || t("apiErrors.failed_to_upload_department_logo"),
      );
    } finally {
      setLogoUploadRecord(null);
    }
  };

  const renderRegistryActions = (record) => (
    <DropdownMenuRoot>
      <DropdownTrigger showArrow={false}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
      </DropdownTrigger>
      <DropdownContent align="end">
        {activeTab === "departments" ? (
          <DropdownItem
            onClick={() => navigate(`/admin/department/${record.id}`)}
          >
            <span>{t("adminShared.actions.viewProfile")}</span>
          </DropdownItem>
        ) : null}
        {activeTab === "departments" ? (
          <DropdownItem
            icon={<ImageUp className="size-3.5" />}
            onClick={() => openDepartmentLogoUpload(record)}
          >
            <span>{t("adminDepartments.form.fields.logo")}</span>
          </DropdownItem>
        ) : null}
        <DropdownItem onClick={() => openEditModal(record)}>
          <span>{t("adminShared.actions.editDetails")}</span>
        </DropdownItem>
        {activeTab === "groups" ? (
          <>
            <DropdownItem
              icon={<UserPlus className="size-3.5" />}
              onClick={() => openGroupOperation("add-member", record)}
            >
              <span>{t("adminProjects.groups.operations.addMember")}</span>
            </DropdownItem>
            <DropdownItem
              icon={<BadgeCheck className="size-3.5" />}
              onClick={() => openGroupOperation("change-leader", record)}
            >
              <span>{t("adminProjects.groups.operations.changeLeader")}</span>
            </DropdownItem>
            <DropdownItem
              icon={<UsersRound className="size-3.5" />}
              onClick={() =>
                navigate(
                  `/admin/projects/groups/register/${encodeURIComponent(normalizeGroupId(record))}`,
                  {
                    state: {
                      returnTo: "/admin/department",
                      returnTab: "groups",
                    },
                  },
                )
              }
            >
              <span>{t("adminProjects.groups.operations.manageRoster")}</span>
            </DropdownItem>
          </>
        ) : null}
        <DropdownSeparator />
        <DropdownItem variant="danger" onClick={() => openDeleteRecord(record)}>
          <span>{t("adminShared.actions.delete")}</span>
        </DropdownItem>
      </DropdownContent>
    </DropdownMenuRoot>
  );

  if (isError) {
    return (
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto bg-light-app-bg p-4 md:p-5 dark:bg-dark-card-bg">
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-light-error-bg dark:bg-dark-error-bg">
            <Icon
              d={IC.x}
              className="h-5 w-5 text-light-error-text dark:text-dark-error-text"
            />
          </div>
          <div className="text-center">
            <p className="font-medium text-primary dark:text-dark-primary">
              {t("apiErrors.failed_to_load_departments")}
            </p>
            <p className="mt-1 max-w-md text-sm text-muted dark:text-dark-muted">
              {error?.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-white  p-4 md:p-5 min-h-screen dark:bg-dark-card-bg">
      <input
        ref={logoFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleDepartmentLogoFile}
      />
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-muted">
            <Layers className="size-4" strokeWidth={2} />
            {t("settings.tabs.academic")}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-primary dark:text-dark-primary">
            {toolbarTitle}
          </h1>
          <p className="mt-1 text-muted dark:text-dark-muted">
            {toolbarDescription}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <OperationsDropdown
            items={[
              {
                key: "export",
                icon: <Icon d={IC.download} className="size-4" />,
                label: t("adminShared.actions.download"),
                onClick: exportToCSV,
              },
            ]}
          />
          <Button
            type="button"
            onClick={openCreateModal}
            icon={<Plus className="size-4 text-white" strokeWidth={2} />}
          >
            <span className="text-white">
              {activeTab === "departments"
                ? t("adminDepartments.actions.add")
                : activeTab === "groups"
                  ? t("adminProjects.registry.addGroup")
                  : t("adminRegistry.actions.add")}
            </span>
          </Button>
        </div>
      </div>

      <div className="w-full flex flex-col gap-y-1">
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row
                justify="between"
                className="items-stretch gap-3 sm:items-center"
              >
                <SettingsTabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                />
                <TableToolbar.ViewTabs
                  value={viewTab}
                  onValueChange={setViewTab}
                  tabs={[
                    {
                      id: "list",
                      label: t("adminDepartments.toolbar.list"),
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
                      label: t("adminDepartments.toolbar.board"),
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
                    id="registry-search"
                    placeholder={t("adminRegistry.search")}
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    iconD={IC.search}
                  />
                </div>
                {statusOptions.length > 0 ? (
                  <div className="w-full shrink-0 sm:w-48">
                    <Select
                      options={statusOptions}
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    />
                  </div>
                ) : null}
                <AdminTableToolDropdowns
                  labels={{
                    filter: t("adminDepartments.toolbar.filter"),
                    sort: t("adminDepartments.toolbar.sort"),
                    columns: t("adminDepartments.toolbar.columns"),
                    hide: t("adminDepartments.toolbar.hide"),
                  }}
                  icons={{
                    filter: (
                      <Filter className="size-3.5 shrink-0" strokeWidth={2} />
                    ),
                    sort: (
                      <ArrowUpDown
                        className="size-3.5 shrink-0"
                        strokeWidth={2}
                      />
                    ),
                    columns: (
                      <Columns3 className="size-3.5 shrink-0" strokeWidth={2} />
                    ),
                    hide: (
                      <EyeOff className="size-3.5 shrink-0" strokeWidth={2} />
                    ),
                  }}
                  statusOptions={effectiveStatusOptions}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  sortOptions={sortOptions}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSortChange={(key, direction) => {
                    setSortKey(key);
                    setSortDirection(direction);
                  }}
                  columns={columnDefs.map((column) => ({
                    id: column.id,
                    label: column.title || t("adminTable.columns.selection"),
                    required: column.required,
                  }))}
                  hiddenColumns={[...hiddenColumns]}
                  onToggleColumn={toggleColumn}
                  onResetColumns={() => setHiddenColumns(new Set())}
                  compactRows={compactRows}
                  onToggleCompactRows={() => setCompactRows((value) => !value)}
                />
              </TableToolbar.Row>
            </TableToolbar>
          }
        >
          {viewTab === "list" ? (
            <>
              <TableHeader headerData={headerData} />
              <TableBody>
                {pageRows.map((record) => (
                  <TableRow
                    key={
                      activeTab === "groups"
                        ? `${activeTab}-${normalizeGroupId(record)}`
                        : `${activeTab}-${normalizeId(record?.id ?? record?.code)}`
                    }
                    className={compactRows ? "[&_td]:py-2" : undefined}
                  >
                    <TableColumn className="w-10">
                      <Checkbox
                        checked={selectedIds.has(
                          activeTab === "groups"
                            ? normalizeGroupId(record)
                            : normalizeId(record?.id ?? record?.code),
                        )}
                        onChange={() =>
                          toggleSelected(
                            activeTab === "groups"
                              ? normalizeGroupId(record)
                              : normalizeId(record?.id ?? record?.code),
                          )
                        }
                      />
                    </TableColumn>

                    {activeTab === "departments" ? (
                      <>
                        <TableColumn className="font-mono text-xs">
                          #{normalizeId(record?.code ?? record?.id)}
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-default bg-light-app-tertiary text-secondary dark:border-dark-default dark:bg-dark-app-tertiary dark:text-dark-secondary">
                              <Building2 className="size-4" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                              <div className="line-clamp-1 text-sm font-medium text-primary dark:text-dark-primary">
                                {record?.name ||
                                  t("adminDepartments.fallback.name")}
                              </div>
                              <div className="text-xs text-muted dark:text-dark-muted">
                                {getDepartmentMetaLine(record, t)}
                              </div>
                            </div>
                          </div>
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <span className="line-clamp-1 text-sm text-secondary dark:text-dark-secondary">
                            {record?.head ||
                              t("adminDepartments.fallback.head")}
                          </span>
                        </TableColumn>
                        <TableColumn>
                          <StatusPill
                            variant={statusToPillVariant(record?.status)}
                          >
                            {t(
                              `adminShared.status.${String(record?.status || "inactive").toLowerCase()}`,
                            )}
                          </StatusPill>
                        </TableColumn>
                        <TableColumn className="whitespace-nowrap text-xs">
                          {formatRegistryDate(
                            record?.created,
                            locale,
                            t("adminDepartments.fallback.date"),
                          )}
                        </TableColumn>
                      </>
                    ) : null}

                    {activeTab === "academic-years" ? (
                      <>
                        <TableColumn className="font-mono text-xs">
                          #{normalizeId(record?.id)}
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <div className="min-w-0">
                            <div className="line-clamp-1 text-sm font-medium text-primary dark:text-dark-primary">
                              {record?.name || "-"}
                            </div>
                          </div>
                        </TableColumn>
                        <TableColumn className="text-xs">
                          {formatDateRange(
                            record?.startDate,
                            record?.endDate,
                            locale,
                          )}
                        </TableColumn>
                        <TableColumn className="text-xs">
                          {record?.calendarType || "-"}
                        </TableColumn>
                        <TableColumn>
                          <StatusPill
                            variant={statusToPillVariant(
                              inferTimelineStatus(
                                record?.startDate,
                                record?.endDate,
                              ),
                            )}
                          >
                            {t(
                              `adminShared.status.${inferTimelineStatus(record?.startDate, record?.endDate)}`,
                            )}
                          </StatusPill>
                        </TableColumn>
                      </>
                    ) : null}

                    {activeTab === "semesters" ? (
                      <>
                        <TableColumn className="font-mono text-xs">
                          #{normalizeId(record?.id)}
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <div className="min-w-0">
                            <div className="line-clamp-1 text-sm font-medium text-primary dark:text-dark-primary">
                              {record?.name || "-"}
                            </div>
                            <div className="text-xs text-muted dark:text-dark-muted">
                              {record?.type || "-"}
                            </div>
                          </div>
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <span className="text-sm text-secondary dark:text-dark-secondary">
                            {getAcademicYearLabel(record?.academicYear) || "-"}
                          </span>
                        </TableColumn>
                        <TableColumn className="text-xs">
                          {formatDateRange(
                            record?.startDate,
                            record?.endDate,
                            locale,
                          )}
                        </TableColumn>
                        <TableColumn>
                          <StatusPill
                            variant={statusToPillVariant(
                              getSemesterStatus(record),
                            )}
                          >
                            {t(
                              `adminShared.status.${getSemesterStatus(record)}`,
                            )}
                          </StatusPill>
                        </TableColumn>
                      </>
                    ) : null}

                    {activeTab === "batches" ? (
                      <>
                        <TableColumn className="font-mono text-xs">
                          #{normalizeId(record?.id)}
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <div className="min-w-0">
                            <div className="line-clamp-1 text-sm font-medium text-primary dark:text-dark-primary">
                              {record?.name || "-"}
                            </div>
                            <div className="text-xs text-muted dark:text-dark-muted">
                              {record?.year || "-"}
                            </div>
                          </div>
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <span className="text-sm text-secondary dark:text-dark-secondary">
                            {getAcademicYearLabel(record?.academicYear) || "-"}
                          </span>
                        </TableColumn>
                        <TableColumn className="text-xs">
                          {record?.type || "-"}
                        </TableColumn>
                        <TableColumn>
                          <StatusPill
                            variant={statusToPillVariant(
                              getBatchStatus(record),
                            )}
                          >
                            {t(`adminShared.status.${getBatchStatus(record)}`)}
                          </StatusPill>
                        </TableColumn>
                      </>
                    ) : null}

                    {activeTab === "groups" ? (
                      <>
                        <TableColumn className="font-mono text-xs">
                          #{normalizeGroupId(record)}
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <div className="min-w-0">
                            <div className="line-clamp-1 text-sm font-medium text-primary dark:text-dark-primary">
                              {groupTitle(record)}
                            </div>
                          </div>
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <span className="text-sm text-secondary dark:text-dark-secondary">
                            {displayName(record?.groupLeader)}
                          </span>
                        </TableColumn>
                        <TableColumn className="text-sm text-secondary dark:text-dark-secondary">
                          {t("adminProjects.registry.memberCount", {
                            count: groupMembersCount(record),
                          })}
                        </TableColumn>
                      </>
                    ) : null}

                    {activeTab === "faculties" ? (
                      <>
                        <TableColumn className="font-mono text-xs">
                          #{normalizeId(record?.code || record?.id)}
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-default bg-light-app-tertiary text-secondary dark:border-dark-default dark:bg-dark-app-tertiary dark:text-dark-secondary">
                              <Building2 className="size-4" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                              <div className="line-clamp-1 text-sm font-medium text-primary dark:text-dark-primary">
                                {record?.name || "-"}
                              </div>
                              <div className="text-xs text-muted dark:text-dark-muted">
                                {getFacultyMetaLine(record) || "-"}
                              </div>
                            </div>
                          </div>
                        </TableColumn>
                        <TableColumn nowrap={false}>
                          <span className="line-clamp-2 max-w-20 truncate text-sm text-secondary dark:text-dark-secondary">
                            {record?.description || "-"}
                          </span>
                        </TableColumn>
                      </>
                    ) : null}

                    <TableColumn className="text-center">
                      <DropdownMenuRoot>
                        <DropdownTrigger showArrow={false}>
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                              fill="currentColor"
                              fillRule="evenodd"
                              clipRule="evenodd"
                            />
                          </svg>
                        </DropdownTrigger>
                        <DropdownContent align="end">
                          {activeTab === "departments" ? (
                            <DropdownItem
                              onClick={() =>
                                navigate(`/admin/department/${record.id}`)
                              }
                            >
                              <span>
                                {t("adminShared.actions.viewProfile")}
                              </span>
                            </DropdownItem>
                          ) : null}
                          <DropdownItem onClick={() => openEditModal(record)}>
                            <span>{t("adminShared.actions.editDetails")}</span>
                          </DropdownItem>
                          {activeTab === "groups" ? (
                            <>
                              <DropdownItem
                                icon={<UserPlus className="size-3.5" />}
                                onClick={() =>
                                  openGroupOperation("add-member", record)
                                }
                              >
                                <span>
                                  {t(
                                    "adminProjects.groups.operations.addMember",
                                  )}
                                </span>
                              </DropdownItem>
                              <DropdownItem
                                icon={<BadgeCheck className="size-3.5" />}
                                onClick={() =>
                                  openGroupOperation("change-leader", record)
                                }
                              >
                                <span>
                                  {t(
                                    "adminProjects.groups.operations.changeLeader",
                                  )}
                                </span>
                              </DropdownItem>
                              <DropdownItem
                                icon={<UsersRound className="size-3.5" />}
                                onClick={() =>
                                  navigate(
                                    `/admin/projects/groups/register/${encodeURIComponent(normalizeGroupId(record))}`,
                                    {
                                      state: {
                                        returnTo: "/admin/department",
                                        returnTab: "groups",
                                      },
                                    },
                                  )
                                }
                              >
                                <span>
                                  {t(
                                    "adminProjects.groups.operations.manageRoster",
                                  )}
                                </span>
                              </DropdownItem>
                            </>
                          ) : null}
                          <DropdownSeparator />
                          <DropdownItem
                            variant="danger"
                            onClick={() =>
                              setDeleteRecord({
                                id:
                                  activeTab === "groups"
                                    ? normalizeGroupId(record)
                                    : record?.id,
                                name:
                                  (activeTab === "groups"
                                    ? groupTitle(record)
                                    : null) ??
                                  record?.name ??
                                  record?.title ??
                                  record?.code ??
                                  normalizeId(record?.id),
                                meta:
                                  activeTab === "departments"
                                    ? record?.head ||
                                      t("adminDepartments.fallback.head")
                                    : activeTab === "academic-years"
                                      ? record?.calendarType || "-"
                                      : activeTab === "semesters"
                                        ? record?.type || "-"
                                        : activeTab === "batches"
                                          ? getAcademicYearLabel(
                                              record?.academicYear,
                                            ) || "-"
                                          : activeTab === "groups"
                                            ? displayName(record?.groupLeader)
                                            : record?.code || "-",
                              })
                            }
                          >
                            <span>{t("adminShared.actions.delete")}</span>
                          </DropdownItem>
                        </DropdownContent>
                      </DropdownMenuRoot>
                    </TableColumn>
                  </TableRow>
                ))}

                {pageRows.length === 0 ? (
                  <TableRow className="table-advanced-tr--empty cursor-default">
                    <TableColumn
                      colSpan={headerData.length}
                      nowrap={false}
                      className="py-12 text-center text-muted dark:text-dark-muted"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          {activeTab === "groups" ? (
                            <UsersRound className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">
                          {activeTab === "groups"
                            ? t("adminProjects.faculty.emptyGroups")
                            : t("adminRegistry.empty.title")}
                        </span>
                        <span className="text-xs opacity-75">
                          {activeTab === "groups"
                            ? t("adminProjects.registry.emptyHint")
                            : t("adminRegistry.empty.hint")}
                        </span>
                      </div>
                    </TableColumn>
                  </TableRow>
                ) : null}
              </TableBody>
            </>
          ) : null}
        </Table>

        {viewTab === "board" ? (
          <div className="mt-4">
            <AdminRecordsBoard
              rows={pageRows}
              getKey={(record) =>
                activeTab === "groups"
                  ? normalizeGroupId(record)
                  : normalizeId(record?.id ?? record?.code)
              }
              selectedIds={selectedIds}
              onToggleSelected={toggleSelected}
              renderTitle={(record) =>
                activeTab === "groups"
                  ? groupTitle(record)
                  : record?.name || record?.title || record?.code || "-"
              }
              renderSubtitle={(record) => {
                if (activeTab === "departments")
                  return getDepartmentMetaLine(record, t);
                if (activeTab === "groups")
                  return displayName(record?.groupLeader);
                if (activeTab === "faculties")
                  return getFacultyMetaLine(record) || "-";
                return formatDateRange(
                  record?.startDate,
                  record?.endDate,
                  locale,
                );
              }}
              renderStatus={(record) => {
                if (activeTab === "groups") {
                  return (
                    <span className="rounded-full border border-(--color-light-card-border) bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold text-secondary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-secondary">
                      {t("adminProjects.registry.memberCount", {
                        count: groupMembersCount(record),
                      })}
                    </span>
                  );
                }
                const status =
                  activeTab === "academic-years"
                    ? inferTimelineStatus(record?.startDate, record?.endDate)
                    : activeTab === "semesters"
                      ? getSemesterStatus(record)
                      : activeTab === "batches"
                        ? getBatchStatus(record)
                        : record?.status || "active";
                return (
                  <StatusPill variant={statusToPillVariant(status)}>
                    {t(`adminShared.status.${String(status).toLowerCase()}`)}
                  </StatusPill>
                );
              }}
              renderMeta={(record) => (
                <>
                  <span>
                    {activeTab === "departments"
                      ? record?.head || t("adminDepartments.fallback.head")
                      : activeTab === "groups"
                        ? normalizeGroupId(record)
                        : record?.calendarType ||
                          record?.type ||
                          record?.code ||
                          "-"}
                  </span>
                </>
              )}
              renderActions={renderRegistryActions}
              emptyTitle={
                activeTab === "groups"
                  ? t("adminProjects.faculty.emptyGroups")
                  : t("adminRegistry.empty.title")
              }
              emptyDescription={t("adminRegistry.empty.hint")}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalElements}
            pageSize={pageSize}
            onPageChange={(nextPage, nextSize) => {
              if (nextSize !== pageSize) {
                setPageSize(nextSize);
                setPage(1);
                return;
              }
              setPage(nextPage);
            }}
          />
        </div>
      </div>

      {activeTab === "departments" ? (
        <>
          <GlobalModal
            contentClassName="w-2xl"
            className="w-2xl"
            open={showAddModal}
            setOpen={(open) => {
              setShowAddModal(open);
            }}
            isClose
          >
            <AddDepartmentForm
              onClose={() => setShowAddModal(false)}
              onSuccess={() =>
                queryClient.invalidateQueries({ queryKey: ["departments"] })
              }
            />
          </GlobalModal>

          <GlobalModal
            open={showEditModal}
            setOpen={(open) => {
              setShowEditModal(open);
              if (!open) setSelectedRecord(null);
            }}
            isClose
          >
            {selectedRecord ? (
              <EditDepartmentForm
                key={selectedRecord.id}
                department={selectedRecord}
                onClose={() => {
                  setShowEditModal(false);
                  setSelectedRecord(null);
                }}
                onSuccess={() =>
                  queryClient.invalidateQueries({ queryKey: ["departments"] })
                }
              />
            ) : null}
          </GlobalModal>
        </>
      ) : activeTab === "groups" ? null : (
        <>
          <GlobalModal
            open={showAddModal}
            setOpen={(open) => {
              if (!open) {
                closeFormModals();
                return;
              }
              setShowAddModal(true);
            }}
            isClose
            title={t("adminRegistry.modal.createTitle")}
            subtitle={t("adminRegistry.modal.createSubtitle")}
            footer={
              <>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={closeFormModals}
                >
                  {t("adminDepartments.form.actions.cancel")}
                </Button>
                <Button
                  type="button"
                  loading={Boolean(activeMutationState.create?.isPending)}
                  onClick={() => void submitGenericForm("create")}
                  disabled={activeMutationState.create?.isPending}
                >
                  {t("adminRegistry.actions.create")}
                </Button>
              </>
            }
            className="max-w-2xl"
          >
            <RegistryFields
              tabId={activeTab}
              values={formValues}
              setValues={registrySetValues}
              academicYearOptions={academicYearOptions}
              universityOptions={universityOptions}
              fieldErrors={registryFieldErrors}
              t={t}
            />
          </GlobalModal>

          <GlobalModal
            open={showEditModal}
            setOpen={(open) => {
              if (!open) {
                closeFormModals();
                return;
              }
              setShowEditModal(true);
            }}
            isClose
            title={t("adminRegistry.modal.editTitle")}
            subtitle={t("adminRegistry.modal.editSubtitle")}
            footer={
              <>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={closeFormModals}
                >
                  {t("adminDepartments.form.actions.cancel")}
                </Button>
                <Button
                  type="button"
                  loading={Boolean(activeMutationState.update?.isPending)}
                  onClick={() => void submitGenericForm("edit")}
                  disabled={activeMutationState.update?.isPending}
                >
                  {t("adminRegistry.actions.save")}
                </Button>
              </>
            }
            className="max-w-2xl"
          >
            <RegistryFields
              tabId={activeTab}
              values={formValues}
              setValues={registrySetValues}
              academicYearOptions={academicYearOptions}
              universityOptions={universityOptions}
              fieldErrors={registryFieldErrors}
              t={t}
            />
          </GlobalModal>
        </>
      )}

      {groupOperation ? (
        <GlobalModal
          open={true}
          setOpen={(open) => {
            if (
              !open &&
              !updateFacultyGroup.isPending &&
              !updateFacultyGroupLeader.isPending
            )
              closeGroupOperation();
          }}
          isClose
          title={
            groupOperation.mode === "add-member"
              ? t("adminProjects.groups.operations.addMemberTitle")
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
                  updateFacultyGroupLeader.isPending
                }
              >
                {t("adminProjects.form.group.actions.cancel")}
              </Button>
              <Button
                type="button"
                onClick={() => void submitGroupOperation()}
                loading={updateFacultyGroup.isPending}
                disabled={
                  updateFacultyGroup.isPending ||
                  updateFacultyGroupLeader.isPending ||
                  !String(groupOperationDraft.studentId ?? "").trim()
                }
              >
                {updateFacultyGroup.isPending ||
                updateFacultyGroupLeader.isPending
                  ? t("adminProjects.form.group.actions.submitting")
                  : groupOperation.mode === "add-member"
                    ? t("adminProjects.groups.operations.addMember")
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
                  leader: displayName(groupOperation.record?.groupLeader),
                  count: groupMembersCount(groupOperation.record),
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-primary dark:text-dark-primary">
                {groupOperation.mode === "add-member"
                  ? t("adminProjects.groups.operations.memberLabel")
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
                    : groupLeaderOptions
                }
                placeholder={
                  groupOperation.mode === "add-member"
                    ? t("adminProjects.groups.operations.memberPlaceholder")
                    : t("adminProjects.groups.operations.leaderPlaceholder")
                }
                searchPlaceholder={t(
                  "adminProjects.form.group.placeholders.groupLeaderSearch",
                )}
                disabled={
                  updateFacultyGroup.isPending ||
                  updateFacultyGroupLeader.isPending ||
                  (groupOperation.mode === "add-member" &&
                    groupAddMemberOptions.length === 0)
                }
              />
              {groupOperation.mode === "add-member" &&
              groupAddMemberOptions.length === 0 ? (
                <p className="text-[11px] text-muted dark:text-dark-muted">
                  {t("adminProjects.groups.operations.noAvailableStudents")}
                </p>
              ) : null}
            </div>
          </div>
        </GlobalModal>
      ) : null}

      {deleteRecord ? (
        <SensitiveActionModal
          open={true}
          setOpen={(open) => {
            if (!open && !deleteSubmitting) setDeleteRecord(null);
          }}
          title={
            activeTab === "departments"
              ? t("adminDepartments.delete.title")
              : t("adminRegistry.delete.title")
          }
          subtitle={
            activeTab === "departments"
              ? `${t("adminDepartments.delete.descriptionPrefix")} "${deleteRecord.name}"${t("adminDepartments.delete.descriptionSuffix")}`
              : t("adminRegistry.delete.description", {
                  name: deleteRecord.name,
                })
          }
          summaryItems={[
            {
              label:
                activeTab === "departments"
                  ? t("adminDepartments.delete.headLabel")
                  : activeTab === "groups"
                    ? t("adminProjects.delete.meta")
                    : t("adminRegistry.delete.meta"),
              value: deleteRecord.meta || "-",
              mono: true,
            },
          ]}
          warning={
            activeTab === "groups"
              ? t("adminProjects.delete.warning")
              : t("adminDepartments.delete.warning")
          }
          cancelLabel={t("adminDepartments.delete.cancel")}
          confirmLabel={
            deleteSubmitting
              ? t("adminDepartments.delete.submitting")
              : activeTab === "departments"
                ? t("adminDepartments.delete.confirm")
                : t("adminShared.actions.delete")
          }
          onConfirm={confirmDelete}
          submitting={deleteSubmitting}
        />
      ) : null}
    </div>
  );
}
