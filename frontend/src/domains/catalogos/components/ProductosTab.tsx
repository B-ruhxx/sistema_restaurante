import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { Categoria, Producto } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { ImageUploader } from '../../../shared/components/images/ImageUploader'
import { getImageUrl } from '../../../shared/services/uploadApi'
import { Plus, Pencil, Trash, CookingPot } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'
import { Button } from '../../../components/Ui/Button'
import { Input } from '../../../components/Ui/Input'

export const ProductosTab: React.FC = () => {
  const [categories, setCategories] = useState<Categoria[]>([])
  const [products, setProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Modal controls
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // Form state
  const [formFields, setFormFields] = useState<Record<string, any>>({})

  // Variants management state
  const [showVariantsModal, setShowVariantsModal] = useState(false)
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Producto | null>(null)
  const [variantsList, setVariantsList] = useState<any[]>([])
  const [variantsLoading, setVariantsLoading] = useState(false)

  // Variant form state
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [editVariantId, setEditVariantId] = useState<number | null>(null)
  const [variantFormFields, setVariantFormFields] = useState<Record<string, any>>({})

  const [insumosList, setInsumosList] = useState<any[]>([])

  // Borrado físico y lógico
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [cats, prods, ins] = await Promise.all([
        api.get<Categoria[]>('/api/v1/categorias'),
        api.get<Producto[]>('/api/v1/productos'),
        api.get<any[]>('/api/v1/insumos')
      ])
      setCategories(cats)
      setProducts(prods)
      setInsumosList(ins.filter((i: any) => i.estado === 'ACTIVO'))
    } catch (e) {
      console.error('Error loading products catalogs', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadVariants = async (idProducto: number) => {
    setVariantsLoading(true)
    try {
      const res = await api.get<any[]>(`/api/v1/variantes/producto/${idProducto}`)
      setVariantsList(res)
    } catch (e) {
      console.error('Error loading variants', e)
    } finally {
      setVariantsLoading(false)
    }
  }

  const handleOpenVariants = (prod: Producto) => {
    setSelectedProductForVariants(prod)
    loadVariants(prod.idProducto!)
    setShowVariantsModal(true)
    setShowVariantForm(false)
  }

  const handleOpenAddVariant = () => {
    setEditVariantId(null)
    setVariantFormFields({
      nombre: '',
      descripcion: '',
      precioExtra: '0',
      estado: 'ACTIVO'
    })
    setShowVariantForm(true)
  }

  const handleOpenEditVariant = (v: any) => {
    setEditVariantId(v.idVariante)
    setVariantFormFields({
      ...v,
      precioExtra: v.precioExtra.toString()
    })
    setShowVariantForm(true)
  }

  const handleDeleteVariant = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar esta variante?')) return
    try {
      await api.delete(`/api/v1/variantes/${id}`)
      if (selectedProductForVariants) {
        loadVariants(selectedProductForVariants.idProducto!)
      }
    } catch (e: any) {
      alert(e.message || 'Error al eliminar variante')
    }
  }

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductForVariants) return
    try {
      const payload = {
        idProducto: selectedProductForVariants.idProducto,
        nombre: variantFormFields.nombre,
        descripcion: variantFormFields.descripcion,
        precioExtra: parseFloat(variantFormFields.precioExtra || '0'),
        estado: variantFormFields.estado || 'ACTIVO'
      }
      if (editVariantId) {
        await api.put(`/api/v1/variantes/${editVariantId}`, payload)
      } else {
        await api.post('/api/v1/variantes', payload)
      }
      setShowVariantForm(false)
      loadVariants(selectedProductForVariants.idProducto!)
    } catch (err: any) {
      alert(err.message || 'Error al guardar variante')
    }
  }

  const handleOpenDeleteConfirm = (id: number) => {
    setDeleteTargetId(id)
    setShowDeleteConfirmModal(true)
  }

  const handleOpenAdd = () => {
    setEditId(null)
    setFormFields({
      nombre: '',
      descripcion: '',
      precio: '',
      idCategoria: '',
      tipoProducto: 'PREPARADO',
      estado: 'ACTIVO',
      imagen_url: '',
      receta: [],
      stockInicial: '0',
      stockMinimo: '5'
    })
    setShowModal(true)
  }

  const handleOpenEdit = async (item: Producto) => {
    setEditId(item.idProducto!)
    try {
      const res = await api.get<any>(`/api/v1/productos/${item.idProducto}`)
      const prod = res.producto
      const receta = res.receta || []
      const inv = res.inventario || {}

      setFormFields({
        ...prod,
        imagen_url: prod.imagenUrl || prod.imagen_url || '',
        idCategoria: prod.categoria?.idCategoria || '',
        stockInicial: (inv.stock || 0).toString(),
        stockMinimo: (inv.stockMinimo || 5).toString(),
        receta: receta.map((r: any) => ({
          idInsumo: r.insumo.idInsumo,
          nombre: r.insumo.nombre,
          unidad: r.insumo.unidad,
          cantidad: r.cantidad
        }))
      })
    } catch (e) {
      console.error(e)
      setFormFields({
        ...item,
        imagen_url: item.imagenUrl || item.imagen_url || '',
        idCategoria: item.categoria?.idCategoria || '',
        receta: [],
        stockInicial: '0',
        stockMinimo: '5'
      })
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const path = '/api/v1/productos' + (editId ? `/${editId}` : '')
      const method = editId ? 'PUT' : 'POST'

      const payload = {
        ...formFields,
        precio: parseFloat(formFields.precio),
        imagenUrl: formFields.imagen_url,
        receta: formFields.tipoProducto === 'PREPARADO' ? (formFields.receta || []).map((r: any) => ({
          idInsumo: r.idInsumo,
          cantidad: parseFloat(r.cantidad || '0')
        })) : [],
        stockInicial: formFields.tipoProducto === 'INVENTARIO_DIRECTO' ? parseInt(formFields.stockInicial || '0') : null,
        stockMinimo: formFields.tipoProducto === 'INVENTARIO_DIRECTO' ? parseInt(formFields.stockMinimo || '5') : null
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

  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Catálogo de Productos
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }} className="m-0 mt-1">
            Gestione la lista de platos, bebidas y productos de venta directa
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5"
        >
          <Plus size={16} />
          Nuevo Producto
        </Button>
      </div>

      {/* Filter and Search */}
      <Card padded={true} hoverable={false} className="flex flex-col md:flex-row gap-4 justify-between items-center text-left">
        <Input
          type="text"
          className="w-full md:w-80 text-sm"
          placeholder="Buscar producto por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 p-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full card p-12 text-center" style={{ background: 'var(--color-surface)' }}>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">
              No se encontraron productos
            </p>
          </div>
        ) : (
          filteredProducts.map(prod => (
            <Card
              key={prod.idProducto}
              padded={false} /* Permite que la imagen toque los bordes arriba y a los lados */
              hoverable={true}
              className="card-hover h-full flex flex-col justify-between"
            >
              {/* Contenedor de Imagen Proporcional (Evita aplastamientos) */}
              <div className="card-image-container relative w-full h-44 sm:h-48 bg-[var(--color-surface-2)] overflow-hidden border-b border-default">
                {prod.imagenUrl || prod.imagen_url ? (
                  <img
                    src={getImageUrl(prod.imagenUrl || prod.imagen_url) || ''}
                    alt={prod.nombre}
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-slate-100 text-gray-400">
                    <CookingPot size={48} weight="light" className="opacity-40" />
                  </div>
                )}

                {/* Badge de Estado Absoluto */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`badge ${prod.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}`}>
                    {prod.estado}
                  </span>
                </div>
              </div>

              {/* Cuerpo de la Tarjeta — Espaciado Interno Calibrado */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    {prod.categoria?.nombre || 'Sin Categoría'}
                  </span>
                  <h3 className="text-base font-bold m-0 line-clamp-1" style={{ color: 'var(--text-primary)' }} title={prod.nombre}>
                    {prod.nombre}
                  </h3>
                  <p className="text-xs m-0 mt-1 line-clamp-2 h-8 text-left" style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {prod.descripcion || 'Sin descripción'}
                  </p>
                  <span className="text-[10px] block font-mono mt-2" style={{ color: 'var(--text-muted)' }}>
                    Tipo: {prod.tipoProducto === 'PREPARADO' ? 'Preparado' : 'Inventario Directo'}
                  </span>
                </div>

                {/* Separador y Precio */}
                <div className="flex items-center justify-between pt-3 mt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-lg font-extrabold" style={{ color: 'var(--color-primary)' }}>
                    S/. {prod.precio.toFixed(2)}
                  </span>
                  {prod.tipoProducto === 'INVENTARIO_DIRECTO' ? (
                    <span className="badge badge-neutral text-[9px]">Inv. Directo</span>
                  ) : (
                    <span className="badge badge-primary text-[9px]">Receta</span>
                  )}
                </div>
              </div>

              {/* Botones de Acción de la Tarjeta (Estandarizados y con AIRE) */}
              <div className="p-5 pt-0 flex gap-2.5 items-center justify-between mt-auto">
                <Button
                  onClick={() => handleOpenVariants(prod)}
                  variant="secondary"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-2 font-bold"
                  title="Gestionar Variantes"
                  style={{
                    background: 'var(--color-primary-light)',
                    borderColor: 'var(--color-primary-glow)',
                    color: 'var(--color-primary)'
                  }}
                >
                  <CookingPot size={14} />
                  <span>Variantes</span>
                </Button>

                <Button
                  onClick={() => handleOpenEdit(prod)}
                  variant="secondary"
                  size="sm"
                  iconOnly={true}
                  className="border-default"
                  title="Editar"
                >
                  <Pencil size={14} />
                </Button>

                <Button
                  onClick={() => handleOpenDeleteConfirm(prod.idProducto!)}
                  variant="danger"
                  size="sm"
                  iconOnly={true}
                  title="Eliminar o Desactivar"
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
        title={editId ? 'Modificar Producto' : 'Añadir Nuevo Producto'}
        maxWidth="650px"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                label="Nombre"
                type="text"
                required
                value={formFields.nombre || ''}
                onChange={(e) => updateField('nombre', e.target.value)}
              />
              <div>
                <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Descripción</label>
                <textarea
                  className="erp-input w-full text-xs h-16"
                  value={formFields.descripcion || ''}
                  onChange={(e) => updateField('descripcion', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Precio (S/.)"
                  type="number"
                  step="0.01"
                  required
                  value={formFields.precio || ''}
                  onChange={(e) => updateField('precio', e.target.value)}
                />
                <div>
                  <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Categoría</label>
                  <select
                    className="erp-select w-full text-xs"
                    value={formFields.idCategoria || ''}
                    onChange={(e) => updateField('idCategoria', e.target.value ? parseInt(e.target.value) : '')}
                  >
                    <option value="">Elegir...</option>
                    {categories.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Tipo de Producto</label>
                <select
                  className="erp-select w-full text-xs"
                  value={formFields.tipoProducto || 'PREPARADO'}
                  onChange={(e) => updateField('tipoProducto', e.target.value)}
                >
                  <option value="PREPARADO">Preparado (Plato cocina)</option>
                  <option value="INVENTARIO_DIRECTO">Inventario Directo (Gaseosa, etc.)</option>
                </select>
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

            <div className="space-y-4">
              <ImageUploader
                label="Imagen del Producto"
                currentUrl={formFields.imagen_url}
                onUploaded={(url) => updateField('imagen_url', url)}
                onRemove={() => updateField('imagen_url', '')}
                autoUpload={true}
              />

              {formFields.tipoProducto === 'INVENTARIO_DIRECTO' && (
                <Card padded={true} style={{ background: 'var(--color-surface-2)' }}>
                  <h4 className="text-xs font-bold mb-3">Control de Inventario Directo</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Stock Actual"
                      type="number"
                      required
                      value={formFields.stockInicial || '0'}
                      onChange={(e) => updateField('stockInicial', e.target.value)}
                    />
                    <Input
                      label="Stock Mínimo"
                      type="number"
                      required
                      value={formFields.stockMinimo || '5'}
                      onChange={(e) => updateField('stockMinimo', e.target.value)}
                    />
                  </div>
                </Card>
              )}
            </div>
          </div>

          {formFields.tipoProducto === 'PREPARADO' && (
            <div className="pt-4 border-t space-y-3 text-left" style={{ borderColor: 'var(--border-color)' }}>
              <h4 className="text-xs font-bold m-0">Receta / Insumos Consumidos</h4>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-[10px] text-gray-400 mb-1">Insumo</label>
                  <select
                    id="recipe-insumo-select"
                    className="erp-select w-full text-xs"
                    defaultValue=""
                  >
                    <option value="">Elegir insumo...</option>
                    {insumosList.map(ins => (
                      <option key={ins.idInsumo} value={ins.idInsumo}>
                        {ins.nombre} ({ins.unidad})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ width: '100px' }}>
                  <Input
                    label="Cantidad"
                    type="number"
                    step="0.001"
                    id="recipe-insumo-qty"
                    placeholder="0.00"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  style={{ height: '36px' }}
                  onClick={() => {
                    const selectEl = document.getElementById('recipe-insumo-select') as HTMLSelectElement
                    const qtyEl = document.getElementById('recipe-insumo-qty') as HTMLInputElement
                    if (!selectEl || !qtyEl || !selectEl.value || !qtyEl.value) return

                    const insId = parseInt(selectEl.value)
                    const qty = parseFloat(qtyEl.value)
                    if (qty <= 0) return

                    const matchedInsumo = insumosList.find(i => i.idInsumo === insId)
                    if (!matchedInsumo) return

                    const currentReceta = [...(formFields.receta || [])]
                    const existingIdx = currentReceta.findIndex(r => r.idInsumo === insId)
                    if (existingIdx > -1) {
                      currentReceta[existingIdx].cantidad = qty.toString()
                    } else {
                      currentReceta.push({
                        idInsumo: insId,
                        nombre: matchedInsumo.nombre,
                        unidad: matchedInsumo.unidad,
                        cantidad: qty.toString()
                      })
                    }
                    updateField('receta', currentReceta)
                    selectEl.value = ""
                    qtyEl.value = ""
                  }}
                >
                  Agregar
                </Button>
              </div>

              <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-color)', maxHeight: '150px', overflowY: 'auto' }}>
                <table className="erp-table text-xs">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Cantidad</th>
                      <th className="text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!formFields.receta || formFields.receta.length === 0) ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-gray-500">Sin ingredientes configurados en la receta</td>
                      </tr>
                    ) : (
                      formFields.receta.map((item: any) => (
                        <tr key={item.idInsumo}>
                          <td className="font-semibold">{item.nombre}</td>
                          <td>{item.cantidad} {item.unidad}</td>
                          <td className="text-right">
                            <button
                              type="button"
                              className="hover:opacity-80 cursor-pointer"
                              style={{ color: 'var(--color-danger)' }}
                              onClick={() => {
                                const updated = (formFields.receta || []).filter((r: any) => r.idInsumo !== item.idInsumo)
                                updateField('receta', updated)
                              }}
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowModal(false)}
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

      {/* Variants Manager Modal */}
      <Modal
        open={showVariantsModal}
        onClose={() => setShowVariantsModal(false)}
        title={`Gestionar Variantes - ${selectedProductForVariants?.nombre}`}
        maxWidth="600px"
      >
        <div className="space-y-4 text-left">
          {showVariantForm ? (
            <form onSubmit={handleSaveVariant} className="space-y-4 p-4 border rounded-xl" style={{ borderColor: 'var(--border-color)', background: 'var(--color-surface-2)' }}>
              <h4 className="text-sm font-bold m-0">
                {editVariantId ? 'Modificar Variante' : 'Añadir Variante'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  type="text"
                  required
                  placeholder="Ej. Familiar o Masa Fina"
                  value={variantFormFields.nombre || ''}
                  onChange={(e) => setVariantFormFields(prev => ({ ...prev, nombre: e.target.value }))}
                />
                <Input
                  label="Precio Adicional (S/.)"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ej. 15.00 o -10.00"
                  value={variantFormFields.precioExtra || ''}
                  onChange={(e) => setVariantFormFields(prev => ({ ...prev, precioExtra: e.target.value }))}
                />
              </div>
              <Input
                label="Descripción"
                type="text"
                placeholder="Ej. Estilo masa pan, tradicional o New York"
                value={variantFormFields.descripcion || ''}
                onChange={(e) => setVariantFormFields(prev => ({ ...prev, descripcion: e.target.value }))}
              />
              <div>
                <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Estado</label>
                <select
                  className="erp-select w-full text-xs"
                  value={variantFormFields.estado || 'ACTIVO'}
                  onChange={(e) => setVariantFormFields(prev => ({ ...prev, estado: e.target.value }))}
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setShowVariantForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                >
                  Guardar Variante
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Opciones Disponibles</span>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenAddVariant}
                className="flex items-center gap-1"
                style={{ fontSize: '11px' }}
              >
                <Plus size={12} />
                Nueva Variante
              </Button>
            </div>
          )}

          <div className="overflow-x-auto border rounded-xl" style={{ maxHeight: '250px', borderColor: 'var(--border-color)' }}>
            <table className="erp-table text-xs">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio Extra</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {variantsLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">Cargando variantes...</td>
                  </tr>
                ) : variantsList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                      Este producto no tiene variantes configuradas
                    </td>
                  </tr>
                ) : (
                  variantsList.map(v => (
                    <tr key={v.idVariante}>
                      <td className="font-semibold">
                        <span className="block" style={{ color: 'var(--text-primary)' }}>{v.nombre}</span>
                        {v.descripcion && <span className="block text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>{v.descripcion}</span>}
                      </td>
                      <td className="font-mono" style={{ color: 'var(--color-primary)' }}>
                        {v.precioExtra >= 0 ? `+ S/. ${parseFloat(v.precioExtra).toFixed(2)}` : `- S/. ${Math.abs(parseFloat(v.precioExtra)).toFixed(2)}`}
                      </td>
                      <td>
                        <span className={`badge ${v.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'} text-[9px]`}>
                          {v.estado}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            iconOnly={true}
                            onClick={() => handleOpenEditVariant(v)}
                            style={{ padding: '0.2rem' }}
                          >
                            <Pencil size={12} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            iconOnly={true}
                            onClick={() => handleDeleteVariant(v.idVariante!)}
                            style={{ padding: '0.2rem' }}
                          >
                            <Trash size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <Button
              variant="secondary"
              onClick={() => setShowVariantsModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirmModal}
        onClose={() => { setShowDeleteConfirmModal(false); setDeleteTargetId(null); }}
        title="Eliminar o Desactivar Producto"
        maxWidth="450px"
      >
        <div className="space-y-4 text-left p-1">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ¿Qué acción desea realizar para este producto?
          </p>
          <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--border-color)' }}>
            <p className="m-0 font-bold" style={{ color: 'var(--text-primary)' }}>Desactivar (Borrado Lógico):</p>
            <p className="m-0 mt-1" style={{ color: 'var(--text-secondary)' }}>
              Cambia el estado a <span className="font-semibold text-red-500">INACTIVO</span>. Se mantendrán las ventas y pedidos anteriores que contengan este producto.
            </p>
            <p className="m-0 mt-3 font-bold" style={{ color: 'var(--text-primary)' }}>Eliminar Definitivamente (Borrado Físico):</p>
            <p className="m-0 mt-1" style={{ color: 'var(--text-secondary)' }}>
              Remueve el producto permanentemente de la base de datos. Esto <span className="font-semibold">solo</span> es posible si el producto no tiene ventas, pedidos, combos ni movimientos de inventario registrados.
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t border-default">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowDeleteConfirmModal(false); setDeleteTargetId(null); }}
            >
              Cancelar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="font-bold text-red-500 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
              onClick={async () => {
                if (!deleteTargetId) return
                try {
                  await api.delete(`/api/v1/productos/${deleteTargetId}?physical=false`)
                  setShowDeleteConfirmModal(false)
                  setDeleteTargetId(null)
                  loadData()
                } catch (e: any) {
                  alert(e.message || 'Error al desactivar el producto')
                }
              }}
            >
              Desactivar
            </Button>
            <Button
              size="sm"
              className="font-bold"
              style={{ background: 'var(--color-danger)', color: 'white' }}
              onClick={async () => {
                if (!deleteTargetId) return
                try {
                  await api.delete(`/api/v1/productos/${deleteTargetId}?physical=true`)
                  setShowDeleteConfirmModal(false)
                  setDeleteTargetId(null)
                  loadData()
                } catch (e: any) {
                  alert(e.message || 'No se puede eliminar el producto físicamente porque tiene dependencias en el sistema.')
                }
              }}
            >
              Eliminar Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
