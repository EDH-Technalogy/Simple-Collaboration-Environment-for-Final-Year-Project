import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  BadgeCheck,
  Building2,
  CalendarDays,
  Columns3,
  EyeOff,
  Filter,
  Hash,
  LayoutGrid,
  LayoutList,
  ListChecks,
  UserSquare2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PersonAvatar from "../../components/PersonAvatar";
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
  DropdownTrigger,
} from "../../components/DropdownMenu";
import Field from "../../components/Field";
import IC from "../../components/IC";
import Icon from "../../components/Icon";
import Pagination from "../../components/Pagination";
import Select from "../../components/Select";
import SensitiveActionModal from "../../components/SensitiveActionModal";
import StatusPill, { statusToPillVariant } from "../../components/StatusPill";
import Table from "../../components/Table";
import TableBody from "../../components/TableBody";
import TableColumn from "../../components/TableColumn";
import TableHeader from "../../components/TableHeader";
import TableRow from "../../components/TableRow";
import TableToolbar from "../../components/TableToolbar";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useDeleteStudent, useStudentsPage } from "../../services/useApi";

const EMPTY = [];

export default function Students() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewTab, setViewTab] = useState("list");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [hiddenColumns, setHiddenColumns] = useState(() => new Set());
  const [compactRows, setCompactRows] = useState(false);
  const [sortKey, setSortKey] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [deleteStudentId, setDeleteStudentId] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const deleteStudentMutation = useDeleteStudent({
    showSuccessToast: false,
    showErrorToast: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "students",
      });
    },
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const {
    data: pageData,
    isError,
    error,
  } = useStudentsPage({
    page: page - 1,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
  });

  const students = pageData?.content ?? EMPTY;
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const deletingStudent = students.find(
    (row) => String(row.id) === String(deleteStudentId),
  );

  const columnDefs = useMemo(
    () => [
      {
        id: "select",
        title: "",
        required: true,
        tooltip: t("adminShared.tableHints.bulkSelection"),
        icon: (
          <ListChecks
            className="size-3.5 shrink-0 opacity-70"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        id: "id",
        title: t("adminStudents.table.id"),
        tooltip: t("adminShared.tableHints.recordId"),
        icon: (
          <Hash className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        ),
      },
      {
        id: "student",
        title: t("adminStudents.table.student"),
        tooltip: t("adminShared.tableHints.displayName"),
        icon: (
          <UserSquare2
            className="size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        id: "department",
        title: t("adminStudents.table.department"),
        tooltip: t("adminShared.tableHints.department"),
        icon: (
          <Building2
            className="size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        id: "status",
        title: t("adminStudents.table.status"),
        tooltip: t("adminShared.tableHints.columnStatus"),
        icon: (
          <BadgeCheck
            className="size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        id: "enrolled",
        title: t("adminStudents.table.enrolled"),
        tooltip: t("adminShared.tableHints.dateEnrolled"),
        icon: (
          <CalendarDays
            className="size-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        id: "actions",
        required: true,
        title: t("adminStudents.table.actions"),
        align: "center",
        tooltip: t("adminShared.tableHints.rowActions"),
        icon: (
          <LayoutList
            className="size-3.5 shrink-0 opacity-80"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
    ],
    [t],
  );
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
  const isColumnVisible = (id) => !hiddenColumns.has(id);

  const locale =
    i18n.language === "ps"
      ? "ps-AF"
      : i18n.language === "prs"
        ? "fa-AF"
        : "en-US";

  const statusOptions = [
    { value: "all", label: t("adminShared.filters.allStatus") },
    { value: "active", label: t("adminShared.status.active") },
    { value: "pending", label: t("adminShared.status.pending") },
    { value: "rejected", label: t("adminShared.status.rejected") },
    { value: "suspended", label: t("adminShared.status.suspended") },
  ];
  const sortOptions = [
    { value: "name", label: t("adminStudents.table.student") },
    { value: "department", label: t("adminStudents.table.department") },
    { value: "status", label: t("adminStudents.table.status") },
    { value: "enrolled", label: t("adminStudents.table.enrolled") },
  ];
  const sortedStudents = useMemo(() => {
    const accessors = {
      name: (student) => `${student.firstName ?? ""} ${student.lastName ?? ""}`,
      department: (student) => student.department ?? "",
      status: (student) => student.status ?? "",
      enrolled: (student) => student.enrollmentDate ?? "",
    };
    const getValue = accessors[sortKey] ?? accessors.name;
    return [...students].sort((a, b) => {
      const result = String(getValue(a)).localeCompare(String(getValue(b)), undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortDirection === "desc" ? -result : result;
    });
  }, [students, sortDirection, sortKey]);
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

  const handleViewProfile = (student) => {
    navigate(`/admin/student/${student.id}`);
  };

  const confirmDeleteStudent = async () => {
    if (deleteStudentId == null || deleteSubmitting) return;
    setDeleteSubmitting(true);
    try {
      await deleteStudentMutation.mutateAsync(deleteStudentId);
      window.GooeyToaster?.success?.(t("adminStudents.delete.success"));
      setDeleteStudentId(null);
    } catch (e) {
      window.GooeyToaster?.error?.(
        e?.message || t("adminStudents.delete.error"),
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const renderStudentActions = (student) => (
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
        <DropdownItem onClick={() => handleViewProfile(student)}>
          <span>{t("adminShared.actions.viewProfile")}</span>
        </DropdownItem>
        <DropdownItem onClick={() => navigate(`/admin/student/${student.id}/edit`)}>
          <span>{t("adminShared.actions.editDetails")}</span>
        </DropdownItem>
        <DropdownItem
          variant="danger"
          onClick={() => setDeleteStudentId(student.id)}
        >
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
              {t("apiErrors.failed_to_load_students")}
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
    <div className="flex flex-1 min-h-screen  flex-col gap-6 overflow-y-auto bg-white  p-4 md:p-5 dark:bg-dark-card-bg">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-primary dark:text-dark-primary">
            {t("adminStudents.header.title")}
          </h1>
          <p className="text-muted dark:text-dark-muted">
            {t("adminStudents.header.description", {
              count: totalElements,
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-none">
            <button
              type="button"
              onClick={() => navigate("/admin/student/new")}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-default bg-light-btn-primary-bg  px-3 py-2 text-xs font-semibold text-secondary transition-colors hover:bg-light-btn-primary-hover dark:border-dark-default  dark:text-dark-secondary dark:hover:bg-dark-card-hover"
            >
              {<Icon d={IC.plus} className="size-4 text-white" />}
              <span className="text-white ">
                {t("adminStudents.actions.add")}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Table
          toolbar={
            <TableToolbar>
              <TableToolbar.Row
                justify="between"
                className="items-stretch gap-3 sm:items-center"
              >
                <TableToolbar.ViewTabs
                  value={viewTab}
                  onValueChange={setViewTab}
                  tabs={[
                    {
                      id: "list",
                      label: t("adminStudents.toolbar.list"),
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
                      label: t("adminStudents.toolbar.board"),
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
                    id="students-search"
                    placeholder={t("adminStudents.filters.searchPlaceholder")}
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    iconD={IC.search}
                  />
                </div>
                <div className="w-full shrink-0 sm:w-48">
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  />
                </div>
                <AdminTableToolDropdowns
                  labels={{
                    filter: t("adminStudents.toolbar.filter"),
                    sort: t("adminStudents.toolbar.sort"),
                    columns: t("adminStudents.toolbar.columns"),
                    hide: t("adminStudents.toolbar.hide"),
                  }}
                  icons={{
                    filter: <Filter className="size-3.5 shrink-0" strokeWidth={2} />,
                    sort: <ArrowUpDown className="size-3.5 shrink-0" strokeWidth={2} />,
                    columns: <Columns3 className="size-3.5 shrink-0" strokeWidth={2} />,
                    hide: <EyeOff className="size-3.5 shrink-0" strokeWidth={2} />,
                  }}
                  statusOptions={statusOptions}
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
                {sortedStudents.map((student) => (
              <TableRow
                key={student.id}
                className={compactRows ? "[&_td]:py-2" : undefined}
              >
                {isColumnVisible("select") ? (
                  <TableColumn className="w-10">
                    <Checkbox
                      checked={selectedIds.has(String(student.id))}
                      onChange={() => toggleSelected(String(student.id))}
                    />
                  </TableColumn>
                ) : null}

                {isColumnVisible("id") ? (
                <TableColumn className="font-mono text-xs">
                  #{String(student.code).padStart(2, "0")}
                </TableColumn>
                ) : null}

                {isColumnVisible("student") ? (
                <TableColumn>
                  <div className="flex items-center gap-3">
                    <PersonAvatar person={student} />
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-medium text-primary dark:text-dark-primary">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-muted dark:text-dark-muted">
                        {student.email || student.username || student.code}
                      </div>
                    </div>
                  </div>
                </TableColumn>
                ) : null}

                {isColumnVisible("department") ? (
                <TableColumn nowrap={false}>
                  <span className="inline-flex max-w-[14rem] rounded-full border border-default bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold capitalize text-secondary dark:border-dark-default dark:bg-dark-app-tertiary dark:text-dark-secondary">
                    {student.department || t("adminStudents.emptyHint")}
                  </span>
                </TableColumn>
                ) : null}

                {isColumnVisible("status") ? (
                <TableColumn>
                  <StatusPill variant={statusToPillVariant(student.status)}>
                    {t(
                      `adminShared.status.${String(student.status).toLowerCase()}`,
                    )}
                  </StatusPill>
                </TableColumn>
                ) : null}

                {isColumnVisible("enrolled") ? (
                <TableColumn className="whitespace-nowrap text-xs">
                  {student.enrollmentDate
                    ? new Date(student.enrollmentDate).toLocaleDateString(
                        locale,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )
                    : "—"}
                </TableColumn>
                ) : null}

                {isColumnVisible("actions") ? (
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
                      <DropdownItem onClick={() => handleViewProfile(student)}>
                        <span>{t("adminShared.actions.viewProfile")}</span>
                      </DropdownItem>
                      <DropdownItem
                        onClick={() =>
                          navigate(`/admin/student/${student.id}/edit`)
                        }
                      >
                        <span>{t("adminShared.actions.editDetails")}</span>
                      </DropdownItem>
                      <DropdownItem
                        variant="danger"
                        onClick={() => setDeleteStudentId(student.id)}
                      >
                        <span>{t("adminShared.actions.delete")}</span>
                      </DropdownItem>
                    </DropdownContent>
                  </DropdownMenuRoot>
                </TableColumn>
                ) : null}
              </TableRow>
            ))}

            {sortedStudents.length === 0 && (
              <TableRow className="table-advanced-tr--empty cursor-default">
                <TableColumn
                  colSpan={headerData.length}
                  nowrap={false}
                  className="py-12 text-center text-muted dark:text-dark-muted"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Icon
                        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                        className="h-5 w-5 text-muted-foreground"
                      />
                    </div>
                    <span className="font-medium">
                      {t("adminStudents.empty")}
                    </span>
                    <span className="text-xs opacity-75">
                      {t("adminStudents.emptyHint")}
                    </span>
                  </div>
                </TableColumn>
              </TableRow>
            )}
              </TableBody>
            </>
          ) : null}
        </Table>
        {viewTab === "board" ? (
          <div className="mt-4">
            <AdminRecordsBoard
              rows={sortedStudents}
              getKey={(student) => student.id}
              selectedIds={selectedIds}
              onToggleSelected={toggleSelected}
              renderTitle={(student) =>
                `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() ||
                student.email ||
                student.id
              }
              renderSubtitle={(student) =>
                student.email || student.username || student.code || "—"
              }
              renderStatus={(student) => (
                <StatusPill variant={statusToPillVariant(student.status)}>
                  {t(`adminShared.status.${String(student.status).toLowerCase()}`)}
                </StatusPill>
              )}
              renderMeta={(student) => (
                <>
                  <span>{student.department || t("adminStudents.emptyHint")}</span>
                  <span>
                    {student.enrollmentDate
                      ? new Date(student.enrollmentDate).toLocaleDateString(locale)
                      : "—"}
                  </span>
                </>
              )}
              renderActions={renderStudentActions}
              emptyTitle={t("adminStudents.empty")}
              emptyDescription={t("adminStudents.emptyHint")}
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

      {deleteStudentId != null ? (
        <SensitiveActionModal
          open={true}
          setOpen={(open) => {
            if (!open && !deleteSubmitting) setDeleteStudentId(null);
          }}
          title={t("adminStudents.delete.title")}
          subtitle={`${t("adminStudents.delete.descriptionPrefix")} ${
            deletingStudent
              ? `“${`${deletingStudent.firstName ?? ""} ${deletingStudent.lastName ?? ""}`.trim()}”`
              : t("adminStudents.delete.fallbackName")
          }${t("adminStudents.delete.descriptionSuffix")}`}
          summaryItems={[
            {
              label: t("adminStudents.delete.emailLabel"),
              value:
                deletingStudent?.email?.trim() ||
                t("adminStudents.delete.noEmail"),
              mono: true,
            },
          ]}
          warning={t("adminStudents.delete.warning")}
          cancelLabel={t("adminStudents.delete.cancel")}
          confirmLabel={
            deleteSubmitting
              ? t("studentForm.actions.submitting")
              : t("adminStudents.delete.confirm")
          }
          onConfirm={confirmDeleteStudent}
          submitting={deleteSubmitting}
        />
      ) : null}
    </div>
  );
}
