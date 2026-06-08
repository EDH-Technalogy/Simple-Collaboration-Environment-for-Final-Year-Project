import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import {
  DropdownContent,
  DropdownItem,
  DropdownMenuRoot,
  DropdownTrigger,
} from "../../components/DropdownMenu";
import IC from "../../components/IC";
import Icon from "../../components/Icon";
import Select from "../../components/Select";
import Table from "../../components/Table";
import TableBody from "../../components/TableBody";
import TableColumn from "../../components/TableColumn";
import TableHeader from "../../components/TableHeader";
import TableRow from "../../components/TableRow";
import Pagination from "../../components/Pagination";
import PersonAvatar from "../../components/PersonAvatar";
import Checkbox from "../../components/Checkbox";
import Button from "../../components/Button";
import Field from "../../components/Field";
import TableToolbar from "../../components/TableToolbar";
import {
  AdminRecordsBoard,
  AdminTableToolDropdowns,
} from "../../components/admin/AdminTableControls";
import StatusPill, { statusToPillVariant } from "../../components/StatusPill";
import SensitiveActionModal from "../../components/SensitiveActionModal";
import { useDeleteTeacher, useTeachersPage } from "../../services/useApi";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const EMPTY = [];

export default function Teachers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const deleteTeacherMutation = useDeleteTeacher({
    showSuccessToast: false,
    showErrorToast: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "teachers",
      });
    },
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [viewTab, setViewTab] = useState("list");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [hiddenColumns, setHiddenColumns] = useState(() => new Set());
  const [compactRows, setCompactRows] = useState(false);
  const [sortKey, setSortKey] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [deleteTeacherId, setDeleteTeacherId] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data: pageData } = useTeachersPage({
    page: page - 1,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
  });

  const teachers = pageData?.content ?? EMPTY;
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const deletingTeacher = teachers.find(
    (row) => String(row.id) === String(deleteTeacherId),
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
        title: t("adminTeachers.table.id"),
        tooltip: t("adminShared.tableHints.recordId"),
        icon: (
          <Hash className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        ),
      },
      {
        id: "teacher",
        title: t("adminTeachers.table.teacher"),
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
        title: t("adminTeachers.table.department"),
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
        title: t("adminTeachers.table.status"),
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
        id: "joined",
        title: t("adminTeachers.table.joined"),
        tooltip: t("adminShared.tableHints.dateJoined"),
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
        title: t("adminTeachers.table.actions"),
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
    { value: "name", label: t("adminTeachers.table.teacher") },
    { value: "department", label: t("adminTeachers.table.department") },
    { value: "status", label: t("adminTeachers.table.status") },
    { value: "joined", label: t("adminTeachers.table.joined") },
  ];
  const sortedTeachers = useMemo(() => {
    const accessors = {
      name: (teacher) => `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`,
      department: (teacher) => teacher.department ?? "",
      status: (teacher) => teacher.status ?? "",
      joined: (teacher) => teacher.joined ?? "",
    };
    const getValue = accessors[sortKey] ?? accessors.name;
    return [...teachers].sort((a, b) => {
      const result = String(getValue(a)).localeCompare(String(getValue(b)), undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortDirection === "desc" ? -result : result;
    });
  }, [teachers, sortDirection, sortKey]);
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

  const handleViewProfile = (teacher) => {
    navigate(`/admin/teacher/${teacher.id}`);
  };

  const confirmDeleteTeacher = async () => {
    if (deleteTeacherId == null || deleteSubmitting) return;
    setDeleteSubmitting(true);
    try {
      await deleteTeacherMutation.mutateAsync(deleteTeacherId);
      window.GooeyToaster?.success?.(t("adminTeachers.delete.success"));
      setDeleteTeacherId(null);
    } catch (e) {
      window.GooeyToaster?.error?.(
        e?.message || t("adminTeachers.delete.error"),
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };
  const renderTeacherActions = (teacher) => (
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
        <DropdownItem onClick={() => handleViewProfile(teacher)}>
          <span>{t("adminShared.actions.viewProfile")}</span>
        </DropdownItem>
        <DropdownItem onClick={() => navigate(`/admin/teacher/${teacher.id}/edit`)}>
          <span>{t("adminShared.actions.editDetails")}</span>
        </DropdownItem>
        <DropdownItem
          variant="danger"
          onClick={() => setDeleteTeacherId(teacher.id)}
        >
          <span>{t("adminTeachers.actions.remove")}</span>
        </DropdownItem>
      </DropdownContent>
    </DropdownMenuRoot>
  );
  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-white min-h-screen p-4 md:p-5 dark:bg-dark-card-bg">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-primary dark:text-dark-primary">
            {t("adminTeachers.header.title")}
          </h1>
          <p className="text-muted dark:text-dark-muted">
            {t("adminTeachers.header.description", {
              count: totalElements,
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-none">
            <Button
              icon={<Icon d={IC.plus} className="size-4" />}
              onClick={() => navigate("/admin/teacher/new")}
            >
              {t("adminTeachers.actions.add")}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Table
          className=""
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
                      label: t("adminTeachers.toolbar.list"),
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
                      label: t("adminTeachers.toolbar.board"),
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
                    id="teachers-search"
                    placeholder={t("adminTeachers.filters.searchPlaceholder")}
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
                    filter: t("adminTeachers.toolbar.filter"),
                    sort: t("adminTeachers.toolbar.sort"),
                    columns: t("adminTeachers.toolbar.columns"),
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
            {sortedTeachers.map((teacher) => (
              <TableRow key={teacher.id} className={compactRows ? "[&_td]:py-2" : undefined}>
                {isColumnVisible("select") ? (
                <TableColumn className="w-10">
                  <Checkbox
                    checked={selectedIds.has(String(teacher.id))}
                    onChange={() => toggleSelected(String(teacher.id))}
                  />
                </TableColumn>
                ) : null}
                {isColumnVisible("id") ? (
                <TableColumn className="font-mono text-xs">
                  #{String(teacher.code).padStart(2, "0")}
                </TableColumn>
                ) : null}

                {isColumnVisible("teacher") ? (
                <TableColumn>
                  <div className="flex items-center gap-3">
                    <PersonAvatar person={teacher} />
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-medium text-primary dark:text-dark-primary">
                        {teacher.firstName} {teacher.lastName}
                      </div>
                      <div className="text-xs text-muted dark:text-dark-muted">
                        {teacher.email}
                      </div>
                    </div>
                  </div>
                </TableColumn>
                ) : null}

                {isColumnVisible("department") ? (
                <TableColumn nowrap={false}>
                  <span className="inline-flex max-w-[14rem] rounded-full border border-default bg-light-app-tertiary px-2.5 py-1 text-[11px] font-semibold capitalize text-secondary dark:border-dark-default dark:bg-dark-app-tertiary dark:text-dark-secondary">
                    {teacher.department}
                  </span>
                </TableColumn>
                ) : null}

                {isColumnVisible("status") ? (
                <TableColumn>
                  <StatusPill variant={statusToPillVariant(teacher.status)}>
                    {t(`adminShared.status.${teacher.status}`)}
                  </StatusPill>
                </TableColumn>
                ) : null}

                {isColumnVisible("joined") ? (
                <TableColumn className="whitespace-nowrap text-xs">
                  {new Date(teacher.joined).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
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
                      <DropdownItem onClick={() => handleViewProfile(teacher)}>
                        <span>{t("adminShared.actions.viewProfile")}</span>
                      </DropdownItem>
                      <DropdownItem
                        onClick={() =>
                          navigate(`/admin/teacher/${teacher.id}/edit`)
                        }
                      >
                        <span>{t("adminShared.actions.editDetails")}</span>
                      </DropdownItem>
                      <DropdownItem
                        variant="danger"
                        onClick={() => setDeleteTeacherId(teacher.id)}
                      >
                        <span>{t("adminTeachers.actions.remove")}</span>
                      </DropdownItem>
                    </DropdownContent>
                  </DropdownMenuRoot>
                </TableColumn>
                ) : null}
              </TableRow>
            ))}

            {sortedTeachers.length === 0 && (
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
                      {t("adminTeachers.empty.title")}
                    </span>
                    <span className="text-xs opacity-75">
                      {t("adminTeachers.empty.description")}
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
              rows={sortedTeachers}
              getKey={(teacher) => teacher.id}
              selectedIds={selectedIds}
              onToggleSelected={toggleSelected}
              renderTitle={(teacher) =>
                `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim() ||
                teacher.email ||
                teacher.id
              }
              renderSubtitle={(teacher) => teacher.email || teacher.username || "—"}
              renderStatus={(teacher) => (
                <StatusPill variant={statusToPillVariant(teacher.status)}>
                  {t(`adminShared.status.${teacher.status}`)}
                </StatusPill>
              )}
              renderMeta={(teacher) => (
                <>
                  <span>{teacher.department || "—"}</span>
                  <span>
                    {teacher.joined
                      ? new Date(teacher.joined).toLocaleDateString(locale)
                      : "—"}
                  </span>
                </>
              )}
              renderActions={renderTeacherActions}
              emptyTitle={t("adminTeachers.empty.title")}
              emptyDescription={t("adminTeachers.empty.description")}
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

      {deleteTeacherId != null ? (
        <SensitiveActionModal
          open={true}
          setOpen={(open) => {
            if (!open && !deleteSubmitting) setDeleteTeacherId(null);
          }}
          title={t("adminTeachers.delete.title")}
          subtitle={`${t("adminTeachers.delete.descriptionPrefix")} ${
            deletingTeacher
              ? `“${`${deletingTeacher.firstName ?? ""} ${deletingTeacher.lastName ?? ""}`.trim()}”`
              : t("adminTeachers.delete.fallbackName")
          }${t("adminTeachers.delete.descriptionSuffix")}`}
          summaryItems={[
            {
              label: t("adminTeachers.delete.emailLabel"),
              value:
                deletingTeacher?.email?.trim() ||
                t("adminTeachers.delete.noEmail"),
              mono: true,
            },
          ]}
          warning={t("adminTeachers.delete.warning")}
          cancelLabel={t("adminTeachers.delete.cancel")}
          confirmLabel={
            deleteSubmitting
              ? t("studentForm.actions.submitting")
              : t("adminTeachers.delete.confirm")
          }
          onConfirm={confirmDeleteTeacher}
          submitting={deleteSubmitting}
        />
      ) : null}
    </div>
  );
}
