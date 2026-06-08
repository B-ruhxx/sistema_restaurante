import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { Proveedor } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { Plus, Pencil, Trash } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'
import { Button } from '../../../components/Ui/Button'
import { Input } from '../../../components/Ui/Input'

export const ProveedoresTab: React.FC = () => {
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
          <h2 className="text-xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Registro de Proveedores
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }} className="m-0 mt-1">
            Gestione las empresas proveedoras de insumos, verduras, carnes y bebidas
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5"
        >
          <Plus size={16} />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Filter and Search */}
      <Card padded={true} hoverable={false} className="flex flex-col md:flex-row gap-4 justify-between items-center text-left">
        <Input
          type="text"
          className="w-full md:w-80 text-sm"
          placeholder="Buscar proveedor por razón social o RUC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Providers Table */}
      <Card padded={false} hoverable={false} className="overflow-hidden text-left border-default">
        <div className="overflow-x-auto">
          <table className="erp-table text-xs">
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
                        <Button
                          onClick={() => handleOpenEdit(prov)}
                          variant="secondary"
                          size="sm"
                          iconOnly={true}
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          onClick={() => handleDelete(prov.idProveedor!)}
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
        title={editId ? 'Modificar Proveedor' : 'Añadir Nuevo Proveedor'}
        maxWidth="500px"
      >
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <Input
            label="Razón Social"
            type="text"
            required
            value={formFields.razonSocial || ''}
            onChange={(e) => updateField('razonSocial', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Nombre Comercial"
              type="text"
              value={formFields.nombreComercial || ''}
              onChange={(e) => updateField('nombreComercial', e.target.value)}
            />
            <Input
              label="RUC"
              type="text"
              required
              value={formFields.ruc || ''}
              onChange={(e) => updateField('ruc', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Contacto Principal"
              type="text"
              value={formFields.contactoPrincipal || ''}
              onChange={(e) => updateField('contactoPrincipal', e.target.value)}
            />
            <Input
              label="Teléfono"
              type="text"
              value={formFields.telefono || ''}
              onChange={(e) => updateField('telefono', e.target.value)}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={formFields.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
          />
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
