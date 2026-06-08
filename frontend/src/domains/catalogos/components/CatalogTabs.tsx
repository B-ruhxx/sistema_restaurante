import React from 'react'
import { Pizza, Tag, Package, Gift } from '@phosphor-icons/react'

export type CatalogTab = 'PRODUCTOS' | 'CATEGORIAS' | 'INSUMOS' | 'COMBOS'

interface CatalogTabsProps {
  activeTab: CatalogTab
  setActiveTab: (tab: CatalogTab) => void
}

export const CatalogTabs: React.FC<CatalogTabsProps> = ({ activeTab, setActiveTab }) => {
  // Migramos los strings de iconos a componentes reales de Phosphor
  const tabs = [
    { id: 'PRODUCTOS' as CatalogTab, label: 'Productos', Icon: Pizza },
    { id: 'CATEGORIAS' as CatalogTab, label: 'Categorías', Icon: Tag },
    { id: 'INSUMOS' as CatalogTab, label: 'Insumos / Almacén', Icon: Package },
    { id: 'COMBOS' as CatalogTab, label: 'Combos & Promos', Icon: Gift }
  ]

  return (
    /* Cambiamos a var(--color-surface-2) para crear un contenedor segmentado elegante */
    <div
      className="p-1.5 flex gap-1.5 overflow-x-auto border rounded-xl shrink-0 backdrop-blur-sm"
      style={{
        background: 'var(--color-surface-2)',
        borderColor: 'var(--border-color)'
      }}
    >
      {tabs.map(t => {
        const isActive = activeTab === t.id
        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold 
              cursor-pointer select-none border border-transparent transition-all duration-200 ease-out min-w-max flex-1 justify-center
              ${isActive
                ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)] border-[var(--border-color)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--color-primary-light)]'
              }
            `}
          >
            <t.Icon
              size={16}
              weight={isActive ? 'bold' : 'regular'}
              className={isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'}
            />
            <span>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}