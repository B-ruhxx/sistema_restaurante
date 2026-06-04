import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { AlertaStockDto, StockInsuficienteDto } from '../types'
import { TrendUp, TrendDown, Package, Warning, CurrencyDollar, Calendar } from '@phosphor-icons/react'

export const Reports: React.FC = () => {
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
        <h1 className="text-3xl font-bold tracking-tight text-white m-0">Dashboard de Reportes</h1>
        <p className="text-gray-400 text-sm mt-1">Métricas de negocio, utilidades y alertas críticas de stock</p>
      </div>

      {/* Financials Row */}
      {financials && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel double-bezel rounded-2xl p-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-white"><CurrencyDollar size={96} /></div>
            <span className="text-xs text-gray-400 font-semibold block mb-1">INGRESOS TOTALES</span>
            <span className="text-3xl font-bold text-white tracking-tight">S/. {financials.totalVentas.toFixed(2)}</span>
            <span className="text-[10px] text-gray-400 block mt-2">Base Imponible: S/. {financials.baseImponible.toFixed(2)} | IGV: S/. {financials.igv.toFixed(2)}</span>
          </div>

          <div className="glass-panel double-bezel rounded-2xl p-6 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-white"><TrendDown size={96} /></div>
            <span className="text-xs text-gray-400 font-semibold block mb-1">COSTO DE INSUMOS VENDIDOS</span>
            <span className="text-3xl font-bold text-red-400 tracking-tight">S/. {financials.costoTotal.toFixed(2)}</span>
            <span className="text-[10px] text-gray-400 block mt-2">Calculado a partir de recetas e inventarios directos</span>
          </div>

          <div className="glass-panel double-bezel rounded-2xl p-6 text-left relative overflow-hidden bg-gradient-to-br from-purple-950/20 to-transparent">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-white"><TrendUp size={96} /></div>
            <span className="text-xs text-gray-400 font-semibold block mb-1">GANANCIA NETA ESTIMADA</span>
            <span className="text-3xl font-bold text-green-400 tracking-tight">S/. {financials.gananciaNeta.toFixed(2)}</span>
            <span className="text-[10px] text-gray-400 block mt-2">Utilidad real descontando costos de ingredientes</span>
          </div>
        </div>
      )}

      {/* Main Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <div className="glass-panel double-bezel rounded-2xl p-6 text-left space-y-4">
          <h3 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <Calendar size={22} className="text-purple-400" />
            Ventas Diarias (Últimos días)
          </h3>
          <div className="space-y-3 pt-2">
            {dailySales.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-12">No hay ventas registradas recientemente.</p>
            ) : (
              dailySales.map((d, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>{d.fecha} ({d.cantidad} vts)</span>
                    <span className="font-semibold text-white">S/. {d.total.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(d.total / maxDailySale) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Products Chart */}
        <div className="glass-panel double-bezel rounded-2xl p-6 text-left space-y-4">
          <h3 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <TrendUp size={22} className="text-purple-400" />
            Productos Más Vendidos
          </h3>
          <div className="space-y-3 pt-2">
            {popularProducts.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-12">No hay estadísticas de venta disponibles.</p>
            ) : (
              popularProducts.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>{p.producto}</span>
                    <span className="font-semibold text-white">{p.cantidad} u. | S/. {p.total.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(p.cantidad / maxPopQty) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-panel double-bezel rounded-2xl p-6 text-left space-y-4">
          <h3 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <Warning size={22} className="text-orange-400" />
            Alertas de Stock Crítico (Productos)
          </h3>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {alertaStock.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">Todo el inventario directo está en niveles correctos.</p>
            ) : (
              alertaStock.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-orange-500 dot-orange"></span>
                    <span className="font-medium text-white">{item.nombre}</span>
                  </div>
                  <span className="text-orange-400 font-semibold">Stock: {item.stock} (Mín: {item.stockMinimo})</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recipe stock alert */}
        <div className="glass-panel double-bezel rounded-2xl p-6 text-left space-y-4">
          <h3 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <Package size={22} className="text-red-400" />
            Insumos Insuficientes para Recetas
          </h3>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {stockInsuficiente.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">No hay insumos agotados para las recetas de los platos.</p>
            ) : (
              stockInsuficiente.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
                  <div>
                    <span className="font-medium text-white block">Insumo: {item.insumo}</span>
                    <span className="text-[10px] text-gray-400">Requerido en plato: {item.producto}</span>
                  </div>
                  <span className="text-red-400 font-semibold">Disponible: {item.stock} kg / cant (Necesario: {item.cantidadNecesaria} por porción)</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
