import { useState } from 'react';
import {
  Plus, Pencil, Trash2, MoreHorizontal, LayoutGrid, List,
  Percent, X, Loader2
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
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { cn, getFullImageUrl } from '../components/ui/utils';
import { ImageUploadZone } from '../components/ui/image-upload-zone';
import { useCombos } from '../../hooks/useCombos';
import { useProductos } from '../../hooks/useProductos';
import type { Combo as ApiCombo, ComboDetalle, ComboRequest } from '../../api/combos';
import { toast } from '../../lib/notifications';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';

interface ComboItem {
  productId: string;
  productName: string;
  qty: number;
  regularPrice: number;
}

interface Combo {
  id: string;
  name: string;
  description: string;
  image?: string;
  rawImagenUrl?: string;
  items: ComboItem[];
  promoPrice: number;
  regularTotal: number;
  active: boolean;
  validUntil: string;
  tag: string;
}

const emptyForm = { name: '', description: '', image: '', promoPrice: '', validUntil: '', tag: '', active: true };

export function Combos() {
  const { combos: apiCombos, isLoading, createCombo, updateCombo, deleteCombo } = useCombos();
  const { productos } = useProductos();

  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Combo | null>(null);
  const [deleting, setDeleting] = useState<Combo | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<ComboItem[]>([]);
  const [addProd, setAddProd] = useState({ productId: '', qty: '1' });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando combos...</p>
      </div>
    );
  }

  // Map API combos to UI Combo interface
  const combos: Combo[] = apiCombos.map((c: ApiCombo) => {
    const comboItems: ComboItem[] = (c.detalles || []).map((det: ComboDetalle) => ({
      productId: String(det.idProducto),
      productName: det.nombreProducto || 'Producto',
      qty: det.cantidad,
      regularPrice: det.precioProducto || 0,
    }));
    const total = comboItems.reduce((s, i) => s + i.regularPrice * i.qty, 0);

    return {
      id: String(c.idCombo),
      name: c.nombre,
      description: c.descripcion || '',
      image: c.imagenUrl ? getFullImageUrl(c.imagenUrl) : undefined,
      rawImagenUrl: c.imagenUrl || '',
      items: comboItems,
      promoPrice: c.precio,
      regularTotal: total,
      active: c.estado === 'ACTIVO',
      validUntil: c.validoHasta || '',
      tag: c.etiqueta || '',
    };
  });

  // Map products to select options
  const mappedProducts = productos
    .filter((p) => p.estado === 'ACTIVO' && p.esSku !== false && !p.tieneSkus)
    .map((p) => ({
      id: String(p.idProducto),
      name: p.nombreProductoPadre
        ? `${p.nombreProductoPadre} / ${p.nombre}${p.sku ? ` (${p.sku})` : ''}`
        : `${p.nombre}${p.sku ? ` (${p.sku})` : ''}`,
      price: Number(p.precio || 0),
    }));

  const filtered = combos.filter(c => {
    return c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
  });

  const regularTotal = items.reduce((s, i) => s + i.regularPrice * i.qty, 0);
  const promoPrice = parseFloat(form.promoPrice) || 0;
  const savings = regularTotal - promoPrice;
  const savingsPct = regularTotal > 0 ? (savings / regularTotal) * 100 : 0;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setItems([]);
    setDialogOpen(true);
  };

  const openEdit = (c: Combo) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description, image: c.rawImagenUrl || '', promoPrice: String(c.promoPrice), validUntil: c.validUntil, tag: c.tag, active: c.active });
    setItems([...c.items]);
    setDialogOpen(true);
  };

  const handleAddProduct = () => {
    const prod = mappedProducts.find(p => p.id === addProd.productId);
    if (!prod) return;
    const qty = parseInt(addProd.qty) || 1;
    const existing = items.find(i => i.productId === prod.id);
    if (existing) {
      setItems(prev => prev.map(i => i.productId === prod.id ? { ...i, qty: i.qty + qty } : i));
    } else {
      setItems(prev => [...prev, { productId: prod.id, productName: prod.name, qty, regularPrice: prod.price }]);
    }
    setAddProd({ productId: '', qty: '1' });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.promoPrice) {
      toast.error('El nombre y precio son obligatorios');
      return;
    }
    if (items.length === 0) {
      toast.error('Debe agregar al menos un producto al combo');
      return;
    }
    if (promoPrice <= 0) {
      toast.error('El precio promocional debe ser mayor a cero');
      return;
    }
    if (regularTotal > 0 && promoPrice > regularTotal) {
      toast.error('El precio promocional no debe superar el total regular del combo');
      return;
    }

    const payload: ComboRequest = {
      nombre: form.name.trim(),
      descripcion: form.description.trim() || undefined,
      precio: promoPrice,
      imagenUrl: form.image && !form.image.startsWith('http') ? form.image : (form.image ? form.image.replace(/^https?:\/\/[^/]+/, '') : undefined),
      etiqueta: form.tag.trim() || undefined,
      validoHasta: form.validUntil || undefined,
      estado: form.active ? 'ACTIVO' : 'INACTIVO',
      detalles: items.map(item => ({
        idProducto: Number(item.productId),
        cantidad: item.qty,
      })),
    };

    try {
      if (editing) {
        await updateCombo({ id: Number(editing.id), data: payload });
        toast.success('Combo actualizado correctamente');
      } else {
        await createCombo(payload);
        toast.success('Combo creado correctamente');
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el combo');
    }
  };

  const totalActivos = combos.filter(c => c.active).length;

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Catálogo' },
          { label: 'Combos' },
        ]}
        icon={Percent}
        iconColor="blue"
        title="Combos y Promociones"
        subtitle="Administra ofertas conjuntas de la carta, promociones temporales y descuentos vinculados."
        action={
          <Button onClick={openCreate} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nuevo Combo
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiCard
          icon={Percent}
          label="Total Combos"
          value={combos.length}
          color="slate"
        />
        <KpiCard
          icon={Percent}
          label="Combos Activos"
          value={totalActivos}
          color="green"
        />
      </div>

      {/* Toolbar */}
      <FilterToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar combo...',
        }}
        actions={
          <div className="flex items-center border border-border rounded-xl bg-muted/20 p-1 overflow-hidden">
            <Button size="icon" onClick={() => setView('cards')} variant={view === 'cards' ? 'default' : 'ghost'} className="h-9 w-9 rounded-lg">
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button size="icon" onClick={() => setView('table')} variant={view === 'table' ? 'default' : 'ghost'} className="h-9 w-9 rounded-lg">
              <List className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="Sin combos encontrados"
          description="Crea promociones y combos de productos para agilizar tus ventas y ofrecer precios competitivos."
          action={
            <Button onClick={openCreate} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Combo
            </Button>
          }
        />
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => {
            const discount = c.regularTotal > 0 ? ((c.regularTotal - c.promoPrice) / c.regularTotal) * 100 : 0;
            return (
              <Card key={c.id} className={cn('border border-border bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden hover:border-primary/30 transition-all flex flex-col justify-between', !c.active && 'opacity-65')}>
                <div>
                  <div className="relative aspect-[16/9] bg-muted border-b border-border/60">
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-semibold">
                        Sin imagen
                      </div>
                    )}
                    {c.tag && (
                      <Badge className="absolute top-2.5 left-2.5 font-semibold text-[9px] shadow-2xs">
                        {c.tag}
                      </Badge>
                    )}
                    {discount > 0 && (
                      <Badge variant="destructive" className="absolute top-2.5 right-2.5 font-bold text-[9px] shadow-2xs">
                        -{discount.toFixed(0)}% DCTO
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-bold text-foreground text-sm leading-snug">{c.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed font-medium">{c.description || 'Sin descripción'}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg flex-shrink-0">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openEdit(c)} className="rounded-lg">
                            <Pencil className="w-4 h-4 mr-2 text-muted-foreground" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="ui-status-danger rounded-lg focus:bg-[var(--status-danger-surface)]" onClick={() => { setDeleting(c); setDeleteOpen(true); }}>
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-1.5 py-1.5 border-t border-border/40">
                      {c.items.map(i => (
                        <div key={i.productId} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                          <span className="w-5 h-5 rounded bg-muted border border-border/60 flex items-center justify-center text-[10px] text-foreground font-bold">{i.qty}</span>
                          <span className="truncate flex-1">{i.productName}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <div className="p-5 pt-0 border-t border-border/40 mt-3">
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground line-through font-semibold ui-tabular">S/ {c.regularTotal.toFixed(2)}</p>
                      <p className="text-lg font-black text-primary ui-tabular">S/ {c.promoPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={c.active ? 'success' : 'secondary'} className="shadow-2xs text-[9px] font-bold px-2 py-0.5">{c.active ? 'Activo' : 'Inactivo'}</Badge>
                      {c.validUntil && <p className="text-[10px] text-muted-foreground font-medium">Hasta {c.validUntil}</p>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <SectionCard
          title="Listado de combos y ofertas"
          description="Estructuración de ofertas y precios especiales."
          icon={Percent}
          iconColor="blue"
        >
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead>Precio regular</TableHead>
                  <TableHead>Precio promo</TableHead>
                  <TableHead>Ahorro</TableHead>
                  <TableHead className="hidden sm:table-cell">Válido hasta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => {
                  const savings = c.regularTotal - c.promoPrice;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-bold text-foreground">{c.name}</p>
                        {c.tag && <Badge className="text-[9px] h-4 mt-1">{c.tag}</Badge>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-semibold text-muted-foreground">{c.items.length} productos</TableCell>
                      <TableCell className="text-xs text-muted-foreground line-through font-medium ui-tabular">S/ {c.regularTotal.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-primary ui-tabular">S/ {c.promoPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className="text-xs ui-status-success font-bold ui-tabular">-S/ {savings.toFixed(2)}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground font-medium">{c.validUntil || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={c.active ? 'success' : 'secondary'} className="shadow-2xs">{c.active ? 'Activo' : 'Inactivo'}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => openEdit(c)} className="rounded-lg">
                              <Pencil className="w-4 h-4 mr-2 text-muted-foreground" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="ui-status-danger rounded-lg focus:bg-[var(--status-danger-surface)]" onClick={() => { setDeleting(c); setDeleteOpen(true); }}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editing ? 'Editar Combo' : 'Nuevo Combo'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold">Nombre del combo *</Label>
              <Input placeholder="Ej: Combo Familiar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-11 rounded-xl" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold">Descripción</Label>
              <Textarea rows={2} className="resize-none rounded-xl" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalles de lo que incluye el combo..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Etiqueta comercial</Label>
              <Input placeholder="Ej: Más vendido" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Válido hasta</Label>
              <Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} className="h-11 rounded-xl bg-background" />
            </div>
            <div className="col-span-2">
              <ImageUploadZone
                label="Imagen del combo"
                value={form.image}
                onChange={(url) => setForm(f => ({ ...f, image: url }))}
                module="combos"
                description="Sube una imagen o arrástrala desde tu equipo o internet. Formatos: JPG, PNG, WEBP."
              />
            </div>

            <div className="col-span-2 space-y-3">
              <Separator className="my-2" />
              <p className="text-sm font-bold text-foreground">Productos incluidos en el combo</p>
              <div className="flex gap-2">
                <select
                  className="flex-1 h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={addProd.productId}
                  onChange={e => setAddProd(a => ({ ...a, productId: e.target.value }))}
                >
                  <option value="">Seleccionar SKU vendible...</option>
                  {mappedProducts.map(p => <option key={p.id} value={p.id}>{p.name} — S/ {p.price.toFixed(2)}</option>)}
                </select>
                <Input type="number" className="w-24 h-11 rounded-xl" placeholder="Cant." value={addProd.qty} onChange={e => setAddProd(a => ({ ...a, qty: e.target.value }))} />
                <Button type="button" onClick={handleAddProduct} disabled={!addProd.productId} className="h-11 rounded-xl px-4">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {items.map(i => (
                  <div key={i.productId} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50 text-xs">
                    <span className="w-6 h-6 rounded-lg bg-background border text-center text-xs font-bold flex items-center justify-center shadow-2xs">{i.qty}</span>
                    <span className="flex-1 font-semibold text-foreground">{i.productName}</span>
                    <span className="text-muted-foreground font-bold ui-tabular">S/ {(i.regularPrice * i.qty).toFixed(2)}</span>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 rounded-lg ui-status-danger hover:bg-[var(--status-danger-surface)]" onClick={() => setItems(prev => prev.filter(x => x.productId !== i.productId))}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 font-semibold">Sin productos en la oferta</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Precio regular acumulado</Label>
              <Input disabled value={`S/ ${regularTotal.toFixed(2)}`} className="h-11 rounded-xl bg-muted/40 font-bold ui-tabular text-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Precio promocional combo *</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.promoPrice} onChange={e => setForm(f => ({ ...f, promoPrice: e.target.value }))} className="h-11 rounded-xl font-bold" />
            </div>

            {promoPrice > 0 && regularTotal > 0 && (
              <div className="col-span-2 flex items-center gap-3.5 p-3.5 rounded-xl ui-status-success-soft border">
                <Percent className="w-5 h-5 ui-status-success flex-shrink-0" />
                <div className="text-xs font-bold leading-normal">
                  <span className="ui-status-success block">Ahorro total estimado: S/ {savings.toFixed(2)}</span>
                  <span className="text-muted-foreground mt-0.5 block font-medium">({savingsPct.toFixed(1)}% de descuento real aplicado)</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 col-span-2 pt-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label className="text-sm font-semibold">Combo activo en menú</Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.promoPrice} className="h-10 rounded-xl">
              {editing ? 'Guardar cambios' : 'Crear combo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg font-bold">Desactivar combo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            ¿Seguro que deseas inactivar el combo <strong>{deleting?.name}</strong>? Se ocultará de la lista del POS.
          </p>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="h-10 rounded-xl">Cancelar</Button>
            <Button
              variant="destructive"
              className="h-10 rounded-xl"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteCombo(Number(deleting.id));
                  toast.success('Combo inactivado correctamente');
                  setDeleteOpen(false);
                  setDeleting(null);
                } catch (error) {
                  console.error(error);
                  toast.error('No se pudo inactivar el combo');
                }
              }}
            >
              Inactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
