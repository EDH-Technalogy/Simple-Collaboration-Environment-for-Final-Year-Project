import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import Checkbox from "../Checkbox";
import {
  DropdownCheckboxItem,
  DropdownContent,
  DropdownItem,
  DropdownMenuRoot,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownSeparator,
  DropdownTrigger,
} from "../DropdownMenu";
import TableToolbar from "../TableToolbar";

export function AdminTableToolDropdowns({
  labels,
  icons,
  statusOptions = [],
  statusFilter,
  onStatusFilterChange,
  sortOptions = [],
  sortKey,
  sortDirection,
  onSortChange,
  columns = [],
  hiddenColumns = [],
  onToggleColumn,
  onResetColumns,
  compactRows,
  onToggleCompactRows,
}) {
  const { t } = useTranslation();
  const hidden = new Set(hiddenColumns);

  return (
    <TableToolbar.Section className="min-w-fit shrink-0 justify-start md:ml-auto md:justify-end">
      <DropdownMenuRoot>
        <DropdownTrigger
          asChild
          aria-label={labels.filter}
        >
          <button type="button" className="table-toolbar-icon-btn">
            {icons.filter ? (
              <span className="inline-flex shrink-0 opacity-80">
                {icons.filter}
              </span>
            ) : null}
            <span>{labels.filter}</span>
          </button>
        </DropdownTrigger>
        <DropdownContent align="end">
          {statusOptions.map((option) => (
            <DropdownItem
              key={option.value}
              icon={
                statusFilter === option.value ? (
                  <Check className="size-4" />
                ) : null
              }
              onClick={() => onStatusFilterChange?.(option.value)}
            >
              {option.label}
            </DropdownItem>
          ))}
        </DropdownContent>
      </DropdownMenuRoot>

      <DropdownMenuRoot>
        <DropdownTrigger
          asChild
          aria-label={labels.sort}
        >
          <button type="button" className="table-toolbar-icon-btn">
            {icons.sort ? (
              <span className="inline-flex shrink-0 opacity-80">
                {icons.sort}
              </span>
            ) : null}
            <span>{labels.sort}</span>
          </button>
        </DropdownTrigger>
        <DropdownContent align="end">
          <DropdownRadioGroup
            value={sortKey}
            onValueChange={(value) => onSortChange?.(value, sortDirection)}
          >
            {sortOptions.map((option) => (
              <DropdownRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownRadioItem>
            ))}
          </DropdownRadioGroup>
          <DropdownSeparator />
          <DropdownRadioGroup
            value={sortDirection}
            onValueChange={(value) => onSortChange?.(sortKey, value)}
          >
            <DropdownRadioItem value="asc">
              {t("adminTable.sort.asc")}
            </DropdownRadioItem>
            <DropdownRadioItem value="desc">
              {t("adminTable.sort.desc")}
            </DropdownRadioItem>
          </DropdownRadioGroup>
        </DropdownContent>
      </DropdownMenuRoot>

      <DropdownMenuRoot>
        <DropdownTrigger
          asChild
          aria-label={labels.columns}
        >
          <button type="button" className="table-toolbar-icon-btn">
            {icons.columns ? (
              <span className="inline-flex shrink-0 opacity-80">
                {icons.columns}
              </span>
            ) : null}
            <span>{labels.columns}</span>
          </button>
        </DropdownTrigger>
        <DropdownContent align="end">
          {columns.map((column) => (
            <DropdownCheckboxItem
              key={column.id}
              checked={!hidden.has(column.id)}
              onCheckedChange={() => onToggleColumn?.(column.id)}
              disabled={column.required}
            >
              {column.label}
            </DropdownCheckboxItem>
          ))}
          <DropdownSeparator />
          <DropdownItem onClick={onResetColumns}>
            {t("adminTable.columns.showAll")}
          </DropdownItem>
        </DropdownContent>
      </DropdownMenuRoot>

      <TableToolbar.IconButton
        type="button"
        aria-pressed={compactRows}
        aria-label={labels.hide}
        icon={icons.hide}
        onClick={onToggleCompactRows}
      >
        {labels.hide}
      </TableToolbar.IconButton>
    </TableToolbar.Section>
  );
}

export function AdminRecordsBoard({
  rows,
  getKey,
  selectedIds,
  onToggleSelected,
  renderTitle,
  renderSubtitle,
  renderMeta,
  renderStatus,
  renderActions,
  emptyTitle,
  emptyDescription,
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-8 text-center dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
        <p className="text-sm font-semibold text-primary dark:text-dark-primary">
          {emptyTitle}
        </p>
        {emptyDescription ? (
          <p className="mt-1 text-xs text-muted dark:text-dark-muted">
            {emptyDescription}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => {
        const id = String(getKey(row));
        const selected = selectedIds?.has?.(id);
        return (
          <article
            key={id}
            className="rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-xs dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)"
          >
            <div className="flex items-start justify-between gap-3">
              <Checkbox
                checked={selected}
                onChange={() => onToggleSelected?.(id)}
              />
              <div className="shrink-0">{renderActions?.(row)}</div>
            </div>
            <div className="mt-3 min-w-0">
              <div className="text-sm font-semibold text-primary dark:text-dark-primary">
                {renderTitle(row)}
              </div>
              <div className="mt-1 text-xs leading-5 text-muted dark:text-dark-muted">
                {renderSubtitle(row)}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {renderStatus?.(row)}
            </div>
            <div className="mt-4 grid gap-2 text-xs text-secondary dark:text-dark-secondary">
              {renderMeta?.(row)}
            </div>
          </article>
        );
      })}
    </div>
  );
}
