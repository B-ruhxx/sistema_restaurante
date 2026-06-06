import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { Categoria } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { ImageUploader } from '../../../shared/components/images/ImageUploader'
import { ImagePreview } from '../../../shared/components/images/ImagePreview'
import { Plus, Pencil, Trash } from '@phosphor-icons/react'

export const CategoriasPage: React.FC = () => {
  const [categories, setCategories] = useState<Categoria[]>([])
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
      const cats = await api.get<Categoria[]>('/api/v1/categorias')
      setCategories(cats)
    } catch (e) {
      console.error('Error loading categories catalogs', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar esta categoría?')) return
    try {
      await api.delete(`/api/v1/categorias/${id}`)
      loadData()
    } catch (e: any) {
      alert(e.message || 'Error al eliminar')
    }
  }

  const handleOpenAdd = () => {
    setEditId(null)
    setFormFields({
      nombre: '',
      descripcion: '',
      estado: 'ACTIVO',
      imagen_url: ''
    })
    setShowModal(true)
  }

  const handleOpenEdit = (item: Categoria) => {
    setEditId(item.idCategoria!)
    setFormFields({
      ...item,
      imagen_url: item.imagenUrl || item.imagen_url || ''
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const path = '/api/v1/categorias' + (editId ? `/${editId}` : '')
      const method = editId ? 'PUT' : 'POST'

      const payload = {
        ...formFields,
        imagenUrl: formFields.imagen_url
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

  const filteredCategories = categories.filter(c => 
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.descripcion && c.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Categorías de Menú
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
            Gestione las clasificaciones de platos y bebidas (Ej. Entradas, Pastas, Bebidas)
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary flex items-center gap-1.5 shadow-lg"
        >
          <Plus size={16} />
          Nueva Categoría
        </button>
      </div>

      {/* Filter and Search */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center" style={{ background: 'var(--color-surface)' }}>
        <input
          type="text"
          className="erp-input w-full md:w-80 text-sm"
          placeholder="Buscar categoría por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories Table */}
      <div className="card overflow-hidden text-left border-default" style={{ background: 'var(--color-surface)' }}>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Imagen</th>
                <th style={{ width: '80px' }}>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    No se encontraron categorías
                  </td>
                </tr>
              ) : (
                filteredCategories.map(cat => (
                  <tr key={cat.idCategoria}>
                    <td>
                      <ImagePreview src={cat.imagenUrl || cat.imagen_url} alt={cat.nombre} size="sm" allowExpand={true} />
                    </td>
                    <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{cat.idCategoria}</td>
                    <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{cat.nombre}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{cat.descripcion || 'Sin descripción'}</td>
                    <td>
                      <span className={`badge ${cat.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}`}>
                        {cat.estado}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.idCategoria!)}
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
        title={editId ? 'Modificar Categoría' : 'Añadir Nueva Categoría'}
        maxWidth="500px"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
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
              <div>
                <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Descripción</label>
                <textarea
                  className="erp-input w-full text-xs h-24"
                  value={formFields.descripcion || ''}
                  onChange={(e) => updateField('descripcion', e.target.value)}
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

            <div>
              <ImageUploader
                label="Imagen de Categoría"
                currentUrl={formFields.imagen_url}
                onUploaded={(url) => updateField('imagen_url', url)}
                onRemove={() => updateField('imagen_url', '')}
                autoUpload={true}
              />
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
