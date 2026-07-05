import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useERP, Product, Customer } from '../contexts/ERPContextValue';
import { mesasApi } from '../../api/mesas';
import { pedidosApi, Pedido } from '../../api/pedidos';
import { precuentasApi } from '../../api/precuentas';
import { CLIENTE_TIPO_DOCUMENTO_VALUES, type ClienteTipoDocumento } from '../../api/clientes';
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
  Search, Plus, Minus, X, CreditCard,
  BookOpen, User, UserSearch, UserPlus, ChevronRight,
  Clock, Flame, CheckCircle2, Package, BadgeCheck, ChefHat,
  ShoppingCart, AlertTriangle,
} from 'lucide-react';
import { cn } from '../components/ui/utils';

/* ── Estados del pedido ─────────────────────────────────────── */
type PosStatus = 'draft' | 'pendiente' | 'en-cocina' | 'listo' | 'entregado' | 'cobrado';

const STATUS_META: Record<PosStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: 'Armando pedido',   color: 'text-muted-foreground', icon: ShoppingCart },
  pendiente: { label: 'Pendiente',         color: 'ui-status-warning', icon: Clock },
  'en-cocina': { label: 'En preparación', color: 'ui-status-info', icon: Flame },
  listo:     { label: 'Listo para servir', color: 'ui-status-success', icon: CheckCircle2 },
  entregado: { label: 'Entregado',         color: 'ui-status-success', icon: Package },
  cobrado:   { label: 'Cobrado',           color: 'ui-status-info', icon: BadgeCheck },
};

/* ── Tipo cliente selector ──────────────────────────────────── */
type CustomerMode = 'generic' | 'search' | 'create';

const DOCUMENT_LABELS: Record<ClienteTipoDocumento, string> = {
  DNI: 'DNI',
  RUC: 'RUC',
  CE: 'CE',
  PASAPORTE: 'Pasaporte',
  SIN_DOCUMENTO: 'Sin documento',
};

const DOCUMENT_PLACEHOLDERS: Record<ClienteTipoDocumento, string> = {
  DNI: 'DNI',
  RUC: 'RUC',
  CE: 'CE',
  PASAPORTE: 'Pasaporte',
  SIN_DOCUMENTO: 'Sin documento',
};

const isTipoDocumento = (value: string): value is ClienteTipoDocumento =>
  CLIENTE_TIPO_DOCUMENTO_VALUES.some((tipoDocumento) => tipoDocumento === value);

const getCustomerDocumentSummary = (customer: Pick<Customer, 'documentType' | 'documentNumber'>) => {
  const documentValue = customer.documentNumber || 'Sin identificador';
  return `${customer.documentType} · ${documentValue}`;
};

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
  const [selectedMesaId, setSelectedMesaId] = useState(() => searchParams.get('mesa') || '');
  const [activePedido, setActivePedido] = useState<Pedido | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [posStatus, setPosStatus] = useState<PosStatus>('draft');

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
      else if (pedido.estado === 'SERVIDO' || pedido.estado === 'CUENTA') setPosStatus('entregado');
      else if (pedido.estado === 'EN_COCINA') setPosStatus('en-cocina');
      else if (pedido.estado === 'CERRADO') setPosStatus('cobrado');
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
  const [newCustomer, setNewCustomer] = useState<{
    name: string;
    documentType: ClienteTipoDocumento;
    doc: string;
    phone: string;
  }>({
    name: '',
    documentType: 'DNI',
    doc: '',
    phone: '',
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchCat    = category === 'todos' || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  /* abrir modal customización */
  const openEdit = (product: Product) => {
    if (posStatus !== 'draft' && posStatus !== 'pendiente') return;
    if (!selectedMesaId) {
      toast.error('Selecciona una mesa antes de armar el pedido');
      return;
    }
    if (product.variants?.length && !product.variants.some(variant => variant.isAvailable)) {
      toast.warning('No hay SKUs disponibles para este producto');
      return;
    }
    if (product.variants || product.extras) {
      setEditProduct(product);
      setEditVariant(product.variants?.find(variant => variant.isAvailable)?.name || product.variants?.[0]?.name || '');
      setEditExtras([]);
      setEditNotes('');
    } else {
      addToCart(product);
    }
  };

  const confirmAdd = () => {
    if (!editProduct) return;
    const selectedVariant = editProduct.variants?.find(variant => variant.name === editVariant);
    if (editProduct.variants?.length && !selectedVariant?.isAvailable) {
      toast.warning('Selecciona un SKU con stock disponible');
      return;
    }
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
    const extrasIds = (item.extras || [])
      .map(extraName => allExtras.find(extra => extra.nombre === extraName)?.idExtra)
      .filter((id): id is number => typeof id === 'number');

    return {
      idProducto: Number(item.variantSkuProductId ?? item.productId),
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
      if (activePedido?.estado === 'CUENTA' || activePedido?.estado === 'CERRADO' || activePedido?.estado === 'CANCELADO') {
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
    const updated = await pedidosApi.updateEstado(activePedido.idPedido, 'SERVIDO');
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

    if (activePedido.estado === 'CUENTA') {
      toast.success('La precuenta ya fue emitida');
      navigate('/caja');
      return;
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
    if (refreshed.estado === 'SERVIDO' || refreshed.estado === 'CUENTA') setPosStatus('entregado');
    if (refreshed.estado === 'CERRADO') setPosStatus('cobrado');
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

    if (newCustomer.documentType !== 'SIN_DOCUMENTO' && !documentNumber) {
      toast.error('Ingresa el documento del cliente');
      return;
    }

    try {
      setIsCreatingCustomer(true);
      const customer = await createCustomer({
        name,
        documentType: newCustomer.documentType,
        documentNumber: newCustomer.documentType === 'SIN_DOCUMENTO' ? '' : documentNumber,
        phone: phone || undefined,
      });
      setSelectedCustomer(customer);
      setCustomerMode('search');
      setCustomerSearch('');
      setNewCustomer({ name: '', documentType: 'DNI', doc: '', phone: '' });
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
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden bg-surface-default dark:bg-background">

      {/* ── Top bar: search + category chips ─────────────────── */}
      <div className="bg-surface-panel border-b border-border px-4 py-2 flex items-center gap-3 shrink-0">
        {/* Icono POS */}
        <div className="w-8 h-8 rounded-xl bg-[var(--status-info-surface)] flex items-center justify-center shrink-0">
          <ChefHat className="w-4 h-4 text-[var(--status-info)]" />
        </div>

        {/* Buscador */}
        <div className="relative w-52 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            className="pl-8 h-8 text-sm bg-muted/40 border-border focus-visible:ring-1"
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
                    ? 'bg-[var(--action-primary)] text-white border-transparent shadow-sm'
                    : 'bg-surface-panel text-muted-foreground border-border hover:bg-[var(--status-info-surface)] hover:text-[var(--status-info)] hover:border-[var(--status-info)]'
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
                <ProductCard key={p.id} product={p} onAdd={openEdit} disabled={!canEdit || !selectedMesaId} />
              ))}
            </div>
          )}
        </main>

        {/* ── Order Panel ─────────────────────────────────────── */}
        <aside className="w-80 xl:w-88 bg-white dark:bg-card border-l border-border flex flex-col shrink-0">

          {/* Status bar */}
          <div className={cn(
            'px-4 py-2.5 border-b border-border flex items-center gap-2',
            posStatus === 'draft' ? 'bg-muted/30' : 'bg-[var(--status-warning-surface)]'
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
            <div className="bg-[var(--status-warning-surface)] border-b border-[var(--status-warning)]/20 px-4 py-2 flex items-center gap-2 text-[var(--status-warning)]">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--status-warning)]" />
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
                  className="text-[11px] font-medium text-[var(--status-info)] hover:opacity-80"
                  onClick={refreshActivePedido}
                >
                  Actualizar estado
                </button>
              )}
            </div>
            {activePedido ? (
              <div className="flex items-center justify-between rounded-lg bg-[var(--status-info-surface)] border border-[var(--status-info)]/20 px-2.5 py-1.5">
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
                      <span className="text-sm font-bold text-[var(--status-danger)]">
                        S/ {(item.price * item.quantity).toFixed(2)}
                      </span>
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            className="w-5 h-5 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-[var(--status-danger)] hover:text-[var(--status-danger)] transition-colors"
                            onClick={() => updateCartItem(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            className="w-5 h-5 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-[var(--status-danger)] hover:text-[var(--status-danger)] transition-colors"
                            onClick={() => updateCartItem(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                          <button
                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-[var(--status-danger)] transition-colors ml-0.5"
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
                        done ? 'bg-[var(--action-primary)]' : 'bg-muted'
                      )} />
                      {i < 4 && (
                        <div className={cn(
                          'h-0.5 flex-1 mx-0.5 transition-colors',
                          stepIdx < currentIdx ? 'bg-[var(--action-primary)]' : 'bg-muted'
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
              <span className="text-xl font-extrabold text-[var(--text-primary)] tabular-nums">S/ {cartTotal.toFixed(2)}</span>
            </div>

            {/* Botón principal de acción */}
            {posStatus !== 'cobrado' ? (
              <button
                disabled={actionDisabled}
                onClick={handleAction}
                className={cn(
                  'w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                  actionDisabled
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : posStatus === 'entregado'
                    ? 'bg-[var(--action-primary)] hover:opacity-90 text-white shadow-sm'
                    : 'bg-[var(--action-primary)] hover:opacity-90 text-white shadow-sm'
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
              <div className="w-full h-11 rounded-xl bg-[var(--status-success-surface)] border border-[var(--status-success)]/20 flex items-center justify-center gap-2">
                <BadgeCheck className="w-4 h-4 text-[var(--status-success)]" />
                <span className="text-sm font-semibold text-[var(--status-success)]">Pedido cobrado</span>
              </div>
            )}

            {/* Nuevo pedido / limpiar */}
            {(cart.length > 0 || posStatus !== 'draft') && (
              <button
                onClick={handleNewOrder}
                className="w-full text-xs text-muted-foreground hover:text-[var(--status-info)] transition-colors py-0.5"
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
                {editProduct.variants.length <= 4 ? (
                  <Tabs value={editVariant} onValueChange={setEditVariant}>
                    <TabsList
                      className="grid w-full"
                      style={{ gridTemplateColumns: `repeat(${editProduct.variants.length}, minmax(0, 1fr))` }}
                    >
                      {editProduct.variants.map(v => (
                        <TabsTrigger key={v.name} value={v.name} disabled={!v.isAvailable}>
                          {v.name}<br />
                          <span className="text-[10px]">
                            {v.isAvailable ? `S/ ${v.price.toFixed(2)}` : 'Agotado'}
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                ) : (
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={editVariant}
                    onChange={(event) => setEditVariant(event.target.value)}
                  >
                    {editProduct.variants.map(v => (
                      <option key={v.name} value={v.name} disabled={!v.isAvailable}>
                        {v.name} - {v.isAvailable ? `S/ ${v.price.toFixed(2)}` : 'Agotado'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {editProduct?.extras && (
              <div className="space-y-2">
                <Label>Extras</Label>
                <div className="space-y-1.5">
                  {editProduct.extras.map(extra => (
                    <label
                      key={extra.name}
                      className="flex items-center justify-between p-2.5 border border-border rounded-lg cursor-pointer hover:bg-[var(--status-info-surface)] transition-colors"
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
                          className="accent-[var(--action-primary)]"
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
              className="px-4 py-2 rounded-lg bg-[var(--action-primary)] hover:opacity-90 text-white text-sm font-semibold transition-colors"
              onClick={confirmAdd}
              disabled={!!editProduct?.variants?.length && !editProduct.variants.find(variant => variant.name === editVariant)?.isAvailable}
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
  newCustomer: { name: string; documentType: ClienteTipoDocumento; doc: string; phone: string };
  setNewCustomer: (v: { name: string; documentType: ClienteTipoDocumento; doc: string; phone: string }) => void;
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
              mode === 'generic' ? 'text-[var(--status-info)] bg-[var(--status-info-surface)]' : 'hover:text-foreground hover:bg-muted'
            )}
            title="Cliente genérico"
          >
            <User className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMode('search')}
            className={cn(
              'p-1 rounded text-muted-foreground transition-colors',
              mode === 'search' ? 'text-[var(--status-info)] bg-[var(--status-info-surface)]' : 'hover:text-foreground hover:bg-muted'
            )}
            title="Buscar cliente"
          >
            <UserSearch className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMode('create')}
            className={cn(
              'p-1 rounded text-muted-foreground transition-colors',
              mode === 'create' ? 'text-[var(--status-info)] bg-[var(--status-info-surface)]' : 'hover:text-foreground hover:bg-muted'
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
            <div className="flex items-center gap-2 bg-[var(--status-info-surface)] border border-[var(--status-info)]/20 rounded-lg px-2.5 py-1.5">
              <div className="w-6 h-6 rounded-full bg-[var(--status-info)] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{selectedCustomer.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {getCustomerDocumentSummary(selectedCustomer)}
                </p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-muted-foreground hover:text-[var(--status-info)]">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  className="w-full pl-6 pr-2 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-[var(--action-primary)]/30"
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
                      className="w-full text-left px-2.5 py-1.5 hover:bg-[var(--status-info-surface)] transition-colors"
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                    >
                      <p className="text-xs font-medium">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{getCustomerDocumentSummary(c)}</p>
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
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-[var(--action-primary)]/30"
            placeholder="Nombre completo"
            value={newCustomer.name}
            maxLength={50}
            onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
          />
          <select
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-[var(--action-primary)]/30"
            value={newCustomer.documentType}
            onChange={event => {
              const value = event.target.value;
              if (!isTipoDocumento(value)) return;
              setNewCustomer({
                ...newCustomer,
                documentType: value,
                doc: value === 'SIN_DOCUMENTO' ? '' : newCustomer.doc,
              });
            }}
          >
            {CLIENTE_TIPO_DOCUMENTO_VALUES.map((tipoDocumento) => (
              <option key={tipoDocumento} value={tipoDocumento}>
                {DOCUMENT_LABELS[tipoDocumento]}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-1.5">
            {newCustomer.documentType !== 'SIN_DOCUMENTO' ? (
              <input
                className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-[var(--action-primary)]/30"
                placeholder={DOCUMENT_PLACEHOLDERS[newCustomer.documentType]}
                value={newCustomer.doc}
                maxLength={20}
                onChange={e => setNewCustomer({ ...newCustomer, doc: e.target.value })}
              />
            ) : (
              <div className="px-2.5 py-1.5 text-xs rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground flex items-center">
                Sin documento
              </div>
            )}
            <input
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-[var(--action-primary)]/30"
              placeholder="Teléfono"
              value={newCustomer.phone}
              maxLength={20}
              onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
          </div>
          <button
            className="w-full py-1.5 rounded-lg bg-[var(--action-primary)] hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
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
  const usesPhysicalStock = product.type === 'INVENTARIO_DIRECTO' && !product.isCatalogParent;
  const availableVariants = product.variants?.filter(variant => variant.isAvailable) || [];
  const isOutOfStock = product.variants?.length ? availableVariants.length === 0 : usesPhysicalStock && product.stock <= 0;
  const isCardDisabled = disabled || isOutOfStock;

  const hasOptions = !!(product.variants?.length || product.extras?.length);
  const productKindLabel = product.variants?.length
    ? `${availableVariants.length}/${product.variants.length} opciones`
    : hasOptions ? 'Personalizable' : 'Sin opciones';

  return (
    <div
      className={cn(
        'bg-card rounded-lg overflow-hidden border border-border shadow-ui-low transition-colors flex flex-col group',
        isCardDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary/40 cursor-pointer'
      )}
      onClick={() => !isCardDisabled && onAdd(product)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className={cn(
            'w-full h-full object-cover transition-transform duration-300',
            !isCardDisabled && 'group-hover:scale-105'
          )}
        />
        {isOutOfStock && (
          <span className={cn(
            'absolute bottom-2 left-2 max-w-[calc(100%-1rem)] rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground shadow-ui-low'
          )}>
            Agotado
          </span>
        )}
      </div>

      <div className="p-2.5 flex flex-col flex-1 gap-1">
        <div className="flex items-start gap-1">
          <p className="font-semibold text-xs leading-tight flex-1 line-clamp-2">{product.name}</p>
          <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] font-medium capitalize text-muted-foreground">
            {product.category}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm font-extrabold text-primary">Desde S/ {product.price.toFixed(2)}</span>
          {hasOptions ? (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
              <BookOpen className="w-3 h-3" />
              {productKindLabel}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">{productKindLabel}</span>
          )}
        </div>

        {!isCardDisabled && (
          <button
            className="w-full h-9 rounded-lg border border-border text-primary text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-1 mt-0.5"
            onClick={e => { e.stopPropagation(); onAdd(product); }}
          >
            <Plus className="w-3 h-3" /> Agregar
          </button>
        )}
        {isOutOfStock && (
          <div className="w-full h-7 rounded-lg bg-muted text-muted-foreground text-xs font-semibold flex items-center justify-center gap-1 mt-0.5">
            Agotado
          </div>
        )}
      </div>
    </div>
  );
}
