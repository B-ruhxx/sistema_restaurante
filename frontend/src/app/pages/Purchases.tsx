import { useState } from 'react';
import {
  Plus, Search, ChevronRight, CheckCircle2, Clock, X, Eye,
  ShoppingCart, Building2, AlertCircle, Ban, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
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
import { CompraResponse } from '../../api/compras';

interface SelectedItem {
  idInsumo: number;
  nombre: string;
  unidad: string;
  qty: number;
  unitPrice: number;
  total: number;
}

type Step = 1 | 2 | 3;

const statusConf: Record<string, { label: string; badge: string }> = {
  REGISTRADA: { label: 'Registrada', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  ANULADA: { label: 'Anulada', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export function Purchases() {
  const { compras, isLoading: loadingCompras, createCompra, anularCompra, isCreating, isAnulando } = useCompras();
  const { proveedores, isLoading: loadingProveedores } = useProveedores();
  const { insumos, isLoading: loadingInsumos } = useInsumos();

  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedP, setSelectedP] = useState<CompraResponse | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [newForm, setNewForm] = useState({ supplierId: '', notes: '' });
  const [newItems, setNewItems] = useState<SelectedItem[]>([]);
  const [addItem, setAddItem] = useState({ idInsumo: '', qty: '', unitPrice: '' });

  if (loadingCompras || loadingProveedores || loadingInsumos) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando compras y catálogos...</p>
      </div>
    );
  }

  // Filters active suppliers
  const activeSuppliers = proveedores.filter(p => p.estado !== 'INACTIVO');
  const activeInsumos = insumos.filter(i => i.estado !== 'INACTIVO');

  // Filter purchases by search term
  const filtered = compras.filter(p =>
    (p.codigoCompra || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.proveedorNombre || '').toLowerCase().includes(search.toLowerCase())
  );

  // Group purchases by month for the chart
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
    .map(m => ({
      month: m,
      total: purchasesByMonth[m] || 0
    }));

  const totalThisMonth = compras
    .filter(c => c.estado !== 'ANULADA')
    .reduce((s, p) => s + Number(p.total), 0);

  const pendingCount = compras.filter(p => p.estado === 'PENDIENTE').length;

  const newTotal = newItems.reduce((s, i) => s + i.total, 0);

  const handleAddItem = () => {
    const insumo = activeInsumos.find(i => i.idInsumo === Number(addItem.idInsumo));
    if (!insumo || !addItem.qty || !addItem.unitPrice) return;
    const qty = parseFloat(addItem.qty);
    const price = parseFloat(addItem.unitPrice);
    
    // Check if item is already added
    if (newItems.some(i => i.idInsumo === insumo.idInsumo)) {
      toast.warning('Este insumo ya ha sido agregado.');
      return;
    }

    const item: SelectedItem = {
      idInsumo: insumo.idInsumo,
      nombre: insumo.nombre,
      unidad: insumo.unidad,
      qty,
      unitPrice: price,
      total: qty * price
    };
    setNewItems(prev => [...prev, item]);
    setAddItem({ idInsumo: '', qty: '', unitPrice: '' });
  };

  const handleConfirm = async () => {
    if (!newForm.supplierId || newItems.length === 0) return;

    try {
      const payload = {
        idProveedor: Number(newForm.supplierId),
        detalles: newItems.map(item => ({
          idInsumo: item.idInsumo,
          cantidad: item.qty,
          precioUnitario: item.unitPrice
        })),
        observacion: newForm.notes || 'Registro de compra.'
      };

      await createCompra(payload);
      toast.success('Orden de compra registrada con éxito');
      setNewOpen(false);
      setStep(1);
      setNewForm({ supplierId: '', notes: '' });
      setNewItems([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error al registrar la compra');
    }
  };

  const handleAnular = async (id: number) => {
    if (!confirm('¿Está seguro de que desea anular esta compra? Esto revertirá los ingresos de stock.')) return;
    try {
      await anularCompra(id);
      toast.success('Compra anulada correctamente');
      setDetailOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error al anular la compra');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Compras</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestión de órdenes de compra e ingresos a inventario</p>
        </div>
        <Button onClick={() => { setNewOpen(true); setStep(1); }}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Compra
        </Button>
      </div>

      {/* Dashboard Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gastos en Compras de Insumos (S/)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip formatter={(v: number) => [`S/ ${v}`, 'Total']} />
                    <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                  Sin compras registradas para graficar.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Compras Totales Registradas', value: `S/ ${totalThisMonth.toLocaleString()}`, icon: ShoppingCart },
            { label: 'Órdenes de Compra', value: compras.length, icon: Clock },
            { label: 'Proveedores Activos', value: activeSuppliers.length, icon: Building2 },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Providers summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {activeSuppliers.slice(0, 4).map(s => {
          const total = compras
            .filter(p => p.idProveedor === s.idProveedor && p.estado !== 'ANULADA')
            .reduce((sum, p) => sum + Number(p.total), 0);
          return (
            <Card key={s.idProveedor} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium truncate">{s.razonSocial}</p>
              </div>
              <p className="text-base font-semibold">S/ {total.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">compras activas</p>
            </Card>
          );
        })}
      </div>

      {/* Filters + Table */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar compra o proveedor..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
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
              <TableRow key={p.idCompra} className="cursor-pointer hover:bg-accent/50" onClick={() => { setSelectedP(p); setDetailOpen(true); }}>
                <TableCell className="font-mono text-sm font-medium">{p.codigoCompra || `COMP-${String(p.idCompra).padStart(4, '0')}`}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{p.proveedorNombre}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{p.empleadoNombre}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{new Date(p.fecha).toLocaleString()}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{p.detalles?.length || 0}</TableCell>
                <TableCell className="font-medium">S/ {Number(p.total).toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf[p.estado]?.badge || 'bg-zinc-100 text-zinc-700'}`}>
                    {statusConf[p.estado]?.label || p.estado}
                  </span>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setSelectedP(p); setDetailOpen(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron órdenes de compra.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* New Purchase Wizard */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
            <DialogDescription>Completa el asistente para registrar la compra e ingresar stock al inventario.</DialogDescription>
            {/* Steps indicator */}
            <div className="flex items-center gap-2 mt-3">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {s === 1 ? 'Proveedor' : s === 2 ? 'Insumos' : 'Confirmación'}
                  </span>
                  {s < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Proveedor *</Label>
                <Select value={newForm.supplierId} onValueChange={v => setNewForm(f => ({ ...f, supplierId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar proveedor..." /></SelectTrigger>
                  <SelectContent>
                    {activeSuppliers.map(s => (
                      <SelectItem key={s.idProveedor} value={String(s.idProveedor)}>
                        {s.razonSocial} {s.ruc ? `(${s.ruc})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notas / Observación</Label>
                <Input placeholder="Observaciones..." value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Agrega los insumos a comprar:</p>
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label>Insumo *</Label>
                  <Select value={addItem.idInsumo} onValueChange={v => setAddItem(a => ({ ...a, idInsumo: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Insumo..." /></SelectTrigger>
                    <SelectContent>
                      {activeInsumos.map(s => (
                        <SelectItem key={s.idInsumo} value={String(s.idInsumo)}>{s.nombre} ({s.unidad})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label>Cantidad</Label>
                  <Input placeholder="Cant." type="number" min="0.01" step="any" className="mt-1" value={addItem.qty} onChange={e => setAddItem(a => ({ ...a, qty: e.target.value }))} />
                </div>
                <div className="w-28">
                  <Label>Precio Unitario</Label>
                  <Input placeholder="P. unit." type="number" min="0.01" step="any" className="mt-1" value={addItem.unitPrice} onChange={e => setAddItem(a => ({ ...a, unitPrice: e.target.value }))} />
                </div>
                <Button onClick={handleAddItem} className="h-10"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto mt-2">
                {newItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border text-sm">
                    <span className="flex-1 font-medium">{item.nombre}</span>
                    <span className="text-muted-foreground">{item.qty} {item.unidad}</span>
                    <span className="text-muted-foreground">S/ {item.unitPrice.toFixed(2)} c/u</span>
                    <span className="font-semibold">S/ {item.total.toFixed(2)}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => setNewItems(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {newItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin insumos agregados</p>}
              </div>
              {newItems.length > 0 && (
                <div className="flex justify-between p-3 rounded-lg bg-muted/50 font-medium text-sm">
                  <span>Total estimado</span>
                  <span>S/ {newTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Proveedor</span>
                  <span className="font-medium">{proveedores.find(s => s.idProveedor === Number(newForm.supplierId))?.razonSocial}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Insumos totales</span>
                  <span className="font-medium">{newItems.length} items</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Total de la Compra</span>
                  <span className="font-semibold text-lg text-primary">S/ {newTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {newItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-muted-foreground">
                    <span>{item.nombre} × {item.qty} {item.unidad}</span>
                    <span>S/ {item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            {step > 1 && <Button variant="outline" onClick={() => setStep(s => (s - 1) as Step)}>Anterior</Button>}
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            {step < 3 ? (
              <Button onClick={() => setStep(s => (s + 1) as Step)} disabled={step === 1 && !newForm.supplierId || step === 2 && newItems.length === 0}>
                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleConfirm} disabled={isCreating}>
                {isCreating ? 'Guardando...' : 'Confirmar compra'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle — {selectedP?.codigoCompra || `COMP-${String(selectedP?.idCompra).padStart(4, '0')}`}</DialogTitle>
          </DialogHeader>
          {selectedP && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Proveedor</p>
                  <p className="font-medium">{selectedP.proveedorNombre}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Comprador</p>
                  <p className="font-medium">{selectedP.empleadoNombre}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Fecha</p>
                  <p className="font-medium">{new Date(selectedP.fecha).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Estado</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf[selectedP.estado]?.badge || 'bg-zinc-100 text-zinc-700'}`}>
                    {statusConf[selectedP.estado]?.label || selectedP.estado}
                  </span>
                </div>
                {selectedP.observacion && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Observación</p>
                    <p className="font-medium">{selectedP.observacion}</p>
                  </div>
                )}
              </div>
              <Separator />
              <p className="text-sm font-semibold">Items Comprados</p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">P. Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedP.detalles?.map(item => (
                      <TableRow key={item.idDetalleCompra}>
                        <TableCell className="text-sm">{item.nombreInsumo}</TableCell>
                        <TableCell className="text-sm text-right">{item.cantidad} {item.unidadInsumo}</TableCell>
                        <TableCell className="text-sm text-right">S/ {Number(item.precioUnitario).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-right font-medium">S/ {Number(item.subtotal).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-end gap-1.5 pt-2 text-sm font-medium">
                <div className="flex justify-between w-48">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>S/ {Number(selectedP.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-48">
                  <span className="text-muted-foreground">IGV (18%)</span>
                  <span>S/ {Number(selectedP.igv).toFixed(2)}</span>
                </div>
                <Separator className="w-48" />
                <div className="flex justify-between w-48 text-base font-semibold text-primary">
                  <span>Total</span>
                  <span>S/ {Number(selectedP.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between items-center w-full">
            <div>
              {selectedP && selectedP.estado === 'REGISTRADA' && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  disabled={isAnulando} 
                  onClick={() => handleAnular(selectedP.idCompra)}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {isAnulando ? 'Anulando...' : 'Anular Compra'}
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
