import React from 'react'
import { useAppStore } from '../../../store'

export type AdminTab = 'CLIENTES' | 'PROVEEDORES' | 'EMPLEADOS' | 'CONFIGURACION'

interface AdminTabsProps {
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAppStore()
  const role = user?.rol || 'MESERO'

  const allTabs: { id: AdminTab; label: string; icon: string; roles: string[] }[] = [
    { id: 'CLIENTES', label: 'Clientes', icon: 'fa-solid fa-users', roles: ['ADMINISTRADOR', 'MESERO', 'CAJERO'] },
    { id: 'PROVEEDORES', label: 'Proveedores', icon: 'fa-solid fa-truck-ramp-box', roles: ['ADMINISTRADOR'] },
    { id: 'EMPLEADOS', label: 'Empleados', icon: 'fa-solid fa-id-card', roles: ['ADMINISTRADOR'] },
    { id: 'CONFIGURACION', label: 'Configuración', icon: 'fa-solid fa-gears', roles: ['ADMINISTRADOR'] }
  ]

  const visibleTabs = allTabs.filter(t => t.roles.includes(role))

  return (
    <div className="card p-3 flex gap-2 overflow-x-auto border-default shrink-0" style={{ background: 'var(--color-surface)' }}>
      {visibleTabs.map(t => {
        const isActive = activeTab === t.id
        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`btn btn-sm flex items-center gap-2 cursor-pointer transition-all ${isActive ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '12px' }}
          >
            <i className={`${t.icon} text-[14px]`}></i>
            <span>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
