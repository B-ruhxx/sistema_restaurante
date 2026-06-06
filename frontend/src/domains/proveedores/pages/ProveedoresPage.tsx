import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { Proveedor } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { Plus, Pencil, Trash } from '@phosphor-icons/react'

export const ProveedoresPage: React.FC = () => {
  const [providers, setProviders] = useState<Proveedor[]>([])
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
      const provs = await api.get<Proveedor[]>('/api/v1/proveedores')
      setProviders(provs)
    } catch (e) {
      console.error('Error loading providers catalogs', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este proveedor?')) return
    try {
      await api.delete(`/api/v1/proveedores/${id}`)
      loadData()
    } catch (e: any) {
      alert(e.message || 'Error al eliminar')
    }
  }

  const handleOpenAdd = () => {
    setEditId(null)
    setFormFields({
      razonSocial: '',
      nombreComercial: '',
      ruc: '',
      telefono: '',
      email: '',
      direccion: '',
      contactoPrincipal: '',
      estado: 'ACTIVO'
    })
    setShowModal(true)
  }

  const handleOpenEdit = (item: Proveedor) => {
    setEditId(item.idProveedor!)
    setFormFields({
      ...item
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const path = '/api/v1/proveedores' + (editId ? `/${editId}` : '')
      const method = editId ? 'PUT' : 'POST'

      if (method === 'POST') {
        await api.post(path, formFields)
      } else {
        await api.put(path, formFields)
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

  const filteredProviders = providers.filter(p => 
    p.razonSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.nombreComercial && p.nombreComercial.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.ruc && p.ruc.includes(searchQuery))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Registro de Proveedores
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
            Gestione las empresas proveedoras de insumos, verduras, carnes y bebidas
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary flex items-center gap-1.5 shadow-lg"
        >
          <Plus size={16} />
          Nuevo Proveedor
        </button>
      </div>

      {/* Filter and Search */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center" style={{ background: 'var(--color-surface)' }}>
        <input
          type="text"
          className="erp-input w-full md:w-80 text-sm"
          placeholder="Buscar proveedor por razón social o RUC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Providers Table */}
      <div className="card overflow-hidden text-left border-default" style={{ background: 'var(--color-surface)' }}>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Razón Social</th>
                <th>RUC</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    No se encontraron proveedores
                  </td>
                </tr>
              ) : (
                filteredProviders.map(prov => (
                  <tr key={prov.idProveedor}>
                    <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{prov.idProveedor}</td>
                    <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {prov.razonSocial}
                      {prov.nombreComercial && (
                        <span className="text-[10px] block font-normal text-muted-color">Comercial: {prov.nombreComercial}</span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{prov.ruc}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }} className="text-xs">
                      <span className="block font-medium">{prov.contactoPrincipal || 'Sin contacto'}</span>
                      <span className="block">{prov.telefono || 'Sin teléfono'} - {prov.email || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`badge ${prov.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}`}>
                        {prov.estado}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(prov)}
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(prov.idProveedor!)}
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
        title={editId ? 'Modificar Proveedor' : 'Añadir Nuevo Proveedor'}
        maxWidth="500px"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Razón Social</label>
            <input
              type="text"
              required
              className="erp-input w-full text-xs"
              value={formFields.razonSocial || ''}
              onChange={(e) => updateField('razonSocial', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Nombre Comercial</label>
              <input
                type="text"
                className="erp-input w-full text-xs"
                value={formFields.nombreComercial || ''}
                onChange={(e) => updateField('nombreComercial', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>RUC</label>
              <input
                type="text"
                required
                className="erp-input w-full text-xs"
                value={formFields.ruc || ''}
                onChange={(e) => updateField('ruc', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Contacto Principal</label>
              <input
                type="text"
                className="erp-input w-full text-xs"
                value={formFields.contactoPrincipal || ''}
                onChange={(e) => updateField('contactoPrincipal', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Teléfono</label>
              <input
                type="text"
                className="erp-input w-full text-xs"
                value={formFields.telefono || ''}
                onChange={(e) => updateField('telefono', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input
              type="email"
              className="erp-input w-full text-xs"
              value={formFields.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Dirección</label>
            <input
              type="text"
              className="erp-input w-full text-xs"
              value={formFields.direccion || ''}
              onChange={(e) => updateField('direccion', e.target.value)}
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
