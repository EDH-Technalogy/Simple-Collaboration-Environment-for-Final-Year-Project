import { cloneElement, isValidElement, ReactElement, ReactNode, useState } from 'react'
import Icon from './Icon'

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  register?: Record<string, unknown>
  id?: string
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (value: string) => void
  value?: string
  iconD?: string
  children?: ReactNode
}

function Field({
  register,
  id,
  label,
  type = 'text',
  placeholder,
  error,
  required,
  onChange,
  onValueChange,
  value,
  iconD,
  autoComplete,
  children,
  className = '',
  ...rest
}: FieldProps) {
  const [showPw, setShowPw] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (showPw ? 'text' : 'password') : type

  return (
    <div className={['fp-field', className].filter(Boolean).join(' ')}>
      {label ? <label className="fp-field-label" htmlFor={id}>{label}</label> : null}
      <div className="fp-field-frame">
        {iconD ? (
          <span className="fp-field-icon">
            <Icon d={iconD} className="fp-field-svg" />
          </span>
        ) : null}
        {children ? (
          <div className={error ? 'fp-field-child fp-field-error' : 'fp-field-child'}>
            {isValidElement(children)
              ? cloneElement(children as ReactElement<{ className?: string }>, {
                  className: [(children as ReactElement<{ className?: string }>).props.className || '', error ? 'fp-control-error' : ''].filter(Boolean).join(' '),
                })
              : children}
          </div>
        ) : (
          <input
            id={id}
            required={required}
            type={resolvedType}
            placeholder={placeholder}
            value={value}
            onChange={(event) => {
              onValueChange?.(event.target.value)
              onChange?.(event)
            }}
            autoComplete={autoComplete}
            {...register}
            {...rest}
            className={['fp-input', iconD ? 'fp-input-with-icon' : '', isPassword ? 'fp-input-password' : '', error ? 'fp-control-error' : ''].filter(Boolean).join(' ')}
          />
        )}
        {isPassword ? (
          <button type="button" onClick={() => setShowPw((current) => !current)} className="fp-password-toggle" tabIndex={-1}>
            <Icon
              d={
                showPw
                  ? 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z'
                  : 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22'
              }
              className="fp-field-svg"
            />
          </button>
        ) : null}
      </div>
      {error ? <span className="fp-field-error-text">{error}</span> : null}
    </div>
  )
}

export default Field
