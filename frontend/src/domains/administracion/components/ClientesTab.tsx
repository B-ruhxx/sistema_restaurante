import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { Cliente } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { Plus, Pencil, Trash } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'
import { Button } from '../../../components/Ui/Button'
import { Input } from '../../../components/Ui/Input'

export const ClientesTab: React.FC = () => {
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
          <h2 className="text-xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Base de Clientes
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }} className="m-0 mt-1">
            Gestione la información de sus clientes, documentos para facturación y datos de contacto
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5"
        >
          <Plus size={16} />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filter and Search */}
      <Card padded={true} hoverable={false} className="flex flex-col md:flex-row gap-4 justify-between items-center text-left">
        <Input
          type="text"
          className="w-full md:w-80 text-sm"
          placeholder="Buscar cliente por nombre o documento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Clients Table */}
      <Card padded={false} hoverable={false} className="overflow-hidden text-left border-default">
        <div className="overflow-x-auto">
          <table className="erp-table text-xs">
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
                        <Button
                          onClick={() => handleOpenEdit(cl)}
                          variant="secondary"
                          size="sm"
                          iconOnly={true}
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          onClick={() => handleDelete(cl.idCliente!)}
                          variant="danger"
                          size="sm"
                          iconOnly={true}
                          title="Desactivar"
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Modificar Cliente' : 'Añadir Nuevo Cliente'}
        maxWidth="500px"
      >
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Nombre"
              type="text"
              required
              value={formFields.nombre || ''}
              onChange={(e) => updateField('nombre', e.target.value)}
            />
            <Input
              label="Apellido"
              type="text"
              required
              value={formFields.apellido || ''}
              onChange={(e) => updateField('apellido', e.target.value)}
            />
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
            <Input
              label="Documento Identidad"
              type="text"
              required
              value={formFields.documentoIdentidad || ''}
              onChange={(e) => updateField('documentoIdentidad', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Teléfono"
              type="text"
              value={formFields.telefono || ''}
              onChange={(e) => updateField('telefono', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={formFields.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
          <Input
            label="Dirección"
            type="text"
            value={formFields.direccion || ''}
            onChange={(e) => updateField('direccion', e.target.value)}
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
