function TextArea({
  className,
  id,
  label,
  required,
  register,
  placeholder,
  error,
  row,
  rows,
  value,
  onChange,
  ...rest
}) {
  const resolvedRows = rows ?? row ?? 4;
  return (
    <div className={`${className ? className : ""}`}>
      <div className="relative flex w-full flex-col gap-1">
        {label ? (
          <label
            htmlFor={id}
            className="text-[11px] font-semibold text-primary dark:text-dark-primary"
          >
            {label} {required && <span className="text-error">*</span>}
          </label>
        ) : null}
        <textarea
          rows={resolvedRows}
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...register}
          {...rest}
          className={[
            "w-full resize-y rounded-xl border bg-(--color-light-input-bg) px-3.5 py-2 text-xs text-(--color-light-text-primary) outline-none transition-colors",
            "placeholder:text-(--color-light-input-placeholder)",
            "dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder)",
            error
              ? "border-(--color-light-error-border) focus:border-(--color-light-error-border) focus:ring-2 focus:ring-(--color-light-error-border)/20 dark:border-(--color-dark-error-border) dark:focus:border-(--color-dark-error-border) dark:focus:ring-(--color-dark-error-border)/25"
              : "border-(--color-light-input-border) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15",
          ].join(" ")}
        />
      </div>
      {error ? (
        <p className="mt-1 text-[10px] font-medium leading-none text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default TextArea;
