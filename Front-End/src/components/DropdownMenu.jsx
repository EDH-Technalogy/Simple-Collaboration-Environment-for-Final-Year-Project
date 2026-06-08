import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  CheckIcon,
  DotFilledIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { cn } from "../lib/utils";

/* ─────────────────────────────────────────────── */
/* Root */
export const DropdownMenuRoot = DropdownMenu.Root;

/* ─────────────────────────────────────────────── */
/* Trigger */
export const DropdownTrigger = React.forwardRef(
  (
    {
      children,
      icon,
      showArrow = true,
      /** Header-style circular avatar/account control — no muted overlay on icons */
      compactIcon = false,
      asChild = false,
      className,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <DropdownMenu.Trigger asChild>
          {React.cloneElement(children, { ref, ...props })}
        </DropdownMenu.Trigger>
      );
    }

    const iconOnly =
      compactIcon ||
      Boolean(icon != null && !children && showArrow === false);

    return (
      <DropdownMenu.Trigger asChild>
        <button
          ref={ref}
          className={cn(
            "group flex items-center gap-2 border transition-colors rtl:flex-row-reverse",
            "outline-none",
            iconOnly
              ? cn(
                  "size-9 shrink-0 cursor-pointer justify-center gap-0 overflow-hidden rounded-full border-transparent bg-transparent p-0 shadow-none sm:size-10",
                  "hover:bg-transparent dark:hover:bg-transparent",
                  "data-[state=open]:bg-transparent dark:data-[state=open]:bg-transparent",
                  "focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:focus-visible:ring-blue-400/35",
                )
              : cn(
                  icon || showArrow
                    ? "w-full rounded-xl px-3 py-2 text-sm font-medium"
                    : "w-fit cursor-pointer justify-center rounded-full text-sm font-medium",
                  "border-(--color-light-input-border) bg-(--color-light-input-bg) text-(--color-light-text-secondary) dark:border-(--color-dark-input-border) dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-secondary)",
                  "hover:text-(--color-light-text-primary) dark:hover:text-(--color-dark-text-primary)",
                  "focus-visible:ring-2 focus-visible:ring-blue-500/15 dark:focus-visible:ring-blue-400/15",
                ),
            className,
          )}
          {...props}
        >
          {icon && (
            <span
              className={cn(
                "flex shrink-0 items-center justify-center leading-none",
                !iconOnly &&
                  "text-(--color-light-text-muted) group-hover:text-(--color-light-text-secondary) dark:text-(--color-dark-text-muted) dark:group-hover:text-(--color-dark-text-secondary)",
              )}
            >
              {icon}
            </span>
          )}
        {children && (
          <span className="flex-1 truncate ltr:text-left rtl:text-right text-(--color-light-text-secondary) dark:text-(--color-dark-text-secondary) group-hover:text-(--color-light-text-primary) dark:group-hover:text-(--color-dark-text-primary)">
            {children}
          </span>
        )}

          {showArrow && (
            <ChevronRightIcon className="h-4 w-4 shrink-0 transition-transform group-hover:rotate-90 data-[state=open]:rotate-90 rtl:rotate-180 rtl:group-hover:-rotate-90 rtl:data-[state=open]:-rotate-90 text-(--color-light-text-muted) dark:text-(--color-dark-text-muted) group-hover:text-(--color-light-text-secondary) dark:group-hover:text-(--color-dark-text-secondary)" />
          )}
        </button>
      </DropdownMenu.Trigger>
    );
  },
);
DropdownTrigger.displayName = "DropdownTrigger";

/* ─────────────────────────────────────────────── */
/* Content */
export const DropdownContent = React.forwardRef(
  ({ children, className, sideOffset = 4, align = "start", ...props }, ref) => (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-[1100] min-w-56 overflow-hidden rounded-xl p-1.5",
          "border shadow-md",
          "bg-(--color-light-card-bg) text-(--color-light-text-primary) border-(--color-light-card-border)",
          "dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-text-primary) dark:border-(--color-dark-card-border)",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  ),
);
DropdownContent.displayName = "DropdownContent";

/* ─────────────────────────────────────────────── */
/* Item */
const itemVariants = {
  default:
    "text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)",
  danger:
    "text-(--color-light-error-text) dark:text-(--color-dark-error-text)",
  success:
    "text-(--color-light-success-text) dark:text-(--color-dark-success-text)",
  warning:
    "text-(--color-light-warning-text) dark:text-(--color-dark-warning-text)",
};

export const DropdownItem = React.forwardRef(
  ({ children, icon, variant = "default", data, className, ...props }, ref) => (
    <DropdownMenu.Item
      ref={ref}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-normal rtl:flex-row-reverse",
        "cursor-pointer select-none outline-none transition-colors",
        "hover:bg-(--color-light-nav-hover-bg) dark:hover:bg-(--color-dark-card-hover) data-highlighted:bg-(--color-light-nav-active-bg) dark:data-highlighted:bg-(--color-dark-card-hover)",
        "ltr:text-left rtl:text-right",
        itemVariants[variant],
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="h-4 w-4 shrink-0 text-(--color-light-text-muted) dark:text-(--color-dark-text-muted)">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">{children}</span>
      {data && (
        <span className="shrink-0 ltr:ml-auto rtl:mr-auto text-(--color-light-text-tertiary) dark:text-(--color-dark-text-tertiary)">
          {data}
        </span>
      )}
    </DropdownMenu.Item>
  ),
);
DropdownItem.displayName = "DropdownItem";

/* ─────────────────────────────────────────────── */
/* Checkbox */
export const DropdownCheckboxItem = React.forwardRef(
  ({ children, checked, className, ...props }, ref) => (
    <DropdownMenu.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn(
        "relative flex w-full items-center rounded-xl py-2 pl-8 pr-2 text-sm",
        "cursor-pointer select-none outline-none transition-colors",
        "text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)",
        "hover:bg-(--color-light-nav-hover-bg) dark:hover:bg-(--color-dark-card-hover) data-highlighted:bg-(--color-light-nav-active-bg) dark:data-highlighted:bg-(--color-dark-card-hover)",
        "data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <DropdownMenu.ItemIndicator className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <CheckIcon className="h-4 w-4" />
      </DropdownMenu.ItemIndicator>
      {children}
    </DropdownMenu.CheckboxItem>
  ),
);
DropdownCheckboxItem.displayName = "DropdownCheckboxItem";

/* ─────────────────────────────────────────────── */
/* Radio */
export const DropdownRadioGroup = DropdownMenu.RadioGroup;

export const DropdownRadioItem = React.forwardRef(
  ({ children, className, ...props }, ref) => (
    <DropdownMenu.RadioItem
      ref={ref}
      className={cn(
        "relative flex w-full items-center transition-all rounded-xl py-2 pl-8 pr-2 text-sm",
        "cursor-pointer select-none outline-none transition-colors",
        "text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)",
        "hover:bg-(--color-light-nav-hover-bg) dark:hover:bg-(--color-dark-card-hover) data-highlighted:bg-(--color-light-nav-active-bg) dark:data-highlighted:bg-(--color-dark-card-hover)",
        className,
      )}
      {...props}
    >
      <DropdownMenu.ItemIndicator className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <DotFilledIcon className="h-3.5 w-3.5" />
      </DropdownMenu.ItemIndicator>
      {children}
    </DropdownMenu.RadioItem>
  ),
);
DropdownRadioItem.displayName = "DropdownRadioItem";

/* ─────────────────────────────────────────────── */
/* Submenu */
export const DropdownSub = DropdownMenu.Sub;

export const DropdownSubTrigger = React.forwardRef(
  ({ children, icon, className, ...props }, ref) => (
    <DropdownMenu.SubTrigger
      ref={ref}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium rtl:flex-row-reverse",
        "cursor-pointer select-none outline-none transition-colors",
        "group text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)",
        "hover:bg-(--color-light-nav-hover-bg) dark:hover:bg-(--color-dark-card-hover) data-highlighted:bg-(--color-light-nav-active-bg) dark:data-highlighted:bg-(--color-dark-card-hover)",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="h-4 w-4 shrink-0 text-(--color-light-text-muted) dark:text-(--color-dark-text-muted)">
          {icon}
        </span>
      )}
      <span className="flex-1 ltr:text-left rtl:text-right">{children}</span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-(--color-light-text-muted) transition-transform group-hover:rotate-90 dark:text-(--color-dark-text-muted) rtl:rotate-180 rtl:group-hover:-rotate-90" />
    </DropdownMenu.SubTrigger>
  ),
);
DropdownSubTrigger.displayName = "DropdownSubTrigger";

export const DropdownSubContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent
        ref={ref}
        className={cn(
          "z-[1100] min-w-48 rounded-xl border p-1.5",
          "shadow-md",
          "bg-(--color-light-card-bg) text-(--color-light-text-primary) border-(--color-light-card-border)",
          "dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-text-primary) dark:border-(--color-dark-card-border)",
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  ),
);
DropdownSubContent.displayName = "DropdownSubContent";

/* ─────────────────────────────────────────────── */
/* Label */
export const DropdownLabel = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DropdownMenu.Label
      ref={ref}
      className={cn(
        "px-3 py-1 text-xs font-semibold uppercase text-(--color-light-text-muted) dark:text-(--color-dark-text-muted)",
        className,
      )}
      {...props}
    >
      {children}
    </DropdownMenu.Label>
  ),
);
DropdownLabel.displayName = "DropdownLabel";

/* ─────────────────────────────────────────────── */
/* Separator */
export const DropdownSeparator = React.forwardRef(
  ({ className, ...props }, ref) => (
    <DropdownMenu.Separator
      ref={ref}
      className={cn(
        "my-1 h-px bg-(--color-light-divider) dark:bg-(--color-dark-divider)",
        className,
      )}
      {...props}
    />
  ),
);
DropdownSeparator.displayName = "DropdownSeparator";
export const DropdownShortcut = ({ className, ...props }) => (
  <span
    className={cn(
      "ml-auto text-xs tracking-widest text-(--color-light-text-tertiary) dark:text-(--color-dark-text-tertiary)",
      className,
    )}
    {...props}
  />
);
DropdownShortcut.displayName = "DropdownShortcut";
