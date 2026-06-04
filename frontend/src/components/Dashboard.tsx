import React, { useState } from 'react'
import { useAppStore } from '../store'
import { api } from '../api'
import { POS } from './POS'
import { Kitchen } from './Kitchen'
import { CajaPanel } from './CajaPanel'
import { Catalogs } from './Catalogs'
import { Reports } from './Reports'
import {
  Coins,
  ShoppingCart,
  CookingPot,
  Files,
  ChartBar,
  SignOut,
  User,
  Storefront
} from '@phosphor-icons/react'

type Tab = 'POS' | 'KITCHEN' | 'CAJA' | 'CATALOGS' | 'REPORTS'

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('POS')
  const { user, caja, logout } = useAppStore()

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', {})
    } catch (e) {
      console.error('Error logging out', e)
    } finally {
      logout()
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'POS':
        return <POS />
      case 'KITCHEN':
        return <Kitchen />
      case 'CAJA':
        return <CajaPanel />
      case 'CATALOGS':
        return <Catalogs />
      case 'REPORTS':
        return <Reports />
      default:
        return <POS />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0b0f]">
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel border-r border-white/5 flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="p-2.5 bg-purple-600 rounded-xl shadow-lg shadow-purple-600/30 text-white">
              <Storefront size={22} weight="bold" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-wide text-white mb-0">SISTEMA RESTAURANTE</h2>
              <span className="text-[10px] text-gray-500 font-bold block mt-0.5">ERP & POS SOLUCIÓN</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {(
              [
                { id: 'POS', label: 'Ventas (POS)', icon: <ShoppingCart size={20} /> },
                { id: 'KITCHEN', label: 'Cocina', icon: <CookingPot size={20} /> },
                { id: 'CAJA', label: 'Caja', icon: <Coins size={20} /> },
                { id: 'CATALOGS', label: 'Catálogos', icon: <Files size={20} /> },
                { id: 'REPORTS', label: 'Reportes', icon: <ChartBar size={20} /> }
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${activeTab === item.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-white/5 rounded-full text-purple-400 border border-white/5">
              <User size={18} />
            </div>
            <div className="text-left">
              <span className="text-white text-xs font-bold block leading-tight">
                {user?.nombre} {user?.apellido}
              </span>
              <span className="text-[9px] text-gray-500 font-bold tracking-wider uppercase block mt-0.5">
                {user?.rol}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 border border-white/5 hover:border-red-500/20 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <SignOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Panel Frame */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header bar */}
        <header className="h-16 border-b border-white/5 glass-panel px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-xs font-semibold">Módulo Activo:</span>
            <span className="text-white text-sm font-bold bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
              {activeTab === 'POS' && 'Punto de Venta (POS)'}
              {activeTab === 'KITCHEN' && 'Monitor de Cocina'}
              {activeTab === 'CAJA' && 'Flujos de Caja Registradora'}
              {activeTab === 'CATALOGS' && 'Administración de Catálogos'}
              {activeTab === 'REPORTS' && 'Inteligencia & Reportes'}
            </span>
          </div>

          {/* Caja Status Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-medium">Estado Caja:</span>
              {caja ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded border border-green-500/10">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full dot-green"></span>
                  ABIERTA (Turno #{caja.idCaja})
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded border border-red-500/10">
                  <span className="h-1.5 w-1.5 bg-red-500 rounded-full dot-red"></span>
                  CERRADA
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page Inner Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-black/10">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
