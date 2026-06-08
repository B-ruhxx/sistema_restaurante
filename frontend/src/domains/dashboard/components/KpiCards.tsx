import React from 'react'
import { CurrencyDollar, TrendUp, Coins, Warning } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'

interface KpiCardsProps {
  financials: {
    totalVentas: number
    baseImponible: number
    igv: number
    costoTotal: number
    gananciaNeta: number
  } | null
  alertaStockCount: number
  caja: any
  loading: boolean
}

export const KpiCards: React.FC<KpiCardsProps> = ({ financials, alertaStockCount, caja, loading }) => {
  const KPICard = ({ icon, label, value, sub, color, loading: l }: {
    icon: React.ReactNode, label: string, value: string, sub?: string, color: string, loading?: boolean
  }) => (
    <Card
      padded={true}
      hoverable={true}
      className="kpi-card text-left"
      style={{ borderLeftColor: color } as React.CSSProperties}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {label}
          </p>
          {l ? (
            <div className="skeleton" style={{ width: 120, height: 32, borderRadius: 8 }} />
          ) : (
            <p style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {value}
            </p>
          )}
          {sub && !l && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{sub}</p>
          )}
        </div>
        <div style={{
          background: `${color}18`, borderRadius: 'var(--radius-md)',
          padding: '0.625rem', color,
        }}>
          {icon}
        </div>
      </div>
    </Card>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
      <KPICard loading={loading}
        icon={<CurrencyDollar size={22} />} label="Ingresos Totales"
        value={financials ? `S/. ${financials.totalVentas.toFixed(2)}` : '—'}
        sub={financials ? `IGV: S/. ${financials.igv.toFixed(2)}` : 'Sin datos aún'}
        color="var(--color-primary)"
      />
      <KPICard loading={loading}
        icon={<TrendUp size={22} />} label="Ganancia Neta"
        value={financials ? `S/. ${financials.gananciaNeta.toFixed(2)}` : '—'}
        sub="Descontando costo de insumos"
        color="var(--color-success)"
      />
      <KPICard loading={loading}
        icon={<Coins size={22} />} label="Estado de Caja"
        value={caja ? `S/. ${(caja.montoSistema ?? caja.montoApertura).toFixed(2)}` : 'Cerrada'}
        sub={caja ? `Turno #${caja.idCaja}` : 'Debe abrir caja para vender'}
        color={caja ? 'var(--color-success)' : 'var(--color-danger)'}
      />
      <KPICard loading={loading}
        icon={<Warning size={22} />} label="Alertas de Stock"
        value={loading ? '...' : String(alertaStockCount)}
        sub={alertaStockCount === 0 ? 'Inventario en orden ✓' : 'Productos bajo mínimo'}
        color={alertaStockCount > 0 ? 'var(--color-warning)' : 'var(--color-success)'}
      />
    </div>
  )
}
