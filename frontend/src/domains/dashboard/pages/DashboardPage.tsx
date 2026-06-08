import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { AlertaStockDto } from '../../../shared/types'
import { useAppStore } from '../../../store'
import { KpiCards } from '../components/KpiCards'
import { KitchenOrders } from '../components/KitchenOrders'
import { ShoppingCart, TrendUp, Warning, Gauge, ArrowsClockwise, Package } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'
import { Button } from '../../../components/Ui/Button'

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

  const userRole = user?.rol || 'MESERO'

  const loadData = async () => {
    if (userRole === 'COCINERO') {
      // Cooks don't need financial metrics
      setLoading(false)
      return
    }
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

  useEffect(() => {
    loadData()
  }, [userRole])

  const maxDaily = Math.max(...dailySales.map(d => d.total), 1)
  const maxPopular = Math.max(...popularProducts.map(p => p.cantidad), 1)

  // 1. If cook, show only kitchen comanda orders
  if (userRole === 'COCINERO') {
    return (
      <div style={{ padding: '0.25rem' }}>
        <KitchenOrders />
      </div>
    )
  }

  // 2. Otherwise show admin KPIs & kitchen orders section below
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div className="section-header flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: 0 }}>
            Bienvenido, {user?.nombre} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem', margin: 0 }}>
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button onClick={loadData} variant="secondary" disabled={loading}>
          <ArrowsClockwise size={15} className={loading ? 'animate-spin-slow' : ''} />
          Actualizar Datos
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <KpiCards
        financials={financials}
        alertaStockCount={alertaStock.length}
        caja={caja}
        loading={loading}
      />

      {/* Charts & Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

        {/* Daily Sales */}
        <Card padded={true}>
          <h3 style={{ fontSize: '0.9375rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
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
        </Card>

        {/* Popular Products */}
        <Card padded={true}>
          <h3 style={{ fontSize: '0.9375rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
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
        </Card>

        {/* Stock Alerts */}
        <Card padded={true} style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '0.9375rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {alertaStock.map((item, i) => (
                <div key={i} style={{
                  background: 'var(--color-warning-light)',
                  border: '1px solid hsl(45, 80%, 80%)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  textAlign: 'left'
                }}>
                  <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)', margin: 0 }}>{item.nombre}</p>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(45, 60%, 30%)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                    Stock:
                    <span className={`badge ${item.stock === 0 ? 'badge-danger' : 'badge-warning'} text-[10px] px-1.5 py-0.5`}>
                      {item.stock}
                    </span>
                    / Mín: {item.stockMinimo}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Kitchen Orders Section */}
      <div style={{ marginTop: '0.5rem' }}>
        <KitchenOrders />
      </div>
    </div>
  )
}
