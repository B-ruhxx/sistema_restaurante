import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useERP, Product, Customer } from '../contexts/ERPContext';
import { mesasApi } from '../../api/mesas';
import { pedidosApi, Pedido } from '../../api/pedidos';
import { precuentasApi } from '../../api/precuentas';
import { variantesApi } from '../../api/variantes';
import { extrasApi, ExtraProducto } from '../../api/extras';
import { toast } from '../../lib/notifications';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import {
  Search, Plus, Minus, X, CreditCard, Pencil, Trash2,
  BookOpen, User, UserSearch, UserPlus, ChevronRight,
  Clock, Flame, CheckCircle2, Package, BadgeCheck, ChefHat,
  ShoppingCart, AlertTriangle,
} from 'lucide-react';
import { cn } from '../components/ui/utils';

/* ── Categorías ─────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'todos',        label: 'Todos' },
  { id: 'hamburguesas', label: 'Hamburguesas' },
  { id: 'pizzas',       label: 'Pizzas' },
  { id: 'ensaladas',    label: 'Ensaladas' },
  { id: 'pastas',       label: 'Pastas' },
  { id: 'bebidas',      label: 'Bebidas' },
  { id: 'postres',      label: 'Postres' },
  { id: 'mexicano',     label: 'Mexicano' },
  { id: 'sushi',        label: 'Sushi' },
  { id: 'peruano',      label: 'Peruano' },
];

/* ── Estados del pedido ─────────────────────────────────────── */
type PosStatus = 'draft' | 'pendiente' | 'en-cocina' | 'listo' | 'entregado' | 'cobrado';

const STATUS_META: Record<PosStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: 'Armando pedido',   color: 'text-gray-500',   icon: ShoppingCart },
  pendiente: { label: 'Pendiente',         color: 'text-amber-600',  icon: Clock },
  'en-cocina': { label: 'En preparación', color: 'text-blue-600',   icon: Flame },
  listo:     { label: 'Listo para servir',color: 'text-green-600',  icon: CheckCircle2 },
  entregado: { label: 'Entregado',         color: 'text-teal-600',   icon: Package },
  cobrado:   { label: 'Cobrado',           color: 'text-purple-600', icon: BadgeCheck },
};

/* ── Tipo cliente selector ──────────────────────────────────── */
type CustomerMode = 'generic' | 'search' | 'create';

export function POS() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const {
    products,
    customers,
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    cashRegister,
    createCustomer,
  } = useERP();

  const isCajaAbierta = cashRegister && cashRegister.status === 'abierta';
  const [selectedMesaId, setSelectedMesaId] = useState('');
  const [activePedido, setActivePedido] = useState<Pedido | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const mesasDisponiblesQuery = useQuery({
    queryKey: ['mesas', 'disponibles'],
    queryFn: mesasApi.getDisponibles,
    refetchOnWindowFocus: false,
  });

  const { data: allExtras = [] } = useQuery<ExtraProducto[]>({
    queryKey: ['extras'],
    queryFn: extrasApi.getAll,
    staleTime: 30_000,
  });

  useEffect(() => {
    const mesaFromUrl = searchParams.get('mesa');
    if (mesaFromUrl) {
      setSelectedMesaId(mesaFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadActivePedido = async () => {
      if (!selectedMesaId) {
        setActivePedido(null);
        return;
      }
      const pedido = await pedidosApi.getActivoPorMesa(Number(selectedMesaId));
      setActivePedido(pedido);
      if (!pedido) {
        setPosStatus('draft');
        return;
      }
      if (pedido.estado === 'LISTO') setPosStatus('listo');
      else if (pedido.estado === 'ENTREGADO' || pedido.estado === 'CUENTA_SOLICITADA' || pedido.estado === 'CUENTA_EMITIDA') setPosStatus('entregado');
      else if (pedido.estado === 'ENVIADO_COCINA' || pedido.estado === 'EN_PREPARACION') setPosStatus('en-cocina');
      else setPosStatus('draft');
    };

    loadActivePedido().catch(() => {
      setActivePedido(null);
      setPosStatus('draft');
    });
  }, [selectedMesaId]);

  // Dynamic categories computed from product categories present in the database
  const categories = [
    { id: 'todos', label: 'Todos' },
    ...Array.from(new Set(products.map(p => p.category)))
      .filter(Boolean)
      .map(cat => ({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1)
      }))
  ];

  /* filtros */
  const [category, setCategory]   = useState('todos');
  const [search, setSearch]       = useState('');

  /* modal personalización */
  const [editProduct, setEditProduct]   = useState<Product | null>(null);
  const [editVariant, setEditVariant]   = useState('');
  const [editExtras, setEditExtras]     = useState<string[]>([]);
  const [editNotes, setEditNotes]       = useState('');

  /* cliente */
  const [customerMode, setCustomerMode]       = useState<CustomerMode>('generic');
  const [customerSearch, setCustomerSearch]   = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer]         = useState({ name: '', doc: '', phone: '' });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  /* estado del pedido POS */
  const [posStatus, setPosStatus] = useState<PosStatus>('draft');

  const filteredProducts = products.filter(p => {
    const matchCat    = category === 'todos' || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  /* abrir modal customización */
  const openEdit = (product: Product) => {
    if (posStatus !== 'draft' && posStatus !== 'pendiente') return;
    if (product.variants || product.extras) {
      setEditProduct(product);
      setEditVariant(product.variants?.[0]?.name || '');
      setEditExtras([]);
      setEditNotes('');
    } else {
      addToCart(product);
    }
  };

  const confirmAdd = () => {
    if (!editProduct) return;
    addToCart(editProduct, editVariant, editExtras, editNotes);
    setEditProduct(null);
  };

  /* transiciones de estado */
  const canEdit    = posStatus === 'draft' || posStatus === 'pendiente';
  const statusFlow: Partial<Record<PosStatus, PosStatus>> = {
    draft:      'en-cocina',
    'en-cocina':'listo',
    listo:      'entregado',
  };
  const nextStatus = statusFlow[posStatus];
  const actionLabel: Partial<Record<PosStatus, string>> = {
    draft:      'Enviar a Cocina',
    'en-cocina':'Esperando cocina',
    listo:      'Marcar Entregado',
    entregado:  'Emitir Precuenta',
  };

  const mapCartItemToDetalle = async (item: typeof cart[number]) => {
    let idVariante: number | undefined;
    if (item.variant) {
      const variantes = await queryClient.fetchQuery({
        queryKey: ['variantes', Number(item.productId)],
        queryFn: () => variantesApi.getByProducto(Number(item.productId)),
      });
      idVariante = variantes.find(v => v.nombre === item.variant)?.idVariante;
    }

    const extrasIds = (item.extras || [])
      .map(extraName => allExtras.find(extra => extra.nombre === extraName)?.idExtra)
      .filter((id): id is number => typeof id === 'number');

    return {
      idProducto: Number(item.productId),
      idVariante,
      cantidad: item.quantity,
      observacion: item.notes,
      extrasIds,
    };
  };

  const submitOrderToKitchen = async () => {
    if (!selectedMesaId) {
      toast.error('Selecciona una mesa libre');
      return;
    }
    if (cart.length === 0) {
      toast.error('Agrega productos al pedido');
      return;
    }

    try {
      setIsSubmittingOrder(true);
      if (activePedido?.estado === 'CUENTA_EMITIDA' || activePedido?.estado === 'PAGADO' || activePedido?.estado === 'CANCELADO') {
        toast.error('Este pedido ya no admite nuevos productos');
        return;
      }

      const pedido = activePedido || await pedidosApi.createForMesa(Number(selectedMesaId), {
        idCliente: selectedCustomer ? Number(selectedCustomer.id) : null,
      });

      for (const item of cart) {
        await pedidosApi.addDetalle(pedido.idPedido, await mapCartItemToDetalle(item));
      }

      const enviado = await pedidosApi.enviarCocina(pedido.idPedido);
      setActivePedido(enviado);
      setPosStatus('en-cocina');
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      queryClient.invalidateQueries({ queryKey: ['mesas', 'disponibles'] });
      queryClient.invalidateQueries({ queryKey: ['cocina', 'comandas'] });
      toast.success(`Pedido #${enviado.idPedido} enviado a cocina`);
      clearCart();
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const markDelivered = async () => {
    if (!activePedido) {
      setPosStatus('entregado');
      return;
    }
    const updated = await pedidosApi.updateEstado(activePedido.idPedido, 'ENTREGADO');
    setActivePedido(updated);
    setPosStatus('entregado');
    queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    queryClient.invalidateQueries({ queryKey: ['mesas'] });
    toast.success('Pedido marcado como entregado');
  };

  const emitPrecuenta = async () => {
    if (!activePedido) {
      toast.error('No hay pedido activo para emitir precuenta');
      return;
    }

    if (activePedido.estado === 'CUENTA_EMITIDA') {
      toast.success('La precuenta ya fue emitida');
      navigate('/caja');
      return;
    }

    if (activePedido.estado === 'ENTREGADO') {
      await pedidosApi.solicitarCuenta(activePedido.idPedido);
    }

    const precuenta = await precuentasApi.emitir(activePedido.idPedido);
    const refreshed = await pedidosApi.getById(activePedido.idPedido);
    setActivePedido(refreshed);
    setPosStatus('entregado');
    queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    queryClient.invalidateQueries({ queryKey: ['mesas'] });
    queryClient.invalidateQueries({ queryKey: ['precuentas'] });
    queryClient.invalidateQueries({ queryKey: ['caja', 'pedidos-pendientes'] });
    toast.success(`Precuenta ${precuenta.numero} emitida`);
    navigate('/caja');
  };

  const refreshActivePedido = async () => {
    if (!activePedido) return;
    const refreshed = await pedidosApi.getById(activePedido.idPedido);
    setActivePedido(refreshed);
    if (refreshed.estado === 'LISTO') setPosStatus('listo');
    if (refreshed.estado === 'ENTREGADO' || refreshed.estado === 'CUENTA_EMITIDA') setPosStatus('entregado');
    toast.info(`Estado actual: ${refreshed.estado.replaceAll('_', ' ')}`);
  };

  const handleAction = async () => {
    if (activePedido && cart.length > 0) {
      await submitOrderToKitchen();
      return;
    }
    if (posStatus === 'draft') {
      await submitOrderToKitchen();
      return;
    }
    if (posStatus === 'en-cocina') {
      toast.info('Cocina debe marcar el pedido como listo');
      return;
    }
    if (posStatus === 'listo') {
      await markDelivered();
      return;
    }
    if (posStatus === 'entregado') {
      await emitPrecuenta();
      return;
    }
    if (nextStatus) setPosStatus(nextStatus);
  };

  const handleNewOrder = () => {
    clearCart();
    setPosStatus('draft');
    setSelectedCustomer(null);
    setCustomerMode('generic');
    setSelectedMesaId('');
    setActivePedido(null);
    queryClient.invalidateQueries({ queryKey: ['mesas', 'disponibles'] });
  };

  const handleCreateCustomer = async () => {
    const name = newCustomer.name.trim();
    const documentNumber = newCustomer.doc.trim();
    const phone = newCustomer.phone.trim();

    if (!name) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }

    if (!documentNumber) {
      toast.error('Ingresa DNI o RUC del cliente');
      return;
    }

    const documentType: Customer['documentType'] = documentNumber.length === 11 ? 'RUC' : 'DNI';

    try {
      setIsCreatingCustomer(true);
      const customer = await createCustomer({
        name,
        documentType,
        documentNumber,
        phone: phone || undefined,
      });
      setSelectedCustomer(customer);
      setCustomerMode('search');
      setCustomerSearch('');
      setNewCustomer({ name: '', doc: '', phone: '' });
      toast.success('Cliente guardado correctamente');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo guardar el cliente');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  /* clientes filtrados */
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.documentNumber.includes(customerSearch)
  );

  const requiresCartForAction = posStatus === 'draft' || (posStatus === 'en-cocina' && cart.length > 0);
  const actionDisabled = isSubmittingOrder
    || (requiresCartForAction && cart.length === 0)
    || (posStatus === 'draft' && !selectedMesaId);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden bg-[#f8f7f5] dark:bg-background">

      {/* ── Top bar: search + category chips ─────────────────── */}
      <div className="bg-white dark:bg-card border-b border-border px-4 py-2 flex items-center gap-3 shrink-0">
        {/* Icono POS */}
        <div className="w-8 h-8 rounded-xl bg-[#e8f0fe] dark:bg-blue-950 flex items-center justify-center shrink-0">
          <ChefHat className="w-4 h-4 text-[#4f7bf7] dark:text-blue-400" />
        </div>

        {/* Buscador */}
        <div className="relative w-52 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            className="pl-8 h-8 text-sm bg-[#f8f7f5] dark:bg-muted border-0 focus-visible:ring-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Chips categorías — scroll horizontal */}
        <div className="flex-1 overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 min-w-max">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 border',
                  category === cat.id
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white dark:bg-card text-muted-foreground border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main body ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Producto grid ───────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Search className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} onAdd={openEdit} disabled={!canEdit} />
              ))}
            </div>
          )}
        </main>

        {/* ── Order Panel ─────────────────────────────────────── */}
        <aside className="w-80 xl:w-88 bg-white dark:bg-card border-l border-border flex flex-col shrink-0">

          {/* Status bar */}
          <div className={cn(
            'px-4 py-2.5 border-b border-border flex items-center gap-2',
            posStatus === 'draft' ? 'bg-gray-50 dark:bg-muted/30' : 'bg-amber-50 dark:bg-amber-950/20'
          )}>
            {(() => {
              const meta = STATUS_META[posStatus];
              const Icon = meta.icon;
              return (
                <>
                  <Icon className={cn('w-4 h-4', meta.color)} />
                  <span className={cn('text-xs font-semibold', meta.color)}>{meta.label}</span>
                </>
              );
            })()}
          </div>

          {/* Caja cerrada warning */}
          {!isCajaAbierta && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/50 px-4 py-2 flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-500" />
              <span className="text-[11px] font-medium leading-tight">
                Caja cerrada. Abre la caja en Gestión de Caja para cobrar pedidos.
              </span>
            </div>
          )}

          {/* Customer selector */}
          <CustomerSelector
            mode={customerMode}
            setMode={setCustomerMode}
            customerSearch={customerSearch}
            setCustomerSearch={setCustomerSearch}
            filteredCustomers={filteredCustomers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            newCustomer={newCustomer}
            setNewCustomer={setNewCustomer}
            onCreateCustomer={handleCreateCustomer}
            isCreatingCustomer={isCreatingCustomer}
          />

          <div className="border-b border-border px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mesa</span>
              {activePedido && (
                <button
                  type="button"
                  className="text-[11px] font-medium text-red-600 hover:text-red-700"
                  onClick={refreshActivePedido}
                >
                  Actualizar estado
                </button>
              )}
            </div>
            {activePedido ? (
              <div className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-2.5 py-1.5">
                <span className="text-sm font-medium">
                  Pedido #{activePedido.idPedido} · {activePedido.numeroMesa ? `Mesa ${activePedido.numeroMesa}` : 'Mesa asignada'}
                </span>
                <span className="text-[10px] text-muted-foreground">{activePedido.estado.replaceAll('_', ' ')}</span>
              </div>
            ) : (
              <select
                value={selectedMesaId}
                onChange={(event) => setSelectedMesaId(event.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-sm"
              >
                <option value="">Selecciona una mesa libre</option>
                {(mesasDisponiblesQuery.data || []).map(mesa => (
                  <option key={mesa.idMesa} value={mesa.idMesa}>
                    Mesa {mesa.numero}{mesa.nombre ? ` · ${mesa.nombre}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Items */}
          <ScrollArea className="flex-1 px-3 py-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-center">
                <ShoppingCart className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">Agrega productos al pedido</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {cart.map(item => (
                  <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/40 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{item.name}</p>
                      {item.variant && <p className="text-[11px] text-muted-foreground">{item.variant}</p>}
                      {item.extras?.length ? (
                        <p className="text-[11px] text-muted-foreground">+{item.extras.join(', ')}</p>
                      ) : null}
                      {item.notes && (
                        <p className="text-[11px] text-muted-foreground italic">"{item.notes}"</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-bold text-red-600">
                        S/ {(item.price * item.quantity).toFixed(2)}
                      </span>
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            className="w-5 h-5 rounded-full border border-gray-200 dark:border-border flex items-center justify-center text-gray-400 hover:border-red-400 hover:text-red-600 transition-colors"
                            onClick={() => updateCartItem(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            className="w-5 h-5 rounded-full border border-gray-200 dark:border-border flex items-center justify-center text-gray-400 hover:border-red-400 hover:text-red-600 transition-colors"
                            onClick={() => updateCartItem(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                          <button
                            className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors ml-0.5"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Status flow progress */}
          {posStatus !== 'draft' && (
            <div className="px-4 py-2 border-t border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Progreso</span>
              </div>
              <div className="flex items-center gap-1">
                {(['pendiente', 'en-cocina', 'listo', 'entregado', 'cobrado'] as PosStatus[]).map((s, i) => {
                  const steps: PosStatus[] = ['pendiente', 'en-cocina', 'listo', 'entregado', 'cobrado'];
                  const currentIdx = steps.indexOf(posStatus);
                  const stepIdx   = i;
                  const done      = stepIdx <= currentIdx;
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <div className={cn(
                        'w-2 h-2 rounded-full shrink-0 transition-colors',
                        done ? 'bg-red-600' : 'bg-gray-200 dark:bg-muted'
                      )} />
                      {i < 4 && (
                        <div className={cn(
                          'h-0.5 flex-1 mx-0.5 transition-colors',
                          stepIdx < currentIdx ? 'bg-red-600' : 'bg-gray-200 dark:bg-muted'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {(['Pendiente', 'Cocina', 'Listo', 'Entregado', 'Cobrado']).map(l => (
                  <span key={l} className="text-[9px] text-muted-foreground text-center flex-1">{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
              </span>
              <span className="text-xl font-extrabold text-red-600">S/ {cartTotal.toFixed(2)}</span>
            </div>

            {/* Botón principal de acción */}
            {posStatus !== 'cobrado' ? (
              <button
                disabled={actionDisabled}
                onClick={handleAction}
                className={cn(
                  'w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                  actionDisabled
                    ? 'bg-gray-100 dark:bg-muted text-gray-300 cursor-not-allowed'
                  : posStatus === 'entregado'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                )}
              >
                {posStatus === 'entregado'
                  ? cart.length > 0
                    ? <><ChefHat className="w-4 h-4" /> Enviar nuevos productos</>
                    : <><CreditCard className="w-4 h-4" /> Emitir Precuenta</>
                  : posStatus === 'draft'
                  ? <><ChefHat className="w-4 h-4" /> {isSubmittingOrder ? 'Enviando...' : 'Enviar a Cocina'}</>
                  : activePedido && cart.length > 0
                  ? <><ChefHat className="w-4 h-4" /> Enviar nuevos productos</>
                  : <><ChevronRight className="w-4 h-4" /> {actionLabel[posStatus]}</>
                }
              </button>
            ) : (
              <div className="w-full h-11 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 flex items-center justify-center gap-2">
                <BadgeCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Pedido cobrado</span>
              </div>
            )}

            {/* Nuevo pedido / limpiar */}
            {(cart.length > 0 || posStatus !== 'draft') && (
              <button
                onClick={handleNewOrder}
                className="w-full text-xs text-muted-foreground hover:text-red-500 transition-colors py-0.5"
              >
                Nuevo pedido
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* ── Modal personalización producto ───────────────────── */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editProduct?.name}</DialogTitle>
            <DialogDescription>Personaliza tu pedido</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editProduct?.variants && (
              <div className="space-y-2">
                <Label>Variante</Label>
                <Tabs value={editVariant} onValueChange={setEditVariant}>
                  <TabsList
                    className="grid w-full"
                    style={{ gridTemplateColumns: `repeat(${editProduct.variants.length}, 1fr)` }}
                  >
                    {editProduct.variants.map(v => (
                      <TabsTrigger key={v.name} value={v.name}>
                        {v.name}<br />
                        <span className="text-[10px]">S/ {v.price}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            )}

            {editProduct?.extras && (
              <div className="space-y-2">
                <Label>Extras</Label>
                <div className="space-y-1.5">
                  {editProduct.extras.map(extra => (
                    <label
                      key={extra.name}
                      className="flex items-center justify-between p-2.5 border border-border rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editExtras.includes(extra.name)}
                          onChange={e =>
                            setEditExtras(e.target.checked
                              ? [...editExtras, extra.name]
                              : editExtras.filter(x => x !== extra.name)
                            )
                          }
                          className="accent-red-600"
                        />
                        <span className="text-sm">{extra.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">+S/ {extra.price.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                placeholder="Ej: Sin cebolla, poco picante..."
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setEditProduct(null)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              onClick={confirmAdd}
            >
              Agregar al pedido
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Customer Selector component ─────────────────────────────── */
function CustomerSelector({
  mode, setMode,
  customerSearch, setCustomerSearch,
  filteredCustomers, selectedCustomer, setSelectedCustomer,
  newCustomer, setNewCustomer,
  onCreateCustomer, isCreatingCustomer,
}: {
  mode: CustomerMode; setMode: (m: CustomerMode) => void;
  customerSearch: string; setCustomerSearch: (s: string) => void;
  filteredCustomers: Customer[]; selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer | null) => void;
  newCustomer: { name: string; doc: string; phone: string };
  setNewCustomer: (v: { name: string; doc: string; phone: string }) => void;
  onCreateCustomer: () => void;
  isCreatingCustomer: boolean;
}) {
  return (
    <div className="border-b border-border px-3 py-2.5 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</span>
        <div className="flex gap-1">
          <button
            onClick={() => { setMode('generic'); setSelectedCustomer(null); }}
            className={cn(
              'p-1 rounded text-muted-foreground transition-colors',
              mode === 'generic' ? 'text-red-600 bg-red-50 dark:bg-red-950/30' : 'hover:text-foreground hover:bg-muted'
            )}
            title="Cliente genérico"
          >
            <User className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMode('search')}
            className={cn(
              'p-1 rounded text-muted-foreground transition-colors',
              mode === 'search' ? 'text-red-600 bg-red-50 dark:bg-red-950/30' : 'hover:text-foreground hover:bg-muted'
            )}
            title="Buscar cliente"
          >
            <UserSearch className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMode('create')}
            className={cn(
              'p-1 rounded text-muted-foreground transition-colors',
              mode === 'create' ? 'text-red-600 bg-red-50 dark:bg-red-950/30' : 'hover:text-foreground hover:bg-muted'
            )}
            title="Crear cliente"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Generic */}
      {mode === 'generic' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-1.5">
          <User className="w-3.5 h-3.5 shrink-0" />
          <span>Cliente genérico</span>
        </div>
      )}

      {/* Search */}
      {mode === 'search' && (
        <div className="space-y-1.5">
          {selectedCustomer ? (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5">
              <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{selectedCustomer.name}</p>
                <p className="text-[10px] text-muted-foreground">{selectedCustomer.documentNumber}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-300 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  className="w-full pl-6 pr-2 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-red-400"
                  placeholder="Nombre o documento..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                />
              </div>
              {customerSearch.length > 0 && (
                <div className="max-h-24 overflow-y-auto rounded-lg border border-border bg-white dark:bg-card shadow-sm">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">Sin resultados</p>
                  ) : filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                    >
                      <p className="text-xs font-medium">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.documentNumber}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Create */}
      {mode === 'create' && (
        <div className="space-y-1.5">
          <input
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-red-400"
            placeholder="Nombre completo"
            value={newCustomer.name}
            onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <input
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-red-400"
              placeholder="DNI / RUC"
              value={newCustomer.doc}
              onChange={e => setNewCustomer({ ...newCustomer, doc: e.target.value })}
            />
            <input
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-red-400"
              placeholder="Teléfono"
              value={newCustomer.phone}
              onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
          </div>
          <button
            className="w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
            disabled={isCreatingCustomer}
            onClick={onCreateCustomer}
          >
            {isCreatingCustomer ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Product Card ─────────────────────────────────────────────── */
function ProductCard({
  product, onAdd, disabled,
}: { product: Product; onAdd: (p: Product) => void; disabled: boolean }) {
  const isOutOfStock = product.stock <= 0;
  const isCardDisabled = disabled || isOutOfStock;

  const stockBadge = isOutOfStock
    ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
    : product.stock < 5
    ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
    : product.stock < 20
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
    : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400';

  const hasOptions = !!(product.variants?.length || product.extras?.length);
  const productKindLabel = product.type === 'INVENTARIO_DIRECTO'
    ? hasOptions ? 'Variantes' : 'Directo'
    : hasOptions ? 'Personalizable' : 'Sin opciones';

  return (
    <div
      className={cn(
        'bg-white dark:bg-card rounded-2xl overflow-hidden border border-orange-100 dark:border-border shadow-sm transition-all duration-200 flex flex-col group',
        isCardDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
      )}
      onClick={() => !isCardDisabled && onAdd(product)}
    >
      {/* Imagen */}
      <div className="relative overflow-hidden" style={{ height: '140px' }}>
        <img
          src={product.image}
          alt={product.name}
          className={cn(
            'w-full h-full object-cover transition-transform duration-300',
            !isCardDisabled && 'group-hover:scale-105'
          )}
        />
        {/* Stock badge — esquina inferior izquierda */}
        <span className={cn(
          'absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm',
          stockBadge
        )}>
          {isOutOfStock ? 'Agotado' : `${product.stock} uds`}
        </span>
      </div>

      {/* Body */}
      <div className="p-2.5 flex flex-col flex-1 gap-1">
        {/* Nombre + categoría */}
        <div className="flex items-start gap-1">
          <p className="font-semibold text-xs leading-tight flex-1 line-clamp-2">{product.name}</p>
          <span className="shrink-0 bg-orange-50 dark:bg-orange-950/30 text-orange-500 border border-orange-200 dark:border-orange-800 text-[9px] font-medium px-1.5 py-0.5 rounded capitalize">
            {product.category}
          </span>
        </div>

        {/* Precio */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm font-extrabold text-red-600">S/ {product.price.toFixed(2)}</span>
          {hasOptions ? (
            <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-medium">
              <BookOpen className="w-3 h-3" />
              {productKindLabel}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">{productKindLabel}</span>
          )}
        </div>

        {/* Add button */}
        {!isCardDisabled && (
          <button
            className="w-full h-7 rounded-lg border border-red-200 dark:border-red-800 text-red-600 text-xs font-semibold hover:bg-red-600 hover:text-white transition-all duration-150 flex items-center justify-center gap-1 mt-0.5"
            onClick={e => { e.stopPropagation(); onAdd(product); }}
          >
            <Plus className="w-3 h-3" /> Agregar
          </button>
        )}
        {isOutOfStock && (
          <div className="w-full h-7 rounded-lg bg-gray-100 dark:bg-muted text-gray-400 text-xs font-semibold flex items-center justify-center gap-1 mt-0.5">
            Agotado
          </div>
        )}
      </div>
    </div>
  );
}
