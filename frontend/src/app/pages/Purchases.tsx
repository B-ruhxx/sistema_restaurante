import { useState } from 'react';
import {
  Plus, Search, ChevronRight, CheckCircle2, Clock, X, Eye,
  ShoppingCart, TrendingDown, Building2, Calendar
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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

interface PurchaseItem {
  supplyId: string;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface Purchase {
  id: string;
  supplier: string;
  supplierId: string;
  date: string;
  status: 'pendiente' | 'recibida' | 'cancelada';
  items: PurchaseItem[];
  total: number;
  notes: string;
}

const suppliers = [
  { id: 's1', name: 'Distribuidora El Sol S.A.C.' },
  { id: 's2', name: 'Carnes Premium del Perú' },
  { id: 's3', name: 'Lácteos Andinos E.I.R.L.' },
  { id: 's4', name: 'Panadería Artesanal Napoli' },
];

const supplyList = [
  { id: 'i1', name: 'Pan de hamburguesa', unit: 'unidad' },
  { id: 'i2', name: 'Carne de res 150g', unit: 'unidad' },
  { id: 'i3', name: 'Lechuga', unit: 'kg' },
  { id: 'i4', name: 'Tomate', unit: 'kg' },
  { id: 'i5', name: 'Mayonesa', unit: 'kg' },
  { id: 'i6', name: 'Queso cheddar', unit: 'kg' },
  { id: 'i7', name: 'Mozzarella', unit: 'kg' },
  { id: 'i8', name: 'Salsa de tomate', unit: 'kg' },
];

const purchases: Purchase[] = [
  {
    id: 'COMP-0042', supplier: 'Distribuidora El Sol S.A.C.', supplierId: 's1', date: '2024-06-08', status: 'recibida',
    items: [
      { supplyId: 'i1', name: 'Pan de hamburguesa', unit: 'unidad', qty: 100, unitPrice: 0.80, total: 80 },
      { supplyId: 'i3', name: 'Lechuga', unit: 'kg', qty: 5, unitPrice: 4.00, total: 20 },
      { supplyId: 'i4', name: 'Tomate', unit: 'kg', qty: 8, unitPrice: 3.50, total: 28 },
    ],
    total: 128, notes: '',
  },
  {
    id: 'COMP-0041', supplier: 'Carnes Premium del Perú', supplierId: 's2', date: '2024-06-07', status: 'recibida',
    items: [
      { supplyId: 'i2', name: 'Carne de res 150g', unit: 'unidad', qty: 80, unitPrice: 4.50, total: 360 },
    ],
    total: 360, notes: 'Carne fresca de primera calidad',
  },
  {
    id: 'COMP-0043', supplier: 'Lácteos Andinos E.I.R.L.', supplierId: 's3', date: '2024-06-08', status: 'pendiente',
    items: [
      { supplyId: 'i6', name: 'Queso cheddar', unit: 'kg', qty: 3, unitPrice: 28.00, total: 84 },
      { supplyId: 'i7', name: 'Mozzarella', unit: 'kg', qty: 4, unitPrice: 32.00, total: 128 },
    ],
    total: 212, notes: '',
  },
];

const monthlyData = [
  { month: 'Ene', total: 3200 },
  { month: 'Feb', total: 2900 },
  { month: 'Mar', total: 3800 },
  { month: 'Abr', total: 4100 },
  { month: 'May', total: 3600 },
  { month: 'Jun', total: 2800 },
];

const statusConf = {
  pendiente: { label: 'Pendiente', badge: 'bg-yellow-100 text-yellow-700' },
  recibida: { label: 'Recibida', badge: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', badge: 'bg-red-100 text-red-700' },
};

type Step = 1 | 2 | 3 | 4;

export function Purchases() {
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedP, setSelectedP] = useState<Purchase | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [newForm, setNewForm] = useState({ supplierId: '', notes: '' });
  const [newItems, setNewItems] = useState<PurchaseItem[]>([]);
  const [addItem, setAddItem] = useState({ supplyId: '', qty: '', unitPrice: '' });

  const filtered = purchases.filter(p =>
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const newTotal = newItems.reduce((s, i) => s + i.total, 0);

  const handleAddItem = () => {
    const supply = supplyList.find(s => s.id === addItem.supplyId);
    if (!supply || !addItem.qty || !addItem.unitPrice) return;
    const qty = parseFloat(addItem.qty);
    const price = parseFloat(addItem.unitPrice);
    const item: PurchaseItem = { supplyId: supply.id, name: supply.name, unit: supply.unit, qty, unitPrice: price, total: qty * price };
    setNewItems(prev => [...prev, item]);
    setAddItem({ supplyId: '', qty: '', unitPrice: '' });
  };

  const handleConfirm = () => {
    // In real app would save to backend
    setNewOpen(false);
    setStep(1);
    setNewForm({ supplierId: '', notes: '' });
    setNewItems([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Compras</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestión de órdenes de compra a proveedores</p>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Gastos mensuales (S/)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip formatter={(v: number) => [`S/ ${v}`, 'Total']} />
                  <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Compras este mes', value: `S/ ${purchases.reduce((s, p) => s + p.total, 0).toLocaleString()}`, icon: ShoppingCart },
            { label: 'Pendientes', value: purchases.filter(p => p.status === 'pendiente').length, icon: Clock },
            { label: 'Proveedores activos', value: suppliers.length, icon: Building2 },
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

      {/* Main Providers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {suppliers.map(s => {
          const total = purchases.filter(p => p.supplierId === s.id).reduce((sum, p) => sum + p.total, 0);
          return (
            <Card key={s.id} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium truncate">{s.name}</p>
              </div>
              <p className="text-base font-semibold">S/ {total.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">compras totales</p>
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
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              <TableHead className="hidden lg:table-cell">Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => { setSelectedP(p); setDetailOpen(true); }}>
                <TableCell className="font-mono text-sm font-medium">{p.id}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{p.supplier}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{p.date}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{p.items.length}</TableCell>
                <TableCell className="font-medium">S/ {p.total.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf[p.status].badge}`}>
                    {statusConf[p.status].label}
                  </span>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setSelectedP(p); setDetailOpen(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* New Purchase Wizard */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
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
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notas (opcional)</Label>
                <Input placeholder="Observaciones..." value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Agrega los insumos a comprar:</p>
              <div className="flex gap-2 flex-wrap">
                <Select value={addItem.supplyId} onValueChange={v => setAddItem(a => ({ ...a, supplyId: v }))}>
                  <SelectTrigger className="flex-1 min-w-32"><SelectValue placeholder="Insumo..." /></SelectTrigger>
                  <SelectContent>{supplyList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Cant." type="number" className="w-20" value={addItem.qty} onChange={e => setAddItem(a => ({ ...a, qty: e.target.value }))} />
                <Input placeholder="P. unit." type="number" className="w-24" value={addItem.unitPrice} onChange={e => setAddItem(a => ({ ...a, unitPrice: e.target.value }))} />
                <Button onClick={handleAddItem} size="sm"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {newItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border text-sm">
                    <span className="flex-1 font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.qty} {item.unit}</span>
                    <span className="font-medium">S/ {item.total.toFixed(2)}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setNewItems(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {newItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin insumos agregados</p>}
              </div>
              {newItems.length > 0 && (
                <div className="flex justify-between p-3 rounded-lg bg-muted/50 font-medium text-sm">
                  <span>Total</span>
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
                  <span className="font-medium">{suppliers.find(s => s.id === newForm.supplierId)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{newItems.length} insumos</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-semibold text-lg">S/ {newTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                {newItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-muted-foreground">
                    <span>{item.name} × {item.qty} {item.unit}</span>
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
              <Button onClick={handleConfirm}>Confirmar compra</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle — {selectedP?.id}</DialogTitle>
          </DialogHeader>
          {selectedP && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Proveedor</p>
                  <p className="font-medium">{selectedP.supplier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">{selectedP.date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf[selectedP.status].badge}`}>
                    {statusConf[selectedP.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold text-lg">S/ {selectedP.total.toFixed(2)}</p>
                </div>
              </div>
              <Separator />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Cant.</TableHead>
                    <TableHead>P. Unit.</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedP.items.map(item => (
                    <TableRow key={item.supplyId}>
                      <TableCell className="text-sm">{item.name}</TableCell>
                      <TableCell className="text-sm">{item.qty} {item.unit}</TableCell>
                      <TableCell className="text-sm">S/ {item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-sm font-medium">S/ {item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
