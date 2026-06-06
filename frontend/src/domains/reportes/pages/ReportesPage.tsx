import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { AlertaStockDto, StockInsuficienteDto } from '../../../shared/types'
import { TrendUp, TrendDown, Package, Warning, CurrencyDollar, Calendar } from '@phosphor-icons/react'

export const ReportesPage: React.FC = () => {
  // Financial Summary
  const [financials, setFinancials] = useState<{
    totalVentas: number
    baseImponible: number
    igv: number
    costoTotal: number
    gananciaNeta: number
  } | null>(null)

  // Views & lists
  const [alertaStock, setAlertaStock] = useState<AlertaStockDto[]>([])
  const [stockInsuficiente, setStockInsuficiente] = useState<StockInsuficienteDto[]>([])
  const [popularProducts, setPopularProducts] = useState<{ producto: string; cantidad: number; total: number }[]>([])
  const [dailySales, setDailySales] = useState<{ fecha: string; total: number; cantidad: number }[]>([])

  const loadReports = async () => {
    try {
      const [finRes, alertRes, insRes, popRes, dailyRes] = await Promise.all([
        api.get<any>('/api/v1/reportes/resumen-financiero'),
        api.get<AlertaStockDto[]>('/api/v1/reportes/alerta-stock'),
        api.get<StockInsuficienteDto[]>('/api/v1/reportes/stock-insuficiente'),
        api.get<any[]>('/api/v1/reportes/productos-populares'),
        api.get<any[]>('/api/v1/reportes/ventas-diarias')
      ])

      setFinancials(finRes)
      setAlertaStock(alertRes)
      setStockInsuficiente(insRes)
      setPopularProducts(popRes)
      setDailySales(dailyRes)
    } catch (e) {
      console.error('Error loading reports', e)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const maxDailySale = Math.max(...dailySales.map(d => d.total), 1)
  const maxPopQty = Math.max(...popularProducts.map(p => p.cantidad), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
          Reportes & Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
          Métricas de negocio, utilidades y alertas críticas de stock
        </p>
      </div>

      {/* Financials Row */}
      {financials && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 text-left relative overflow-hidden border-default" style={{ background: 'var(--color-surface)' }}>
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-black"><CurrencyDollar size={96} /></div>
            <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>INGRESOS TOTALES</span>
            <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>S/. {financials.totalVentas.toFixed(2)}</span>
            <span className="text-[10px] block mt-2" style={{ color: 'var(--text-secondary)' }}>
              Base Imponible: S/. {financials.baseImponible.toFixed(2)} | IGV: S/. {financials.igv.toFixed(2)}
            </span>
          </div>

          <div className="card p-6 text-left relative overflow-hidden border-default" style={{ background: 'var(--color-surface)' }}>
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-black"><TrendDown size={96} /></div>
            <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>COSTO DE INSUMOS VENDIDOS</span>
            <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-danger)' }}>S/. {financials.costoTotal.toFixed(2)}</span>
            <span className="text-[10px] block mt-2" style={{ color: 'var(--text-secondary)' }}>
              Calculado a partir de recetas e inventarios directos
            </span>
          </div>

          <div className="card p-6 text-left relative overflow-hidden border-default" style={{ background: 'var(--color-surface-2)' }}>
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-black"><TrendUp size={96} /></div>
            <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>GANANCIA NETA ESTIMADA</span>
            <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-success)' }}>S/. {financials.gananciaNeta.toFixed(2)}</span>
            <span className="text-[10px] block mt-2" style={{ color: 'var(--text-secondary)' }}>
              Utilidad real descontando costos de ingredientes
            </span>
          </div>
        </div>
      )}

      {/* Main Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <div className="card p-6 text-left space-y-4 border-default" style={{ background: 'var(--color-surface)' }}>
          <h3 className="text-lg font-bold m-0 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar size={22} style={{ color: 'var(--color-primary)' }} />
            Ventas Diarias (Últimos días)
          </h3>
          <div className="space-y-3 pt-2">
            {dailySales.length === 0 ? (
              <p className="text-xs text-center py-12" style={{ color: 'var(--text-muted)' }}>No hay ventas registradas recientemente.</p>
            ) : (
              dailySales.map((d, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>{d.fecha} ({d.cantidad} vts)</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>S/. {d.total.toFixed(2)}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${(d.total / maxDailySale) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Products Chart */}
        <div className="card p-6 text-left space-y-4 border-default" style={{ background: 'var(--color-surface)' }}>
          <h3 className="text-lg font-bold m-0 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendUp size={22} style={{ color: 'var(--color-primary)' }} />
            Productos Más Vendidos
          </h3>
          <div className="space-y-3 pt-2">
            {popularProducts.length === 0 ? (
              <p className="text-xs text-center py-12" style={{ color: 'var(--text-muted)' }}>No hay estadísticas de venta disponibles.</p>
            ) : (
              popularProducts.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>{p.producto}</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.cantidad} u. | S/. {p.total.toFixed(2)}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${(p.cantidad / maxPopQty) * 100}%`, background: 'var(--color-success)' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card p-6 text-left space-y-4 border-default" style={{ background: 'var(--color-surface)' }}>
          <h3 className="text-lg font-bold m-0 flex items-center gap-2" style={{ color: 'var(--color-warning)' }}>
            <Warning size={22} />
            Alertas de Stock Crítico (Productos)
          </h3>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {alertaStock.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>Todo el inventario directo está en niveles correctos.</p>
            ) : (
              alertaStock.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 rounded-lg border text-xs"
                  style={{
                    color: 'hsl(45, 80%, 30%)',
                    background: 'var(--color-warning-light)',
                    borderColor: 'hsla(45, 95%, 50%, 0.2)'
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-[var(--color-warning)]"></span>
                    <span className="font-medium">{item.nombre}</span>
                  </div>
                  <span className="font-semibold">Stock: {item.stock} (Mín: {item.stockMinimo})</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recipe stock alert */}
        <div className="card p-6 text-left space-y-4 border-default" style={{ background: 'var(--color-surface)' }}>
          <h3 className="text-lg font-bold m-0 flex items-center gap-2" style={{ color: 'var(--color-danger)' }}>
            <Package size={22} />
            Insumos Insuficientes para Recetas
          </h3>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {stockInsuficiente.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No hay insumos agotados para las recetas de los platos.</p>
            ) : (
              stockInsuficiente.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 rounded-lg border text-xs"
                  style={{
                    color: 'var(--color-danger)',
                    background: 'var(--color-danger-light)',
                    borderColor: 'hsla(5, 65%, 38%, 0.2)'
                  }}
                >
                  <div>
                    <span className="font-medium block">Insumo: {item.insumo}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Requerido en plato: {item.producto}</span>
                  </div>
                  <span className="font-semibold">Disponible: {item.stock} kg / cant (Necesario: {item.cantidadNecesaria} por porción)</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
