import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padded?: boolean
  isKpi?: boolean // Agregamos este prop por si quieres usarlo como tarjeta KPI con línea roja superior
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = true,
  padded = true,
  isKpi = false,
  ...props
}) => {
  const classes = [
    'card',
    hoverable ? 'card-hover' : '',
    isKpi ? 'kpi-card' : '',
    !padded ? 'p-0' : '', // Si no es padded, anulamos el padding por defecto de la clase .card
    className
  ].filter(Boolean).join(' ').trim().replace(/\s+/g, ' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}