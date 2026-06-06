import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../../store'
import { api } from '../../../shared/services/api'
import { Categoria, Producto, ComboProducto, Cliente, MetodoPago, Pedido, Venta } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { ShoppingCart, Tag, MagnifyingGlass, User, Trash, Plus, Minus, CreditCard, Coins, Check, FileText } from '@phosphor-icons/react'

export const PosPage: React.FC = () => {
  const { caja, cart, addToCart, removeFromCart, updateCartQty, updateCartObservacion, clearCart } = useAppStore()
  
  // Data loading
  const [categories, setCategories] = useState<Categoria[]>([])
  const [products, setProducts] = useState<Producto[]>([])
  const [combos, setCombos] = useState<ComboProducto[]>([])
  const [clients, setClients] = useState<Cliente[]>([])
  const [paymentMethods, setPaymentMethods] = useState<MetodoPago[]>([])

  // Selection state
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL' | 'COMBOS'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)

  // New client form modal
  const [showClientModal, setShowClientModal] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientApellido, setNewClientApellido] = useState('')
  const [newClientDocType, setNewClientDocType] = useState<'DNI' | 'RUC'>('DNI')
  const [newClientDocNum, setNewClientDocNum] = useState('')

  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false)
  const [tipoComprobante, setTipoComprobante] = useState<'BOLETA' | 'FACTURA'>('BOLETA')
  const [serie, setSerie] = useState('B001')
  const [correlativo, setCorrelativo] = useState('')
  const [payments, setPayments] = useState<{ idMetodoPago: number; monto: number; numeroOperacion?: string }[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch initial data
  const loadData = async () => {
    try {
      const [catsRes, prodsRes, combosRes, clientsRes, pmRes] = await Promise.all([
        api.get<Categoria[]>('/api/v1/categorias'),
        api.get<Producto[]>('/api/v1/productos'),
        api.get<ComboProducto[]>('/api/v1/combos'),
        api.get<Cliente[]>('/api/v1/clientes'),
        api.get<MetodoPago[]>('/api/v1/metodo-pagos').catch(() => [])
      ])
      
      setCategories(catsRes.filter(c => c.estado === 'ACTIVO'))
      setProducts(prodsRes.filter(p => p.estado === 'ACTIVO'))
      setCombos(combosRes.filter(c => c.estado === 'ACTIVO'))
      setClients(clientsRes.filter(c => c.estado === 'ACTIVO'))

      // Fallback for payment methods if endpoint not loaded
      if (pmRes.length > 0) {
        setPaymentMethods(pmRes.filter(p => p.estado === 'ACTIVO'))
      } else {
        setPaymentMethods([
          { idMetodoPago: 1, nombre: 'EFECTIVO', requiereOperacion: false },
          { idMetodoPago: 2, nombre: 'TARJETA', requiereOperacion: true },
          { idMetodoPago: 3, nombre: 'YAPE/PLIN', requiereOperacion: true }
        ])
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
    setCorrelativo(Math.floor(100000 + Math.random() * 900000).toString())
  }, [])

  // Auto series update on comprobante change
  useEffect(() => {
    setSerie(tipoComprobante === 'BOLETA' ? 'B001' : 'F001')
  }, [tipoComprobante])

  if (!caja) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh] card border-default max-w-lg mx-auto my-12">
        <Coins size={64} style={{ color: 'var(--text-muted)' }} className="mb-4" />
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Punto de Venta Bloqueado</h2>
        <p style={{ color: 'var(--text-secondary)' }} className="max-w-md">
          Debe abrir el control de Caja para poder habilitar la pantalla de ventas y facturación.
        </p>
      </div>
    )
  }

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
    if (selectedCategory === 'ALL') return matchesSearch
    if (selectedCategory === 'COMBOS') return false // Combos handles separately
    return p.categoria?.idCategoria === selectedCategory && matchesSearch
  })

  // Cart Totals
  const subtotalCart = cart.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0)

  // Handle click on product to add
  const handleAddProduct = (p: Producto) => {
    addToCart({
      producto: p,
      cantidad: 1,
      precioUnitario: p.precio,
      observacion: ''
    })
  }

  // Handle click on combo to add
  const handleAddCombo = (c: ComboProducto) => {
    addToCart({
      combo: c,
      cantidad: 1,
      precioUnitario: c.precio,
      observacion: ''
    })
  }

  // Handle create new client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post<Cliente>('/api/v1/clientes', {
        nombre: newClientName,
        apellido: newClientApellido,
        tipoDocumento: newClientDocType,
        documentoIdentidad: newClientDocNum,
        estado: 'ACTIVO'
      })
      setClients(prev => [...prev, res])
      setSelectedClient(res)
      setShowClientModal(false)
      setNewClientName('')
      setNewClientApellido('')
      setNewClientDocNum('')
    } catch (e: any) {
      alert(e.message || 'Error registrando cliente')
    }
  }

  // Open checkout drawer
  const handleOpenCheckout = () => {
    if (cart.length === 0) return
    // Default payment as full cash
    const cashMethod = paymentMethods.find(p => p.nombre.toUpperCase() === 'EFECTIVO')
    setPayments([
      {
        idMetodoPago: cashMethod?.idMetodoPago || 1,
        monto: subtotalCart
      }
    ])
    setShowCheckout(true)
  }

  // Process order flow
  const handleProcessOrder = async () => {
    setLoading(true)
    try {
      // 1. Create Pedido (Order)
      const detalles = cart.map(item => ({
        idProducto: item.producto?.idProducto || null,
        idCombo: item.combo?.idCombo || null,
        cantidad: item.cantidad,
        observacion: item.observacion || null,
        extrasIds: []
      }))

      const pedidoReq = {
        idCliente: selectedClient?.idCliente || null,
        detalles
      }

      const orderRes = await api.post<Pedido>('/api/v1/pedidos', pedidoReq)

      // 2. Register Sale (Venta) in PENDING
      const ventaReq = {
        idPedido: orderRes.idPedido,
        tipoComprobante,
        serie,
        correlativo,
        pagos: payments.map(p => ({
          idMetodoPago: p.idMetodoPago,
          monto: p.monto,
          numeroOperacion: p.numeroOperacion || null
        }))
      }

      const saleRes = await api.post<Venta>('/api/v1/ventas', ventaReq)

      // 3. Mark Venta as PAID and update stock
      await api.post<Venta>(`/api/v1/ventas/${saleRes.idVenta}/pagar`, payments.map(p => ({
        idMetodoPago: p.idMetodoPago,
        monto: p.monto,
        numeroOperacion: p.numeroOperacion || null
      })))

      alert('¡Venta realizada con éxito!')
      clearCart()
      setSelectedClient(null)
      setShowCheckout(false)
      setCorrelativo(Math.floor(100000 + Math.random() * 900000).toString())
    } catch (e: any) {
      alert(e.message || 'Error procesando la venta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[82vh]">
      {/* Left side: Catalog Browser */}
      <div className="lg:col-span-2 flex flex-col space-y-4 h-full overflow-hidden">
        {/* Search & Tabs */}
        <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
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
              className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.idCategoria}
                onClick={() => setSelectedCategory(cat.idCategoria!)}
                className={`btn btn-sm ${selectedCategory === cat.idCategoria ? 'btn-primary' : 'btn-secondary'}`}
              >
                {cat.nombre}
              </button>
            ))}
            <button
              onClick={() => setSelectedCategory('COMBOS')}
              className={`btn btn-sm ${selectedCategory === 'COMBOS' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Promos/Combos
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {selectedCategory === 'COMBOS' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {combos.map(combo => (
                <div
                  key={combo.idCombo}
                  onClick={() => handleAddCombo(combo)}
                  className="card card-hover p-4 text-left cursor-pointer flex flex-col justify-between h-36 border-default"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <div>
                    <span className="badge badge-primary mb-2">
                      COMBO
                    </span>
                    <h4 className="text-sm font-semibold m-0 leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {combo.nombre}
                    </h4>
                    <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {combo.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                  <span className="font-bold text-sm mt-2" style={{ color: 'var(--color-primary)' }}>
                    S/. {combo.precio.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(prod => (
                <div
                  key={prod.idProducto}
                  onClick={() => handleAddProduct(prod)}
                  className="card card-hover p-4 text-left cursor-pointer flex flex-col justify-between h-36 border-default"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <div>
                    <span className="badge badge-neutral mb-2">
                      {prod.tipoProducto === 'PREPARADO' ? 'Cocina' : 'Inventario'}
                    </span>
                    <h4 className="text-sm font-semibold m-0 leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {prod.nombre}
                    </h4>
                    <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {prod.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                  <span className="font-bold text-sm mt-2" style={{ color: 'var(--color-primary)' }}>
                    S/. {prod.precio.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Shopping Cart & Checkout drawer */}
      <div className="lg:col-span-1 card p-6 flex flex-col h-full overflow-hidden text-left border-default" style={{ background: 'var(--color-surface)' }}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 shrink-0" style={{ color: 'var(--text-primary)' }}>
          <ShoppingCart size={22} style={{ color: 'var(--color-primary)' }} />
          Orden de Venta
        </h3>

        {/* Client selector */}
        <div className="mb-4 shrink-0 p-3 rounded-xl flex items-center justify-between border-default" style={{ background: 'var(--color-surface-2)' }}>
          <div className="flex items-center gap-2">
            <User size={18} style={{ color: 'var(--color-primary)' }} />
            {selectedClient ? (
              <div>
                <span className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                  {selectedClient.nombre} {selectedClient.apellido}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {selectedClient.tipoDocumento}: {selectedClient.documentoIdentidad}
                </span>
              </div>
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Público General (Por defecto)</span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {selectedClient && (
              <button
                onClick={() => setSelectedClient(null)}
                className="text-[10px] hover:underline cursor-pointer"
                style={{ color: 'var(--color-danger)' }}
              >
                Limpiar
              </button>
            )}
            <select
              className="erp-select text-[11px] py-1 max-w-[120px]"
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
              <option value="">Buscar/Elegir...</option>
              {clients.map(c => (
                <option key={c.idCliente} value={c.idCliente}>{c.nombre} {c.apellido}</option>
              ))}
              <option value="NEW">+ Nuevo Cliente</option>
            </select>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <ShoppingCart size={32} className="mb-2" />
              <p className="text-xs">El carrito está vacío</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartId} className="p-3 rounded-xl space-y-2 border-default" style={{ background: 'var(--color-surface-2)' }}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="text-xs font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {item.producto?.nombre || item.combo?.nombre}
                    </h5>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--color-primary)' }}>
                      S/. {item.precioUnitario.toFixed(2)} c/u
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="hover:opacity-80 cursor-pointer shrink-0"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    <Trash size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <input
                    type="text"
                    placeholder="Nota..."
                    className="erp-input py-0.5 px-2 text-[10px] flex-1"
                    value={item.observacion || ''}
                    onChange={(e) => updateCartObservacion(item.cartId, e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(item.cartId, item.cantidad - 1)}
                      className="p-1 rounded btn-secondary cursor-pointer"
                      style={{ padding: '0.2rem' }}
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{item.cantidad}</span>
                    <button
                      onClick={() => updateCartQty(item.cartId, item.cantidad + 1)}
                      className="p-1 rounded btn-secondary cursor-pointer"
                      style={{ padding: '0.2rem' }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Panel */}
        <div className="shrink-0 border-t pt-4 space-y-4" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex justify-between font-semibold" style={{ color: 'var(--text-primary)' }}>
            <span>Total a Pagar</span>
            <span className="text-lg" style={{ color: 'var(--color-primary)' }}>S/. {subtotalCart.toFixed(2)}</span>
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 btn btn-primary font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <CreditCard size={20} />
            Proceder al Cobro
          </button>
        </div>
      </div>

      {/* New Client Modal */}
      <Modal
        open={showClientModal}
        onClose={() => setShowClientModal(false)}
        title="Registrar Nuevo Cliente"
        maxWidth="400px"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div>
            <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Nombre</label>
            <input
              type="text"
              required
              className="erp-input w-full text-xs"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Apellido</label>
            <input
              type="text"
              required
              className="erp-input w-full text-xs"
              value={newClientApellido}
              onChange={(e) => setNewClientApellido(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Tipo Doc.</label>
              <select
                className="erp-select w-full text-xs"
                value={newClientDocType}
                onChange={(e) => setNewClientDocType(e.target.value as 'DNI' | 'RUC')}
              >
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Número</label>
              <input
                type="text"
                required
                className="erp-input w-full text-xs"
                value={newClientDocNum}
                onChange={(e) => setNewClientDocNum(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowClientModal(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              Registrar
            </button>
          </div>
        </form>
      </Modal>

      {/* Checkout Modal */}
      <Modal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        title="Finalizar Venta e Imprimir Comprobante"
        maxWidth="500px"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Tipo de Comprobante</label>
              <select
                className="erp-select w-full text-sm"
                value={tipoComprobante}
                onChange={(e) => setTipoComprobante(e.target.value as 'BOLETA' | 'FACTURA')}
              >
                <option value="BOLETA">Boleta de Venta</option>
                <option value="FACTURA">Factura de Venta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Número de Serie & Correlativo</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  className="erp-input w-16 text-center text-sm"
                  disabled
                  value={serie}
                />
                <input
                  type="text"
                  className="erp-input w-full text-sm"
                  placeholder="Correlativo"
                  value={correlativo}
                  onChange={(e) => setCorrelativo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Cash payments */}
          <div>
            <label className="block text-xs mb-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(pm => {
                const isSelected = payments.some(p => p.idMetodoPago === pm.idMetodoPago)
                return (
                  <button
                    key={pm.idMetodoPago}
                    type="button"
                    onClick={() => {
                      setPayments([
                        {
                          idMetodoPago: pm.idMetodoPago!,
                          monto: subtotalCart,
                          numeroOperacion: pm.requiereOperacion ? 'OP-' + Math.floor(1000 + Math.random() * 9000) : undefined
                        }
                      ])
                    }}
                    className={`btn text-xs font-semibold cursor-pointer transition-all text-center flex items-center justify-center gap-1.5 ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {isSelected && <Check size={14} />}
                    {pm.nombre}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Operation code if required */}
          {payments.some(p => {
            const pm = paymentMethods.find(m => m.idMetodoPago === p.idMetodoPago)
            return pm?.requiereOperacion
          }) && (
            <div>
              <label className="block text-xs mb-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Número de Operación / Ref</label>
              <input
                type="text"
                className="erp-input w-full text-sm"
                placeholder="Ingrese código de transacción bancaria"
                value={payments[0]?.numeroOperacion || ''}
                onChange={(e) => {
                  const updated = [...payments]
                  updated[0].numeroOperacion = e.target.value
                  setPayments(updated)
                }}
              />
            </div>
          )}

          <div className="p-4 rounded-xl space-y-2 border-default" style={{ background: 'var(--color-surface-2)' }}>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>S/. {(subtotalCart / 1.18).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>IGV (18%)</span>
              <span>S/. {(subtotalCart - (subtotalCart / 1.18)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
              <span>Monto Total</span>
              <span>S/. {subtotalCart.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowCheckout(false)}
              className="btn btn-ghost"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleProcessOrder}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Procesando...' : 'Confirmar Venta y Pago'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
