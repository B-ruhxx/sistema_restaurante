import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { Categoria, Producto, Insumo, ComboProducto, Proveedor, Cliente } from '../types'
import { Plus, Pencil, Trash, Tag, CookingPot, Package, Calendar, Users, Storefront } from '@phosphor-icons/react'

type CatalogTab = 'PRODUCTS' | 'INSUMOS' | 'CATEGORIES' | 'COMBOS' | 'PROVIDERS' | 'CLIENTS'

export const Catalogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CatalogTab>('PRODUCTS')

  // Lists state
  const [categories, setCategories] = useState<Categoria[]>([])
  const [products, setProducts] = useState<Producto[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [combos, setCombos] = useState<ComboProducto[]>([])
  const [providers, setProviders] = useState<Proveedor[]>([])
  const [clients, setClients] = useState<Cliente[]>([])

  // Modal controls
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // Dynamic form state
  const [formFields, setFormFields] = useState<Record<string, any>>({})

  const loadCatalogData = async () => {
    try {
      const [cats, prods, ins, coms, provs, cls] = await Promise.all([
        api.get<Categoria[]>('/api/v1/categorias'),
        api.get<Producto[]>('/api/v1/productos'),
        api.get<Insumo[]>('/api/v1/insumos'),
        api.get<ComboProducto[]>('/api/v1/combos'),
        api.get<Proveedor[]>('/api/v1/proveedores'),
        api.get<Cliente[]>('/api/v1/clientes')
      ])
      setCategories(cats)
      setProducts(prods)
      setInsumos(ins)
      setCombos(coms)
      setProviders(provs)
      setClients(cls)
    } catch (e) {
      console.error('Error loading catalogs', e)
    }
  }

  useEffect(() => {
    loadCatalogData()
  }, [])

  // CRUD Delete (soft disable)
  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este registro?')) return
    try {
      let path = ''
      if (activeTab === 'PRODUCTS') path = `/api/v1/productos/${id}`
      else if (activeTab === 'INSUMOS') path = `/api/v1/insumos/${id}`
      else if (activeTab === 'CATEGORIES') path = `/api/v1/categorias/${id}`
      else if (activeTab === 'COMBOS') path = `/api/v1/combos/${id}`
      else if (activeTab === 'PROVIDERS') path = `/api/v1/proveedores/${id}`
      else if (activeTab === 'CLIENTS') path = `/api/v1/clientes/${id}`

      await api.delete(path)
      loadCatalogData()
    } catch (e: any) {
      alert(e.message || 'Error al eliminar')
    }
  }

  // Open Modal to Add
  const handleOpenAdd = () => {
    setEditId(null)
    setFormFields({})
    setShowModal(true)
  }

  // Open Modal to Edit
  const handleOpenEdit = (item: any) => {
    setEditId(item.idProducto || item.idInsumo || item.idCategoria || item.idCombo || item.idProveedor || item.idCliente)
    
    // Flatten fields for simpler form state
    const fields: Record<string, any> = { ...item }
    if (item.categoria) {
      fields.idCategoria = item.categoria.idCategoria
    }
    setFormFields(fields)
    setShowModal(true)
  }

  // Handle Form Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let path = ''
      let method: 'POST' | 'PUT' = editId ? 'PUT' : 'POST'
      
      if (activeTab === 'PRODUCTS') {
        path = '/api/v1/productos' + (editId ? `/${editId}` : '')
        // Ensure decimal parsing for product price
        formFields.precio = parseFloat(formFields.precio)
        if (!formFields.tipoProducto) formFields.tipoProducto = 'PREPARADO'
      } else if (activeTab === 'INSUMOS') {
        path = '/api/v1/insumos' + (editId ? `/${editId}` : '')
        formFields.stockMinimo = parseFloat(formFields.stockMinimo)
        formFields.stock = parseFloat(formFields.stock || '0')
      } else if (activeTab === 'CATEGORIES') {
        path = '/api/v1/categorias' + (editId ? `/${editId}` : '')
      } else if (activeTab === 'COMBOS') {
        path = '/api/v1/combos' + (editId ? `/${editId}` : '')
        formFields.precio = parseFloat(formFields.precio)
      } else if (activeTab === 'PROVIDERS') {
        path = '/api/v1/proveedores' + (editId ? `/${editId}` : '')
      } else if (activeTab === 'CLIENTS') {
        path = '/api/v1/clientes' + (editId ? `/${editId}` : '')
      }

      if (method === 'POST') {
        await api.post(path, formFields)
      } else {
        await api.put(path, formFields)
      }

      setShowModal(false)
      loadCatalogData()
    } catch (err: any) {
      alert(err.message || 'Error al guardar los datos')
    }
  }

  const updateField = (key: string, val: any) => {
    setFormFields(prev => ({ ...prev, [key]: val }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white m-0">Catálogos del Sistema</h1>
          <p className="text-gray-400 text-sm mt-1">Mantenimientos y configuraciones de tablas maestras</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-lg shadow-purple-600/35 transition-all"
        >
          <Plus size={16} />
          Nuevo Registro
        </button>
      </div>

      {/* Tabs Row */}
      <div className="glass-panel double-bezel rounded-xl p-2 flex gap-1 overflow-x-auto">
        {(
          [
            { id: 'PRODUCTS', label: 'Productos', icon: <CookingPot size={16} /> },
            { id: 'INSUMOS', label: 'Insumos / Receta', icon: <Package size={16} /> },
            { id: 'CATEGORIES', label: 'Categorías', icon: <Tag size={16} /> },
            { id: 'COMBOS', label: 'Combos / Promociones', icon: <Calendar size={16} /> },
            { id: 'PROVIDERS', label: 'Proveedores', icon: <Storefront size={16} /> },
            { id: 'CLIENTS', label: 'Clientes', icon: <Users size={16} /> }
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main List Table */}
      <div className="glass-panel double-bezel rounded-2xl overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-[11px] font-bold tracking-wider border-b border-white/5 uppercase">
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-6">Nombre / Razón Social</th>
                <th className="py-3.5 px-6">Detalles / Atributos</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeTab === 'PRODUCTS' && products.map(prod => (
                <tr key={prod.idProducto} className="hover:bg-white/5 transition-all">
                  <td className="py-4 px-6 text-gray-400 font-mono text-xs">{prod.idProducto}</td>
                  <td className="py-4 px-6 font-semibold text-white">{prod.nombre}</td>
                  <td className="py-4 px-6 text-gray-300">
                    <span className="text-xs font-medium block">Categoría: {prod.categoria?.nombre || 'Ninguna'}</span>
                    <span className="text-xs font-semibold text-purple-400">S/. {prod.precio.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Tipo: {prod.tipoProducto}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${prod.estado === 'ACTIVO' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{prod.estado}</span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => handleOpenEdit(prod)} className="p-1.5 rounded bg-white/5 text-gray-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(prod.idProducto!)} className="p-1.5 rounded bg-white/5 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"><Trash size={14} /></button>
                  </td>
                </tr>
              ))}

              {activeTab === 'INSUMOS' && insumos.map(ins => (
                <tr key={ins.idInsumo} className="hover:bg-white/5 transition-all">
                  <td className="py-4 px-6 text-gray-400 font-mono text-xs">{ins.idInsumo}</td>
                  <td className="py-4 px-6 font-semibold text-white">{ins.nombre}</td>
                  <td className="py-4 px-6 text-gray-300">
                    <span className="text-xs block">Unidad: {ins.unidad}</span>
                    <span className="text-xs block">Stock Actual: <strong className={ins.stock <= ins.stockMinimo ? 'text-red-400' : 'text-green-400'}>{ins.stock}</strong></span>
                    <span className="text-xs block">Costo Promedio: S/. {ins.costoPromedio?.toFixed(2) || '0.00'}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ins.estado === 'ACTIVO' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{ins.estado}</span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => handleOpenEdit(ins)} className="p-1.5 rounded bg-white/5 text-gray-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(ins.idInsumo!)} className="p-1.5 rounded bg-white/5 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"><Trash size={14} /></button>
                  </td>
                </tr>
              ))}

              {activeTab === 'CATEGORIES' && categories.map(cat => (
                <tr key={cat.idCategoria} className="hover:bg-white/5 transition-all">
                  <td className="py-4 px-6 text-gray-400 font-mono text-xs">{cat.idCategoria}</td>
                  <td className="py-4 px-6 font-semibold text-white">{cat.nombre}</td>
                  <td className="py-4 px-6 text-gray-300 text-xs">{cat.descripcion || 'Sin descripción'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cat.estado === 'ACTIVO' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{cat.estado}</span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => handleOpenEdit(cat)} className="p-1.5 rounded bg-white/5 text-gray-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(cat.idCategoria!)} className="p-1.5 rounded bg-white/5 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"><Trash size={14} /></button>
                  </td>
                </tr>
              ))}

              {activeTab === 'COMBOS' && combos.map(combo => (
                <tr key={combo.idCombo} className="hover:bg-white/5 transition-all">
                  <td className="py-4 px-6 text-gray-400 font-mono text-xs">{combo.idCombo}</td>
                  <td className="py-4 px-6 font-semibold text-white">{combo.nombre}</td>
                  <td className="py-4 px-6 text-gray-300 text-xs">
                    <span className="block font-medium">Precio Combo: S/. {combo.precio.toFixed(2)}</span>
                    <span className="block text-gray-400">{combo.descripcion || 'Sin descripción'}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${combo.estado === 'ACTIVO' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{combo.estado}</span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => handleOpenEdit(combo)} className="p-1.5 rounded bg-white/5 text-gray-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(combo.idCombo!)} className="p-1.5 rounded bg-white/5 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"><Trash size={14} /></button>
                  </td>
                </tr>
              ))}

              {activeTab === 'PROVIDERS' && providers.map(prov => (
                <tr key={prov.idProveedor} className="hover:bg-white/5 transition-all">
                  <td className="py-4 px-6 text-gray-400 font-mono text-xs">{prov.idProveedor}</td>
                  <td className="py-4 px-6 font-semibold text-white">
                    {prov.razonSocial}
                    <span className="text-[10px] text-gray-400 block">Comercial: {prov.nombreComercial || 'N/A'}</span>
                  </td>
                  <td className="py-4 px-6 text-gray-300 text-xs">
                    <span className="block">RUC: {prov.ruc}</span>
                    <span className="block">Contacto: {prov.contactoPrincipal || 'N/A'} ({prov.telefono || 'Sin tlf'})</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${prov.estado === 'ACTIVO' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{prov.estado}</span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => handleOpenEdit(prov)} className="p-1.5 rounded bg-white/5 text-gray-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(prov.idProveedor!)} className="p-1.5 rounded bg-white/5 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"><Trash size={14} /></button>
                  </td>
                </tr>
              ))}

              {activeTab === 'CLIENTS' && clients.map(cl => (
                <tr key={cl.idCliente} className="hover:bg-white/5 transition-all">
                  <td className="py-4 px-6 text-gray-400 font-mono text-xs">{cl.idCliente}</td>
                  <td className="py-4 px-6 font-semibold text-white">{cl.nombre} {cl.apellido}</td>
                  <td className="py-4 px-6 text-gray-300 text-xs">
                    <span className="block">{cl.tipoDocumento}: {cl.documentoIdentidad}</span>
                    <span className="block">Tel: {cl.telefono || 'Sin teléfono'} - Email: {cl.email || 'N/A'}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cl.estado === 'ACTIVO' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{cl.estado}</span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => handleOpenEdit(cl)} className="p-1.5 rounded bg-white/5 text-gray-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(cl.idCliente!)} className="p-1.5 rounded bg-white/5 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"><Trash size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel double-bezel rounded-2xl p-6 w-full max-w-md text-left">
            <h4 className="text-white font-bold text-lg mb-4">
              {editId ? 'Modificar Registro' : 'Añadir Nuevo Registro'}
            </h4>
            <form onSubmit={handleSave} className="space-y-4">
              {activeTab === 'PRODUCTS' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Nombre</label>
                    <input type="text" required className="glass-input w-full text-xs" value={formFields.nombre || ''} onChange={(e) => updateField('nombre', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Descripción</label>
                    <textarea className="glass-input w-full text-xs h-16" value={formFields.descripcion || ''} onChange={(e) => updateField('descripcion', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Precio (S/.)</label>
                      <input type="number" step="0.01" required className="glass-input w-full text-xs" value={formFields.precio || ''} onChange={(e) => updateField('precio', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Categoría</label>
                      <select className="glass-input w-full text-xs bg-[#0d0f14]" value={formFields.idCategoria || ''} onChange={(e) => updateField('idCategoria', parseInt(e.target.value))}>
                        <option value="">Elegir...</option>
                        {categories.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Tipo de Producto</label>
                    <select className="glass-input w-full text-xs bg-[#0d0f14]" value={formFields.tipoProducto || 'PREPARADO'} onChange={(e) => updateField('tipoProducto', e.target.value)}>
                      <option value="PREPARADO">Preparado (Plato cocina)</option>
                      <option value="INVENTARIO_DIRECTO">Inventario Directo (Gaseosa, etc.)</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'INSUMOS' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Nombre</label>
                    <input type="text" required className="glass-input w-full text-xs" value={formFields.nombre || ''} onChange={(e) => updateField('nombre', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Unidad</label>
                      <input type="text" required className="glass-input w-full text-xs" placeholder="Ej. KG, UNIDAD, LITROS" value={formFields.unidad || ''} onChange={(e) => updateField('unidad', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Stock Mínimo Alerta</label>
                      <input type="number" required className="glass-input w-full text-xs" value={formFields.stockMinimo || ''} onChange={(e) => updateField('stockMinimo', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'CATEGORIES' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Nombre</label>
                    <input type="text" required className="glass-input w-full text-xs" value={formFields.nombre || ''} onChange={(e) => updateField('nombre', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Descripción</label>
                    <textarea className="glass-input w-full text-xs h-16" value={formFields.descripcion || ''} onChange={(e) => updateField('descripcion', e.target.value)} />
                  </div>
                </>
              )}

              {activeTab === 'COMBOS' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Nombre</label>
                    <input type="text" required className="glass-input w-full text-xs" value={formFields.nombre || ''} onChange={(e) => updateField('nombre', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Descripción</label>
                    <textarea className="glass-input w-full text-xs h-16" value={formFields.descripcion || ''} onChange={(e) => updateField('descripcion', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Precio Combo (S/.)</label>
                    <input type="number" step="0.01" required className="glass-input w-full text-xs" value={formFields.precio || ''} onChange={(e) => updateField('precio', e.target.value)} />
                  </div>
                </>
              )}

              {activeTab === 'PROVIDERS' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Razón Social</label>
                    <input type="text" required className="glass-input w-full text-xs" value={formFields.razonSocial || ''} onChange={(e) => updateField('razonSocial', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">RUC</label>
                    <input type="text" required className="glass-input w-full text-xs" value={formFields.ruc || ''} onChange={(e) => updateField('ruc', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Contacto Principal</label>
                      <input type="text" className="glass-input w-full text-xs" value={formFields.contactoPrincipal || ''} onChange={(e) => updateField('contactoPrincipal', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Teléfono</label>
                      <input type="text" className="glass-input w-full text-xs" value={formFields.telefono || ''} onChange={(e) => updateField('telefono', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'CLIENTS' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Nombre</label>
                      <input type="text" required className="glass-input w-full text-xs" value={formFields.nombre || ''} onChange={(e) => updateField('nombre', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Apellido</label>
                      <input type="text" required className="glass-input w-full text-xs" value={formFields.apellido || ''} onChange={(e) => updateField('apellido', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Tipo Doc.</label>
                      <select className="glass-input w-full text-xs bg-[#0d0f14]" value={formFields.tipoDocumento || 'DNI'} onChange={(e) => updateField('tipoDocumento', e.target.value)}>
                        <option value="DNI">DNI</option>
                        <option value="RUC">RUC</option>
                        <option value="CE">C.E.</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Nro. Documento</label>
                      <input type="text" required className="glass-input w-full text-xs" value={formFields.documentoIdentidad || ''} onChange={(e) => updateField('documentoIdentidad', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs text-gray-300 mb-1">Estado</label>
                <select className="glass-input w-full text-xs bg-[#0d0f14]" value={formFields.estado || 'ACTIVO'} onChange={(e) => updateField('estado', e.target.value)}>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs text-gray-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold text-xs cursor-pointer shadow-lg shadow-purple-600/30">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
