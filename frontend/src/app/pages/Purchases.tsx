import { useState } from 'react';
import {
  Plus, ChevronRight, CheckCircle2, Clock, X, Eye,
  ShoppingCart, Building2, Ban, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from '../../lib/notifications';
import { useCompras } from '../../hooks/useCompras';
import { useProveedores } from '../../hooks/useProveedores';
import { useInsumos } from '../../hooks/useInsumos';
import { useProductos } from '../../hooks/useProductos';
import { comprasApi } from '../../api/compras';
import type { CompraResponse } from '../../api/compras';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

interface SelectedItem {
  tipoRecurso: 'INSUMO' | 'PRODUCTO';
  idInsumo?: number;
  idProducto?: number;
  nombre: string;
  unidad: string;
  sku?: string;
  qty: number;
  unitPrice: number;
  expirationDate: string;
  total: number;
}

type Step = 1 | 2 | 3;

const statusConf: Record<string, { label: string; badgeVariant: 'success' | 'danger' | 'info' | 'warning' | 'secondary' }> = {
  REGISTRADA: { label: 'Registrada', badgeVariant: 'success' },
  ANULADA: { label: 'Anulada', badgeVariant: 'danger' },
};

export function Purchases() {
  const { compras, isLoading: loadingCompras, createCompra, anularCompra, isCreating, isAnulando } = useCompras();
  const { proveedores, isLoading: loadingProveedores } = useProveedores();
  const { insumos, isLoading: loadingInsumos } = useInsumos();
  const { productos, isLoading: loadingProductos } = useProductos();

  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedP, setSelectedP] = useState<CompraResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [newForm, setNewForm] = useState({ supplierId: '', notes: '' });
  const [newItems, setNewItems] = useState<SelectedItem[]>([]);
  const [addItem, setAddItem] = useState({
    tipoRecurso: 'INSUMO' as 'INSUMO' | 'PRODUCTO',
    idRecurso: '',
    qty: '',
    unitPrice: '',
    expirationDate: '',
  });

  if (loadingCompras || loadingProveedores || loadingInsumos || loadingProductos) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando compras y catálogos...</p>
      </div>
    );
  }

  const activeSuppliers = proveedores.filter(p => p.estado !== 'INACTIVO');
  const activeInsumos = insumos.filter(i => i.estado !== 'INACTIVO');
  const activeProductSkus = productos.filter(p =>
    p.estado !== 'INACTIVO' &&
    p.esSku !== false &&
    p.tipoProducto === 'INVENTARIO_DIRECTO'
  );

  const filtered = compras.filter(p =>
    (p.codigoCompra || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.proveedorNombre || '').toLowerCase().includes(search.toLowerCase())
  );

  const purchasesByMonth = compras
    .filter(c => c.estado !== 'ANULADA')
    .reduce((acc, c) => {
      const date = new Date(c.fecha);
      const month = date.toLocaleString('es-ES', { month: 'short' });
      acc[month] = (acc[month] || 0) + Number(c.total);
      return acc;
    }, {} as Record<string, number>);

  const monthsOrder = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const chartData = monthsOrder
    .filter(m => purchasesByMonth[m] !== undefined)
    .map(m => ({ month: m, total: purchasesByMonth[m] || 0 }));

  const totalRegistrado = compras
    .filter(c => c.estado !== 'ANULADA')
    .reduce((s, p) => s + Number(p.total), 0);

  const newTotal = newItems.reduce((s, i) => s + i.total, 0);
  const selectedSupplier = proveedores.find(s => s.idProveedor === Number(newForm.supplierId));

  const handleAddItem = () => {
    const qty = parseFloat(addItem.qty);
    const price = parseFloat(addItem.unitPrice);
    if (!addItem.idRecurso || !addItem.qty || !addItem.unitPrice || !addItem.expirationDate) return;
    if (qty <= 0 || price <= 0) return;

    if (addItem.tipoRecurso === 'PRODUCTO' && !Number.isInteger(qty)) {
      toast.warning('La cantidad de un SKU producto debe ser un número entero.');
      return;
    }

    const duplicate = newItems.some(i =>
      i.tipoRecurso === addItem.tipoRecurso &&
      (addItem.tipoRecurso === 'INSUMO'
        ? i.idInsumo === Number(addItem.idRecurso)
        : i.idProducto === Number(addItem.idRecurso))
    );
    if (duplicate) {
      toast.warning('Este recurso ya ha sido agregado.');
      return;
    }

    const item: SelectedItem = addItem.tipoRecurso === 'INSUMO'
      ? (() => {
        const insumo = activeInsumos.find(i => i.idInsumo === Number(addItem.idRecurso));
        if (!insumo) throw new Error('Insumo no encontrado');
        return {
          tipoRecurso: 'INSUMO' as const,
          idInsumo: insumo.idInsumo,
          nombre: insumo.nombre,
          unidad: insumo.unidad,
          qty,
          unitPrice: price,
          expirationDate: addItem.expirationDate,
          total: qty * price,
        };
      })()
      : (() => {
        const producto = activeProductSkus.find(p => p.idProducto === Number(addItem.idRecurso));
        if (!producto) throw new Error('SKU producto no encontrado');
        return {
          tipoRecurso: 'PRODUCTO' as const,
          idProducto: producto.idProducto,
          nombre: producto.nombre,
          unidad: 'uds',
          sku: producto.sku,
          qty,
          unitPrice: price,
          expirationDate: addItem.expirationDate,
          total: qty * price,
        };
      })();
    setNewItems(prev => [...prev, item]);
    setAddItem(a => ({ ...a, idRecurso: '', qty: '', unitPrice: '', expirationDate: '' }));
  };

  const handleConfirm = async () => {
    if (!newForm.supplierId || newItems.length === 0) return;

    try {
      const payload = {
        idProveedor: Number(newForm.supplierId),
        detalles: newItems.map(item => ({
          idInsumo: item.tipoRecurso === 'INSUMO' ? item.idInsumo : undefined,
          idProducto: item.tipoRecurso === 'PRODUCTO' ? item.idProducto : undefined,
          cantidad: item.qty,
          precioUnitario: item.unitPrice,
          fechaVencimiento: item.expirationDate
        })),
        observacion: newForm.notes || 'Registro de compra.'
      };

      await createCompra(payload);
      toast.success('Orden de compra registrada con éxito');
      setNewOpen(false);
      setStep(1);
      setNewForm({ supplierId: '', notes: '' });
      setNewItems([]);
    } catch (err) {
      console.error(err);
      const apiError = err as AppApiErrorLike;
      const errorMessage =
        typeof apiError.response?.data === 'string'
          ? apiError.response.data
          : apiError.response?.data?.message;
      toast.error(errorMessage || 'Error al registrar la compra');
    }
  };

  const handleAnular = async (id: number) => {
    if (!confirm('¿Está seguro de que desea anular esta compra? Esto revertirá los ingresos de stock.')) return;
    try {
      await anularCompra(id);
      toast.success('Compra anulada correctamente');
      setDetailOpen(false);
    } catch (err) {
      console.error(err);
      const apiError = err as AppApiErrorLike;
      const errorMessage =
        typeof apiError.response?.data === 'string'
          ? apiError.response.data
          : apiError.response?.data?.message;
      toast.error(errorMessage || 'Error al anular la compra');
    }
  };

  const openDetail = async (purchase: CompraResponse) => {
    setSelectedP(purchase);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const detail = await comprasApi.getById(purchase.idCompra);
      setSelectedP(detail);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo cargar el detalle completo de la compra');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Inventario' },
          { label: 'Compras' },
        ]}
        icon={ShoppingCart}
        iconColor="blue"
        title="Compras"
        subtitle="Gestión de órdenes de compra e ingresos a inventario por lotes."
        action={
          <Button onClick={() => { setNewOpen(true); setStep(1); }} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nueva Compra
          </Button>
        }
      />

      {/* KPI Cards + Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Gastos en Compras de Inventario (S/)</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip formatter={(v: number) => [`S/ ${v}`, 'Total']} />
                <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[130px] flex items-center justify-center text-xs font-semibold text-muted-foreground">
              Sin compras registradas para graficar.
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="flex flex-col gap-3">
          <KpiCard icon={ShoppingCart} label="Compras Totales (S/)" value={`S/ ${totalRegistrado.toLocaleString()}`} color="blue" />
          <KpiCard icon={Clock} label="Órdenes de Compra" value={compras.length} color="slate" />
          <KpiCard icon={Building2} label="Proveedores Activos" value={activeSuppliers.length} color="green" />
        </div>
      </div>

      {/* Supplier quick summary */}
      {activeSuppliers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {activeSuppliers.slice(0, 4).map(s => {
            const total = compras
              .filter(p => p.idProveedor === s.idProveedor && p.estado !== 'ANULADA')
              .reduce((sum, p) => sum + Number(p.total), 0);
            return (
              <div key={s.idProveedor} className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-foreground truncate">{s.razonSocial}</p>
                </div>
                <p className="text-sm font-black text-foreground ui-tabular">S/ {total.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">en compras activas</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <FilterToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar compra o proveedor...',
        }}
      />

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Sin órdenes de compra"
          description="Registra tu primera compra para ingresar stock al inventario."
          action={
            <Button onClick={() => { setNewOpen(true); setStep(1); }} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Compra
            </Button>
          }
        />
      ) : (
        <SectionCard
          title="Órdenes de Compra"
          description={`Mostrando ${filtered.length} registros.`}
          icon={ShoppingCart}
          iconColor="blue"
        >
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Compra</TableHead>
                  <TableHead className="hidden md:table-cell">Proveedor</TableHead>
                  <TableHead className="hidden sm:table-cell">Comprador</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead className="hidden lg:table-cell">Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.idCompra} className="cursor-pointer" onClick={() => openDetail(p)}>
                    <TableCell className="font-mono text-xs font-bold text-foreground">{p.codigoCompra || `COMP-${String(p.idCompra).padStart(4, '0')}`}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm font-bold text-foreground">{p.proveedorNombre}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs font-semibold text-muted-foreground">{p.empleadoNombre}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs font-semibold text-muted-foreground">{new Date(p.fecha).toLocaleString()}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs font-semibold text-muted-foreground">{p.detalles?.length || 0}</TableCell>
                    <TableCell className="font-bold text-foreground ui-tabular text-sm">S/ {Number(p.total).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={statusConf[p.estado]?.badgeVariant || 'secondary'} className="shadow-2xs text-[10px] font-bold">
                        {statusConf[p.estado]?.label || p.estado}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg"
                        aria-label={`Ver detalle de ${p.codigoCompra || `COMP-${String(p.idCompra).padStart(4, '0')}`}`}
                        onClick={() => openDetail(p)}
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      {/* New Purchase Wizard */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] min-w-0 w-[calc(100vw-2rem)] max-w-4xl overflow-x-hidden overflow-y-auto rounded-2xl p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Nueva Orden de Compra</DialogTitle>
            <DialogDescription className="text-xs">Completa el asistente para registrar la compra e ingresar stock al inventario.</DialogDescription>
            {/* Steps indicator */}
            <div className="flex items-center gap-2 mt-4">
              {([1, 2, 3] as const).map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm',
                    step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-border'
                  )}>
                    {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground hidden sm:block">
                    {s === 1 ? 'Proveedor' : s === 2 ? 'Recursos' : 'Confirmación'}
                  </span>
                  {s < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </DialogHeader>

          {step === 1 && (
            <div className="min-w-0 space-y-4 mt-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="purchase-supplier" className="text-sm font-semibold">Proveedor *</Label>
                <Select value={newForm.supplierId} onValueChange={v => setNewForm(f => ({ ...f, supplierId: v }))}>
                  <SelectTrigger
                    id="purchase-supplier"
                    className="h-auto min-h-11 min-w-0 items-start rounded-xl py-2 text-left whitespace-normal [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-normal"
                  >
                    <SelectValue placeholder="Seleccionar proveedor..." />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] rounded-xl">
                    {activeSuppliers.map(s => (
                      <SelectItem key={s.idProveedor} value={String(s.idProveedor)} className="items-start overflow-hidden rounded-lg py-2 [&>span:last-child]:min-w-0 [&>span:last-child]:whitespace-normal">
                        <span className="min-w-0 whitespace-normal leading-tight">
                          <span className="block break-words font-medium">{s.razonSocial}</span>
                          {s.ruc && <span className="mt-1 block break-all text-xs text-muted-foreground">RUC: {s.ruc}</span>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purchase-notes" className="text-sm font-semibold">Notas / Observación</Label>
                <Input id="purchase-notes" placeholder="Observaciones..." value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} className="h-11 rounded-xl" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="min-w-0 space-y-4 mt-2">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-foreground">Agregar recursos a la compra</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  Selecciona insumos o SKUs de inventario directo e indica sus datos de ingreso.
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-border bg-muted/10 p-4">
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="purchase-resource-type" className="text-xs font-semibold">Tipo de recurso</Label>
                    <Select
                      value={addItem.tipoRecurso}
                      onValueChange={v => setAddItem(a => ({
                        ...a,
                        tipoRecurso: v as 'INSUMO' | 'PRODUCTO',
                        idRecurso: '',
                      }))}
                    >
                      <SelectTrigger id="purchase-resource-type" className="h-10 min-w-0 rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] rounded-xl">
                        <SelectItem value="INSUMO" className="rounded-lg">Insumo</SelectItem>
                        <SelectItem value="PRODUCTO" className="rounded-lg">SKU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="purchase-resource" className="text-xs font-semibold">
                      {addItem.tipoRecurso === 'INSUMO' ? 'Insumo *' : 'SKU producto *'}
                    </Label>
                    <Select
                      value={addItem.idRecurso}
                      onValueChange={v => setAddItem(a => ({ ...a, idRecurso: v }))}
                    >
                      <SelectTrigger
                        id="purchase-resource"
                        className="h-auto min-h-10 min-w-0 items-start rounded-xl py-2 text-left text-xs whitespace-normal [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-normal"
                      >
                        <SelectValue
                          placeholder={addItem.tipoRecurso === 'INSUMO'
                            ? 'Seleccionar insumo...'
                            : 'Seleccionar SKU...'}
                        />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] rounded-xl">
                        {addItem.tipoRecurso === 'INSUMO'
                          ? activeInsumos.map(s => (
                            <SelectItem
                              key={s.idInsumo}
                              value={String(s.idInsumo)}
                              className="items-start overflow-hidden rounded-lg py-2 [&>span:last-child]:min-w-0 [&>span:last-child]:whitespace-normal"
                            >
                              <span className="min-w-0 whitespace-normal leading-tight">
                                <span className="block break-words font-medium">{s.nombre}</span>
                                <span className="mt-1 block break-words text-xs text-muted-foreground">Unidad: {s.unidad}</span>
                              </span>
                            </SelectItem>
                          ))
                          : activeProductSkus.map(p => (
                            <SelectItem
                              key={p.idProducto}
                              value={String(p.idProducto)}
                              className="items-start overflow-hidden rounded-lg py-2 [&>span:last-child]:min-w-0 [&>span:last-child]:whitespace-normal"
                            >
                              <span className="min-w-0 whitespace-normal leading-tight">
                                <span className="block break-words font-medium">{p.nombre}</span>
                                {p.sku && <span className="mt-1 block break-all text-xs text-muted-foreground">SKU: {p.sku}</span>}
                              </span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.35fr)_auto] lg:items-end">
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="purchase-quantity" className="text-xs font-semibold">Cantidad</Label>
                    <Input
                      id="purchase-quantity"
                      placeholder="0"
                      type="number"
                      min="0.01"
                      step="any"
                      className="h-10 rounded-xl text-xs"
                      value={addItem.qty}
                      onChange={e => setAddItem(a => ({ ...a, qty: e.target.value }))}
                    />
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="purchase-unit-price" className="text-xs font-semibold">Precio unitario</Label>
                    <Input
                      id="purchase-unit-price"
                      placeholder="0.00"
                      type="number"
                      min="0.01"
                      step="any"
                      className="h-10 rounded-xl text-xs"
                      value={addItem.unitPrice}
                      onChange={e => setAddItem(a => ({ ...a, unitPrice: e.target.value }))}
                    />
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="purchase-expiration-date" className="text-xs font-semibold">Fecha de vencimiento</Label>
                    <Input
                      id="purchase-expiration-date"
                      type="date"
                      className="h-10 rounded-xl bg-background text-xs"
                      value={addItem.expirationDate}
                      onChange={e => setAddItem(a => ({ ...a, expirationDate: e.target.value }))}
                    />
                  </div>

                  <Button
                    onClick={handleAddItem}
                    aria-label="Agregar recurso a la compra"
                    className="h-10 w-full rounded-xl px-4 lg:w-10 lg:px-0"
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="ml-2 lg:hidden">Agregar recurso</span>
                  </Button>
                </div>
              </div>

              <div className="min-w-0 space-y-2 max-h-60 overflow-y-auto pr-1">
                {newItems.map((item, i) => (
                  <div
                    key={i}
                    className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-xl border border-border bg-muted/10 p-3 text-xs sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto_auto] sm:items-center"
                  >
                    <span className="rounded-lg bg-muted px-2 py-1 text-[9px] font-bold">
                      {item.tipoRecurso === 'INSUMO' ? 'Insumo' : 'SKU'}
                    </span>
                    <span className="min-w-0 whitespace-normal font-bold text-foreground">
                      <span className="block break-words">{item.nombre}</span>
                      {item.sku && <span className="mt-0.5 block break-all text-[10px] font-semibold text-muted-foreground">SKU: {item.sku}</span>}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Eliminar ${item.tipoRecurso === 'INSUMO' ? 'insumo' : 'SKU'} ${item.nombre}`}
                      className="h-7 w-7 rounded-lg ui-status-danger hover:bg-[var(--status-danger-surface)] sm:order-last"
                      onClick={() => setNewItems(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <span className="col-span-2 font-semibold text-muted-foreground sm:col-span-1">
                      {item.qty} {item.unidad}
                    </span>
                    <span className="font-semibold text-muted-foreground">
                      S/ {item.unitPrice.toFixed(2)}/u
                    </span>
                    <span className="font-bold text-foreground sm:text-right">
                      S/ {item.total.toFixed(2)}
                    </span>
                  </div>
                ))}

                {newItems.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-muted/5 px-4 py-8 text-center">
                    <ShoppingCart className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground">Sin recursos agregados</p>
                  </div>
                )}
              </div>

              {newItems.length > 0 && (
                <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/30 p-3.5">
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-foreground">Total estimado</span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {newItems.length} {newItems.length === 1 ? 'recurso agregado' : 'recursos agregados'}
                    </span>
                  </div>
                  <span className="shrink-0 text-lg font-black text-primary ui-tabular">S/ {newTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="min-w-0 space-y-4 mt-2">
              <div className="min-w-0 p-4 sm:p-5 rounded-2xl border border-border bg-muted/10 space-y-3">
                <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm">
                  <span className="text-muted-foreground font-semibold">Proveedor</span>
                  <span className="min-w-0 text-right font-bold text-foreground">
                    <span className="block break-words">{selectedSupplier?.razonSocial}</span>
                    {selectedSupplier?.ruc && <span className="mt-0.5 block break-all text-xs font-semibold text-muted-foreground">RUC: {selectedSupplier.ruc}</span>}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-semibold">Recursos totales</span>
                  <span className="font-bold text-foreground">{newItems.length} items</span>
                </div>
                <Separator />
                <div className="flex justify-between gap-3">
                  <span className="font-bold text-foreground">Total de la Compra</span>
                  <span className="font-black text-lg text-primary ui-tabular">S/ {newTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="min-w-0 space-y-1.5 max-h-40 overflow-y-auto">
                {newItems.map((item, i) => (
                  <div key={i} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 text-xs text-muted-foreground font-semibold">
                    <span className="min-w-0 break-words">
                      <span className="block">{item.tipoRecurso === 'INSUMO' ? 'Insumo' : 'SKU'} · {item.nombre}</span>
                      {item.sku && <span className="mt-0.5 block break-all text-[10px]">SKU: {item.sku}</span>}
                      <span className="mt-0.5 block">{item.qty} {item.unidad} · vence {new Date(item.expirationDate + 'T00:00:00').toLocaleDateString()}</span>
                    </span>
                    <span className="font-bold text-foreground ui-tabular">S/ {item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
            {step > 1 && <Button variant="outline" onClick={() => setStep(s => (s - 1) as Step)} className="h-10 rounded-xl">Anterior</Button>}
            <Button variant="outline" onClick={() => setNewOpen(false)} className="h-10 rounded-xl">Cancelar</Button>
            {step < 3 ? (
              <Button onClick={() => setStep(s => (s + 1) as Step)} disabled={step === 1 && !newForm.supplierId || step === 2 && newItems.length === 0} className="h-10 rounded-xl font-semibold">
                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleConfirm} disabled={isCreating} className="h-10 rounded-xl font-semibold">
                {isCreating ? 'Guardando...' : 'Confirmar compra'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] min-w-0 w-[calc(100vw-2rem)] max-w-lg overflow-x-hidden overflow-y-auto rounded-2xl p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Detalle — {selectedP?.codigoCompra || `COMP-${String(selectedP?.idCompra).padStart(4, '0')}`}</DialogTitle>
            {detailLoading && <DialogDescription className="text-xs">Cargando detalle real desde backend...</DialogDescription>}
          </DialogHeader>
          {selectedP && (
            <div className="min-w-0 space-y-4 mt-2">
              <div className="grid min-w-0 grid-cols-1 gap-3 text-sm p-4 rounded-xl border border-border bg-muted/10 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Proveedor</p>
                  <p className="break-words font-bold text-foreground mt-0.5">{selectedP.proveedorNombre}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Comprador</p>
                  <p className="break-words font-bold text-foreground mt-0.5">{selectedP.empleadoNombre}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Fecha</p>
                  <p className="font-semibold text-foreground mt-0.5">{new Date(selectedP.fecha).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Estado</p>
                  <Badge variant={statusConf[selectedP.estado]?.badgeVariant || 'secondary'} className="mt-1 shadow-2xs text-[10px] font-bold">
                    {statusConf[selectedP.estado]?.label || selectedP.estado}
                  </Badge>
                </div>
                {selectedP.observacion && (
                  <div className="min-w-0 sm:col-span-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Observación</p>
                    <p className="break-words font-semibold text-foreground mt-0.5 text-xs">{selectedP.observacion}</p>
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground mb-2">Items Comprados</p>
                <div className="space-y-2 sm:hidden">
                  {selectedP.detalles?.map(item => (
                    <article key={item.idDetalleCompra} className="min-w-0 rounded-xl border border-border bg-muted/10 p-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold text-foreground">
                          {item.tipoRecurso === 'PRODUCTO' ? item.nombreProducto : item.nombreInsumo}
                        </p>
                        {item.tipoRecurso === 'PRODUCTO' && item.skuProducto && (
                          <p className="mt-1 break-all text-[10px] font-semibold text-muted-foreground">SKU: {item.skuProducto}</p>
                        )}
                      </div>
                      <dl className="mt-3 grid min-w-0 grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        <div className="min-w-0">
                          <dt className="font-semibold text-muted-foreground">Cantidad</dt>
                          <dd className="mt-0.5 break-words font-bold text-foreground">
                            {item.cantidad} {item.tipoRecurso === 'PRODUCTO' ? 'uds' : item.unidadInsumo}
                          </dd>
                        </div>
                        <div className="min-w-0 text-right">
                          <dt className="font-semibold text-muted-foreground">Vencimiento</dt>
                          <dd className="mt-0.5 break-words font-bold text-foreground">
                            {item.fechaVencimiento ? new Date(item.fechaVencimiento + 'T00:00:00').toLocaleDateString() : 'Sin fecha'}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="font-semibold text-muted-foreground">Precio unitario</dt>
                          <dd className="mt-0.5 break-all font-bold text-foreground ui-tabular">S/ {Number(item.precioUnitario).toFixed(2)}</dd>
                        </div>
                        <div className="min-w-0 text-right">
                          <dt className="font-semibold text-muted-foreground">Total</dt>
                          <dd className="mt-0.5 break-all font-black text-primary ui-tabular">S/ {Number(item.subtotal).toFixed(2)}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
                <div className="hidden min-w-0 rounded-xl border border-border overflow-hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recurso</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">Vence</TableHead>
                        <TableHead className="text-right">P. Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedP.detalles?.map(item => (
                        <TableRow key={item.idDetalleCompra}>
                          <TableCell className="max-w-48 whitespace-normal break-words text-xs font-bold text-foreground">
                            {item.tipoRecurso === 'PRODUCTO'
                              ? `${item.nombreProducto}${item.skuProducto ? ` · ${item.skuProducto}` : ''}`
                              : item.nombreInsumo}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs font-semibold text-muted-foreground text-right">
                            {item.cantidad} {item.tipoRecurso === 'PRODUCTO' ? 'uds' : item.unidadInsumo}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs font-semibold text-muted-foreground text-right">
                            {item.fechaVencimiento ? new Date(item.fechaVencimiento + 'T00:00:00').toLocaleDateString() : 'Sin fecha'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs font-semibold text-muted-foreground text-right ui-tabular">S/ {Number(item.precioUnitario).toFixed(2)}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs font-bold text-foreground text-right ui-tabular">S/ {Number(item.subtotal).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 pt-1 text-sm font-semibold">
                <div className="flex justify-between w-48">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="ui-tabular">S/ {Number(selectedP.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-48">
                  <span className="text-muted-foreground">IGV (18%)</span>
                  <span className="ui-tabular">S/ {Number(selectedP.igv).toFixed(2)}</span>
                </div>
                <Separator className="w-48" />
                <div className="flex justify-between w-48 text-base font-black text-primary">
                  <span>Total</span>
                  <span className="ui-tabular">S/ {Number(selectedP.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between items-center w-full mt-4 pt-3 border-t border-border/40">
            <div>
              {selectedP && selectedP.estado === 'REGISTRADA' && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isAnulando}
                  onClick={() => handleAnular(selectedP.idCompra)}
                  className="h-9 rounded-xl gap-1.5 font-semibold"
                >
                  <Ban className="w-3.5 h-3.5" />
                  {isAnulando ? 'Anulando...' : 'Anular Compra'}
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => setDetailOpen(false)} className="h-9 rounded-xl">Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
