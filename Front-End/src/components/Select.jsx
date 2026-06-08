import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";

const Select = ({
  value,
  defaultValue,
  onChange,
  onValueChange,
  placeholder = "Select...",
  options = [],
  label,
  className = "",
  disabled = false,
  error,
  name,
  register,
}) => {
  const handleValueChange = onChange ?? onValueChange;
  const resolvedRegister =
    name && typeof register === "function" ? register(name) : register;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[11px] font-semibold text-primary dark:text-dark-primary">
          {label}
        </label>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={value ?? defaultValue ?? ""}
          readOnly
          {...(resolvedRegister || {})}
        />
      )}

      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          className={`
            inline-flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3.5 text-xs
            border transition-colors outline-none
            bg-(--color-light-input-bg) text-(--color-light-text-primary)
            dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary)
            focus-visible:outline-none
            data-placeholder:text-(--color-light-input-placeholder) dark:data-placeholder:text-(--color-dark-input-placeholder)
            ${
              error
                ? "border-(--color-light-error-border) focus-visible:border-(--color-light-error-border) focus-visible:ring-2 focus-visible:ring-(--color-light-error-border)/25 dark:border-(--color-dark-error-border) dark:focus-visible:border-(--color-dark-error-border) dark:focus-visible:ring-(--color-dark-error-border)/20"
                : "border-(--color-light-input-border) dark:border-dark-input-border focus-visible:border-(--color-light-input-border-focus) focus-visible:ring-2 focus-visible:ring-blue-500/15 dark:focus-visible:border-(--color-dark-input-border-focus) dark:focus-visible:ring-blue-400/15"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            <RadixSelect.Value placeholder={placeholder} />
          </span>
          <RadixSelect.Icon className="shrink-0">
            <ChevronDownIcon />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className="
              z-[1100] overflow-hidden w-(--radix-select-trigger-width) rounded-xl border
              bg-(--color-light-card-bg) text-(--color-light-text-primary) border-(--color-light-card-border)
              dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-text-primary) dark:border-(--color-dark-card-border)
              shadow-md
            "
            position="popper"
          >
            <RadixSelect.ScrollUpButton className="flex items-center justify-center h-6">
              <ChevronUpIcon />
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="p-1">
              {options.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex items-center justify-center h-6">
              <ChevronDownIcon />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error ? (
        <span className="text-[10px] font-medium leading-none text-error">{error}</span>
      ) : null}
    </div>
  );
};

const SelectItem = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <RadixSelect.Item
      ref={ref}
      {...props}
      className="
        relative flex min-w-0 items-center h-8 px-8 text-xs rounded-lg cursor-pointer outline-none
        text-(--color-light-text-primary) dark:text-(--color-dark-text-primary)
        data-highlighted:bg-(--color-light-nav-hover-bg) dark:data-highlighted:bg-(--color-dark-card-hover)
        data-disabled:opacity-50 data-disabled:pointer-events-none
      "
    >
      <RadixSelect.ItemText className="min-w-0 truncate">{children}</RadixSelect.ItemText>

      <RadixSelect.ItemIndicator className="absolute left-2">
        <CheckIcon />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
});

SelectItem.displayName = "SelectItem";

export default Select;
