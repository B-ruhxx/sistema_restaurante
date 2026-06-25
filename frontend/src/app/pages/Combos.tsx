import { useState } from 'react';
import {
  Plus, Search, Pencil, Trash2, MoreHorizontal, LayoutGrid, List,
  Tag, Percent, X, Package, Loader2
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
import { ComboRequest } from '../../api/combos';
import authApi from '../../api/auth';
import { toast } from '../../lib/notifications';


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
  image: string;
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
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando combos...</p>
      </div>
    );
  }

  // Map API combos to UI Combo interface
  const combos: Combo[] = apiCombos.map((c: any) => {
    const comboItems: ComboItem[] = (c.detalles || []).map((det: any) => ({
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
      image: c.imagenUrl ? getFullImageUrl(c.imagenUrl) : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=180&fit=crop&auto=format',
      rawImagenUrl: c.imagenUrl || '',
      items: comboItems,
      promoPrice: c.precio,
      regularTotal: total,
      active: c.estado === 'ACTIVO',
      validUntil: '',
      tag: '',
    };
  });

  // Map products to select options
  const mappedProducts = productos.map(p => ({
    id: String(p.idProducto),
    name: p.nombre,
    price: p.precio,
  }));

  const filtered = combos.filter(c => {
    if (!c.active) return false; // filter out inactive/deleted combos
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
    // Store the raw imagenUrl from API (relative path) not the full URL
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

    const payload: ComboRequest = {
      nombre: form.name,
      descripcion: form.description,
      precio: promoPrice,
      // Store only relative path (e.g. /api/uploads/combos/xxx.jpg or empty)
      imagenUrl: form.image && !form.image.startsWith('http') ? form.image : (form.image ? form.image.replace(/^https?:\/\/[^/]+/, '') : undefined),
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



  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Combos y Promociones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{combos.filter(c => c.active).length} activos de {combos.length} totales</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Nuevo Combo</Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar combo..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button onClick={() => setView('cards')} className={cn('p-2 transition-colors', view === 'cards' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('table')} className={cn('p-2 transition-colors', view === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards View */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => {
            const discount = c.regularTotal > 0 ? ((c.regularTotal - c.promoPrice) / c.regularTotal) * 100 : 0;
            return (
              <Card key={c.id} className={`overflow-hidden hover:shadow-md transition-shadow ${!c.active ? 'opacity-60' : ''}`}>
                <div className="relative">
                  <img src={c.image} alt={c.name} className="w-full h-40 object-cover bg-muted" />
                  {c.tag && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                      {c.tag}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-destructive text-white text-xs px-2 py-1 rounded-full font-bold">
                    -{discount.toFixed(0)}%
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{c.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { setDeleting(c); setDeleteOpen(true); }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-1 mb-3">
                    {c.items.map(i => (
                      <div key={i.productId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-4 h-4 rounded bg-muted flex items-center justify-center text-[10px] font-bold">{i.qty}</span>
                        {i.productName}
                      </div>
                    ))}
                  </div>

                  <Separator className="mb-3" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground line-through">S/ {c.regularTotal.toFixed(2)}</p>
                      <p className="text-lg font-bold text-primary">S/ {c.promoPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={c.active ? 'default' : 'secondary'}>{c.active ? 'Activo' : 'Inactivo'}</Badge>
                      {c.validUntil && <p className="text-xs text-muted-foreground mt-1">Hasta {c.validUntil}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <Card>
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
                      <p className="font-medium">{c.name}</p>
                      {c.tag && <p className="text-xs text-muted-foreground">{c.tag}</p>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{c.items.length} productos</TableCell>
                    <TableCell className="text-sm text-muted-foreground line-through">S/ {c.regularTotal.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-primary">S/ {c.promoPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="text-xs text-green-600 font-medium">-S/ {savings.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{c.validUntil || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={c.active ? 'default' : 'secondary'}>{c.active ? 'Activo' : 'Inactivo'}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { setDeleting(c); setDeleteOpen(true); }}>
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
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Combo' : 'Nuevo Combo'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nombre del combo *</Label>
              <Input placeholder="Ej: Combo Familiar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Descripción</Label>
              <Textarea rows={2} className="mt-1 resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>Etiqueta (emoji + texto)</Label>
              <Input placeholder="Ej: 🔥 Más vendido" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Válido hasta</Label>
              <Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} className="mt-1" />
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

            <div className="col-span-2">
              <Separator />
              <p className="text-sm font-medium mt-3 mb-2">Productos incluidos</p>
              <div className="flex gap-2 mb-3">
                <select
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={addProd.productId}
                  onChange={e => setAddProd(a => ({ ...a, productId: e.target.value }))}
                >
                  <option value="">Seleccionar producto...</option>
                  {mappedProducts.map(p => <option key={p.id} value={p.id}>{p.name} — S/ {p.price}</option>)}
                </select>
                <Input type="number" className="w-20" placeholder="Cant." value={addProd.qty} onChange={e => setAddProd(a => ({ ...a, qty: e.target.value }))} />
                <Button size="sm" onClick={handleAddProduct} disabled={!addProd.productId}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {items.map(i => (
                  <div key={i.productId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                    <span className="w-6 h-6 rounded bg-background border text-center text-xs font-medium flex items-center justify-center">{i.qty}</span>
                    <span className="flex-1">{i.productName}</span>
                    <span className="text-muted-foreground">S/ {(i.regularPrice * i.qty).toFixed(2)}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setItems(prev => prev.filter(x => x.productId !== i.productId))}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Sin productos agregados</p>}
              </div>
            </div>

            <div>
              <Label>Precio regular (auto)</Label>
              <Input disabled value={`S/ ${regularTotal.toFixed(2)}`} className="mt-1 bg-muted/50" />
            </div>
            <div>
              <Label>Precio promocional *</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={form.promoPrice} onChange={e => setForm(f => ({ ...f, promoPrice: e.target.value }))} className="mt-1" />
            </div>

            {promoPrice > 0 && regularTotal > 0 && (
              <div className="col-span-2 flex items-center gap-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <Percent className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-green-800 font-medium">Ahorro: S/ {savings.toFixed(2)}</span>
                  <span className="text-green-700 ml-2">({savingsPct.toFixed(1)}% descuento)</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label>Combo activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.promoPrice}>
              {editing ? 'Guardar cambios' : 'Crear combo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Eliminar combo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">¿Eliminar <strong>{deleting?.name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleting) { await deleteCombo(Number(deleting.id)); setDeleteOpen(false); setDeleting(null); } }}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
