import React, { useState } from 'react'
import { CatalogTabs, CatalogTab } from '../components/CatalogTabs'
import { ProductosTab } from '../components/ProductosTab'
import { CategoriasTab } from '../components/CategoriasTab'
import { InsumosTab } from '../components/InsumosTab'
import { CombosTab } from '../components/CombosTab'

export const CatalogosPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CatalogTab>('PRODUCTOS')

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'PRODUCTOS':
        return <ProductosTab />
      case 'CATEGORIAS':
        return <CategoriasTab />
      case 'INSUMOS':
        return <InsumosTab />
      case 'COMBOS':
        return <CombosTab />
      default:
        return <ProductosTab />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Tab Switcher */}
      <CatalogTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Content */}
      <div className="animate-fade-in" key={activeTab}>
        {renderActiveTab()}
      </div>
    </div>
  )
}
