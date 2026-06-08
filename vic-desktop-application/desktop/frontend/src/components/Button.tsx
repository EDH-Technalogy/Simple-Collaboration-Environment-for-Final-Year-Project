import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger'
  fullWidth?: boolean
}

function BtnSpinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`fp-btn-spinner ${className}`.trim()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

function Button({
  onClick,
  children,
  icon,
  type = 'button',
  className = '',
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = false,
  ...rest
}: ButtonProps) {
  const pending = Boolean(loading)
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled || pending}
      className={['fp-btn', `fp-btn-${variant}`, fullWidth ? 'fp-btn-full' : '', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {pending ? <BtnSpinner /> : icon ? <span className="fp-btn-icon" aria-hidden>{icon}</span> : null}
      <span className={pending ? 'fp-btn-pending-text' : undefined}>{children}</span>
    </button>
  )
}

export default Button
