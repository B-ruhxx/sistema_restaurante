import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { ComboProducto } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { Plus, Pencil, Trash, Gift, MagnifyingGlass, Info } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'
import { Button } from '../../../components/Ui/Button'
import { Input } from '../../../components/Ui/Input'

export const CombosTab: React.FC = () => {
  const [combos, setCombos] = useState<ComboProducto[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal controls
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // Form state
  const [formFields, setFormFields] = useState<Record<string, any>>({})

  const loadData = async () => {
    setLoading(true)
    try {
      const coms = await api.get<ComboProducto[]>('/api/v1/combos')
      setCombos(coms)
    } catch (e) {
      console.error('Error cargando catálogo de combos', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: number) => {
    // Nota: Dejado preparado para reemplazar por un modal de confirmación visual personalizado
    const confirma = window.confirm('¿Está seguro de cambiar el estado de este combo o promoción?')
    if (!confirma) return

    try {
      await api.delete(`/api/v1/combos/${id}`)
      loadData()
    } catch (e: any) {
      console.error(e.message || 'Error al procesar baja')
    }
  }

  const handleOpenAdd = () => {
    setEditId(null)
    setFormFields({
      nombre: '',
      descripcion: '',
      precio: '',
      estado: 'ACTIVO'
    })
    setShowModal(true)
  }

  const handleOpenEdit = (item: ComboProducto) => {
    setEditId(item.idCombo!)
    setFormFields({ ...item })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const path = '/api/v1/combos' + (editId ? `/${editId}` : '')
      const isPut = !!editId

      const payload = {
        ...formFields,
        precio: parseFloat(formFields.precio)
      }

      if (!isPut) {
        await api.post(path, payload)
      } else {
        await api.put(path, payload)
      }

      setShowModal(false)
      loadData()
    } catch (err: any) {
      console.error(err.message || 'Error al persistir combo')
    }
  }

  const updateField = (key: string, val: any) => {
    setFormFields(prev => ({ ...prev, [key]: val }))
  }

  const filteredCombos = combos.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.descripcion && c.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-5 text-left">
      {/* Header Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Combos & Promociones
          </h2>
          <p style={{ color: 'var(--text-muted)' }} className="m-0 text-xs mt-0.5">
            Gestione paquetes integrados, menús ejecutivos y tarifas especiales de temporada.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 py-2 px-4 text-xs font-bold shrink-0 self-start sm:self-auto"
        >
          <Plus size={14} weight="bold" />
          Nuevo Combo Comercial
        </Button>
      </div>

      {/* Barra de Filtros Compacta */}
      <Card padded={false} hoverable={false} className="p-3 border-default bg-[var(--color-surface)] shadow-sm">
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
            <MagnifyingGlass size={16} />
          </span>
          <input
            type="text"
            className="erp-input w-full text-xs pl-9 pr-4 h-9 rounded-xl"
            placeholder="Buscar por coincidencia de nombre o contenido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Grilla de Catálogo */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 p-6">
        {filteredCombos.length === 0 ? (
          <div className="col-span-full card p-16 text-center border-default rounded-2xl bg-[var(--color-surface)]">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-2">
              <Info size={20} />
            </div>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium">
              No se localizaron paquetes de promociones bajo los criterios ingresados.
            </p>
          </div>
        ) : (
          filteredCombos.map(combo => (
            <Card
              key={combo.idCombo}
              padded={true}
              hoverable={true}
              className="card-hover h-full flex flex-col justify-between border-default bg-[var(--color-surface)] rounded-2xl p-5 shadow-sm"
            >
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-surface-2)] border border-default" style={{ color: 'var(--text-muted)' }}>
                    SKU-{combo.idCombo}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${combo.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {combo.estado}
                  </span>
                </div>

                <div className="flex items-start gap-3 mt-4">
                  <div className="p-2 w-10 h-10 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-[var(--border-color)]">
                    <Gift size={20} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black m-0 line-clamp-1 text-[var(--text-primary)]" title={combo.nombre}>
                      {combo.nombre}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5 block">Pack Cerrado</span>
                  </div>
                </div>

                <p className="text-xs mt-3 line-clamp-3 text-left leading-relaxed text-[var(--text-secondary)] min-h-[3.5rem]">
                  {combo.descripcion || 'Sin especificaciones añadidas en el descriptor.'}
                </p>

                {/* Precio Desplegado */}
                <div className="mt-4 pt-3 border-t border-dashed border-default">
                  <span className="text-[10px] uppercase font-bold tracking-wider block mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    Precio Integrado POS
                  </span>
                  <span className="text-lg font-black font-mono text-[var(--color-primary)]">
                    S/. {combo.precio.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botonera de Control Inferior */}
              <div className="flex gap-2 mt-5 pt-3 border-t border-default">
                <Button
                  onClick={() => handleOpenEdit(combo)}
                  variant="secondary"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1.5 border-default text-xs h-8 rounded-xl font-bold bg-[var(--color-surface-2)]"
                >
                  <Pencil size={13} weight="bold" />
                  <span>Configurar</span>
                </Button>
                <Button
                  onClick={() => handleDelete(combo.idCombo!)}
                  variant="danger"
                  size="sm"
                  iconOnly={true}
                  className="h-8 w-8 rounded-xl shrink-0"
                  title="Dar de baja / Activar"
                >
                  <Trash size={13} weight="bold" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Formulario Modal Estilizado */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Modificar Estructura de Combo' : 'Alta de Nuevo Combo / Oferta'}
        maxWidth="440px"
      >
        <form onSubmit={handleSave} className="space-y-4 text-left p-0.5">
          <Input
            label="Etiqueta Comercial del Combo"
            type="text"
            required
            placeholder="Ej. Combo Duo Urbano"
            value={formFields.nombre || ''}
            onChange={(e) => updateField('nombre', e.target.value)}
          />

          <div>
            <label className="block text-[11px] mb-1 font-bold text-[var(--text-secondary)]">
              Desglose de Ítems (Productos incluidos en receta/servicio)
            </label>
            <textarea
              className="erp-input w-full text-xs p-3 rounded-xl border border-default h-20 resize-none font-medium focus:outline-none"
              placeholder="Ej. Consta de 02 Bebidas personales, 01 Porción de acompañamiento y un fondo principal."
              value={formFields.descripcion || ''}
              onChange={(e) => updateField('descripcion', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio Final (S/.)"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={formFields.precio || ''}
              onChange={(e) => updateField('precio', e.target.value)}
            />
            <div>
              <label className="block text-[11px] mb-1 font-bold text-[var(--text-secondary)]">Disponibilidad Operativa</label>
              <select
                className="erp-select w-full text-xs rounded-xl h-[38px] border-default"
                value={formFields.estado || 'ACTIVO'}
                onChange={(e) => updateField('estado', e.target.value)}
              >
                <option value="ACTIVO">ACTIVO (En POS)</option>
                <option value="INACTIVO">INACTIVO (Oculto)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-default mt-6">
            <Button
              type="button"
              onClick={() => setShowModal(false)}
              variant="ghost"
              size="sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="font-bold px-4"
            >
              Guardar Registro
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}