import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Pencil, Trash2, MoreHorizontal, AlertTriangle,
  CheckCircle2, XCircle, MinusCircle, Loader2, Package
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
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

import { useInsumos } from '../../hooks/useInsumos';
import { useMovimientos } from '../../hooks/useMovimientos';
import {
  getInventoryMovementLabel,
  getInventoryMovementSignedQuantity,
  movimientosApi,
} from '../../api/movimientos';
import type { Insumo, InsumoRequest } from '../../api/insumos';
import { PageWrapper, ModuleHeader, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

const units = ['unidad', 'kg', 'gr', 'lt', 'ml', 'bolsa', 'caja', 'lata'];

function getStatus(supply: Insumo): 'normal' | 'bajo' | 'critico' {
  if (!supply.stockMinimo || supply.stockMinimo <= 0) return 'normal';
  const ratio = supply.stock / supply.stockMinimo;
  if (ratio >= 1.5) return 'normal';
  if (ratio >= 0.8) return 'bajo';
  return 'critico';
}

const statusConfig = {
  normal: { label: 'Normal', icon: CheckCircle2, color: 'ui-status-success', badge: 'ui-status-success-soft' },
  bajo: { label: 'Bajo', icon: AlertTriangle, color: 'ui-status-warning', badge: 'ui-status-warning-soft' },
  critico: { label: 'Crítico', icon: XCircle, color: 'ui-status-danger', badge: 'ui-status-danger-soft' },
};

const emptyForm = { name: '', unit: 'unidad', stock: '0', minStock: '', avgCost: '' };

export function Supplies() {
  const queryClient = useQueryClient();
  const { insumos, isLoading, createInsumo, updateInsumo, deleteInsumo } = useInsumos();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Insumo | null>(null);
  const [deleting, setDeleting] = useState<Insumo | null>(null);
  const [adjusting, setAdjusting] = useState<Insumo | null>(null);
  const [historyInsumo, setHistoryInsumo] = useState<Insumo | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [adjustForm, setAdjustForm] = useState({ qty: '', note: '' });
  const { movimientos: historyMovs, isLoading: isLoadingHistory } = useMovimientos(
    { idInsumo: historyInsumo?.idInsumo },
    { enabled: !!historyInsumo }
  );
  const ajusteMutation = useMutation({
    mutationFn: movimientosApi.ajustar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    },
  });

  const filtered = insumos.filter(s => {
    const matchSearch = s.nombre.toLowerCase().includes(search.toLowerCase());
    const status = getStatus(s);
    const matchStatus = filterStatus === 'all' || status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: Insumo) => {
    setEditing(s);
    setForm({ name: s.nombre, unit: s.unidad, stock: String(s.stock), minStock: String(s.stockMinimo), avgCost: String(s.costoPromedio) });
    setDialogOpen(true);
  };

  const openAdjust = (s: Insumo) => {
    setAdjusting(s);
    setAdjustForm({ qty: '', note: '' });
  };

  const handleAdjust = async () => {
    if (!adjusting || !adjustForm.qty || !adjustForm.note.trim()) return;
    const qty = parseFloat(adjustForm.qty);
    if (qty <= 0) return;
    await ajusteMutation.mutateAsync({
      tipoRecurso: 'INSUMO',
      idInsumo: adjusting.idInsumo,
      cantidad: qty,
      motivo: adjustForm.note.trim(),
    });
    setAdjusting(null);
  };

  const handleSave = async () => {
    const data: InsumoRequest = {
      nombre: form.name,
      unidad: form.unit,
      stock: 0,
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
    normal: insumos.filter(s => getStatus(s) === 'normal').length,
    bajo: insumos.filter(s => getStatus(s) === 'bajo').length,
    critico: insumos.filter(s => getStatus(s) === 'critico').length,
  };

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Inventario' },
          { label: 'Insumos' },
        ]}
        icon={Package}
        iconColor="blue"
        title="Gestión de Insumos"
        subtitle="Administra el catálogo maestro de insumos, stocks mínimos y costos promedio."
        action={
          <Button onClick={openCreate} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nuevo Insumo
          </Button>
        }
      />

      {/* Status KPI Cards — clickable as filters */}
      <div className="grid grid-cols-3 gap-4">
        {(['normal', 'bajo', 'critico'] as const).map(s => {
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <div
              key={s}
              className={cn(
                'rounded-2xl border p-4 cursor-pointer transition-all flex items-center gap-3 bg-card shadow-sm',
                filterStatus === s
                  ? 'ring-2 ring-primary border-primary/40'
                  : 'border-border hover:border-primary/30'
              )}
              onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                s === 'normal' ? 'ui-status-success-soft' :
                s === 'bajo' ? 'ui-status-warning-soft' :
                'ui-status-danger-soft'
              )}>
                <Icon className={cn('w-5 h-5', cfg.color)} />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground leading-none">{statusCounts[s]}</p>
                <p className="text-xs font-semibold text-muted-foreground mt-1">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <FilterToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar insumo por nombre...',
        }}
        filters={
          filterStatus !== 'all' ? (
            <Button variant="outline" size="sm" onClick={() => setFilterStatus('all')} className="h-9 rounded-xl gap-1.5 text-xs font-semibold">
              Limpiar filtro
            </Button>
          ) : undefined
        }
      />

      {/* Table */}
      {isLoading ? (
        <div className="h-40 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Cargando insumos...</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin insumos encontrados"
          description="Registra insumos de tu almacén para hacer seguimiento de stock mínimo y costos."
          action={
            <Button onClick={openCreate} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Insumo
            </Button>
          }
        />
      ) : (
        <SectionCard
          title="Catálogo de Insumos"
          description={`Mostrando ${filtered.length} insumos del almacén.`}
          icon={Package}
          iconColor="blue"
        >
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Stock actual</TableHead>
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
                  const pct = s.stockMinimo > 0 ? Math.min((s.stock / (s.stockMinimo * 2)) * 100, 100) : 100;
                  return (
                    <TableRow key={s.idInsumo}>
                      <TableCell className="font-bold text-foreground">{s.nombre}</TableCell>
                      <TableCell className="text-xs font-semibold text-muted-foreground">{s.unidad}</TableCell>
                      <TableCell>
                        <div className="space-y-1.5 min-w-[80px]">
                          <span className="text-sm font-bold text-foreground">{s.stock}</span>
                          <Progress value={pct} className="h-1.5 rounded-full" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-semibold text-muted-foreground">{s.stockMinimo}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs font-bold text-foreground ui-tabular">S/ {s.costoPromedio.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={cn('text-[10px] px-2.5 py-1 rounded-lg font-bold', cfg.badge)}>{cfg.label}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => setHistoryInsumo(s)} className="rounded-lg">
                              <Search className="w-4 h-4 mr-2 text-muted-foreground" /> Historial
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAdjust(s)} className="rounded-lg">
                              <MinusCircle className="w-4 h-4 mr-2 text-muted-foreground" /> Registrar salida
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(s)} className="rounded-lg">
                              <Pencil className="w-4 h-4 mr-2 text-muted-foreground" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive rounded-lg" onClick={() => { setDeleting(s); setDeleteOpen(true); }}>
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
          </div>
        </SectionCard>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editing ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold">Nombre *</Label>
              <Input placeholder="Ej: Carne de res" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-11 rounded-xl" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold">Unidad de medida</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">{units.map(u => <SelectItem key={u} value={u} className="rounded-lg">{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Stock actual</Label>
              <div className="h-11 rounded-xl border border-border/40 bg-muted/30 px-3 flex items-center text-sm font-bold text-muted-foreground">
                {form.stock || '0'} {form.unit}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Stock mínimo</Label>
              <Input type="number" step="0.01" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} className="h-11 rounded-xl" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold">Costo promedio (S/ por {form.unit || 'unidad'})</Label>
              <Input type="number" step="0.001" value={form.avgCost} onChange={e => setForm(f => ({ ...f, avgCost: e.target.value }))} className="h-11 rounded-xl" />
            </div>
            <div className="col-span-2 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-xs text-muted-foreground font-medium leading-relaxed">
              El stock se actualiza formalmente mediante Compras y ajustes del Kardex, no desde esta ficha maestra.
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="h-10 rounded-xl font-semibold">
              {editing ? 'Guardar cambios' : 'Crear insumo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">Eliminar insumo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">¿Eliminar <strong>{deleting?.nombre}</strong>? Esta acción no se puede deshacer y puede afectar recetas asociadas.</p>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="h-10 rounded-xl">Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleting) { await deleteInsumo(deleting.idInsumo); } setDeleteOpen(false); }} className="h-10 rounded-xl">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={!!adjusting} onOpenChange={(open) => !open && setAdjusting(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">Registrar salida — {adjusting?.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-xs text-muted-foreground font-medium leading-relaxed">
              Las entradas se registran desde Compras. Esta salida generará un movimiento Kardex con motivo obligatorio.
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Cantidad a descontar</Label>
              <Input
                type="number"
                min="0.01"
                step="any"
                value={adjustForm.qty}
                onChange={e => setAdjustForm(f => ({ ...f, qty: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Motivo *</Label>
              <Textarea
                rows={2}
                className="resize-none rounded-xl"
                placeholder="Ej: merma, vencimiento, rotura"
                value={adjustForm.note}
                onChange={e => setAdjustForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setAdjusting(null)} className="h-10 rounded-xl">Cancelar</Button>
            <Button onClick={handleAdjust} disabled={!adjustForm.qty || !adjustForm.note.trim() || ajusteMutation.isPending} className="h-10 rounded-xl font-semibold">
              {ajusteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar salida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyInsumo} onOpenChange={() => setHistoryInsumo(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Historial de movimientos — {historyInsumo?.nombre}</DialogTitle>
          </DialogHeader>
          {isLoadingHistory ? (
            <div className="h-24 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Cargando movimientos...</span>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyMovs.map((mov) => (
                    <TableRow key={mov.idMovimiento ?? `${mov.fecha ?? 'mov'}-${mov.referenceId ?? 'n/a'}`}>
                      <TableCell className="text-xs font-semibold text-muted-foreground">{mov.fecha?.replace('T', ' ').slice(0, 16)}</TableCell>
                      <TableCell className="text-xs font-bold text-foreground">{getInventoryMovementLabel(mov.tipoMovimiento)}</TableCell>
                      <TableCell className="text-xs font-semibold text-muted-foreground">{mov.referenceType}{mov.referenceId ? ` #${mov.referenceId}` : ''}</TableCell>
                      <TableCell className="text-right font-bold text-foreground ui-tabular">{getInventoryMovementSignedQuantity(mov)}</TableCell>
                    </TableRow>
                  ))}
                  {historyMovs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground text-xs font-semibold">
                        Sin movimientos registrados para este insumo.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
