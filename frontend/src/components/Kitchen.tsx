import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { Pedido, DetallePedido } from '../types'
import { Clock, Check, CookingPot, Hourglass, CheckCircle, CookingPot as CookerIcon, ArrowsClockwise } from '@phosphor-icons/react'

export const Kitchen: React.FC = () => {
  const [orders, setOrders] = useState<Pedido[]>([])
  const [detailsMap, setDetailsMap] = useState<Record<number, DetallePedido[]>>({})
  const [loading, setLoading] = useState(false)

  const fetchOrders = async () => {
    try {
      const allOrders = await api.get<Pedido[]>('/api/v1/pedidos')
      // Only keep PENDIENTE, EN_COCINA, LISTO
      const active = allOrders.filter(
        (o) => o.estado === 'PENDIENTE' || o.estado === 'EN_COCINA' || o.estado === 'LISTO'
      )
      
      // Sort: Pendiente and Cooking first, then Ready. Newest first within state.
      active.sort((a, b) => {
        const orderVal: Record<string, number> = { PENDIENTE: 1, EN_COCINA: 2, LISTO: 3, ENTREGADO: 4, CANCELADO: 5 }
        const diff = orderVal[a.estado] - orderVal[b.estado]
        if (diff !== 0) return diff
        return b.idPedido! - a.idPedido!
      })

      setOrders(active)

      // Fetch details for any order that we don't have yet
      for (const order of active) {
        if (!detailsMap[order.idPedido!]) {
          try {
            const details = await api.get<DetallePedido[]>(`/api/v1/pedidos/${order.idPedido}/detalles`)
            setDetailsMap((prev) => ({ ...prev, [order.idPedido!]: details }))
          } catch (e) {
            console.error(`Error loading details for order #${order.idPedido}`, e)
          }
        }
      }
    } catch (e) {
      console.error('Error fetching orders in Kitchen Monitor', e)
    }
  }

  // Load and start polling
  useEffect(() => {
    fetchOrders()
    const timer = setInterval(() => {
      fetchOrders()
    }, 5000)
    return () => clearInterval(timer)
  }, [detailsMap])

  // Progress status of order
  const handleUpdateStatus = async (idPedido: number, currentStatus: Pedido['estado']) => {
    let nextStatus: Pedido['estado'] = 'PENDIENTE'
    if (currentStatus === 'PENDIENTE') nextStatus = 'EN_COCINA'
    else if (currentStatus === 'EN_COCINA') nextStatus = 'LISTO'
    else if (currentStatus === 'LISTO') nextStatus = 'ENTREGADO'

    try {
      await api.put(`/api/v1/pedidos/${idPedido}/estado`, { estado: nextStatus })
      // Remove from list if delivered (ENTREGADO), else update local state
      if (nextStatus === 'ENTREGADO') {
        setOrders(prev => prev.filter(o => o.idPedido !== idPedido))
      } else {
        setOrders(prev => prev.map(o => o.idPedido === idPedido ? { ...o, estado: nextStatus } : o))
      }
    } catch (e: any) {
      alert(e.message || 'Error actualizando estado del pedido')
    }
  }

  const getStatusBadge = (status: Pedido['estado']) => {
    switch (status) {
      case 'PENDIENTE':
        return (
          <span className="flex items-center gap-1.5 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded font-semibold">
            <Hourglass size={12} className="animate-pulse" />
            PENDIENTE
          </span>
        )
      case 'EN_COCINA':
        return (
          <span className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded font-semibold">
            <CookingPot size={12} className="animate-bounce" />
            EN COCINA
          </span>
        )
      case 'LISTO':
        return (
          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded font-semibold">
            <CheckCircle size={12} />
            LISTO
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Monitor de Cocina</h1>
          <p className="text-gray-400 text-sm mt-1">Órdenes activas en preparación y despacho</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/5 hover:bg-white/10 text-white cursor-pointer transition-all"
        >
          <ArrowsClockwise size={16} />
          Actualizar
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh] glass-panel double-bezel rounded-2xl">
          <CookingPot size={64} className="text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Sin pedidos activos</h3>
          <p className="text-gray-400 max-w-sm">No hay comandas pendientes de preparación en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => {
            const details = detailsMap[order.idPedido!] || []
            return (
              <div
                key={order.idPedido}
                className={`glass-panel double-bezel rounded-xl flex flex-col justify-between overflow-hidden border-t-4 text-left ${order.estado === 'PENDIENTE' ? 'border-t-orange-500' : order.estado === 'EN_COCINA' ? 'border-t-purple-500' : 'border-t-green-500'}`}
              >
                {/* Header */}
                <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold text-sm m-0">Comanda #{order.idPedido}</h4>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Mesero: {order.empleado?.nombre}
                    </span>
                  </div>
                  {getStatusBadge(order.estado)}
                </div>

                {/* Items */}
                <div className="p-4 flex-1 space-y-3 min-h-[140px]">
                  {details.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">Cargando detalles...</p>
                  ) : (
                    details.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                        <div className="space-y-0.5">
                          <span className="text-white font-semibold block">
                            {item.producto?.nombre || item.combo?.nombre}
                          </span>
                          {item.observacion && (
                            <span className="text-[10px] text-orange-300 font-medium italic block bg-orange-950/20 border border-orange-500/10 px-1.5 py-0.5 rounded w-fit">
                              Nota: {item.observacion}
                            </span>
                          )}
                        </div>
                        <span className="text-purple-400 font-bold bg-purple-950/30 px-2 py-0.5 rounded">
                          x{item.cantidad}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-white/5 border-t border-white/5">
                  {order.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => handleUpdateStatus(order.idPedido!, 'PENDIENTE')}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CookerIcon size={16} />
                      Iniciar Preparación
                    </button>
                  )}
                  {order.estado === 'EN_COCINA' && (
                    <button
                      onClick={() => handleUpdateStatus(order.idPedido!, 'EN_COCINA')}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Check size={16} />
                      Marcar como Listo
                    </button>
                  )}
                  {order.estado === 'LISTO' && (
                    <button
                      onClick={() => handleUpdateStatus(order.idPedido!, 'LISTO')}
                      className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Check size={16} />
                      Despachar Pedido
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
