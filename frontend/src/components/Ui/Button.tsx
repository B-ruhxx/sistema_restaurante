import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  iconOnly?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  className = '',
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  const variantClass = `btn-${variant}`
  const iconClass = iconOnly ? 'btn-icon' : ''

  // Limpiamos los espacios en blanco sobrantes en la cadena de clases
  const combinedClasses = `btn ${variantClass} ${sizeClass} ${iconClass} ${className}`.trim().replace(/\s+/g, ' ')

  return (
    <button
      className={combinedClasses}
      {...props}
    >
      {children}
    </button>
  )
}