import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  CheckIcon,
  Cross2Icon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";
import { cn } from "../lib/utils"; // adjust path to your cn utility

/** Normalise flat options OR grouped options into always-grouped shape */
function normaliseOptions(options) {
  if (!options?.length) return [];
  if ("options" in options[0]) return options; // already grouped
  return [{ label: "", options }]; // wrap flat in one unnamed group
}

/** Flatten all options from groups */
function flattenOptions(groups) {
  return groups.flatMap((g) => g.options);
}

/** Highlight matching substring in label */
function Highlighted({ text = "", query = "" }) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark
        className="
          rounded px-0.5
          bg-(--color-light-nav-active-bg) text-(--color-light-text-primary)
          dark:bg-[rgba(0,102,255,0.18)] dark:text-(--color-dark-text-primary)
        "
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

// ─── Chip (multi-select tag) ──────────────────────────────────────────────────
function Chip({ label, onRemove }) {
  return (
    <span
      className="
        inline-flex items-center gap-1 max-w-[120px]
        rounded-lg border px-2 py-0.5 text-xs font-medium
        bg-(--color-light-nav-active-bg) text-(--color-light-text-primary) border-(--color-light-card-border)
        dark:bg-[rgba(0,102,255,0.18)] dark:text-(--color-dark-text-primary) dark:border-(--color-dark-card-border)
      "
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="
          shrink-0 rounded-sm transition-colors
          text-light-text-secondary hover:text-(--color-light-text-primary)
          dark:text-dark-text-secondary dark:hover:text-(--color-dark-text-primary)
        "
        aria-label={`Remove ${label}`}
      >
        <Cross2Icon className="h-3 w-3" />
      </button>
    </span>
  );
}
export default function SearchableSelect({
  options = [],
  value: controlledValue,
  defaultValue,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onChange,
  onValueChange,
  multiple = false,
  closeOnSelect = true,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  clearable = true,
  disabled = false,
  loading = false,
  renderOption,
  className,
  contentClassName,
  name,
  register,
  maxHeight = 300,
  searchValue,
  onSearchChange,
  /** When false, the × control inside the dropdown search row is hidden. */
  showInlineSearchClear = true,
  /** When false, opening the menu does not reset the search query (helps async server search). */
  clearSearchOnOpen = true,
}) {
  // ── State ──────────────────────────────────────────────────────────────
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = React.useState(
    defaultValue ?? (multiple ? [] : null),
  );
  const selected = isControlled ? controlledValue : internalValue;

  const isOpenControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = isOpenControlled ? controlledOpen : internalOpen;
  const [internalQuery, setInternalQuery] = React.useState("");
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const searchRef = React.useRef(null);
  const listRef = React.useRef(null);
  const query =
    searchValue !== undefined ? String(searchValue ?? "") : internalQuery;

  const setQuery = React.useCallback((nextValue) => {
    const normalizedValue = String(nextValue ?? "");
    if (searchValue === undefined) {
      setInternalQuery(normalizedValue);
    }
    onSearchChange?.(normalizedValue);
  }, [onSearchChange, searchValue]);

  const setOpen = React.useCallback((nextOpen) => {
    if (!isOpenControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }, [isOpenControlled, onOpenChange]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const groups = React.useMemo(() => normaliseOptions(options), [options]);
  const allFlat = React.useMemo(() => flattenOptions(groups), [groups]);

  const filteredGroups = React.useMemo(() => {
    if (!query.trim()) return groups;
    const q = query.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        options: g.options.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            o.description?.toLowerCase().includes(q) ||
            o.searchText?.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.options.length > 0);
  }, [groups, query]);

  const filteredFlat = React.useMemo(
    () => flattenOptions(filteredGroups),
    [filteredGroups],
  );

  const isSelected = (val) =>
    multiple
      ? Array.isArray(selected) && selected.includes(val)
      : selected === val;

  // label shown in trigger (single mode)
  const triggerLabel =
    !multiple && selected
      ? allFlat.find((o) => o.value === selected)?.label
      : null;

  // ── Handlers ────────────────────────────────────────────────────────────
  function commit(val) {
    let next;
    if (multiple) {
      const arr = Array.isArray(selected) ? selected : [];
      next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
    } else {
      next = val;
      if (closeOnSelect) {
        setOpen(false);
      }
    }
    if (!isControlled) setInternalValue(next);
    (onChange ?? onValueChange)?.(next);
  }

  function removeValue(val) {
    if (multiple) {
      const next = (Array.isArray(selected) ? selected : []).filter(
        (v) => v !== val,
      );
      if (!isControlled) setInternalValue(next);
      (onChange ?? onValueChange)?.(next);
    } else {
      if (!isControlled) setInternalValue(null);
      (onChange ?? onValueChange)?.(null);
    }
  }

  function clearAll(e) {
    e.stopPropagation();
    const next = multiple ? [] : null;
    if (!isControlled) setInternalValue(next);
    (onChange ?? onValueChange)?.(next);
  }

  // ── Keyboard ────────────────────────────────────────────────────────────
  function handleSearchKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, filteredFlat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && filteredFlat[focusedIndex]) {
        const opt = filteredFlat[focusedIndex];
        if (!opt.disabled) commit(opt.value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // reset focus & search when opening
  React.useEffect(() => {
    if (open) {
      if (clearSearchOnOpen) setQuery("");
      setFocusedIndex(-1);
      // autofocus search after portal mounts
      setTimeout(() => searchRef.current?.focus(), 10);
    }
  }, [open, clearSearchOnOpen, setQuery]);

  // scroll focused item into view
  React.useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option]");
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  // hasValue
  const hasValue = multiple
    ? Array.isArray(selected) && selected.length > 0
    : !!selected;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      {/* ── Hidden form input ── */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={multiple ? JSON.stringify(selected ?? []) : (selected ?? "")}
          readOnly
          {...((typeof register === "function" ? register(name) : register) ||
            {})}
        />
      )}

      {/* ────────────────────────── TRIGGER ────────────────────────────── */}
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={placeholder}
          className={cn(
            // base layout
            "group relative flex w-full min-h-9.5 items-center gap-2",
            "rounded-xl border px-3.5 py-1.5 text-sm font-medium outline-none transition-colors duration-150",
            // surface + border from index.css tokens
            "bg-(--color-light-input-bg) text-(--color-light-text-primary) border-(--color-light-input-border)",
            "dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:border-dark-input-border",
            "hover:border-(--color-light-border-default) dark:hover:border-(--color-dark-border-default)",

            // open state
            "data-[state=open]:bg-(--color-light-nav-active-bg) data-[state=open]:border-[rgba(0,102,255,0.28)]",
            "dark:data-[state=open]:bg-(--color-dark-card-hover) dark:data-[state=open]:border-[rgba(51,133,255,0.35)]",
            // disabled
            "disabled:opacity-50 disabled:cursor-not-allowed",
            // focus ring
            "focus-visible:ring-2 focus-visible:ring-blue-500/15 dark:focus-visible:ring-blue-400/15",
            className,
          )}
        >
          {/* Left content: chips (multi) or label (single) */}
          <span className="flex min-w-0 flex-1 flex-wrap gap-1">
            {multiple && Array.isArray(selected) && selected.length > 0 ? (
              selected.map((val) => {
                const opt = allFlat.find((o) => o.value === val);
                return opt ? (
                  <Chip
                    key={val}
                    label={opt.label}
                    onRemove={() => removeValue(val)}
                  />
                ) : null;
              })
            ) : triggerLabel ? (
              <span className="truncate text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)">
                {triggerLabel}
              </span>
            ) : (
              <span className="truncate text-(--color-light-input-placeholder) dark:text-(--color-dark-input-placeholder)">
                {placeholder}
              </span>
            )}
          </span>

          {/* Right side: clear button + chevron */}
          <span className="ml-auto flex shrink-0 items-center gap-1">
            {clearable && hasValue && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={clearAll}
                className="
                  flex h-4 w-4 items-center justify-center rounded-sm transition-colors
                  text-(--color-light-text-muted) hover:text-(--color-light-text-primary)
                  dark:text-dark-text-muted dark:hover:text-(--color-dark-text-primary)
                "
                aria-label="Clear selection"
              >
                <Cross2Icon className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDownIcon
              className={cn(
                "h-4 w-4 transition-transform duration-200 text-(--color-light-text-muted) dark:text-dark-text-muted",
                "group-data-[state=open]:rotate-180",
              )}
            />
          </span>
        </button>
      </DropdownMenu.Trigger>

      {/* ────────────────────────── DROPDOWN ───────────────────────────── */}
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          // width matches trigger
          style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // prevent closing when clicking inside the search input
          onPointerDownOutside={(e) => {
            if (e.target === searchRef.current) e.preventDefault();
          }}
          className={cn(
            /* Above GlobalModal backdrop (`z-[999]`) — must stay in sync with `Select.jsx` */
            "z-[1100] overflow-hidden rounded-xl border p-1 shadow-md",
            "bg-(--color-light-card-bg) text-(--color-light-text-primary) border-(--color-light-card-border)",
            "dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-text-primary) dark:border-(--color-dark-card-border)",

            // entrance animation
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
            contentClassName,
          )}
        >
          {/* ── Search input ── */}
          <div className="flex items-center gap-2 border-b px-2 pb-1 pt-0.5 mb-1 border-light-divider dark:border-dark-divider">
            <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 text-(--color-light-text-muted) dark:text-dark-text-muted" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFocusedIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={open}
              className={cn(
                "w-full bg-transparent text-sm outline-none",
                "placeholder:text-[11px] placeholder:text-(--color-light-input-placeholder) dark:placeholder:text-(--color-dark-input-placeholder)",
                "text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)",
                "py-1",
              )}
            />
            {showInlineSearchClear && query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                className="
                  shrink-0 transition-colors
                  text-(--color-light-text-muted) hover:text-(--color-light-text-primary)
                  dark:text-dark-text-muted dark:hover:text-(--color-dark-text-primary)
                "
                aria-label="Clear search"
              >
                <Cross2Icon className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* ── Options list ── */}
          <div
            ref={listRef}
            role="listbox"
            aria-multiselectable={multiple}
            style={{ maxHeight, overflowY: "auto" }}
            className="overflow-y-auto scrollbar-thin"
          >
            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-(--color-light-text-muted) dark:text-dark-text-muted">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading…
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredFlat.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
                <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                  No results
                </span>
                {query && (
                  <span className="text-xs text-(--color-light-text-muted) dark:text-dark-text-muted">
                    No match for &ldquo;{query}&rdquo;
                  </span>
                )}
              </div>
            )}

            {/* Groups + Options */}
            {!loading &&
              filteredGroups.map((group, gi) => (
                <div key={gi}>
                  {/* Group label */}
                  {group.label && (
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-(--color-light-text-muted) dark:text-dark-text-muted">
                      {group.label}
                    </div>
                  )}

                  {group.options.map((opt) => {
                    const globalIndex = filteredFlat.findIndex(
                      (o) => o.value === opt.value,
                    );
                    const selected_ = isSelected(opt.value);
                    const focused = focusedIndex === globalIndex;

                    return (
                      <div
                        key={opt.value}
                        data-option
                        role="option"
                        aria-selected={selected_}
                        aria-disabled={opt.disabled}
                        onClick={() => !opt.disabled && commit(opt.value)}
                        onMouseEnter={() => setFocusedIndex(globalIndex)}
                        className={cn(
                          // base
                          "relative flex w-full cursor-pointer select-none items-center gap-3",
                          "rounded-lg px-3 py-2 text-sm transition-colors duration-100",
                          // normal
                          "text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)",
                          // hover / focus
                          "hover:bg-(--color-light-nav-hover-bg) dark:hover:bg-(--color-dark-card-hover)",
                          focused &&
                            "bg-(--color-light-nav-active-bg) dark:bg-(--color-dark-card-hover)",
                          // selected
                          selected_ &&
                            "bg-(--color-light-nav-active-bg) dark:bg-(--color-dark-card-hover) font-medium",
                          // disabled
                          opt.disabled &&
                            "cursor-not-allowed opacity-40 hover:bg-transparent dark:hover:bg-transparent",
                        )}
                      >
                        {/* Leading icon */}
                        {opt.icon && (
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-(--color-light-text-muted) dark:text-dark-text-muted">
                            {opt.icon}
                          </span>
                        )}

                        {/* Custom render OR default */}
                        <span className="flex min-w-0 flex-1 flex-col">
                          {renderOption ? (
                            renderOption(opt)
                          ) : (
                            <>
                              <span className="truncate">
                                <Highlighted text={opt.label} query={query} />
                              </span>
                              {opt.description && (
                                <span className="truncate text-xs text-(--color-light-text-muted) dark:text-dark-text-muted">
                                  {opt.description}
                                </span>
                              )}
                            </>
                          )}
                        </span>

                        {/* Check indicator */}
                        {selected_ && (
                          <CheckIcon className="ml-auto h-4 w-4 shrink-0 text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)" />
                        )}
                      </div>
                    );
                  })}

                  {/* Group separator (except last) */}
                  {gi < filteredGroups.length - 1 && group.label && (
                    <div className="my-1 mx-1 h-px bg-light-divider dark:bg-dark-divider" />
                  )}
                </div>
              ))}
          </div>

          {/* ── Footer: multi count + clear all ── */}
          {multiple && Array.isArray(selected) && selected.length > 0 && (
            <div className="mt-1 flex items-center justify-between border-t px-3 pt-1.5 pb-1 border-light-divider dark:border-dark-divider">
              <span className="text-xs text-(--color-light-text-muted) dark:text-dark-text-muted">
                {selected.length} selected
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-light-error-text dark:text-dark-error-text hover:underline transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
