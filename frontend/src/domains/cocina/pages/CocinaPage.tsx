import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { Pedido, DetallePedido } from '../../../shared/types'
import { Clock, Check, CookingPot, Hourglass, CheckCircle, ArrowsClockwise } from '@phosphor-icons/react'

export const CocinaPage: React.FC = () => {
  const [orders, setOrders] = useState<Pedido[]>([])
  const [detailsMap, setDetailsMap] = useState<Record<number, DetallePedido[]>>({})

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
          <span className="badge badge-warning flex items-center gap-1">
            <Hourglass size={12} className="animate-pulse" />
            PENDIENTE
          </span>
        )
      case 'EN_COCINA':
        return (
          <span className="badge badge-primary flex items-center gap-1">
            <CookingPot size={12} className="animate-bounce" />
            EN COCINA
          </span>
        )
      case 'LISTO':
        return (
          <span className="badge badge-success flex items-center gap-1">
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
          <h1 className="text-3xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Monitor de Cocina
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
            Órdenes activas en preparación y despacho
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="btn btn-secondary btn-sm flex items-center gap-2"
        >
          <ArrowsClockwise size={16} />
          Actualizar
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh] card border-default max-w-lg mx-auto">
          <CookingPot size={64} style={{ color: 'var(--text-muted)' }} className="mb-4" />
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sin pedidos activos</h3>
          <p style={{ color: 'var(--text-secondary)' }} className="max-w-sm">
            No hay comandas pendientes de preparación en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => {
            const details = detailsMap[order.idPedido!] || []
            let borderColor = 'var(--color-warning)'
            if (order.estado === 'EN_COCINA') borderColor = 'var(--color-primary)'
            if (order.estado === 'LISTO') borderColor = 'var(--color-success)'

            return (
              <div
                key={order.idPedido}
                className="card flex flex-col justify-between overflow-hidden text-left border-default"
                style={{
                  background: 'var(--color-surface)',
                  borderTop: `4px solid ${borderColor}`
                }}
              >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--color-surface-2)' }}>
                  <div>
                    <h4 className="font-bold text-sm m-0" style={{ color: 'var(--text-primary)' }}>
                      Comanda #{order.idPedido}
                    </h4>
                    <span className="text-[10px] block mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Mesero: {order.empleado?.nombre}
                    </span>
                  </div>
                  {getStatusBadge(order.estado)}
                </div>

                {/* Items */}
                <div className="p-4 flex-1 space-y-3 min-h-[140px]">
                  {details.length === 0 ? (
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Cargando detalles...</p>
                  ) : (
                    details.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="space-y-0.5">
                          <span className="font-semibold block" style={{ color: 'var(--text-primary)' }}>
                            {item.producto?.nombre || item.combo?.nombre}
                          </span>
                          {item.observacion && (
                            <span
                              className="text-[10px] font-medium italic block px-1.5 py-0.5 rounded w-fit border"
                              style={{
                                color: 'hsl(45, 80%, 30%)',
                                background: 'var(--color-warning-light)',
                                borderColor: 'hsla(45, 95%, 50%, 0.2)'
                              }}
                            >
                              Nota: {item.observacion}
                            </span>
                          )}
                        </div>
                        <span className="badge badge-primary">
                          x{item.cantidad}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  {order.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => handleUpdateStatus(order.idPedido!, 'PENDIENTE')}
                      className="w-full btn btn-primary text-xs flex items-center justify-center gap-1.5"
                      style={{ background: 'var(--color-warning)', color: 'white', boxShadow: 'none' }}
                    >
                      <CookingPot size={16} />
                      Iniciar Preparación
                    </button>
                  )}
                  {order.estado === 'EN_COCINA' && (
                    <button
                      onClick={() => handleUpdateStatus(order.idPedido!, 'EN_COCINA')}
                      className="w-full btn btn-primary text-xs flex items-center justify-center gap-1.5"
                    >
                      <Check size={16} />
                      Marcar como Listo
                    </button>
                  )}
                  {order.estado === 'LISTO' && (
                    <button
                      onClick={() => handleUpdateStatus(order.idPedido!, 'LISTO')}
                      className="w-full btn text-xs flex items-center justify-center gap-1.5"
                      style={{ background: 'var(--color-success)', color: 'white' }}
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
