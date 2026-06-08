import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full text-left">
        {label && (
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`erp-input ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-none' : ''} ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs font-medium block mt-1" style={{ color: 'var(--color-danger)' }}>
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'