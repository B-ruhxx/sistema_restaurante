import React from 'react'
import { Categoria, Producto, ComboProducto } from '../../../shared/types'
import { MagnifyingGlass, Pizza, CookingPot } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'
import { getImageUrl } from '../../../shared/services/uploadApi' // Asegura el parseo correcto de rutas estáticas/backend

interface ProductGridProps {
  categories: Categoria[]
  products: Producto[]
  combos: ComboProducto[]
  selectedCategory: number | 'ALL' | 'COMBOS'
  setSelectedCategory: (cat: number | 'ALL' | 'COMBOS') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  onAddProduct: (p: Producto) => void
  onAddCombo: (c: ComboProducto) => void
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  categories,
  products,
  combos,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onAddProduct,
  onAddCombo
}) => {
  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
    if (selectedCategory === 'ALL') return matchesSearch
    if (selectedCategory === 'COMBOS') return false
    return p.categoria?.idCategoria === selectedCategory && matchesSearch
  })

  // Filter combos
  const filteredCombos = combos.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.descripcion && c.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col space-y-4 h-full overflow-hidden text-left bg-[var(--color-surface)]">
      {/* Search & Tabs Header */}
      <Card
        padded={true}
        hoverable={false}
        className="flex flex-col md:flex-row gap-4 justify-between items-center shrink-0 border-default text-left"
        style={{ background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface) 100%)' }}
      >
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--text-muted)' }}>
            <MagnifyingGlass size={18} />
          </span>
          <input
            type="text"
            className="erp-input pl-10 py-1.5 w-full text-sm"
            placeholder="Buscar plato o bebida..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`btn btn-sm font-bold ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary border-default bg-[var(--color-surface)]'}`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.idCategoria}
              onClick={() => setSelectedCategory(cat.idCategoria!)}
              className={`btn btn-sm font-bold ${selectedCategory === cat.idCategoria ? 'btn-primary' : 'btn-secondary border-default bg-[var(--color-surface)]'}`}
            >
              {cat.nombre}
            </button>
          ))}
          <button
            onClick={() => setSelectedCategory('COMBOS')}
            className={`btn btn-sm font-bold ${selectedCategory === 'COMBOS' ? 'btn-primary' : 'btn-secondary border-default bg-[var(--color-surface)]'}`}
          >
            🍕 Combos / Ofertas
          </button>
        </div>
      </Card>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto pr-1">
        {selectedCategory === 'COMBOS' ? (
          filteredCombos.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-semibold text-xs">No se encontraron combos disponibles</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {filteredCombos.map(combo => (
                <Card
                  key={combo.idCombo}
                  onClick={() => onAddCombo(combo)}
                  padded={false}
                  hoverable={true}
                  className="card-hover text-left cursor-pointer flex flex-row overflow-hidden h-28 border-default bg-[var(--color-surface)] shadow-sm rounded-2xl group transition-all select-none"
                >
                  {/* Left: Image */}
                  <div className="w-24 h-full bg-[var(--color-surface-2)] border-r border-default overflow-hidden shrink-0">
                    <div className="flex items-center justify-center w-full h-full text-[var(--color-primary)] opacity-60 bg-amber-50">
                      <Pizza size={32} weight="duotone" />
                    </div>
                  </div>

                  {/* Right: Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="overflow-hidden">
                      <div className="flex justify-between items-baseline gap-1.5">
                        <span className="badge badge-primary text-[9px] px-1.5 py-0.5 font-bold uppercase truncate max-w-[80px]">
                          Combo
                        </span>
                      </div>
                      <h4 className="text-xs font-bold mt-1 leading-snug text-[var(--text-primary)] line-clamp-1 truncate" title={combo.nombre}>
                        {combo.nombre}
                      </h4>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-normal overflow-hidden">
                        {combo.descripcion || 'Paquete promocional especial.'}
                      </p>
                    </div>
                    <div className="font-mono font-bold text-xs" style={{ color: 'var(--color-primary)' }}>
                      S/. {combo.precio.toFixed(2)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-semibold text-xs">No se encontraron productos en esta categoría</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {filteredProducts.map(prod => (
                <Card
                  key={prod.idProducto}
                  onClick={() => onAddProduct(prod)}
                  padded={false}
                  hoverable={true}
                  className="card-hover text-left cursor-pointer flex flex-row overflow-hidden h-28 border-default bg-[var(--color-surface)] shadow-sm rounded-2xl group transition-all select-none"
                >
                  {/* Left: Image */}
                  <div className="w-24 h-full bg-[var(--color-surface-2)] border-r border-default overflow-hidden shrink-0">
                    {prod.imagenUrl || prod.imagen_url ? (
                      <img
                        src={getImageUrl(prod.imagenUrl || prod.imagen_url) || ''}
                        alt={prod.nombre}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-slate-50 text-gray-400">
                        <CookingPot size={28} weight="light" className="opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Right: Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="overflow-hidden">
                      <div className="flex justify-between items-baseline gap-1.5">
                        <span className="badge badge-neutral text-[9px] px-1.5 py-0.5 font-bold uppercase truncate max-w-[80px]">
                          {prod.categoria?.nombre || 'Plato'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium shrink-0">
                          {prod.tipoProducto === 'PREPARADO' ? 'Cocina' : 'Stock'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold mt-1 leading-snug text-[var(--text-primary)] line-clamp-1 truncate" title={prod.nombre}>
                        {prod.nombre}
                      </h4>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-normal overflow-hidden">
                        {prod.descripcion || 'Sin descripción adicional.'}
                      </p>
                    </div>
                    <div className="font-mono font-bold text-xs" style={{ color: 'var(--color-primary)' }}>
                      S/. {prod.precio.toFixed(2)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}