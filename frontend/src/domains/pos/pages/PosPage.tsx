import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../../store'
import { api } from '../../../shared/services/api'
import { Categoria, Producto, ComboProducto, Cliente, MetodoPago, Pedido, Venta, VarianteProducto } from '../../../shared/types'
import { Modal } from '../../../shared/components/ui/Modal'
import { ProductGrid } from '../components/ProductGrid'
import { CartPanel } from '../components/CartPanel'
import { CajaModal } from '../components/CajaModal'
import { Coins, Check, CreditCard, User, Key, Receipt, IdentificationCard } from '@phosphor-icons/react'
import { Card } from '../../../components/Ui/Card'
import { Button } from '../../../components/Ui/Button'
import { Input } from '../../../components/Ui/Input'

export const PosPage: React.FC = () => {
  const { caja, setCaja, cart, addToCart, removeFromCart, updateCartQty, updateCartObservacion, clearCart } = useAppStore()

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

  // Modals visibility
  const [showClientModal, setShowClientModal] = useState(false)
  const [showCajaModal, setShowCajaModal] = useState(false)

  // New client form state
  const [newClientName, setNewClientName] = useState('')
  const [newClientApellido, setNewClientApellido] = useState('')
  const [newClientDocType, setNewClientDocType] = useState<'DNI' | 'RUC'>('DNI')
  const [newClientDocNum, setNewClientDocNum] = useState('')

  const [loading, setLoading] = useState(false)

  // Variant selector modal state
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Producto | null>(null)
  const [availableVariants, setAvailableVariants] = useState<VarianteProducto[]>([])
  const [selectedVariant, setSelectedVariant] = useState<VarianteProducto | null>(null)

  const loadData = async () => {
    try {
      const [catsRes, prodsRes, combosRes, clientsRes, pmRes, activeCaja] = await Promise.all([
        api.get<Categoria[]>('/api/v1/categorias'),
        api.get<Producto[]>('/api/v1/productos'),
        api.get<ComboProducto[]>('/api/v1/combos'),
        api.get<Cliente[]>('/api/v1/clientes'),
        api.get<MetodoPago[]>('/api/v1/metodo-pagos').catch(() => []),
        api.get<any>('/api/v1/cajas/activa').catch(() => null)
      ])

      setCategories(catsRes.filter(c => c.estado === 'ACTIVO'))
      setProducts(prodsRes.filter(p => p.estado === 'ACTIVO'))
      setCombos(combosRes.filter(c => c.estado === 'ACTIVO'))
      setClients(clientsRes.filter(c => c.estado === 'ACTIVO'))
      setCaja(activeCaja)

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
      console.error('Error loading POS data', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const subtotalCart = cart.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0)

  const handleAddProduct = async (p: Producto) => {
    try {
      const vars = await api.get<VarianteProducto[]>(`/api/v1/variantes/producto/${p.idProducto}`)
      const activeVars = vars.filter(v => v.estado === 'ACTIVO')
      if (activeVars.length > 0) {
        setSelectedProductForVariant(p)
        setAvailableVariants(activeVars)
        setSelectedVariant(activeVars[0])
        setShowVariantModal(true)
      } else {
        addToCart({
          producto: p,
          cantidad: 1,
          precioUnitario: p.precio,
          observacion: ''
        })
      }
    } catch (e) {
      addToCart({
        producto: p,
        cantidad: 1,
        precioUnitario: p.precio,
        observacion: ''
      })
    }
  }

  const handleConfirmVariant = () => {
    if (!selectedProductForVariant || !selectedVariant) return
    addToCart({
      producto: selectedProductForVariant,
      variante: selectedVariant,
      cantidad: 1,
      precioUnitario: selectedProductForVariant.precio + selectedVariant.precioExtra,
      observacion: ''
    })
    setShowVariantModal(false)
    setSelectedProductForVariant(null)
    setSelectedVariant(null)
  }

  const handleAddCombo = (c: ComboProducto) => {
    addToCart({
      combo: c,
      cantidad: 1,
      precioUnitario: c.precio,
      observacion: ''
    })
  }

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
      console.error(e.message || 'Error registrando cliente')
    }
  }

  const handleConfirmPedido = async () => {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const detalles = cart.map(item => ({
        idProducto: item.producto?.idProducto || null,
        idCombo: item.combo?.idCombo || null,
        idVariante: item.variante?.idVariante || null,
        cantidad: item.cantidad,
        observacion: item.observacion || null,
        extrasIds: []
      }))

      const pedidoReq = {
        idCliente: selectedClient?.idCliente || null,
        detalles
      }

      await api.post<Pedido>('/api/v1/pedidos', pedidoReq)
      clearCart()
      setSelectedClient(null)
      alert('Comanda registrada y enviada a cocina con éxito')
    } catch (e: any) {
      console.error(e.message || 'Error registrando el pedido')
      alert(e.message || 'Error registrando el pedido')
    } finally {
      setLoading(false)
    }
  }

  // 1. Vista de bloqueo con Estética Premium si la caja está cerrada
  if (!caja) {
    return (
      <div className="flex flex-col h-[82vh] justify-center items-center bg-[var(--color-surface-2)] -m-6">
        <Card padded={false} className="flex flex-col items-center justify-center p-8 text-center border-default max-w-md w-full shadow-xl bg-[var(--color-surface)] rounded-2xl">
          <div className="p-4 rounded-full bg-red-50 text-[var(--color-danger)] mb-4 animate-bounce">
            <Coins size={42} weight="duotone" />
          </div>
          <h2 className="text-lg font-black mb-1.5" style={{ color: 'var(--text-primary)' }}>Terminal de Venta Inactivo</h2>
          <p style={{ color: 'var(--text-muted)' }} className="text-xs leading-relaxed max-w-xs mb-6">
            Es obligatorio realizar la apertura de turno de la caja registradora para poder procesar transacciones y facturar órdenes.
          </p>
          <Button onClick={() => setShowCajaModal(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold">
            <Key size={16} weight="bold" />
            Abrir Caja y Turno Real
          </Button>
        </Card>
        <CajaModal open={showCajaModal} onClose={() => setShowCajaModal(false)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[82vh] -m-6 overflow-hidden bg-[var(--color-surface-2)]">

      {/* BARRA DE ACCIÓN SUPERIOR CONTROLADA (Toma de pedidos simplificada) */}
      <div className="bg-[var(--color-surface)] px-6 py-2.5 border-b border-default flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
            Terminal POS Toma de Pedidos • Turno #{caja.idCaja}
          </span>
        </div>
      </div>

      {/* ÁREA DE TRABAJO SPLIT: Catálogo / Carrito */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">

        {/* Lado Izquierdo: Buscador y Grilla de Productos */}
        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden p-5">
          <ProductGrid
            categories={categories}
            products={products}
            combos={combos}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddProduct={handleAddProduct}
            onAddCombo={handleAddCombo}
          />
        </div>

        {/* Lado Derecho: Sidebar de la Orden en cola */}
        <div className="lg:col-span-1 bg-[var(--color-surface)] lg:border-l border-default p-5 flex flex-col h-full overflow-hidden shadow-sm">
          <CartPanel
            cart={cart}
            clients={clients}
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
            onRemove={removeFromCart}
            onUpdateQty={updateCartQty}
            onUpdateObs={updateCartObservacion}
            onCheckout={handleConfirmPedido}
            setShowClientModal={setShowClientModal}
            onCajaClick={() => setShowCajaModal(true)}
          />
        </div>
      </div>

      {/* Modales Compartidos Re-estructurados */}
      <CajaModal open={showCajaModal} onClose={() => setShowCajaModal(false)} />

      {/* Registrar Cliente Nuevo */}
      <Modal open={showClientModal} onClose={() => setShowClientModal(false)} title="Registrar Nuevo Cliente" maxWidth="420px">
        <form onSubmit={handleCreateClient} className="space-y-4 text-left p-1">
          <div className="flex items-center gap-2.5 mb-2 pb-2 border-b border-default">
            <IdentificationCard size={20} className="text-[var(--color-primary)]" />
            <span className="text-xs font-bold text-[var(--text-secondary)]">Datos de Identidad Comercial</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombres" type="text" required value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
            <Input label="Apellidos" type="text" required value={newClientApellido} onChange={(e) => setNewClientApellido(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] mb-1 font-bold text-[var(--text-secondary)]">Tipo Doc.</label>
              <select className="erp-select w-full text-xs rounded-xl h-[38px]" value={newClientDocType} onChange={(e) => setNewClientDocType(e.target.value as 'DNI' | 'RUC')}>
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
              </select>
            </div>
            <div className="col-span-2">
              <Input label="Número de Documento" type="text" required value={newClientDocNum} onChange={(e) => setNewClientDocNum(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t border-default">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowClientModal(false)}>Cancelar</Button>
            <Button size="sm" type="submit" className="font-bold">Guardar Cliente</Button>
          </div>
        </form>
      </Modal>



      {/* Selector de Variantes Integrado */}
      <Modal open={showVariantModal} onClose={() => { setShowVariantModal(false); setSelectedProductForVariant(null); setSelectedVariant(null); }} title={`Opciones de Presentación`} maxWidth="400px">
        <div className="space-y-4 text-left p-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-0.5">Producto Base</span>
            <span className="text-sm font-black text-[var(--text-primary)]">{selectedProductForVariant?.nombre}</span>
          </div>
          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-0.5">
            {availableVariants.map(v => {
              const isSelected = selectedVariant?.idVariante === v.idVariante
              return (
                <Button
                  key={v.idVariante}
                  type="button"
                  variant={isSelected ? 'primary' : 'secondary'}
                  onClick={() => setSelectedVariant(v)}
                  className="w-full text-xs font-bold text-left flex justify-between items-center bg-[var(--color-surface)] border"
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-color)',
                    color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)',
                    background: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    boxShadow: 'none'
                  }}
                >
                  <div>
                    <span>{v.nombre}</span>
                    {v.descripcion && <span className="block text-[10px] font-normal text-gray-400 mt-0.5">{v.descripcion}</span>}
                  </div>
                  <span className="font-mono font-bold bg-[var(--color-surface-2)] px-2 py-0.5 rounded-md text-[11px]" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                    {v.precioExtra >= 0 ? `+ S/. ${v.precioExtra.toFixed(2)}` : `- S/. ${Math.abs(v.precioExtra).toFixed(2)}`}
                  </span>
                </Button>
              )
            })}
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t border-default">
            <Button variant="ghost" size="sm" onClick={() => { setShowVariantModal(false); setSelectedProductForVariant(null); setSelectedVariant(null); }}>Cancelar</Button>
            <Button size="sm" onClick={handleConfirmVariant} disabled={!selectedVariant} className="font-bold">Agregar Variación</Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}