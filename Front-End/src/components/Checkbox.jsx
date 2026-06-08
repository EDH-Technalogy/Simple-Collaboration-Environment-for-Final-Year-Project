const Checkbox = ({
  id,
  label = "",
  checked,
  defaultChecked,
  onChange,
  className = "",
  disabled = false,
  children,
  ...props
}) => {
  const isControlled = checked !== undefined;
  const normalizedChecked = checked === "indeterminate" ? false : checked;
  const normalizedDefaultChecked =
    defaultChecked === "indeterminate" ? false : defaultChecked;

  return (
    <label
      className={`inline-flex items-center gap-2 ${className} ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={isControlled ? normalizedChecked : undefined}
        defaultChecked={!isControlled ? normalizedDefaultChecked : undefined}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />

      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-(--color-light-checkbox-border) bg-(--color-light-checkbox-bg) text-(--color-light-checkbox-check) transition-colors peer-checked:border-(--color-light-checkbox-checked-border) peer-checked:bg-(--color-light-checkbox-checked-bg) peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/15 dark:border-(--color-dark-checkbox-border) dark:bg-(--color-dark-checkbox-bg) dark:text-(--color-dark-checkbox-check) dark:peer-checked:border-(--color-dark-checkbox-checked-border) dark:peer-checked:bg-(--color-dark-checkbox-checked-bg) dark:peer-focus-visible:ring-blue-400/15"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-0 transition-opacity"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>

      {(label || children) && (
        <span className="select-none text-sm text-secondary dark:text-dark-secondary">
          {label}
          {children}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
