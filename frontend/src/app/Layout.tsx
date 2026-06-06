import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { api } from '../shared/services/api'

// Domain Pages
import { DashboardPage }    from '../domains/dashboard/pages/DashboardPage'
import { PosPage }          from '../domains/pos/pages/PosPage'
import { CocinaPage }       from '../domains/cocina/pages/CocinaPage'
import { CajaPage }         from '../domains/caja/pages/CajaPage'
import { ProductosPage }    from '../domains/productos/pages/ProductosPage'
import { CategoriasPage }   from '../domains/categorias/pages/CategoriasPage'
import { InsumosPage }      from '../domains/insumos/pages/InsumosPage'
import { CombosPage }       from '../domains/combos/pages/CombosPage'
import { ClientesPage }     from '../domains/clientes/pages/ClientesPage'
import { ProveedoresPage }  from '../domains/proveedores/pages/ProveedoresPage'
import { EmpleadosPage }    from '../domains/empleados/pages/EmpleadosPage'
import { ConfiguracionPage } from '../domains/configuracion/pages/ConfiguracionPage'
import { ReportesPage }     from '../domains/reportes/pages/ReportesPage'

import {
  Gauge, ShoppingCart, CookingPot, Coins, Package,
  Tag, Archive, ForkKnife, Users, Truck, UserCircle,
  Gear, ChartBar, SignOut, User, Storefront,
  CaretDown, CaretRight
} from '@phosphor-icons/react'

export type AppPage =
  | 'DASHBOARD' | 'POS' | 'COCINA' | 'CAJA'
  | 'PRODUCTOS' | 'CATEGORIAS' | 'INSUMOS' | 'COMBOS'
  | 'CLIENTES' | 'PROVEEDORES' | 'EMPLEADOS'
  | 'CONFIGURACION' | 'REPORTES'

interface NavItem {
  id: AppPage
  label: string
  icon: React.ReactNode
  group?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
  collapsible?: boolean
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { id: 'DASHBOARD',  label: 'Dashboard',    icon: <Gauge size={18} /> },
      { id: 'POS',        label: 'Punto de Venta', icon: <ShoppingCart size={18} /> },
      { id: 'COCINA',     label: 'Monitor Cocina', icon: <CookingPot size={18} /> },
      { id: 'CAJA',       label: 'Caja',           icon: <Coins size={18} /> },
    ],
  },
  {
    label: 'Catálogos',
    collapsible: true,
    items: [
      { id: 'PRODUCTOS',   label: 'Productos',    icon: <ForkKnife size={18} /> },
      { id: 'CATEGORIAS',  label: 'Categorías',   icon: <Tag size={18} /> },
      { id: 'INSUMOS',     label: 'Insumos',      icon: <Package size={18} /> },
      { id: 'COMBOS',      label: 'Combos',       icon: <Archive size={18} /> },
    ],
  },
  {
    label: 'Gestión',
    collapsible: true,
    items: [
      { id: 'CLIENTES',    label: 'Clientes',     icon: <Users size={18} /> },
      { id: 'PROVEEDORES', label: 'Proveedores',  icon: <Truck size={18} /> },
      { id: 'EMPLEADOS',   label: 'Empleados',    icon: <UserCircle size={18} /> },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { id: 'REPORTES',      label: 'Reportes',       icon: <ChartBar size={18} /> },
      { id: 'CONFIGURACION', label: 'Configuración',  icon: <Gear size={18} /> },
    ],
  },
]

function renderPage(page: AppPage) {
  switch (page) {
    case 'DASHBOARD':    return <DashboardPage />
    case 'POS':          return <PosPage />
    case 'COCINA':       return <CocinaPage />
    case 'CAJA':         return <CajaPage />
    case 'PRODUCTOS':    return <ProductosPage />
    case 'CATEGORIAS':   return <CategoriasPage />
    case 'INSUMOS':      return <InsumosPage />
    case 'COMBOS':       return <CombosPage />
    case 'CLIENTES':     return <ClientesPage />
    case 'PROVEEDORES':  return <ProveedoresPage />
    case 'EMPLEADOS':    return <EmpleadosPage />
    case 'CONFIGURACION': return <ConfiguracionPage />
    case 'REPORTES':     return <ReportesPage />
    default:             return <DashboardPage />
  }
}

export const Layout: React.FC = () => {
  const [activePage, setActivePage] = useState<AppPage>('DASHBOARD')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [clock, setClock] = useState(new Date())
  const { user, caja, logout } = useAppStore()

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const handleLogout = async () => {
    try { await api.post('/api/auth/logout', {}) } catch { /* ignore */ }
    finally { logout() }
  }

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  const pageTitles: Record<AppPage, string> = {
    DASHBOARD: 'Dashboard', POS: 'Punto de Venta', COCINA: 'Monitor de Cocina',
    CAJA: 'Control de Caja', PRODUCTOS: 'Productos', CATEGORIAS: 'Categorías',
    INSUMOS: 'Insumos', COMBOS: 'Combos & Promociones', CLIENTES: 'Clientes',
    PROVEEDORES: 'Proveedores', EMPLEADOS: 'Empleados', CONFIGURACION: 'Configuración',
    REPORTES: 'Reportes & Analytics',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-background)' }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div
          style={{
            padding: '1.25rem 1rem 1rem',
            borderBottom: '1px solid hsla(255,255%,255%,0.07)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                background: 'var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem',
                boxShadow: 'var(--shadow-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Storefront size={22} weight="bold" color="white" />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: '0.8125rem', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
                RestaurantePOS
              </p>
              <p style={{ color: 'hsl(30,15%,55%)', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
                ERP &amp; POS Sistema
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {NAV_GROUPS.map(group => {
            const isCollapsed = collapsedGroups.has(group.label)
            return (
              <div key={group.label}>
                {/* Group label */}
                <button
                  type="button"
                  onClick={() => group.collapsible && toggleGroup(group.label)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '0 0.375rem 0.35rem',
                    background: 'transparent', border: 'none', cursor: group.collapsible ? 'pointer' : 'default',
                    color: 'hsl(30,15%,40%)', fontSize: '0.625rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}
                >
                  {group.label}
                  {group.collapsible && (
                    isCollapsed
                      ? <CaretRight size={10} style={{ color: 'hsl(30,15%,40%)' }} />
                      : <CaretDown size={10} style={{ color: 'hsl(30,15%,40%)' }} />
                  )}
                </button>

                {/* Items */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
                        onClick={() => setActivePage(item.id)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User footer */}
        <div
          style={{
            padding: '0.875rem 0.75rem',
            borderTop: '1px solid hsla(255,255%,255%,0.07)',
            display: 'flex', flexDirection: 'column', gap: '0.625rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={16} weight="bold" color="white" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'white', fontSize: '0.75rem', fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.nombre} {user?.apellido}
              </p>
              <p style={{ color: 'hsl(30,15%,50%)', fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>
                {user?.rol}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-md)',
              background: 'hsla(5,75%,50%,0.1)', border: '1px solid hsla(5,75%,50%,0.2)',
              color: 'hsl(5,75%,65%)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'hsla(5,75%,50%,0.2)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'hsl(5,75%,75%)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'hsla(5,75%,50%,0.1)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'hsl(5,75%,65%)'
            }}
          >
            <SignOut size={15} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top Header */}
        <header
          style={{
            height: 60,
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--border-color)',
            padding: '0 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ERP</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/</span>
            <span
              style={{
                color: 'var(--color-primary)', fontSize: '0.8125rem', fontWeight: 700,
                fontFamily: 'var(--font-display)',
              }}
            >
              {pageTitles[activePage]}
            </span>
          </div>

          {/* Right side info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Clock */}
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.03em' }}>
              {clock.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>

            {/* Caja badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 600 }}>CAJA</span>
              {caja ? (
                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
                  Abierta #{caja.idCaja}
                </span>
              ) : (
                <span className="badge badge-danger">
                  Cerrada
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            background: 'var(--color-background)',
          }}
          className="animate-fade-in"
          key={activePage}
        >
          {renderPage(activePage)}
        </main>
      </div>
    </div>
  )
}
