import React, { useEffect, useState } from 'react'
import { useAppStore, CartItem } from '../store'
import { api } from '../api'
import { Categoria, Producto, ComboProducto, Cliente, MetodoPago, Pedido, Venta } from '../types'
import { ShoppingCart, Tag, MagnifyingGlass, User, Trash, Plus, Minus, CreditCard, Coins, Check, FileText } from '@phosphor-icons/react'

export const POS: React.FC = () => {
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
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh]">
        <Coins size={64} className="text-gray-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">POS Bloqueado</h2>
        <p className="text-gray-400 max-w-md">Debe abrir el control de Caja para poder habilitar la pantalla de ventas y facturación.</p>
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
        <div className="glass-panel double-bezel rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
          <div className="relative w-full md:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <MagnifyingGlass size={18} />
            </span>
            <input
              type="text"
              className="glass-input pl-10 py-1.5 w-full text-sm"
              placeholder="Buscar plato o bebida..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${selectedCategory === 'ALL' ? 'bg-purple-600 text-white' : 'bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300'}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.idCategoria}
                onClick={() => setSelectedCategory(cat.idCategoria!)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${selectedCategory === cat.idCategoria ? 'bg-purple-600 text-white' : 'bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300'}`}
              >
                {cat.nombre}
              </button>
            ))}
            <button
              onClick={() => setSelectedCategory('COMBOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${selectedCategory === 'COMBOS' ? 'bg-purple-600 text-white' : 'bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300'}`}
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
                  className="glass-card rounded-xl p-4 text-left cursor-pointer flex flex-col justify-between h-36"
                >
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-semibold mb-2">
                      COMBO
                    </span>
                    <h4 className="text-white text-sm font-semibold m-0 leading-tight line-clamp-2">{combo.nombre}</h4>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{combo.descripcion || 'Sin descripción'}</p>
                  </div>
                  <span className="text-purple-400 font-bold text-sm mt-2">S/. {combo.precio.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(prod => (
                <div
                  key={prod.idProducto}
                  onClick={() => handleAddProduct(prod)}
                  className="glass-card rounded-xl p-4 text-left cursor-pointer flex flex-col justify-between h-36"
                >
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-white/5 text-gray-400 text-[10px] font-semibold mb-2">
                      {prod.tipoProducto === 'PREPARADO' ? 'Cocina' : 'Inventario'}
                    </span>
                    <h4 className="text-white text-sm font-semibold m-0 leading-tight line-clamp-2">{prod.nombre}</h4>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{prod.descripcion || 'Sin descripción'}</p>
                  </div>
                  <span className="text-purple-400 font-bold text-sm mt-2">S/. {prod.precio.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Shopping Cart & Checkout drawer */}
      <div className="lg:col-span-1 glass-panel double-bezel rounded-2xl p-6 flex flex-col h-full overflow-hidden text-left">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 shrink-0">
          <ShoppingCart size={22} className="text-purple-400" />
          Orden de Venta
        </h3>

        {/* Client selector */}
        <div className="mb-4 shrink-0 bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={18} className="text-purple-400" />
            {selectedClient ? (
              <div>
                <span className="text-white text-xs font-semibold block">{selectedClient.nombre} {selectedClient.apellido}</span>
                <span className="text-[10px] text-gray-400">{selectedClient.tipoDocumento}: {selectedClient.documentoIdentidad}</span>
              </div>
            ) : (
              <span className="text-gray-400 text-xs">Público General (Por defecto)</span>
            )}
          </div>
          <div className="flex gap-2">
            {selectedClient && (
              <button
                onClick={() => setSelectedClient(null)}
                className="text-[10px] text-red-400 hover:underline cursor-pointer"
              >
                Limpiar
              </button>
            )}
            <select
              className="glass-input text-[11px] py-1 max-w-[120px] bg-[#0d0f14]"
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
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-12">
              <ShoppingCart size={32} className="mb-2" />
              <p className="text-xs">El carrito está vacío</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartId} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="text-white text-xs font-semibold leading-snug">
                      {item.producto?.nombre || item.combo?.nombre}
                    </h5>
                    <span className="text-[10px] text-purple-400 font-bold">
                      S/. {item.precioUnitario.toFixed(2)} c/u
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="text-red-400 hover:text-red-300 cursor-pointer shrink-0"
                  >
                    <Trash size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <input
                    type="text"
                    placeholder="Nota..."
                    className="glass-input py-0.5 px-2 text-[10px] flex-1"
                    value={item.observacion || ''}
                    onChange={(e) => updateCartObservacion(item.cartId, e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(item.cartId, item.cantidad - 1)}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-white text-xs font-semibold">{item.cantidad}</span>
                    <button
                      onClick={() => updateCartQty(item.cartId, item.cantidad + 1)}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-white cursor-pointer"
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
        <div className="shrink-0 border-t border-white/5 pt-4 space-y-4">
          <div className="flex justify-between text-white font-semibold">
            <span>Total a Pagar</span>
            <span className="text-lg text-purple-400">S/. {subtotalCart.toFixed(2)}</span>
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <CreditCard size={20} />
            Proceder al Cobro
          </button>
        </div>
      </div>

      {/* New Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel double-bezel rounded-2xl p-6 w-full max-w-sm text-left">
            <h4 className="text-white font-bold text-lg mb-4">Registrar Nuevo Cliente</h4>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  className="glass-input w-full text-xs"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">Apellido</label>
                <input
                  type="text"
                  required
                  className="glass-input w-full text-xs"
                  value={newClientApellido}
                  onChange={(e) => setNewClientApellido(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Tipo Doc.</label>
                  <select
                    className="glass-input w-full text-xs bg-[#0d0f14]"
                    value={newClientDocType}
                    onChange={(e) => setNewClientDocType(e.target.value as 'DNI' | 'RUC')}
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Número</label>
                  <input
                    type="text"
                    required
                    className="glass-input w-full text-xs"
                    value={newClientDocNum}
                    onChange={(e) => setNewClientDocNum(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Drawer/Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel double-bezel rounded-2xl p-6 w-full max-w-md text-left">
            <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <FileText size={22} className="text-purple-400" />
              Finalizar Venta e Imprimir Comprobante
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tipo de Comprobante</label>
                  <select
                    className="glass-input w-full text-sm bg-[#0d0f14]"
                    value={tipoComprobante}
                    onChange={(e) => setTipoComprobante(e.target.value as 'BOLETA' | 'FACTURA')}
                  >
                    <option value="BOLETA">Boleta de Venta</option>
                    <option value="FACTURA">Factura de Venta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Número de Serie & Correlativo</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      className="glass-input w-16 text-center text-sm"
                      disabled
                      value={serie}
                    />
                    <input
                      type="text"
                      className="glass-input w-full text-sm"
                      placeholder="Correlativo"
                      value={correlativo}
                      onChange={(e) => setCorrelativo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Cash payments */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Método de Pago</label>
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
                        className={`py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center flex items-center justify-center gap-1.5 ${isSelected ? 'bg-purple-600/25 border-purple-500 text-purple-300' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}
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
                  <label className="block text-xs text-gray-400 mb-1">Número de Operación / Ref</label>
                  <input
                    type="text"
                    className="glass-input w-full text-sm"
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

              <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Subtotal</span>
                  <span>S/. {(subtotalCart / 1.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>IGV (18%)</span>
                  <span>S/. {(subtotalCart - (subtotalCart / 1.18)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-white font-bold border-t border-white/5 pt-2">
                  <span>Monto Total</span>
                  <span>S/. {subtotalCart.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleProcessOrder}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-semibold text-xs cursor-pointer shadow-lg shadow-green-600/30"
                >
                  {loading ? 'Procesando...' : 'Confirmar Venta y Pago'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
