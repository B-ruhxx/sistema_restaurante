import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../../store'
import { api } from '../../../shared/services/api'
import { Caja, MovimientoCaja } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { Button } from '../../../components/Ui/Button'
import { Input } from '../../../components/Ui/Input'
import { Coins, Plus, Minus, FileText, Lock, Key } from '@phosphor-icons/react'

interface CajaModalProps {
  open: boolean
  onClose: () => void
}

export const CajaModal: React.FC<CajaModalProps> = ({ open, onClose }) => {
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

  const fetchActiveCaja = async () => {
    try {
      const active = await api.get<Caja | null>('/api/v1/cajas/activa')
      if (active) {
        setCaja(active)
        fetchMovements(active.idCaja!)
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

  useEffect(() => {
    if (open) {
      fetchActiveCaja()
    }
  }, [open])

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
      onClose()
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

  return (
    <Modal open={open} onClose={onClose} title="Control de Caja Registradora" maxWidth="800px">
      <div className="p-1">
        {!caja ? (
          <div className="max-w-md mx-auto text-left py-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 badge badge-primary rounded-xl">
                <Key size={26} weight="bold" />
              </div>
              <div>
                <h3 className="text-base font-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                  Apertura de Turno / Caja
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }} className="m-0 mt-0.5">
                  Es obligatorio abrir caja para registrar transacciones y ventas en el sistema.
                </p>
              </div>
            </div>

            <form onSubmit={handleOpenCaja} className="space-y-4">
              <Input
                label="Monto de Apertura (Efectivo inicial en gaveta)"
                type="number"
                step="0.01"
                required
                value={openMonto}
                onChange={(e) => setOpenMonto(e.target.value)}
                placeholder="0.00"
              />

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Nota / Observación de Apertura
                </label>
                <textarea
                  className="erp-input w-full h-20 text-xs rounded-xl"
                  placeholder="Ej. Billetes chicos y sencillo para dar vuelto"
                  value={openObs}
                  onChange={(e) => setOpenObs(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5"
              >
                <Coins size={16} />
                {loading ? 'Procesando...' : 'Confirmar y Abrir Caja'}
              </Button>
            </form>
          </div>
        ) : (
          /* Cambiado a grid balancedado de 2 columnas (md:grid-cols-2) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">

            {/* Panel Izquierdo: Estado de Caja & Cierre */}
            <div className="space-y-4 pr-0 md:pr-4 md:border-r border-default">
              <div className="flex items-center justify-between pb-3 border-b border-default">
                <span className="badge badge-success flex items-center gap-1.5 font-bold text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  CAJA ABIERTA
                </span>
                <span style={{ color: 'var(--text-muted)' }} className="font-mono text-[10px] font-bold">
                  TURNO #{caja.idCaja}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-3 rounded-xl border-default" style={{ background: 'var(--color-surface-2)' }}>
                  <span className="text-[10px] uppercase font-bold tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                    Cajero Responsable
                  </span>
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {caja.empleado?.nombre} {caja.empleado?.apellido}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border-default">
                    <span className="text-[10px] uppercase font-bold tracking-wider block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                      Monto Inicial
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }} className="font-mono font-bold text-sm">
                      S/. {caja.montoApertura.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border-default" style={{ borderColor: 'var(--color-primary-glow)' }}>
                    <span className="text-[10px] uppercase font-bold tracking-wider block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                      Saldo Esperado
                    </span>
                    <span className="font-mono font-extrabold text-sm" style={{ color: 'var(--color-primary)' }}>
                      S/. {(caja.montoSistema ?? caja.montoApertura).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {!closing ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setClosing(true)}
                  className="w-full flex items-center justify-center gap-2 mt-4 border-default font-bold"
                  style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  <Lock size={14} weight="bold" />
                  Realizar Arqueo y Cerrar Caja
                </Button>
              ) : (
                <form onSubmit={handleCloseCaja} className="space-y-3.5 pt-3.5 border-t border-dashed p-4 rounded-xl border-default" style={{ background: 'var(--color-surface-2)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Arqueo de Efectivo Físico</span>
                    <button type="button" onClick={() => setClosing(false)} className="text-[11px] text-red-500 hover:underline font-medium">
                      Cancelar
                    </button>
                  </div>
                  <Input
                    label="Efectivo Real en Caja"
                    type="number"
                    step="0.01"
                    required
                    value={closeMonto}
                    onChange={(e) => setCloseMonto(e.target.value)}
                    placeholder="Ingrese el monto total contado"
                  />
                  <div>
                    <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Notas / Novedades del Cierre
                    </label>
                    <textarea
                      className="erp-input w-full text-xs h-16 py-2 rounded-xl"
                      placeholder="Descuadres, observaciones de billetes rotos, etc."
                      value={closeObs}
                      onChange={(e) => setCloseObs(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 font-bold"
                  >
                    {loading ? 'Procesando Cierre...' : 'Efectuar Cierre de Turno'}
                  </Button>
                </form>
              )}
            </div>

            {/* Panel Derecho: Movimientos Manuales e Historial */}
            <div className="space-y-4 flex flex-col justify-between">
              <form onSubmit={handleAddMovement} className="space-y-3 p-4 rounded-xl border-default" style={{ background: 'var(--color-surface-2)' }}>
                <h4 className="text-xs font-bold flex items-center gap-2 m-0" style={{ color: 'var(--text-primary)' }}>
                  <Coins size={16} weight="duotone" className="text-[var(--color-primary)]" />
                  Inyección / Extracción Manual de Efectivo
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider mb-1 font-bold" style={{ color: 'var(--text-muted)' }}>Tipo</label>
                    <select
                      className="erp-select w-full text-xs rounded-xl"
                      style={{ height: '38px' }}
                      value={moveTipo}
                      onChange={(e) => setMoveTipo(e.target.value as 'INGRESO' | 'EGRESO')}
                    >
                      <option value="INGRESO">🟢 INGRESO</option>
                      <option value="EGRESO">🔴 EGRESO</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Concepto / Motivo"
                      type="text"
                      required
                      style={{ height: '38px' }}
                      placeholder="Ej. Sencillo / Pago a proveedor urgente"
                      value={moveConcepto}
                      onChange={(e) => setMoveConcepto(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label="Monto Exacto (S/.)"
                      type="number"
                      step="0.01"
                      required
                      style={{ height: '38px' }}
                      placeholder="0.00"
                      value={moveMonto}
                      onChange={(e) => setMoveMonto(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    size="sm"
                    className="h-[38px] px-4 rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Plus size={14} weight="bold" /> Registrar
                  </Button>
                </div>
              </form>

              {/* Historial de Turno */}
              <div className="space-y-2 flex-1 flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <FileText size={14} /> Auditoría de Movimientos Extraordinarios
                </span>

                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1 flex-1 border-default p-2 rounded-xl" style={{ background: 'var(--color-surface)' }}>
                  {movements.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs text-center py-8 m-0">
                      No se registran movimientos manuales en este turno.
                    </p>
                  ) : (
                    movements.map((move) => (
                      <div
                        key={move.idMovimiento}
                        className="flex items-center justify-between p-2.5 rounded-xl border-default text-xs"
                        style={{ background: 'var(--color-surface-2)' }}
                      >
                        <div className="flex items-center gap-3">
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
                            <p className="font-bold m-0" style={{ color: 'var(--text-primary)' }}>{move.concepto}</p>
                            <span className="text-[10px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {move.fecha ? new Date(move.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                            </span>
                          </div>
                        </div>
                        <span
                          className="font-bold font-mono text-sm"
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
      </div>
    </Modal>
  )
}