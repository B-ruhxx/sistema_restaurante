import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { AlertaStockDto, StockInsuficienteDto } from '../../../shared/types'
import { TrendUp, TrendDown, Package, Warning, CurrencyDollar, Calendar, ChartLine, Pizza } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'

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
    <div className="space-y-6 text-left">
      {/* Header de la Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-default shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-tight m-0 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ChartLine size={24} weight="duotone" className="text-[var(--color-primary)]" />
            Reportes & Analytics Comercial
          </h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
            Monitoreo en tiempo real de utilidades netas, rendimiento de cocina y salud de inventario.
          </p>
        </div>
        <div className="text-[11px] font-mono font-bold bg-[var(--color-surface-2)] px-3 py-1.5 rounded-xl border border-default text-[var(--text-secondary)] shadow-sm">
          Frecuencia: Actualización Viva
        </div>
      </div>

      {/* Tarjetas Financieras de Alto Impacto */}
      {financials && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Ingresos Totales */}
          <Card padded={true} hoverable={true} className="relative overflow-hidden border-default bg-[var(--color-surface)] shadow-sm">
            <div className="absolute -top-3 -right-3 p-4 opacity-5 text-[var(--text-primary)]"><CurrencyDollar size={84} weight="fill" /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Ingresos Totales (Bruto)</span>
            <span className="text-2xl font-black font-mono tracking-tight block" style={{ color: 'var(--color-primary)' }}>
              S/. {financials.totalVentas.toFixed(2)}
            </span>
            <div className="text-[10px] font-medium block mt-2 pt-2 border-t border-dashed border-default" style={{ color: 'var(--text-secondary)' }}>
              Base Imp: <span className="font-mono font-bold">S/. {financials.baseImponible.toFixed(2)}</span> • IGV: <span className="font-mono font-bold">S/. {financials.igv.toFixed(2)}</span>
            </div>
          </Card>

          {/* Costo de Insumos */}
          <Card padded={true} hoverable={true} className="relative overflow-hidden border-default bg-[var(--color-surface)] shadow-sm">
            <div className="absolute -top-3 -right-3 p-4 opacity-5 text-red-500"><TrendDown size={84} weight="fill" /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Costo de Insumos Vendidos</span>
            <span className="text-2xl font-black font-mono tracking-tight block text-red-600">
              S/. {financials.costoTotal.toFixed(2)}
            </span>
            <div className="text-[10px] font-medium block mt-2 pt-2 border-t border-dashed border-default" style={{ color: 'var(--text-secondary)' }}>
              Deducción calculada desde recetas activas
            </div>
          </Card>

          {/* Ganancia Neta */}
          <Card padded={true} hoverable={true} className="relative overflow-hidden border-default shadow-md" style={{ background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-success-light) 120%)' }}>
            <div className="absolute -top-3 -right-3 p-4 opacity-5 text-emerald-600"><TrendUp size={84} weight="fill" /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Utilidad Neta Real</span>
            <span className="text-2xl font-black font-mono tracking-tight block text-emerald-600">
              S/. {financials.gananciaNeta.toFixed(2)}
            </span>
            <div className="text-[10px] font-medium block mt-2 pt-2 border-t border-dashed border-default text-emerald-800">
              Margen neto real después de mermas e ingredientes
            </div>
          </Card>
        </div>
      )}

      {/* Paneles de Datos Secundarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfico de Ventas Diarias */}
        <Card padded={true} hoverable={false} className="border-default bg-[var(--color-surface)] shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold m-0 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar size={18} weight="duotone" style={{ color: 'var(--color-primary)' }} />
            Flujo de Ventas Diarias
          </h3>
          <div className="space-y-3.5 pt-1">
            {dailySales.length === 0 ? (
              <p className="text-xs text-center py-12 text-[var(--text-muted)]">No hay ventas registradas recientemente.</p>
            ) : (
              dailySales.map((d, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{d.fecha} <span className="text-[10px] font-normal text-gray-400">({d.cantidad} órdenes)</span></span>
                    <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>S/. {d.total.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-2)] rounded-full h-2 overflow-hidden border border-default">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-[var(--color-primary)]"
                      style={{ width: `${(d.total / maxDailySale) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Productos Más Vendidos */}
        <Card padded={true} hoverable={false} className="border-default bg-[var(--color-surface)] shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold m-0 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Pizza size={18} weight="duotone" style={{ color: 'var(--color-primary)' }} />
            Top Productos & Platos Populares
          </h3>
          <div className="space-y-3.5 pt-1">
            {popularProducts.length === 0 ? (
              <p className="text-xs text-center py-12 text-[var(--text-muted)]">No hay estadísticas de venta disponibles.</p>
            ) : (
              popularProducts.map((p, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{p.producto}</span>
                    <span className="font-mono font-bold text-[11px]" style={{ color: 'var(--text-primary)' }}>
                      {p.cantidad} unds • <span className="text-[var(--color-primary)]">S/. {p.total.toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-2)] rounded-full h-2 overflow-hidden border border-default">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                      style={{ width: `${(p.cantidad / maxPopQty) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Alertas de Stock Crítico */}
        <Card padded={true} hoverable={false} className="border-default bg-[var(--color-surface)] shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold m-0 flex items-center gap-2 text-amber-600">
            <Warning size={18} weight="duotone" />
            Alertas de Stock Mínimo Crítico
          </h3>
          <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
            {alertaStock.length === 0 ? (
              <p className="text-xs text-center py-12 text-[var(--text-muted)]">Todo el inventario directo está en niveles correctos.</p>
            ) : (
              alertaStock.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2.5 rounded-xl border text-xs bg-amber-50/50 border-amber-200/60"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="font-bold text-amber-900 truncate">{item.nombre}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-700 shrink-0 bg-white px-2 py-0.5 rounded-lg border border-amber-200">
                    Stock: {item.stock} <span className="font-normal text-amber-500">(Mín: {item.stockMinimo})</span>
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Insumos de Recetas Insuficientes */}
        <Card padded={true} hoverable={false} className="border-default bg-[var(--color-surface)] shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold m-0 flex items-center gap-2 text-red-600">
            <Package size={18} weight="duotone" />
            Quiebre de Insumos para Recetas (Cocina)
          </h3>
          <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
            {stockInsuficiente.length === 0 ? (
              <p className="text-xs text-center py-12 text-[var(--text-muted)]">No hay insumos agotados para las recetas actuales.</p>
            ) : (
              stockInsuficiente.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2.5 rounded-xl border text-xs bg-red-50/40 border-red-200/60"
                >
                  <div className="overflow-hidden mr-2">
                    <span className="font-bold text-red-900 block truncate">Insumo: {item.insumo}</span>
                    <span className="text-[10px] text-gray-500 block truncate mt-0.5">Afecta a: {item.producto}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-red-700 block bg-white px-2 py-0.5 rounded-lg border border-red-200">
                      Dispo: {item.stock} kg
                    </span>
                    <span className="text-[9px] text-red-400 block mt-0.5 font-medium">Requerido: {item.cantidadNecesaria}/porción</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  )
}