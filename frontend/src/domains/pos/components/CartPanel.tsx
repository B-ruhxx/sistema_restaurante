import React from 'react'
import { Cliente } from '../../../shared/types'
import { ShoppingCart, User, Trash, Minus, Plus, CreditCard, CookingPot } from '@phosphor-icons/react'
import { Button } from '../../../components/Ui/Button'

interface CartPanelProps {
  cart: any[]
  clients: Cliente[]
  selectedClient: Cliente | null
  setSelectedClient: (c: Cliente | null) => void
  onRemove: (id: string) => void
  onUpdateQty: (id: string, qty: number) => void
  onUpdateObs: (id: string, obs: string) => void
  onCheckout: () => void
  setShowClientModal: (open: boolean) => void
  onCajaClick?: () => void
}

export const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  clients,
  selectedClient,
  setSelectedClient,
  onRemove,
  onUpdateQty,
  onUpdateObs,
  onCheckout,
  setShowClientModal,
  onCajaClick
}) => {
  const subtotalCart = cart.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden text-left bg-[var(--color-surface)]">
      {/* Header del Panel */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-default shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-extrabold flex items-center gap-2 m-0" style={{ color: 'var(--text-primary)' }}>
            <ShoppingCart size={20} weight="duotone" style={{ color: 'var(--color-primary)' }} />
            Orden de Venta
          </h3>
          {onCajaClick && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onCajaClick}
              className="flex items-center gap-1 py-1 px-2 h-7 text-[10px] border-default shadow-sm bg-[var(--color-surface-2)]"
              title="Administrar Turno Caja"
            >
              <i className="fa-solid fa-vault text-[var(--color-primary)] text-[10px]"></i>
              <span>Caja</span>
            </Button>
          )}
        </div>
        <span className="badge badge-neutral font-mono text-[11px] px-2 py-0.5 font-bold">
          {cart.length} {cart.length === 1 ? 'ítem' : 'ítems'}
        </span>
      </div>

      {/* Selector de Cliente — Tarjeta de Control Remodelada */}
      <div className="mb-4 shrink-0 p-3 rounded-xl flex items-center justify-between border-default" style={{ background: 'var(--color-surface-2)' }}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-[var(--color-surface)] border border-default flex items-center justify-center shrink-0">
            <User size={16} weight="duotone" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="overflow-hidden">
            {selectedClient ? (
              <div className="truncate">
                <span className="text-xs font-bold block truncate" style={{ color: 'var(--text-primary)' }}>
                  {selectedClient.nombre} {selectedClient.apellido}
                </span>
                <span className="text-[10px] font-mono block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {selectedClient.tipoDocumento}: {selectedClient.documentoIdentidad}
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Público General
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 items-center shrink-0 pl-2">
          {selectedClient && (
            <button
              onClick={() => setSelectedClient(null)}
              className="text-[10px] font-bold hover:underline cursor-pointer transition-colors"
              style={{ color: 'var(--color-danger)' }}
            >
              Limpiar
            </button>
          )}
          <select
            className="erp-select text-[11px] py-1 max-w-[120px] font-semibold bg-[var(--color-surface)]"
            style={{ paddingRight: '1.5rem', backgroundPosition: 'right 0.4rem center' }}
            onChange={(e) => {
              const val = e.target.value
              if (val === 'NEW') {
                setShowClientModal(true)
              } else if (val) {
                const cl = clients.find(c => c.idCliente === parseInt(val))
                if (cl) setSelectedClient(cl)
              }
            }}
            value={selectedClient?.idCliente || ''}
          >
            <option value="">Cambiar...</option>
            {clients.map(c => (
              <option key={c.idCliente} value={c.idCliente}>{c.nombre} {c.apellido}</option>
            ))}
            <option value="NEW" className="font-bold text-[var(--color-primary)]">+ Nuevo Cliente</option>
          </select>
        </div>
      </div>

      {/* Lista de Ítems del Carrito */}
      <div className="flex-1 overflow-y-auto space-y-2.5 mb-4 pr-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="p-4 rounded-full bg-[var(--color-surface-2)] mb-3">
              <ShoppingCart size={28} weight="thin" />
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>El carrito está vacío</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Agrega productos o combos del catálogo</p>
          </div>
        ) : (
          cart.map((item) => (
            /* Fondo cambiado a var(--color-surface) con efecto card-hover controlado */
            <div
              key={item.cartId}
              className="p-3 rounded-xl space-y-2.5 border-default transition-all duration-150"
              style={{ background: 'var(--color-surface)' }}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="text-left">
                  <h5 className="text-xs font-bold leading-snug m-0" style={{ color: 'var(--text-primary)' }}>
                    {item.producto?.nombre || item.combo?.nombre}
                  </h5>
                  {item.variante && (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 bg-[var(--color-surface-2)]" style={{ color: 'var(--text-secondary)' }}>
                      Variante: {item.variante.nombre}
                    </span>
                  )}
                  <div className="mt-1">
                    <span className="text-[11px] font-mono font-bold" style={{ color: 'var(--color-primary)' }}>
                      S/. {item.precioUnitario.toFixed(2)} <span className="text-[10px] font-normal text-gray-400">c/u</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(item.cartId)}
                  className="hover:text-red-600 transition-colors cursor-pointer shrink-0 p-1 rounded-lg hover:bg-red-50 text-gray-400"
                  title="Eliminar ítem"
                >
                  <Trash size={14} />
                </button>
              </div>

              {/* Fila inferior de controles: Nota y Selectores de cantidad */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-dashed border-default">
                <input
                  type="text"
                  placeholder="Añadir nota o término (Ej. Bien cocida)..."
                  className="erp-input py-1 px-2 text-[10px] flex-1 rounded-lg h-7 font-medium"
                  value={item.observacion || ''}
                  onChange={(e) => onUpdateObs(item.cartId, e.target.value)}
                />

                {/* Controladores de Cantidad de Alta Precisión */}
                <div className="flex items-center border border-default rounded-lg p-0.5 bg-[var(--color-surface-2)] shrink-0 h-7">
                  <button
                    onClick={() => onUpdateQty(item.cartId, item.cantidad - 1)}
                    className="p-1 rounded-md bg-[var(--color-surface)] border border-default shadow-sm hover:bg-gray-50 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-gray-600"
                  >
                    <Minus size={10} weight="bold" />
                  </button>
                  <span className="text-xs font-bold text-center min-w-[24px]" style={{ color: 'var(--text-primary)' }}>
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.cartId, item.cantidad + 1)}
                    className="p-1 rounded-md bg-[var(--color-surface)] border border-default shadow-sm hover:bg-gray-50 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-gray-600"
                  >
                    <Plus size={10} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer de Acciones — Jerarquía Financiera Reforzada */}
      <div className="shrink-0 border-t pt-3.5 space-y-3.5 bg-[var(--color-surface)]" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex justify-between items-baseline font-bold" style={{ color: 'var(--text-primary)' }}>
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Total Cobrar:</span>
          <span className="text-2xl font-black font-mono tracking-tight" style={{ color: 'var(--color-primary)' }}>
            S/. {subtotalCart.toFixed(2)}
          </span>
        </div>

        <Button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full py-3 flex items-center justify-center gap-2 shadow-md transition-all font-bold text-sm rounded-xl"
        >
          <CookingPot size={18} weight="bold" />
          Confirmar y Enviar a Cocina
        </Button>
      </div>
    </div>
  )
}