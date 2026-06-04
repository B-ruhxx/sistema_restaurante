import React, { useEffect, useState } from 'react'
import { useAppStore } from '../store'
import { api } from '../api'
import { Caja, MovimientoCaja } from '../types'
import { Coins, Plus, Minus, FileText, Lock, Key, CheckCircle } from '@phosphor-icons/react'

export const CajaPanel: React.FC = () => {
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
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Control de Caja</h1>
          <p className="text-gray-400 text-sm mt-1">Aperturas, arqueos y movimientos de efectivo</p>
        </div>
      </div>

      {!caja ? (
        <div className="max-w-xl mx-auto glass-panel double-bezel rounded-2xl p-8 text-left mt-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Key size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-0">Apertura de Caja Obligatoria</h2>
              <p className="text-gray-400 text-sm">Debes abrir caja para poder registrar ventas y facturar.</p>
            </div>
          </div>

          <form onSubmit={handleOpenCaja} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Monto de Apertura (Efectivo inicial)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 font-semibold">S/.</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="glass-input pl-10 w-full"
                  placeholder="0.00"
                  value={openMonto}
                  onChange={(e) => setOpenMonto(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nota / Observación</label>
              <textarea
                className="glass-input w-full h-20"
                placeholder="Ej. Sencillo en monedas y billetes chicos"
                value={openObs}
                onChange={(e) => setOpenObs(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Coins size={20} />
              {loading ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Status Panel */}
          <div className="lg:col-span-1 glass-panel double-bezel rounded-2xl p-6 text-left space-y-6 h-fit">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <span className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500 dot-green"></span>
                CAJA ABIERTA
              </span>
              <span className="text-gray-400 text-xs">Turno #{caja.idCaja}</span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-400 block mb-0.5">Responsable</span>
                <span className="text-white font-medium">{caja.empleado?.nombre} {caja.empleado?.apellido}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Apertura</span>
                  <span className="text-gray-200 text-sm">
                    {caja.fechaApertura ? new Date(caja.fechaApertura).toLocaleTimeString() : 'Recién abierto'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Monto Inicial</span>
                  <span className="text-gray-200 text-sm font-semibold">S/. {caja.montoApertura.toFixed(2)}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <span className="text-xs text-gray-400 block mb-1">Monto en Caja (Sistema)</span>
                <span className="text-3xl font-bold text-white tracking-tight">
                  S/. {caja.montoSistema?.toFixed(2) || caja.montoApertura.toFixed(2)}
                </span>
                <p className="text-[11px] text-gray-400 mt-1">Calculado por: Apertura + Ingresos - Egresos + Ventas en Efectivo</p>
              </div>
            </div>

            {!closing ? (
              <button
                onClick={() => setClosing(true)}
                className="w-full py-3 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Lock size={18} />
                Cerrar Caja (Arqueo)
              </button>
            ) : (
              <form onSubmit={handleCloseCaja} className="space-y-4 pt-4 border-t border-white/5 bg-white/5 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">Arqueo de Cierre</span>
                  <button type="button" onClick={() => setClosing(false)} className="text-xs text-gray-400 hover:text-white">Cancelar</button>
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Efectivo Real en Caja</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="glass-input w-full text-sm"
                    placeholder="Contar efectivo"
                    value={closeMonto}
                    onChange={(e) => setCloseMonto(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Observación del cierre</label>
                  <textarea
                    className="glass-input w-full text-xs h-16"
                    placeholder="Sobrantes, faltantes o incidencias..."
                    value={closeObs}
                    onChange={(e) => setCloseObs(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  {loading ? 'Cerrando...' : 'Confirmar Cierre y Arqueo'}
                </button>
              </form>
            )}
          </div>

          {/* Add Movement & Log list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Adjustment */}
            <div className="glass-panel double-bezel rounded-2xl p-6 text-left">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Coins size={22} className="text-purple-400" />
                Registrar Movimiento Extra (Ingresos / Egresos)
              </h3>
              <form onSubmit={handleAddMovement} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Tipo</label>
                  <select
                    className="glass-input w-full text-sm py-2 bg-[#0f111a]"
                    value={moveTipo}
                    onChange={(e) => setMoveTipo(e.target.value as 'INGRESO' | 'EGRESO')}
                  >
                    <option value="INGRESO">Ingreso (Entrada)</option>
                    <option value="EGRESO">Egreso (Salida)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1.5">Concepto</label>
                  <input
                    type="text"
                    required
                    className="glass-input w-full text-sm"
                    placeholder="Ej. Pago a proveedor de verduras"
                    value={moveConcepto}
                    onChange={(e) => setMoveConcepto(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Monto (S/.)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="glass-input w-full text-sm"
                      placeholder="0.00"
                      value={moveMonto}
                      onChange={(e) => setMoveMonto(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg cursor-pointer"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* List of movements */}
            <div className="glass-panel double-bezel rounded-2xl p-6 text-left">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText size={22} className="text-purple-400" />
                Historial de Movimientos de Caja
              </h3>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {movements.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No hay movimientos registrados en este turno.</p>
                ) : (
                  movements.map((move) => (
                    <div
                      key={move.idMovimiento}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${move.tipo === 'INGRESO' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {move.tipo === 'INGRESO' ? <Plus size={16} /> : <Minus size={16} />}
                        </div>
                        <div>
                          <p className="text-white font-medium m-0">{move.concepto}</p>
                          <span className="text-[10px] text-gray-400">
                            {move.fecha ? new Date(move.fecha).toLocaleTimeString() : 'Recién registrado'}
                          </span>
                        </div>
                      </div>
                      <span className={`font-semibold ${move.tipo === 'INGRESO' ? 'text-green-400' : 'text-red-400'}`}>
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
