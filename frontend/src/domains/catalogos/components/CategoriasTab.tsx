import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { Categoria } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { ImageUploader } from '../../../shared/components/images/ImageUploader'
import { getImageUrl } from '../../../shared/services/uploadApi'
import { Plus, Pencil, Trash, Tag, MagnifyingGlass, FolderOpen } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'
import { Button } from '../../../components/Ui/Button'
import { Input } from '../../../components/Ui/Input'

export const CategoriasTab: React.FC = () => {
  const [categories, setCategories] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
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
    // Nota: Idealmente reemplazar por un modal de confirmación personalizado de la UI.
    if (!window.confirm('¿Está seguro de cambiar el estado de esta categoría?')) return
    try {
      await api.delete(`/api/v1/categorias/${id}`)
      loadData()
    } catch (e: any) {
      console.error(e.message || 'Error al desactivar la categoría')
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
    setSaveLoading(true)
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
      console.error(err.message || 'Error al guardar los datos')
    } finally {
      setSaveLoading(false)
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
    <div className="space-y-5 text-left">
      {/* Header del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-black tracking-tight m-0 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FolderOpen size={22} weight="duotone" className="text-[var(--color-primary)]" />
            Categorías del Menú
          </h2>
          <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
            Estructure y gestione las clasificaciones raíz para organizar la grilla del POS y Cartas de Cocina.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 font-bold shadow-sm self-start sm:self-auto"
        >
          <Plus size={15} weight="bold" />
          Nueva Categoría
        </Button>
      </div>

      {/* Barra de Búsqueda y Herramientas */}
      <Card padded={false} hoverable={false} className="p-3 bg-[var(--color-surface)] border-default shadow-sm">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <MagnifyingGlass size={16} />
          </div>
          <input
            type="text"
            className="erp-input w-full pl-9 pr-4 text-xs h-[36px]"
            placeholder="Filtrar categorías por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Estados de Carga Completa */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-[var(--color-primary)] rounded-full mb-2"></div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sincronizando catálogo de categorías...</p>
        </div>
      ) : (
        /* Rejilla de Categorías */
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full border border-dashed border-default rounded-2xl p-16 text-center bg-[var(--color-surface)]">
              <Tag size={40} weight="duotone" className="mx-auto text-gray-300 mb-2" />
              <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium">
                No se encontraron categorías registradas que coincidan con la búsqueda.
              </p>
            </div>
          ) : (
            filteredCategories.map(cat => (
              <Card
                key={cat.idCategoria}
                padded={false}
                hoverable={true}
                className="h-full flex flex-col justify-between overflow-hidden border-default bg-[var(--color-surface)] shadow-sm rounded-2xl group transition-all"
              >
                {/* Contenedor de la Imagen */}
                <div className="relative h-40 bg-[var(--color-surface-2)] border-b border-default overflow-hidden">
                  {cat.imagenUrl || cat.imagen_url ? (
                    <img
                      src={getImageUrl(cat.imagenUrl || cat.imagen_url) || ''}
                      alt={cat.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400/70">
                      <Tag size={38} weight="duotone" />
                    </div>
                  )}

                  {/* Badge Flotante Estilizado */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase font-mono ${cat.estado === 'ACTIVO'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                      {cat.estado}
                    </span>
                  </div>
                </div>

                {/* Cuerpo de la Tarjeta */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-mono bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded border border-default text-[var(--text-muted)]">
                      ID: {cat.idCategoria}
                    </span>
                    <h3 className="text-sm font-black mt-2 line-clamp-1 text-[var(--text-primary)]" title={cat.nombre}>
                      {cat.nombre}
                    </h3>
                    <p className="text-xs mt-1 text-[var(--text-muted)] line-clamp-2 h-8 leading-relaxed">
                      {cat.descripcion || 'Sin descripción comercial asignada.'}
                    </p>
                  </div>
                </div>

                {/* Acciones de Tarjeta */}
                <div className="px-4 pb-4 pt-0 flex gap-1.5 shrink-0">
                  <Button
                    onClick={() => handleOpenEdit(cat)}
                    variant="secondary"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold h-8 bg-[var(--color-surface-2)] border-default"
                  >
                    <Pencil size={13} weight="bold" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    onClick={() => handleDelete(cat.idCategoria!)}
                    variant="danger"
                    size="sm"
                    iconOnly={true}
                    className="h-8 w-8 flex items-center justify-center p-0 shrink-0"
                    title={cat.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                  >
                    <Trash size={13} weight="bold" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal Lateral / Centrado de Guardado */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Configurar Categoría' : 'Añadir Nueva Categoría'}
        maxWidth="520px"
      >
        <form onSubmit={handleSave} className="space-y-4 text-left p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-3.5">
              <Input
                label="Nombre Comercial"
                type="text"
                required
                value={formFields.nombre || ''}
                onChange={(e) => updateField('nombre', e.target.value)}
              />
              <div>
                <label className="block text-[11px] mb-1 font-bold text-[var(--text-secondary)]">Descripción del Menú</label>
                <textarea
                  className="erp-input w-full text-xs h-20 p-2.5 resize-none"
                  placeholder="Detalles internos o notas de visualización..."
                  value={formFields.descripcion || ''}
                  onChange={(e) => updateField('descripcion', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] mb-1 font-bold text-[var(--text-secondary)]">Estado Operativo</label>
                <select
                  className="erp-select w-full text-xs rounded-xl h-[38px]"
                  value={formFields.estado || 'ACTIVO'}
                  onChange={(e) => updateField('estado', e.target.value)}
                >
                  <option value="ACTIVO">🟢 ACTIVO (Visible en POS)</option>
                  <option value="INACTIVO">🔴 INACTIVO (Oculto)</option>
                </select>
              </div>
            </div>

            {/* Selector de Imágenes Premium */}
            <div className="bg-[var(--color-surface-2)] p-3 rounded-xl border border-default">
              <ImageUploader
                label="Fotografía de Portada"
                currentUrl={formFields.imagen_url}
                onUploaded={(url) => updateField('imagen_url', url)}
                onRemove={() => updateField('imagen_url', '')}
                autoUpload={true}
              />
            </div>
          </div>

          {/* Acciones de Cierre */}
          <div className="flex gap-2 justify-end pt-3 border-t border-default">
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
              disabled={saveLoading}
              className="font-bold"
            >
              {saveLoading ? 'Guardando...' : 'Guardar Registro'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}