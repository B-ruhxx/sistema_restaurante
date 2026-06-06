import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { AlertaStockDto } from '../../../shared/types'
import { useAppStore } from '../../../store'
import {
  CurrencyDollar, ShoppingCart, Coins, Package,
  TrendUp, Warning, ArrowsClockwise, Gauge
} from '@phosphor-icons/react'

interface FinancialSummary {
  totalVentas: number
  baseImponible: number
  igv: number
  costoTotal: number
  gananciaNeta: number
}

interface PopularProduct {
  producto: string
  cantidad: number
  total: number
}

interface DailySale {
  fecha: string
  total: number
  cantidad: number
}

export const DashboardPage: React.FC = () => {
  const { user, caja } = useAppStore()
  const [financials, setFinancials] = useState<FinancialSummary | null>(null)
  const [alertaStock, setAlertaStock] = useState<AlertaStockDto[]>([])
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([])
  const [dailySales, setDailySales] = useState<DailySale[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [fin, stock, popular, daily] = await Promise.allSettled([
        api.get<FinancialSummary>('/api/v1/reportes/resumen-financiero'),
        api.get<AlertaStockDto[]>('/api/v1/reportes/alerta-stock'),
        api.get<PopularProduct[]>('/api/v1/reportes/productos-populares'),
        api.get<DailySale[]>('/api/v1/reportes/ventas-diarias'),
      ])
      if (fin.status === 'fulfilled') setFinancials(fin.value)
      if (stock.status === 'fulfilled') setAlertaStock(stock.value)
      if (popular.status === 'fulfilled') setPopularProducts(popular.value.slice(0, 6))
      if (daily.status === 'fulfilled') setDailySales(daily.value.slice(-7))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const maxDaily = Math.max(...dailySales.map(d => d.total), 1)
  const maxPopular = Math.max(...popularProducts.map(p => p.cantidad), 1)

  const KPICard = ({ icon, label, value, sub, color, loading: l }: {
    icon: React.ReactNode, label: string, value: string, sub?: string, color: string, loading?: boolean
  }) => (
    <div className="kpi-card" style={{ ['--kpi-color' as any]: color, borderLeftColor: color } as React.CSSProperties}>
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
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
            Bienvenido, {user?.nombre} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary" disabled={loading}>
          <ArrowsClockwise size={15} className={loading ? 'animate-spin-slow' : ''} />
          Actualizar
        </button>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
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
          value={loading ? '...' : String(alertaStock.length)}
          sub={alertaStock.length === 0 ? 'Inventario en orden ✓' : 'Productos bajo mínimo'}
          color={alertaStock.length > 0 ? 'var(--color-warning)' : 'var(--color-success)'}
        />
      </div>

      {/* Charts & Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Daily Sales */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={18} style={{ color: 'var(--color-primary)' }} />
            Ventas Diarias (últimos 7 días)
          </h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)}
            </div>
          ) : dailySales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Gauge size={40} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
              <p>Sin registros de ventas aún</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {dailySales.map((d, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{d.fecha} <span style={{ color: 'var(--text-muted)' }}>({d.cantidad} ventas)</span></span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>S/. {d.total.toFixed(2)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${(d.total / maxDaily) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Products */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendUp size={18} style={{ color: 'var(--color-success)' }} />
            Productos Más Vendidos
          </h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)}
            </div>
          ) : popularProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Package size={40} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
              <p>Sin estadísticas disponibles</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {popularProducts.map((p, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: '0.375rem' }}>#{i+1}</span>
                      {p.producto}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.cantidad} u.</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${(p.cantidad / maxPopular) * 100}%`, background: 'var(--color-success)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Alerts */}
        <div className="card" style={{ padding: '1.25rem', gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '0.9375rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Warning size={18} style={{ color: 'var(--color-warning)' }} />
            Alertas de Stock Crítico
            {alertaStock.length > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>
                {alertaStock.length} alerta{alertaStock.length > 1 ? 's' : ''}
              </span>
            )}
          </h3>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
            </div>
          ) : alertaStock.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '1.25rem',
              background: 'var(--color-success-light)', borderRadius: 'var(--radius-md)',
              color: 'var(--color-success)', fontSize: '0.875rem', fontWeight: 600,
            }}>
              ✓ Todo el inventario se encuentra en niveles correctos
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {alertaStock.map((item, i) => (
                <div key={i} style={{
                  background: 'var(--color-warning-light)',
                  border: '1px solid hsl(45, 80%, 80%)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                }}>
                  <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{item.nombre}</p>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(45, 60%, 30%)', marginTop: '0.2rem' }}>
                    Stock: <strong>{item.stock}</strong> / Mín: {item.stockMinimo}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
