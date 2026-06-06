import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { ConfiguracionEmpresa } from '../../../shared/types'
import { ImageUploader } from '../../../shared/components/images/ImageUploader'

export const ConfiguracionPage: React.FC = () => {
  const [config, setConfig] = useState<ConfiguracionEmpresa | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formFields, setFormFields] = useState<Record<string, any>>({})

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get<ConfiguracionEmpresa>('/api/v1/configuracion')
      setConfig(res)
      setFormFields({
        ...res,
        logo_url: res.logoUrl || res.logo_url || ''
      })
    } catch (e) {
      console.error('Error loading configuracion data', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...formFields,
        igv: parseFloat(formFields.igv),
        logoUrl: formFields.logo_url, // Map both fields
      }

      const res = await api.put<ConfiguracionEmpresa>('/api/v1/configuracion', payload)
      setConfig(res)
      setFormFields({
        ...res,
        logo_url: res.logoUrl || res.logo_url || ''
      })
      alert('Configuración guardada correctamente.')
    } catch (err: any) {
      alert(err.message || 'Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key: string, val: any) => {
    setFormFields(prev => ({ ...prev, [key]: val }))
  }

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <p style={{ color: 'var(--text-muted)' }} className="text-sm">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
          Configuración del Sistema
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
          Ajustes generales de la empresa, datos fiscales e impresión de comprobantes
        </p>
      </div>

      <form onSubmit={handleSave} className="card p-6 text-left border-default grid grid-cols-1 md:grid-cols-3 gap-6" style={{ background: 'var(--color-surface)' }}>
        {/* Left column: Logo & upload */}
        <div className="md:col-span-1 space-y-4">
          <ImageUploader
            label="Logo de la Empresa"
            currentUrl={formFields.logo_url}
            onUploaded={(url) => updateField('logo_url', url)}
            onRemove={() => updateField('logo_url', '')}
            autoUpload={true}
          />
        </div>

        {/* Right column: Form inputs */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold border-b pb-2 uppercase tracking-wider" style={{ color: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
            Datos de la Empresa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Nombre Comercial</label>
              <input
                type="text"
                required
                className="erp-input w-full text-xs"
                value={formFields.nombreEmpresa || ''}
                onChange={(e) => updateField('nombreEmpresa', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Razón Social</label>
              <input
                type="text"
                className="erp-input w-full text-xs"
                value={formFields.razonSocial || ''}
                onChange={(e) => updateField('razonSocial', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Dirección Fiscal</label>
              <input
                type="text"
                className="erp-input w-full text-xs"
                value={formFields.direccion || ''}
                onChange={(e) => updateField('direccion', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Teléfono de contacto</label>
              <input
                type="text"
                className="erp-input w-full text-xs"
                value={formFields.telefono || ''}
                onChange={(e) => updateField('telefono', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Email corporativo</label>
              <input
                type="email"
                className="erp-input w-full text-xs"
                value={formFields.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
          </div>

          <h3 className="text-sm font-bold border-b pb-2 pt-4 uppercase tracking-wider" style={{ color: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
            Configuración Fiscal & Moneda
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Símbolo Moneda</label>
              <input
                type="text"
                required
                className="erp-input w-full text-xs"
                placeholder="Ej. S/. o $"
                value={formFields.moneda || ''}
                onChange={(e) => updateField('moneda', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>IGV / Impuesto (%)</label>
              <input
                type="number"
                step="0.01"
                required
                className="erp-input w-full text-xs"
                placeholder="18.00"
                value={formFields.igv || ''}
                onChange={(e) => updateField('igv', e.target.value)}
              />
            </div>
          </div>

          <h3 className="text-sm font-bold border-b pb-2 pt-4 uppercase tracking-wider" style={{ color: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
            Series de Facturación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Serie Boletas</label>
              <input
                type="text"
                required
                className="erp-input w-full text-xs"
                placeholder="Ej. B001"
                value={formFields.serieBoleta || ''}
                onChange={(e) => updateField('serieBoleta', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Serie Facturas</label>
              <input
                type="text"
                required
                className="erp-input w-full text-xs"
                placeholder="Ej. F001"
                value={formFields.serieFactura || ''}
                onChange={(e) => updateField('serieFactura', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-8"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
