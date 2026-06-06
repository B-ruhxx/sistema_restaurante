import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { Empleado, Rol } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { AvatarUploader } from '../../../shared/components/images/AvatarUploader'
import { ImagePreview } from '../../../shared/components/images/ImagePreview'
import { uploadFile } from '../../../shared/services/uploadApi'
import { Plus, Pencil, Trash } from '@phosphor-icons/react'

export const EmpleadosPage: React.FC = () => {
  const [employees, setEmployees] = useState<Empleado[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal controls
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // Form state
  const [formFields, setFormFields] = useState<Record<string, any>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [empList, roleList] = await Promise.all([
        api.get<Empleado[]>('/api/v1/empleados'),
        api.get<Rol[]>('/api/v1/empleados/roles')
      ])
      setEmployees(empList)
      setRoles(roleList)
    } catch (e) {
      console.error('Error loading employees data', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este empleado?')) return
    try {
      await api.delete(`/api/v1/empleados/${id}`)
      loadData()
    } catch (e: any) {
      alert(e.message || 'Error al eliminar')
    }
  }

  const handleOpenAdd = () => {
    setEditId(null)
    setSelectedFile(null)
    setFormFields({
      nombre: '',
      apellido: '',
      username: '',
      passwordHash: '',
      telefono: '',
      email: '',
      idRol: '',
      estado: 'ACTIVO',
      avatar_url: ''
    })
    setShowModal(true)
  }

  const handleOpenEdit = (item: Empleado) => {
    setEditId(item.idEmpleado!)
    setSelectedFile(null)
    setFormFields({
      ...item,
      idRol: item.rol?.idRol || '',
      avatar_url: item.avatarUrl || item.avatar_url || '',
      passwordHash: '' // Clear for edit, only update if typed
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      let finalAvatarUrl = formFields.avatar_url

      // 1. Upload avatar file if selected
      if (selectedFile) {
        try {
          const uploadRes = await uploadFile(selectedFile)
          finalAvatarUrl = uploadRes.url
        } catch (err: any) {
          alert('Error al subir la foto de perfil: ' + err.message)
          setSaving(false)
          return
        }
      }

      // 2. Prepare payload
      const payload: any = {
        nombre: formFields.nombre,
        apellido: formFields.apellido,
        username: formFields.username,
        telefono: formFields.telefono,
        email: formFields.email,
        estado: formFields.estado,
        avatarUrl: finalAvatarUrl,
        avatar_url: finalAvatarUrl,
        rol: {
          idRol: parseInt(formFields.idRol)
        }
      }

      // Only include password if provided (for new employee, or updated password in edit)
      if (formFields.passwordHash) {
        payload.passwordHash = formFields.passwordHash
      }

      const path = '/api/v1/empleados' + (editId ? `/${editId}` : '')
      const method = editId ? 'PUT' : 'POST'

      if (method === 'POST') {
        if (!formFields.passwordHash) {
          alert('La contraseña es requerida para nuevos empleados.')
          setSaving(false)
          return
        }
        await api.post(path, payload)
      } else {
        await api.put(path, payload)
      }

      setShowModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Error al guardar los datos')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key: string, val: any) => {
    setFormFields(prev => ({ ...prev, [key]: val }))
  }

  const filteredEmployees = employees.filter(e => 
    (e.nombre && e.nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.apellido && e.apellido.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.username && e.username.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Gestión de Empleados
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
            Gestione las cuentas de usuario, asignación de roles y datos del personal
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary flex items-center gap-1.5 shadow-lg"
        >
          <Plus size={16} />
          Nuevo Empleado
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center" style={{ background: 'var(--color-surface)' }}>
        <input
          type="text"
          className="erp-input w-full md:w-80 text-sm"
          placeholder="Buscar empleado por nombre o usuario..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Employees Table */}
      <div className="card overflow-hidden text-left border-default" style={{ background: 'var(--color-surface)' }}>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Foto</th>
                <th style={{ width: '80px' }}>ID</th>
                <th>Nombre Completo</th>
                <th>Usuario / Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    No se encontraron empleados
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.idEmpleado}>
                    <td>
                      <ImagePreview src={emp.avatarUrl || emp.avatar_url} alt={emp.nombre} size="sm" rounded={true} allowExpand={true} />
                    </td>
                    <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{emp.idEmpleado}</td>
                    <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {emp.nombre} {emp.apellido}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <span className="block font-medium">@{emp.username}</span>
                      <span className="block text-xs">{emp.email || 'Sin correo'}</span>
                    </td>
                    <td>
                      <span className="badge badge-primary">{emp.rol?.nombre}</span>
                    </td>
                    <td>
                      <span className={`badge ${emp.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}`}>
                        {emp.estado}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.idEmpleado!)}
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
        title={editId ? 'Modificar Empleado' : 'Añadir Nuevo Empleado'}
        maxWidth="600px"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left side: Photo */}
            <div className="md:col-span-1 flex flex-col items-center justify-center border-r pr-6" style={{ borderColor: 'var(--border-color)' }}>
              <AvatarUploader
                currentUrl={formFields.avatar_url}
                onFileSelected={(file) => setSelectedFile(file)}
                onRemove={() => {
                  setSelectedFile(null)
                  updateField('avatar_url', '')
                }}
                name={formFields.nombre ? `${formFields.nombre} ${formFields.apellido || ''}` : undefined}
              />
            </div>

            {/* Right side: Form Fields */}
            <div className="md:col-span-2 space-y-4">
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
                  <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Username</label>
                  <input
                    type="text"
                    required
                    className="erp-input w-full text-xs"
                    value={formFields.username || ''}
                    onChange={(e) => updateField('username', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Rol</label>
                  <select
                    required
                    className="erp-select w-full text-xs"
                    value={formFields.idRol || ''}
                    onChange={(e) => updateField('idRol', e.target.value)}
                  >
                    <option value="">Elegir...</option>
                    {roles.map(r => <option key={r.idRol} value={r.idRol}>{r.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Contraseña {editId && '(Dejar en blanco para no modificar)'}
                </label>
                <input
                  type="password"
                  required={!editId}
                  className="erp-input w-full text-xs"
                  value={formFields.passwordHash || ''}
                  onChange={(e) => updateField('passwordHash', e.target.value)}
                />
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
                <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input
                  type="email"
                  className="erp-input w-full text-xs"
                  value={formFields.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-ghost"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
