import { useEffect, useMemo, useRef, useState } from 'react'

type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type SelectProps = {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  placeholder?: string
  options?: SelectOption[]
  label?: string
  className?: string
  disabled?: boolean
  error?: string
  name?: string
}

const Select = ({
  value,
  defaultValue,
  onChange,
  onValueChange,
  placeholder = 'Select...',
  options = [],
  label,
  className = '',
  disabled = false,
  error,
  name,
}: SelectProps) => {
  const handleValueChange = onChange ?? onValueChange
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const selectedValue = value ?? defaultValue ?? ''
  const selectedOption = useMemo(() => options.find((opt) => opt.value === selectedValue), [options, selectedValue])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function choose(option: SelectOption) {
    if (option.disabled) return
    handleValueChange?.(option.value)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={['fp-select', className].filter(Boolean).join(' ')}>
      {label ? <label className="fp-field-label">{label}</label> : null}
      {name ? <input type="hidden" name={name} value={value ?? defaultValue ?? ''} readOnly /> : null}
      <div className={['fp-select-trigger', open ? 'fp-select-open' : '', error ? 'fp-control-error' : '', disabled ? 'fp-select-disabled' : ''].filter(Boolean).join(' ')}>
        <button
          type="button"
          disabled={disabled}
          className={!selectedOption ? 'fp-select-placeholder' : ''}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
            }
          }}
        >
          <span>{selectedOption?.label || placeholder}</span>
          <span className="fp-select-chevron">⌄</span>
        </button>
        {open ? (
          <div className="fp-select-menu" role="listbox">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === selectedValue}
                disabled={opt.disabled}
                className={opt.value === selectedValue ? 'fp-select-option fp-select-option-active' : 'fp-select-option'}
                onClick={() => choose(opt)}
              >
                <span>{opt.label}</span>
                {opt.value === selectedValue ? <b>✓</b> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {error ? <span className="fp-field-error-text">{error}</span> : null}
    </div>
  )
}

export default Select
