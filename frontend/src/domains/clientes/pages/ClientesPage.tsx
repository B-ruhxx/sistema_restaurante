import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { Cliente } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { Plus, Pencil, Trash } from '@phosphor-icons/react'

export const ClientesPage: React.FC = () => {
  const [clients, setClients] = useState<Cliente[]>([])
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
      const cls = await api.get<Cliente[]>('/api/v1/clientes')
      setClients(cls)
    } catch (e) {
      console.error('Error loading clients catalogs', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este cliente?')) return
    try {
      await api.delete(`/api/v1/clientes/${id}`)
      loadData()
    } catch (e: any) {
      alert(e.message || 'Error al eliminar')
    }
  }

  const handleOpenAdd = () => {
    setEditId(null)
    setFormFields({
      nombre: '',
      apellido: '',
      tipoDocumento: 'DNI',
      documentoIdentidad: '',
      telefono: '',
      email: '',
      direccion: '',
      estado: 'ACTIVO'
    })
    setShowModal(true)
  }

  const handleOpenEdit = (item: Cliente) => {
    setEditId(item.idCliente!)
    setFormFields({
      ...item
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const path = '/api/v1/clientes' + (editId ? `/${editId}` : '')
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

  const filteredClients = clients.filter(c => 
    (c.nombre && c.nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.apellido && c.apellido.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.documentoIdentidad && c.documentoIdentidad.includes(searchQuery))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Base de Clientes
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
            Gestione la información de sus clientes, documentos para facturación y datos de contacto
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary flex items-center gap-1.5 shadow-lg"
        >
          <Plus size={16} />
          Nuevo Cliente
        </button>
      </div>

      {/* Filter and Search */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center" style={{ background: 'var(--color-surface)' }}>
        <input
          type="text"
          className="erp-input w-full md:w-80 text-sm"
          placeholder="Buscar cliente por nombre o documento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Clients Table */}
      <div className="card overflow-hidden text-left border-default" style={{ background: 'var(--color-surface)' }}>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Nombre / Cliente</th>
                <th>Documento</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                filteredClients.map(cl => (
                  <tr key={cl.idCliente}>
                    <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{cl.idCliente}</td>
                    <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{cl.nombre} {cl.apellido}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-mono text-xs">{cl.tipoDocumento}: {cl.documentoIdentidad}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }} className="text-xs">
                      <span className="block">Tel: {cl.telefono || 'Sin teléfono'}</span>
                      <span className="block">Email: {cl.email || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`badge ${cl.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}`}>
                        {cl.estado}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(cl)}
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cl.idCliente!)}
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
        title={editId ? 'Modificar Cliente' : 'Añadir Nuevo Cliente'}
        maxWidth="500px"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
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
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Apellido</label>
              <input
                type="text"
                required
                className="erp-input w-full text-xs"
                value={formFields.apellido || ''}
                onChange={(e) => updateField('apellido', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Tipo Doc.</label>
              <select
                className="erp-select w-full text-xs"
                value={formFields.tipoDocumento || 'DNI'}
                onChange={(e) => updateField('tipoDocumento', e.target.value)}
              >
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="CE">C.E.</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Documento Identidad</label>
              <input
                type="text"
                required
                className="erp-input w-full text-xs"
                value={formFields.documentoIdentidad || ''}
                onChange={(e) => updateField('documentoIdentidad', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Teléfono</label>
              <input
                type="text"
                className="erp-input w-full text-xs"
                value={formFields.telefono || ''}
                onChange={(e) => updateField('telefono', e.target.value)}
              />
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
