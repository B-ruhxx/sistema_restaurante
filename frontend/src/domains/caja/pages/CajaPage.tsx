import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../../store'
import { api } from '../../../shared/services/api'
import { Caja, MovimientoCaja, Pedido, Venta, MetodoPago } from '../../../shared/types'
import { Coins, Plus, Minus, FileText, Lock, Key, Receipt, CreditCard, ArrowsClockwise, Check } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'
import { Button } from '../../../components/Ui/Button'
import { Input } from '../../../components/Ui/Input'
import { Modal } from '../../../shared/components/ui/Modal'

export const CajaPage: React.FC = () => {
  const { caja, setCaja } = useAppStore()
  const [loading, setLoading] = useState(false)
  
  // Opening state
  const [openMonto, setOpenMonto] = useState('100.00')
  const [openObs, setOpenObs] = useState('Apertura de turno standard')
  
  // Closing state
  const [closeMonto, setCloseMonto] = useState('')
  const [closeObs, setCloseObs] = useState('')
  const [closing, setClosing] = useState(false)

  // Movement state
  const [movements, setMovements] = useState<MovimientoCaja[]>([])
  const [moveTipo, setMoveTipo] = useState<'INGRESO' | 'EGRESO'>('INGRESO')
  const [moveMonto, setMoveMonto] = useState('')
  const [moveConcepto, setMoveConcepto] = useState('')

  // Billing and Unpaid Orders state
  const [unpaidOrders, setUnpaidOrders] = useState<Pedido[]>([])
  const [sales, setSales] = useState<Venta[]>([])
  const [paymentMethods, setPaymentMethods] = useState<MetodoPago[]>([])
  
  // Checkout modal in Caja
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedOrderForBilling, setSelectedOrderForBilling] = useState<Pedido | null>(null)
  const [tipoComprobante, setTipoComprobante] = useState<'BOLETA' | 'FACTURA'>('BOLETA')
  const [serie, setSerie] = useState('B001')
  const [correlativo, setCorrelativo] = useState('')
  const [payments, setPayments] = useState<{ idMetodoPago: number; monto: number; numeroOperacion?: string }[]>([])
  const [orderTotal, setOrderTotal] = useState(0)
  const [orderDetails, setOrderDetails] = useState<any[]>([])

  const fetchActiveCaja = async () => {
    try {
      const active = await api.get<Caja | null>('/api/v1/cajas/activa')
      if (active) {
        setCaja(active)
        fetchMovements(active.idCaja!)
        loadBillingData()
      } else {
        setCaja(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchMovements = async (id: number) => {
    try {
      const data = await api.get<MovimientoCaja[]>(`/api/v1/cajas/${id}/movimientos`)
      setMovements(data)
    } catch (e) {
      console.error(e)
    }
  }

  const loadBillingData = async () => {
    try {
      const [pedidosRes, ventasRes, pmRes] = await Promise.all([
        api.get<Pedido[]>('/api/v1/pedidos'),
        api.get<Venta[]>('/api/v1/ventas'),
        api.get<MetodoPago[]>('/api/v1/metodo-pagos').catch(() => [])
      ])

      setSales(ventasRes)
      
      if (pmRes.length > 0) {
        setPaymentMethods(pmRes.filter(p => p.estado === 'ACTIVO'))
      } else {
        setPaymentMethods([
          { idMetodoPago: 1, nombre: 'EFECTIVO', requiereOperacion: false },
          { idMetodoPago: 2, nombre: 'TARJETA', requiereOperacion: true },
          { idMetodoPago: 3, nombre: 'YAPE/PLIN', requiereOperacion: true }
        ])
      }

      // Filter active orders that do not have a paid/active sale associated
      const activeUnpaid = pedidosRes.filter(pedido => {
        // Only orders in PENDIENTE, EN_COCINA, LISTO can be paid, or even ENTREGADO if not paid.
        if (pedido.estado === 'CANCELADO') return false
        
        // Find if there is a sale associated with this order that is PAGADA
        const isPaid = ventasRes.some(venta => 
          venta.pedido?.idPedido === pedido.idPedido && 
          venta.estado === 'PAGADA'
        )
        return !isPaid
      })

      // Sort unpaid orders: newest first
      activeUnpaid.sort((a, b) => b.idPedido! - a.idPedido!)
      setUnpaidOrders(activeUnpaid)
    } catch (e) {
      console.error('Error loading billing data in CajaPage', e)
    }
  }

  useEffect(() => {
    fetchActiveCaja()
  }, [])

  useEffect(() => {
    setSerie(tipoComprobante === 'BOLETA' ? 'B001' : 'F001')
  }, [tipoComprobante])

  const handleOpenCaja = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post<Caja>('/api/v1/cajas/abrir', {
        montoApertura: parseFloat(openMonto),
        observacion: openObs
      })
      setCaja(res)
      fetchMovements(res.idCaja!)
      loadBillingData()
    } catch (err: any) {
      alert(err.message || 'Error abriendo caja')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseCaja = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!caja) return
    setLoading(true)
    try {
      await api.post<Caja>(`/api/v1/cajas/cerrar/${caja.idCaja}`, {
        montoCierre: parseFloat(closeMonto),
        observacion: closeObs
      })
      setCaja(null)
      setClosing(false)
      setCloseMonto('')
      setCloseObs('')
      alert('Caja cerrada con éxito')
    } catch (err: any) {
      alert(err.message || 'Error cerrando caja')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!caja) return
    setLoading(true)
    try {
      const res = await api.post<MovimientoCaja>(`/api/v1/cajas/${caja.idCaja}/movimientos`, {
        tipo: moveTipo,
        monto: parseFloat(moveMonto),
        concepto: moveConcepto
      })
      setMovements((prev) => [res, ...prev])
      setMoveMonto('')
      setMoveConcepto('')
      fetchActiveCaja()
    } catch (err: any) {
      alert(err.message || 'Error registrando movimiento')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCheckout = async (order: Pedido) => {
    setLoading(true)
    try {
      // Load details to calculate total price
      const details = await api.get<any[]>(`/api/v1/pedidos/${order.idPedido}/detalles`)
      setOrderDetails(details)
      const total = details.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0)
      setOrderTotal(total)
      setSelectedOrderForBilling(order)
      
      const cashMethod = paymentMethods.find(p => p.nombre.toUpperCase() === 'EFECTIVO')
      setPayments([
        {
          idMetodoPago: cashMethod?.idMetodoPago || 1,
          monto: total
        }
      ])
      setCorrelativo(Math.floor(100000 + Math.random() * 900000).toString())
      setTipoComprobante('BOLETA')
      setShowCheckout(true)
    } catch (e: any) {
      console.error(e)
      alert('Error cargando detalles del pedido para el cobro')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessBilling = async () => {
    if (!selectedOrderForBilling) return
    setLoading(true)
    try {
      const ventaReq = {
        idPedido: selectedOrderForBilling.idPedido,
        tipoComprobante,
        serie,
        correlativo,
        pagos: payments.map(p => ({
          idMetodoPago: p.idMetodoPago,
          monto: p.monto,
          numeroOperacion: p.numeroOperacion || null
        }))
      }

      const saleRes = await api.post<Venta>('/api/v1/ventas', ventaReq)

      await api.post<Venta>(`/api/v1/ventas/${saleRes.idVenta}/pagar`, payments.map(p => ({
        idMetodoPago: p.idMetodoPago,
        monto: p.monto,
        numeroOperacion: p.numeroOperacion || null
      })))

      // Check if order needs to be delivered, or if it is already delivered. In POS ERP standard, we can mark it delivered if desired.
      // Usually, checkout marks the payment. The order itself keeps its Cocina status, but is paid.
      
      alert('Pago registrado y comprobante emitido con éxito')
      setShowCheckout(false)
      setSelectedOrderForBilling(null)
      loadBillingData()
      fetchActiveCaja()
    } catch (e: any) {
      console.error(e)
      alert(e.message || 'Error procesando el cobro de la comanda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Control de Caja y Facturación
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
            Gestión de turnos de efectivo, arqueos y cobro de comandas en tiempo real
          </p>
        </div>
      </div>

      {!caja ? (
        <Card padded={false} hoverable={false} className="max-w-xl mx-auto p-8 text-left mt-8 border-default bg-[var(--color-surface)] rounded-2xl shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 badge badge-primary" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <Key size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-0" style={{ color: 'var(--text-primary)' }}>Apertura de Caja Obligatoria</h2>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Debes abrir caja para poder registrar cobros y cuadrar cuentas.</p>
            </div>
          </div>

          <form onSubmit={handleOpenCaja} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Monto de Apertura (Efectivo inicial)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-semibold text-xs" style={{ color: 'var(--text-muted)' }}>
                  S/.
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="erp-input pl-10 w-full"
                  placeholder="0.00"
                  value={openMonto}
                  onChange={(e) => setOpenMonto(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Nota / Observación
              </label>
              <textarea
                className="erp-input w-full h-20"
                placeholder="Ej. Sencillo en monedas y billetes chicos"
                value={openObs}
                onChange={(e) => setOpenObs(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Coins size={20} />
              {loading ? 'Abriendo...' : 'Abrir Caja'}
            </Button>
          </form>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna 1: Estado de Caja y Arqueo Cierre */}
          <div className="lg:col-span-1 card p-6 text-left space-y-6 h-fit border-default" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <span className="badge badge-success flex items-center gap-1.5 font-semibold text-sm">
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)]"></span>
                CAJA ABIERTA
              </span>
              <span style={{ color: 'var(--text-muted)' }} className="text-xs">Turno #{caja.idCaja}</span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs block mb-0.5" style={{ color: 'var(--text-muted)' }}>Responsable</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {caja.empleado?.nombre} {caja.empleado?.apellido}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs block mb-0.5" style={{ color: 'var(--text-muted)' }}>Apertura</span>
                  <span style={{ color: 'var(--text-secondary)' }} className="text-sm">
                    {caja.fechaApertura ? new Date(caja.fechaApertura).toLocaleTimeString() : 'Recién abierto'}
                  </span>
                </div>
                <div>
                  <span className="text-xs block mb-0.5" style={{ color: 'var(--text-muted)' }}>Monto Inicial</span>
                  <span style={{ color: 'var(--text-secondary)' }} className="text-sm font-semibold">
                    S/. {caja.montoApertura.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Monto en Caja (Sistema)</span>
                <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
                  S/. {caja.montoSistema?.toFixed(2) || caja.montoApertura.toFixed(2)}
                </span>
                <p style={{ color: 'var(--text-muted)' }} className="text-[11px] mt-1">
                  Cálculo: Apertura + Ingresos - Egresos + Cobros Efectivo
                </p>
              </div>
            </div>

            {!closing ? (
              <Button
                variant="secondary"
                onClick={() => setClosing(true)}
                className="w-full py-3 flex items-center justify-center gap-2 transition-all"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                <Lock size={18} />
                Cerrar Caja (Arqueo)
              </Button>
            ) : (
              <form onSubmit={handleCloseCaja} className="space-y-4 pt-4 border-t p-4 rounded-xl border-default text-xs" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Arqueo de Cierre</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setClosing(false)} className="text-xs hover:underline" style={{ color: 'var(--text-secondary)' }}>Cancelar</Button>
                </div>
                <div>
                  <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Efectivo Real en Caja</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="erp-input w-full text-sm"
                    placeholder="Contar efectivo"
                    value={closeMonto}
                    onChange={(e) => setCloseMonto(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Observación del cierre</label>
                  <textarea
                    className="erp-input w-full text-xs h-16"
                    placeholder="Sobrantes, faltantes o incidencias..."
                    value={closeObs}
                    onChange={(e) => setCloseObs(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={loading}
                  className="w-full text-sm font-semibold transition-all"
                >
                  {loading ? 'Cerrando...' : 'Confirmar Cierre y Arqueo'}
                </Button>
              </form>
            )}
          </div>

          {/* Columna 2: Ventas por Cobrar (Comandas en espera de pago) */}
          <div className="lg:col-span-1 card p-6 text-left flex flex-col h-[75vh] border-default" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="text-base font-extrabold flex items-center gap-2 m-0" style={{ color: 'var(--text-primary)' }}>
                <Receipt size={22} style={{ color: 'var(--color-primary)' }} />
                Ventas por Cobrar
              </h3>
              <Button
                variant="secondary"
                size="sm"
                iconOnly={true}
                onClick={loadBillingData}
                title="Actualizar Cuentas"
                className="h-8 w-8"
              >
                <ArrowsClockwise size={14} />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {unpaidOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-gray-400">
                  <Check size={36} className="text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold">¡Todo Cobrado!</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">No hay comandas activas pendientes de pago.</p>
                </div>
              ) : (
                unpaidOrders.map(order => (
                  <div
                    key={order.idPedido}
                    className="p-3.5 rounded-xl border border-default flex flex-col justify-between space-y-3 bg-[var(--color-surface-2)] transition-all h-[135px]"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-[var(--text-primary)] block">Comanda #{order.idPedido}</span>
                        <span className="text-[10px] text-gray-500 block mt-0.5 font-medium">
                          Mesero: {order.empleado?.nombre} • {order.fecha ? new Date(order.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Recién tomado'}
                        </span>
                        {order.cliente && (
                          <span className="text-[10px] font-semibold text-[var(--color-primary)] block mt-0.5">
                            Cliente: {order.cliente.nombre} {order.cliente.apellido}
                          </span>
                        )}
                      </div>
                      <span className={`badge ${order.estado === 'LISTO' ? 'badge-success' : (order.estado === 'EN_COCINA' ? 'badge-primary' : 'badge-warning')} text-[9px] font-bold`}>
                        {order.estado}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-default">
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        S/. {order.idPedido ? sales.find(s => s.pedido?.idPedido === order.idPedido)?.total?.toFixed(2) || 'Calculando...' : 'N/A'}
                        {/* Fallback to local total check */}
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenCheckout(order)}
                        className="py-1 px-3.5 font-bold text-xs h-7 rounded-lg shadow-sm"
                      >
                        Cobrar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Columna 3: Movimientos de Caja (Ingreso/Egreso + Log list) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Quick Adjustment */}
            <div className="card p-6 text-left border-default" style={{ background: 'var(--color-surface)' }}>
              <h3 className="text-base font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Coins size={22} style={{ color: 'var(--color-primary)' }} />
                Registrar Movimiento Extra
              </h3>
              <form onSubmit={handleAddMovement} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Tipo</label>
                    <select
                      className="erp-select w-full text-xs h-[38px] rounded-xl"
                      value={moveTipo}
                      onChange={(e) => setMoveTipo(e.target.value as 'INGRESO' | 'EGRESO')}
                    >
                      <option value="INGRESO">🟢 Ingreso</option>
                      <option value="EGRESO">🔴 Egreso / Salida</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Monto (S/.)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="erp-input w-full text-xs h-[38px] rounded-xl"
                      placeholder="0.00"
                      value={moveMonto}
                      onChange={(e) => setMoveMonto(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Concepto / Detalle</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      className="erp-input w-full text-xs h-[38px] rounded-xl"
                      placeholder="Ej. Compra de limones de emergencia"
                      value={moveConcepto}
                      onChange={(e) => setMoveConcepto(e.target.value)}
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      size="sm"
                      iconOnly={true}
                      className="h-[38px] w-[38px] rounded-xl shrink-0"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* List of movements */}
            <div className="card p-6 text-left flex flex-col h-[35vh] border-default" style={{ background: 'var(--color-surface)' }}>
              <h3 className="text-base font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FileText size={22} style={{ color: 'var(--color-primary)' }} />
                Historial de Movimientos
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {movements.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs text-center py-8">
                    No hay movimientos registrados en este turno.
                  </p>
                ) : (
                  movements.map((move) => (
                    <div
                      key={move.idMovimiento}
                      className="flex items-center justify-between p-2.5 rounded-xl border-default text-xs"
                      style={{ background: 'var(--color-surface-2)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="p-1.5 rounded-lg flex items-center justify-center"
                          style={{
                            background: move.tipo === 'INGRESO' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                            color: move.tipo === 'INGRESO' ? 'var(--color-success)' : 'var(--color-danger)'
                          }}
                        >
                          {move.tipo === 'INGRESO' ? <Plus size={12} weight="bold" /> : <Minus size={12} weight="bold" />}
                        </div>
                        <div>
                          <p className="font-semibold m-0" style={{ color: 'var(--text-primary)' }}>{move.concepto}</p>
                          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                            {move.fecha ? new Date(move.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Recién registrado'}
                          </span>
                        </div>
                      </div>
                      <span
                        className="font-bold font-mono"
                        style={{ color: move.tipo === 'INGRESO' ? 'var(--color-success)' : 'var(--color-danger)' }}
                      >
                        {move.tipo === 'INGRESO' ? '+' : '-'} S/. {move.monto.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Ventana de Cobro / Checkout Modal in Caja */}
      <Modal open={showCheckout} onClose={() => { setShowCheckout(false); setSelectedOrderForBilling(null); }} title="Cobro de Comanda y Facturación" maxWidth="480px">
        <div className="space-y-4 text-left p-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-0.5">Orden a Facturar</span>
            <span className="text-sm font-black text-[var(--text-primary)]">Comanda #{selectedOrderForBilling?.idPedido}</span>
            {selectedOrderForBilling?.cliente && (
              <span className="block text-xs font-semibold text-[var(--color-primary)] mt-0.5">
                Cliente: {selectedOrderForBilling.cliente.nombre} {selectedOrderForBilling.cliente.apellido}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] mb-1 font-bold text-[var(--text-secondary)]">Comprobante</label>
              <select className="erp-select w-full text-xs rounded-xl h-[38px]" value={tipoComprobante} onChange={(e) => setTipoComprobante(e.target.value as 'BOLETA' | 'FACTURA')}>
                <option value="BOLETA">📄 Boleta electrónica</option>
                <option value="FACTURA">🏢 Factura comercial</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] mb-1 font-bold text-[var(--text-secondary)]">Serie & Correlativo</label>
              <div className="flex gap-1.5">
                <input type="text" className="erp-input w-16 text-center text-xs font-bold font-mono h-[38px]" disabled value={serie} />
                <input type="text" className="erp-input w-full text-xs font-mono h-[38px]" value={correlativo} onChange={(e) => setCorrelativo(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] mb-1.5 font-bold text-[var(--text-secondary)]">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(pm => {
                const isSelected = payments.some(p => p.idMetodoPago === pm.idMetodoPago)
                return (
                  <Button
                    key={pm.idMetodoPago}
                    type="button"
                    variant={isSelected ? 'primary' : 'secondary'}
                    onClick={() => setPayments([{ idMetodoPago: pm.idMetodoPago!, monto: orderTotal, numeroOperacion: pm.requiereOperacion ? 'OP-' + Math.floor(1000 + Math.random() * 9000) : undefined }])}
                    className="flex flex-col items-center justify-center gap-1.5 p-3.5 text-xs font-bold rounded-xl w-full border"
                    style={{
                      height: '75px',
                      background: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-color)',
                      color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                      boxShadow: 'none'
                    }}
                  >
                    <CreditCard size={18} />
                    <span>{pm.nombre}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {payments.some(p => paymentMethods.find(m => m.idMetodoPago === p.idMetodoPago)?.requiereOperacion) && (
            <Input label="Código / N° de Operación Bancaria" type="text" placeholder="Ingrese el código de Yape, Plin o Voucher" value={payments[0]?.numeroOperacion || ''} onChange={(e) => { const updated = [...payments]; updated[0].numeroOperacion = e.target.value; setPayments(updated) }} />
          )}

          {/* Desglose Fiscal Elegante */}
          <div className="p-3.5 rounded-xl border-default space-y-2 font-medium text-xs" style={{ background: 'var(--color-surface-2)' }}>
            <div className="flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span>Base Imponible</span>
              <span className="font-mono">S/. {(orderTotal / 1.18).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span>I.G.V. (18%)</span>
              <span className="font-mono">S/. {(orderTotal - (orderTotal / 1.18)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold border-t border-dashed pt-2 mt-1" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
              <span>Monto Neto Total</span>
              <span className="font-mono text-sm text-[var(--color-primary)]">S/. {orderTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-default">
            <Button variant="ghost" size="sm" onClick={() => { setShowCheckout(false); setSelectedOrderForBilling(null); }}>Atrás</Button>
            <Button variant="primary" size="sm" onClick={handleProcessBilling} disabled={loading} className="font-bold flex items-center gap-1.5 px-5">
              <Receipt size={14} weight="bold" />
              {loading ? 'Procesando Cobro...' : 'Completar Cobro y Facturar'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
