import React, { useEffect, useState } from 'react'
import { api } from '../../../shared/services/api'
import { ConfiguracionEmpresa } from '../../../shared/types'
import { ImageUploader } from '../../../shared/components/images/ImageUploader'
import { useAppStore } from '../../../store'
import { Card } from '../../../components/Ui/Card'
import { Button } from '../../../components/Ui/Button'
import { Input } from '../../../components/Ui/Input'

export const ConfiguracionTab: React.FC = () => {
  const { setCompanyInfo } = useAppStore()
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
      setCompanyInfo(res.nombreEmpresa, res.logoUrl || res.logo_url || null)
      alert('Configuración guardada correctamente.')
    } catch (err: any) {
      alert(err.message || 'Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key: string, val: any) => {
    setFormFields(prev => {
      const next = { ...prev, [key]: val }
      if (key === 'nombreEmpresa') {
        setCompanyInfo(val, prev.logo_url || prev.logoUrl || null)
      } else if (key === 'logo_url') {
        setCompanyInfo(prev.nombreEmpresa || '', val || null)
      }
      return next
    })
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
      <div className="text-left">
        <h2 className="text-xl font-bold tracking-tight m-0" style={{ color: 'var(--text-primary)' }}>
          Configuración del Sistema
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }} className="m-0 mt-1">
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
            <Input
              label="Nombre Comercial"
              type="text"
              required
              value={formFields.nombreEmpresa || ''}
              onChange={(e) => updateField('nombreEmpresa', e.target.value)}
            />
            <Input
              label="Razón Social"
              type="text"
              value={formFields.razonSocial || ''}
              onChange={(e) => updateField('razonSocial', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="RUC"
              type="text"
              required
              value={formFields.ruc || ''}
              onChange={(e) => updateField('ruc', e.target.value)}
            />
            <Input
              label="Dirección Fiscal"
              type="text"
              value={formFields.direccion || ''}
              onChange={(e) => updateField('direccion', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Teléfono de contacto"
              type="text"
              value={formFields.telefono || ''}
              onChange={(e) => updateField('telefono', e.target.value)}
            />
            <Input
              label="Email corporativo"
              type="email"
              value={formFields.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>

          <h3 className="text-sm font-bold border-b pb-2 pt-4 uppercase tracking-wider" style={{ color: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
            Configuración Fiscal & Moneda
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Símbolo Moneda"
              type="text"
              required
              placeholder="Ej. S/. o $"
              value={formFields.moneda || ''}
              onChange={(e) => updateField('moneda', e.target.value)}
            />
            <Input
              label="IGV / Impuesto (%)"
              type="number"
              step="0.01"
              required
              placeholder="18.00"
              value={formFields.igv || ''}
              onChange={(e) => updateField('igv', e.target.value)}
            />
          </div>

          <h3 className="text-sm font-bold border-b pb-2 pt-4 uppercase tracking-wider" style={{ color: 'var(--color-primary)', borderColor: 'var(--border-color)' }}>
            Series de Facturación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Serie Boletas"
              type="text"
              required
              placeholder="Ej. B001"
              value={formFields.serieBoleta || ''}
              onChange={(e) => updateField('serieBoleta', e.target.value)}
            />
            <Input
              label="Serie Facturas"
              type="text"
              required
              placeholder="Ej. F001"
              value={formFields.serieFactura || ''}
              onChange={(e) => updateField('serieFactura', e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={saving}
              className="px-8"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
