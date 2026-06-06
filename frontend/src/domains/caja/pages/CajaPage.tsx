import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../../store'
import { api } from '../../../shared/services/api'
import { Caja, MovimientoCaja } from '../../../shared/types'
import { Coins, Plus, Minus, FileText, Lock, Key } from '@phosphor-icons/react'

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
    fetchActiveCaja()
  }, [])

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
      // refresh active caja data (system total changes)
      fetchActiveCaja()
    } catch (err: any) {
      alert(err.message || 'Error registrando movimiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Control de Caja
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
            Aperturas, arqueos y movimientos de efectivo
          </p>
        </div>
      </div>

      {!caja ? (
        <div className="max-w-xl mx-auto card p-8 text-left mt-8 border-default" style={{ background: 'var(--color-surface)' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 badge badge-primary" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <Key size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-0" style={{ color: 'var(--text-primary)' }}>Apertura de Caja Obligatoria</h2>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Debes abrir caja para poder registrar ventas y facturar.</p>
            </div>
          </div>

          <form onSubmit={handleOpenCaja} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Monto de Apertura (Efectivo inicial)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-semibold" style={{ color: 'var(--text-muted)' }}>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 btn btn-primary font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Coins size={20} />
              {loading ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Status Panel */}
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
                  Calculado por: Apertura + Ingresos - Egresos + Ventas en Efectivo
                </p>
              </div>
            </div>

            {!closing ? (
              <button
                onClick={() => setClosing(true)}
                className="w-full py-3 btn btn-secondary flex items-center justify-center gap-2 transition-all cursor-pointer"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                <Lock size={18} />
                Cerrar Caja (Arqueo)
              </button>
            ) : (
              <form onSubmit={handleCloseCaja} className="space-y-4 pt-4 border-t p-4 rounded-xl border-default" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Arqueo de Cierre</span>
                  <button type="button" onClick={() => setClosing(false)} className="text-xs hover:underline" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-danger text-sm font-semibold transition-all cursor-pointer"
                >
                  {loading ? 'Cerrando...' : 'Confirmar Cierre y Arqueo'}
                </button>
              </form>
            )}
          </div>

          {/* Add Movement & Log list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Adjustment */}
            <div className="card p-6 text-left border-default" style={{ background: 'var(--color-surface)' }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Coins size={22} style={{ color: 'var(--color-primary)' }} />
                Registrar Movimiento Extra (Ingresos / Egresos)
              </h3>
              <form onSubmit={handleAddMovement} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>Tipo</label>
                  <select
                    className="erp-select w-full text-sm py-2"
                    value={moveTipo}
                    onChange={(e) => setMoveTipo(e.target.value as 'INGRESO' | 'EGRESO')}
                  >
                    <option value="INGRESO">Ingreso (Entrada)</option>
                    <option value="EGRESO">Egreso (Salida)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>Concepto</label>
                  <input
                    type="text"
                    required
                    className="erp-input w-full text-sm"
                    placeholder="Ej. Pago a proveedor de verduras"
                    value={moveConcepto}
                    onChange={(e) => setMoveConcepto(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>Monto (S/.)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="erp-input w-full text-sm"
                      placeholder="0.00"
                      value={moveMonto}
                      onChange={(e) => setMoveMonto(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-icon"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* List of movements */}
            <div className="card p-6 text-left border-default" style={{ background: 'var(--color-surface)' }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FileText size={22} style={{ color: 'var(--color-primary)' }} />
                Historial de Movimientos de Caja
              </h3>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {movements.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm text-center py-8">
                    No hay movimientos registrados en este turno.
                  </p>
                ) : (
                  movements.map((move) => (
                    <div
                      key={move.idMovimiento}
                      className="flex items-center justify-between p-3 rounded-lg border-default transition-all text-sm"
                      style={{ background: 'var(--color-surface-2)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            background: move.tipo === 'INGRESO' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                            color: move.tipo === 'INGRESO' ? 'var(--color-success)' : 'var(--color-danger)'
                          }}
                        >
                          {move.tipo === 'INGRESO' ? <Plus size={16} /> : <Minus size={16} />}
                        </div>
                        <div>
                          <p className="font-medium m-0" style={{ color: 'var(--text-primary)' }}>{move.concepto}</p>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {move.fecha ? new Date(move.fecha).toLocaleTimeString() : 'Recién registrado'}
                          </span>
                        </div>
                      </div>
                      <span
                        className="font-semibold"
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
  )
}
