import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { Insumo } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { Plus, Pencil, Trash } from '@phosphor-icons/react'

export const InsumosPage: React.FC = () => {
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
          <h1 className="text-3xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Catálogo de Insumos / Ingredientes
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
            Gestione las materias primas utilizadas para la preparación de los platos y bebidas
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary flex items-center gap-1.5 shadow-lg"
        >
          <Plus size={16} />
          Nuevo Insumo
        </button>
      </div>

      {/* Filter and Search */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center" style={{ background: 'var(--color-surface)' }}>
        <input
          type="text"
          className="erp-input w-full md:w-80 text-sm"
          placeholder="Buscar insumo por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Insumos Table */}
      <div className="card overflow-hidden text-left border-default" style={{ background: 'var(--color-surface)' }}>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Nombre</th>
                <th>Detalles de Stock</th>
                <th>Unidad</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInsumos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    No se encontraron insumos
                  </td>
                </tr>
              ) : (
                filteredInsumos.map(ins => (
                  <tr key={ins.idInsumo}>
                    <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{ins.idInsumo}</td>
                    <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ins.nombre}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-xs block">
                        Stock Actual: <strong className={ins.stock <= ins.stockMinimo ? 'text-red-600' : 'text-green-600'}>{ins.stock}</strong>
                      </span>
                      <span className="text-xs block">Stock Mínimo: {ins.stockMinimo}</span>
                      <span className="text-[10px] block">Costo Promedio: S/. {ins.costoPromedio?.toFixed(2) || '0.00'}</span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{ins.unidad}</span>
                    </td>
                    <td>
                      <span className={`badge ${ins.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}`}>
                        {ins.estado}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(ins)}
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(ins.idInsumo!)}
                          className="btn btn-danger btn-icon btn-sm"
                          title="Desactivar"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Modificar Insumo' : 'Añadir Nuevo Insumo'}
        maxWidth="450px"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Nombre</label>
            <input
              type="text"
              required
              className="erp-input w-full text-xs"
              value={formFields.nombre || ''}
              onChange={(e) => updateField('nombre', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Unidad de Medida</label>
              <input
                type="text"
                required
                className="erp-input w-full text-xs"
                placeholder="Ej. KG, LITROS, UNIDAD"
                value={formFields.unidad || ''}
                onChange={(e) => updateField('unidad', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Stock Mínimo (Alerta)</label>
              <input
                type="number"
                step="0.01"
                required
                className="erp-input w-full text-xs"
                value={formFields.stockMinimo || ''}
                onChange={(e) => updateField('stockMinimo', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Stock Inicial</label>
              <input
                type="number"
                step="0.01"
                required
                disabled={editId !== null}
                className="erp-input w-full text-xs"
                value={formFields.stock || ''}
                onChange={(e) => updateField('stock', e.target.value)}
              />
            </div>
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
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-ghost"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Guardar Registro
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
