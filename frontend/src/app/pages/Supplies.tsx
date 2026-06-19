import { useState } from 'react';
import {
  Plus, Search, Pencil, Trash2, MoreHorizontal, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { Progress } from '../components/ui/progress';

interface Supply {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  avgCost: number;
  category: string;
}

const initialSupplies: Supply[] = [
  { id: 's1', name: 'Pan de hamburguesa', unit: 'unidad', stock: 120, minStock: 50, avgCost: 0.80, category: 'Panadería' },
  { id: 's2', name: 'Carne de res 150g', unit: 'unidad', stock: 45, minStock: 40, avgCost: 4.50, category: 'Carnes' },
  { id: 's3', name: 'Lechuga', unit: 'kg', stock: 3.5, minStock: 2, avgCost: 4.00, category: 'Verduras' },
  { id: 's4', name: 'Tomate', unit: 'kg', stock: 5.2, minStock: 3, avgCost: 3.50, category: 'Verduras' },
  { id: 's5', name: 'Mayonesa', unit: 'kg', stock: 0.8, minStock: 1, avgCost: 12.00, category: 'Condimentos' },
  { id: 's6', name: 'Queso cheddar', unit: 'kg', stock: 2.1, minStock: 1, avgCost: 28.00, category: 'Lácteos' },
  { id: 's7', name: 'Masa de pizza', unit: 'unidad', stock: 30, minStock: 20, avgCost: 2.20, category: 'Panadería' },
  { id: 's8', name: 'Salsa de tomate', unit: 'kg', stock: 4.5, minStock: 2, avgCost: 6.00, category: 'Condimentos' },
  { id: 's9', name: 'Mozzarella', unit: 'kg', stock: 1.2, minStock: 2, avgCost: 32.00, category: 'Lácteos' },
  { id: 's10', name: 'Albahaca fresca', unit: 'gr', stock: 80, minStock: 100, avgCost: 0.04, category: 'Verduras' },
  { id: 's11', name: 'Aceite de oliva', unit: 'lt', stock: 2.8, minStock: 1, avgCost: 18.00, category: 'Aceites' },
  { id: 's12', name: 'Pollo', unit: 'kg', stock: 8.5, minStock: 5, avgCost: 12.00, category: 'Carnes' },
];

import { useInsumos } from '../../hooks/useInsumos';
import { InsumoRequest } from '../../api/insumos';

const units = ['unidad', 'kg', 'gr', 'lt', 'ml', 'bolsa', 'caja', 'lata'];

interface FrontendSupply {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  avgCost: number;
  category: string;
}

function getStatus(supply: any): 'normal' | 'bajo' | 'critico' {
  const ratio = supply.stock / supply.stockMinimo;
  if (ratio >= 1.5) return 'normal';
  if (ratio >= 0.8) return 'bajo';
  return 'critico';
}

const statusConfig = {
  normal: { label: 'Normal', icon: CheckCircle2, color: 'text-green-600', badge: 'bg-green-100 text-green-700', barColor: 'bg-green-500' },
  bajo: { label: 'Bajo', icon: AlertTriangle, color: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700', barColor: 'bg-yellow-500' },
  critico: { label: 'Crítico', icon: XCircle, color: 'text-red-600', badge: 'bg-red-100 text-red-700', barColor: 'bg-red-500' },
};

const emptyForm = { name: '', unit: 'unidad', stock: '', minStock: '', avgCost: '', category: '' };

export function Supplies() {
  const { insumos, isLoading, createInsumo, updateInsumo, deleteInsumo } = useInsumos();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = insumos
    .filter(s => s.estado !== 'INACTIVO')
    .filter(s => {
      const matchSearch = s.nombre.toLowerCase().includes(search.toLowerCase());
      const status = getStatus(s);
      const matchStatus = filterStatus === 'all' || status === filterStatus;
      return matchSearch && matchStatus;
    });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.nombre, unit: s.unidad, stock: String(s.stock), minStock: String(s.stockMinimo), avgCost: String(s.costoPromedio), category: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data: InsumoRequest = {
      nombre: form.name,
      shadow: undefined, // empty
      unidad: form.unit,
      stock: parseFloat(form.stock) || 0,
      stockMinimo: parseFloat(form.minStock) || 0,
      costoPromedio: parseFloat(form.avgCost) || 0,
      estado: 'ACTIVO',
    };
    if (editing) {
      await updateInsumo({ id: editing.idInsumo, data });
    } else {
      await createInsumo(data);
    }
    setDialogOpen(false);
  };

  const statusCounts = {
    normal: insumos.filter(s => s.estado !== 'INACTIVO' && getStatus(s) === 'normal').length,
    bajo: insumos.filter(s => s.estado !== 'INACTIVO' && getStatus(s) === 'bajo').length,
    critico: insumos.filter(s => s.estado !== 'INACTIVO' && getStatus(s) === 'critico').length,
  };

  if (isLoading) {
    return <div className="p-6">Cargando insumos...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de Insumos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{insumos.filter(s => s.estado !== 'INACTIVO').length} insumos registrados</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Nuevo Insumo</Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        {(['normal', 'bajo', 'critico'] as const).map(s => {
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <Card key={s} className={`cursor-pointer transition-all ${filterStatus === s ? 'ring-2 ring-primary' : ''}`} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-8 h-8 ${cfg.color}`} />
                <div>
                  <p className="text-2xl font-semibold">{statusCounts[s]}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar insumo..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filterStatus !== 'all' && (
          <Button variant="outline" size="sm" onClick={() => setFilterStatus('all')}>
            Limpiar filtro
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Categoría</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden md:table-cell">Stock mín.</TableHead>
              <TableHead className="hidden lg:table-cell">Costo prom.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(s => {
              const status = getStatus(s);
              const cfg = statusConfig[status];
              const pct = Math.min((s.stock / (s.stockMinimo * 2)) * 100, 100);
              return (
                <TableRow key={s.idInsumo}>
                  <TableCell className="font-medium">{s.nombre}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">Insumo</TableCell>
                  <TableCell className="text-sm">{s.unidad}</TableCell>
                  <TableCell>
                    <div className="space-y-1 min-w-[80px]">
                      <span className="text-sm font-medium">{s.stock}</span>
                      <Progress value={pct} className={`h-1.5`} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{s.stockMinimo}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">S/ {s.costoPromedio.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(s)}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { setDeleting(s); setDeleteOpen(true); }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nombre *</Label>
              <Input placeholder="Ej: Carne de res" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Unidad de medida</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stock actual</Label>
              <Input type="number" step="0.01" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Stock mínimo</Label>
              <Input type="number" step="0.01" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Costo promedio (S/ por {form.unit || 'unidad'})</Label>
              <Input type="number" step="0.001" value={form.avgCost} onChange={e => setForm(f => ({ ...f, avgCost: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editing ? 'Guardar cambios' : 'Crear insumo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Eliminar insumo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">¿Eliminar <strong>{deleting?.nombre}</strong>? Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleting) { await deleteInsumo(deleting.idInsumo); } setDeleteOpen(false); }}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
