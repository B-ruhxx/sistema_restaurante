import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../../store'
import { AdminTabs, AdminTab } from '../components/AdminTabs'
import { ClientesTab } from '../components/ClientesTab'
import { ProveedoresTab } from '../components/ProveedoresTab'
import { EmpleadosTab } from '../components/EmpleadosTab'
import { ConfiguracionTab } from '../components/ConfiguracionTab'

export const AdministracionPage: React.FC = () => {
  const { user } = useAppStore()
  const role = user?.rol || 'MESERO'
  const [activeTab, setActiveTab] = useState<AdminTab>('CLIENTES')

  useEffect(() => {
    // Determine default tab based on role permissions
    if (role === 'ADMINISTRADOR') {
      setActiveTab('CLIENTES')
    } else if (role === 'MESERO' || role === 'CAJERO') {
      setActiveTab('CLIENTES')
    }
  }, [role])

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'CLIENTES':
        return <ClientesTab />
      case 'PROVEEDORES':
        return role === 'ADMINISTRADOR' ? <ProveedoresTab /> : null
      case 'EMPLEADOS':
        return role === 'ADMINISTRADOR' ? <EmpleadosTab /> : null
      case 'CONFIGURACION':
        return role === 'ADMINISTRADOR' ? <ConfiguracionTab /> : null
      default:
        return <ClientesTab />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Tab Switcher */}
      <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Content */}
      <div className="animate-fade-in" key={activeTab}>
        {renderActiveTab()}
      </div>
    </div>
  )
}
