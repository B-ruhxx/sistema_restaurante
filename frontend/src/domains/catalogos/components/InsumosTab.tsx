import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { Insumo } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { Plus, Pencil, Trash, Package } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'
import { Button } from '../../../components/Ui/Button'
import { Input } from '../../../components/Ui/Input'

export const InsumosTab: React.FC = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([])
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
      const ins = await api.get<Insumo[]>('/api/v1/insumos')
      setInsumos(ins)
    } catch (e) {
      console.error('Error loading insumos catalogs', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este insumo?')) return
    try {
      await api.delete(`/api/v1/insumos/${id}`)
      loadData()
    } catch (e: any) {
      alert(e.message || 'Error al eliminar')
    }
  }

  const handleOpenAdd = () => {
    setEditId(null)
    setFormFields({
      nombre: '',
      unidad: 'KG',
      stock: '0',
      stockMinimo: '5',
      estado: 'ACTIVO'
    })
    setShowModal(true)
  }

  const handleOpenEdit = (item: Insumo) => {
    setEditId(item.idInsumo!)
    setFormFields({
      ...item
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const path = '/api/v1/insumos' + (editId ? `/${editId}` : '')
      const method = editId ? 'PUT' : 'POST'

      const payload = {
        ...formFields,
        stock: parseFloat(formFields.stock || '0'),
        stockMinimo: parseFloat(formFields.stockMinimo || '0')
      }

      if (method === 'POST') {
        await api.post(path, payload)
      } else {
        await api.put(path, payload)
      }

      setShowModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Error al guardar los datos')
    }
  }

  const updateField = (key: string, val: any) => {
    setFormFields(prev => ({ ...prev, [key]: val }))
  }

  const filteredInsumos = insumos.filter(i =>
    i.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Catálogo de Insumos / Ingredientes
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }} className="m-0 mt-1">
            Gestione las materias primas utilizadas para la preparación de los platos y bebidas
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5"
        >
          <Plus size={16} />
          Nuevo Insumo
        </Button>
      </div>

      {/* Filter and Search */}
      <Card padded={true} hoverable={false} className="flex flex-col md:flex-row gap-4 justify-between items-center text-left">
        <Input
          type="text"
          className="w-full md:w-80 text-sm"
          placeholder="Buscar insumo por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Insumos Grid — Adaptado a .catalog-grid para consistencia visual */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 p-6">
        {filteredInsumos.length === 0 ? (
          <div className="col-span-full card p-12 text-center" style={{ background: 'var(--color-surface)' }}>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">
              No se encontraron insumos
            </p>
          </div>
        ) : (
          filteredInsumos.map(ins => (
            <Card
              key={ins.idInsumo}
              padded={true}
              hoverable={true}
              className="card-hover h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>ID: {ins.idInsumo}</span>
                  <span className={`badge ${ins.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}`}>
                    {ins.estado}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <div className="p-2.5 badge badge-neutral rounded-xl flex items-center justify-center shrink-0">
                    <Package size={22} weight="duotone" className="text-gray-500" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold m-0 line-clamp-1" style={{ color: 'var(--text-primary)' }} title={ins.nombre}>
                      {ins.nombre}
                    </h3>
                    <span className="text-xs text-gray-400 block mt-0.5">Medida: {ins.unidad}</span>
                  </div>
                </div>

                {/* Details / Stock Info — Cuadro interno refinado */}
                <div className="mt-4 space-y-2.5 p-3 rounded-xl border-default text-left" style={{ background: 'var(--color-surface-2)' }}>
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>Stock Actual:</span>
                    <span className={`badge ${ins.stock === 0
                        ? 'badge-danger'
                        : ins.stock <= ins.stockMinimo
                          ? 'badge-warning'
                          : 'badge-success'
                      } px-2.5 py-0.5 font-bold`}>
                      {ins.stock} {ins.unidad}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>Stock Mínimo:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ins.stockMinimo} {ins.unidad}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Costo Promedio:</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--color-primary)' }}>
                      S/. {ins.costoPromedio?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Actions Footer — Espaciado ergonómico */}
              <div className="flex gap-2.5 pt-4 mt-auto">
                <Button
                  onClick={() => handleOpenEdit(ins)}
                  variant="secondary"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1.5 border-default"
                  title="Editar"
                >
                  <Pencil size={14} />
                  <span>Editar</span>
                </Button>
                <Button
                  onClick={() => handleDelete(ins.idInsumo!)}
                  variant="danger"
                  size="sm"
                  iconOnly={true}
                  title="Desactivar"
                >
                  <Trash size={14} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Modificar Insumo' : 'Añadir Nuevo Insumo'}
        maxWidth="450px"
      >
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <Input
            label="Nombre del Insumo"
            type="text"
            required
            value={formFields.nombre || ''}
            onChange={(e) => updateField('nombre', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unidad de Medida"
              type="text"
              required
              placeholder="Ej. KG, LITROS, UNIDAD"
              value={formFields.unidad || ''}
              onChange={(e) => updateField('unidad', e.target.value)}
            />
            <Input
              label="Stock Mínimo (Alerta)"
              type="number"
              step="0.01"
              required
              value={formFields.stockMinimo || ''}
              onChange={(e) => updateField('stockMinimo', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock Inicial"
              type="number"
              step="0.01"
              required
              disabled={editId !== null}
              value={formFields.stock || ''}
              onChange={(e) => updateField('stock', e.target.value)}
            />
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Estado</label>
              <select
                className="erp-select w-full text-xs"
                value={formFields.estado || 'ACTIVO'}
                onChange={(e) => updateField('estado', e.target.value)}
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <Button
              type="button"
              onClick={() => setShowModal(false)}
              variant="ghost"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
            >
              Guardar Registro
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}