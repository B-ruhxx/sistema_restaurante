import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Search, Pencil, Trash2, MoreHorizontal, ImagePlus,
  Package, ChevronRight, Star, History, FlaskConical, Layers, BookOpen,
  LayoutGrid, List,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Separator } from '../components/ui/separator';

import { useProductos } from '../../hooks/useProductos';
import { useCategorias } from '../../hooks/useCategorias';
import { useVariantes } from '../../hooks/useVariantes';
import { ProductoRequest } from '../../api/productos';

interface Product {
  id: string;
  name: string;
  category: string;
  idCategoria?: number;
  price: number;
  type: 'PREPARADO' | 'INVENTARIO_DIRECTO';
  active: boolean;
  image: string;
  description: string;
  variants: Variant[];
  stock: number;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  PREPARADO: { label: 'Elaborado', color: 'bg-blue-100 text-blue-700' },
  INVENTARIO_DIRECTO: { label: 'Directo', color: 'bg-purple-100 text-purple-700' },
  COMBO: { label: 'Combo', color: 'bg-orange-100 text-orange-700' },
};

const historyData = [
  { date: '2024-06-07', action: 'Precio actualizado', user: 'Admin', detail: 'S/ 16.90 → S/ 18.90' },
  { date: '2024-06-01', action: 'Producto creado', user: 'Admin', detail: '' },
];

export function Products() {
  const navigate = useNavigate();
  const { productos, isLoading, createProducto, updateProducto, deleteProducto, getProductoDetail } = useProductos();
  const { categorias } = useCategorias();
  
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [productTab, setProductTab] = useState('general');
  const [form, setForm] = useState<Partial<Product>>({});
  const [newVariant, setNewVariant] = useState({ name: '', price: '' });

  // Map backend products to frontend Product interface
  const mappedProducts: Product[] = productos
    .filter(p => p.estado === 'ACTIVO')
    .map(p => ({
      id: String(p.idProducto),
      name: p.nombre,
      category: p.nombreCategoria || 'Sin Categoría',
      idCategoria: p.idCategoria,
      price: p.precio,
      type: p.tipoProducto,
      active: p.estado === 'ACTIVO',
      image: p.imagenUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=60&h=60&fit=crop&auto=format',
      description: p.descripcion || '',
      variants: [], // Handled inside the detail/tabs if needed
      stock: 0,
    }));

  const filtered = mappedProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', category: 'Hamburguesas', price: 0, type: 'PREPARADO', active: true, description: '', image: '', variants: [], stock: 0 });
    setProductTab('general');
    setDialogOpen(true);
  };

  const openEdit = async (p: Product) => {
    setSelected(p);
    setForm({ ...p, variants: [] });
    
    try {
      // Fetch full detail (including recipe and stock info)
      const detail = await getProductoDetail(Number(p.id));
      if (detail) {
        setForm({
          ...p,
          stock: detail.inventario?.stock || 0,
          variants: [], // Fetch variants independently if needed
        });
      }
    } catch (error) {
      console.error('Error fetching product detail:', error);
    }
    
    setProductTab('general');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Find category ID matching name or default
    const matchedCat = categorias.find(c => c.nombre === form.category);
    
    const requestData: ProductoRequest = {
      nombre: form.name || '',
      descripcion: form.description || '',
      imagenUrl: form.image || '',
      precio: form.price || 0,
      tipoProducto: form.type || 'PREPARADO',
      estado: form.active ? 'ACTIVO' : 'INACTIVO',
      idCategoria: matchedCat?.idCategoria || (categorias.length > 0 ? categorias[0].idCategoria : undefined),
      stockInicial: form.stock || 0,
      stockMinimo: 5,
    };

    try {
      if (selected) {
        await updateProducto({ id: Number(selected.id), data: requestData });
      } else {
        await createProducto(requestData);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const addVariant = () => {
    if (!newVariant.name || !newVariant.price) return;
    const v: Variant = { id: Date.now().toString(), name: newVariant.name, price: parseFloat(newVariant.price), active: true };
    setForm(f => ({ ...f, variants: [...(f.variants || []), v] }));
    setNewVariant({ name: '', price: '' });
  };

  const removeVariant = (id: string) => {
    setForm(f => ({ ...f, variants: (f.variants || []).filter(v => v.id !== id) }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{productos.length} productos en el catálogo</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: mappedProducts.length, icon: Package },
          { label: 'Activos', value: mappedProducts.filter(p => p.active).length, icon: Star },
          { label: 'Elaborados', value: mappedProducts.filter(p => p.type === 'PREPARADO').length, icon: FlaskConical },
          { label: 'Directos', value: mappedProducts.filter(p => p.type === 'INVENTARIO_DIRECTO').length, icon: Layers },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar producto..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map(c => <SelectItem key={c.idCategoria} value={c.nombre}>{c.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center rounded-lg border border-border overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`h-9 w-9 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`h-9 w-9 flex items-center justify-center transition-colors ${viewMode === 'table' ? 'bg-red-600 text-white' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => (
            <ProductGridCard
              key={p.id}
              product={p}
              onEdit={openEdit}
              onDelete={() => { setDeleting(p); setDeleteOpen(true); }}
              onNavigateReceta={() => navigate('/recetas')}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Img</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead className="hidden lg:table-cell">Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => openEdit(p)}>
                <TableCell>
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-muted" />
                </TableCell>
                <TableCell>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[180px]">{p.description}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.category}</TableCell>
                <TableCell className="font-medium">S/ {p.price.toFixed(2)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeLabels[p.type].color}`}>
                    {typeLabels[p.type].label}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {p.type === 'INVENTARIO_DIRECTO' ? p.stock : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={p.active ? 'default' : 'secondary'}>{p.active ? 'Activo' : 'Inactivo'}</Badge>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(p)}>
                        <Pencil className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      {(p.variants?.length > 0 || p.type === 'PREPARADO') && (
                        <DropdownMenuItem onClick={() => navigate('/recetas')}>
                          <BookOpen className="w-4 h-4 mr-2 text-red-500" />
                          <span className="text-red-600 font-medium">Ver Receta</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => { setDeleting(p); setDeleteOpen(true); }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      )}

      {/* Product Dialog with Tabs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <Tabs value={productTab} onValueChange={setProductTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="variantes">Variantes</TabsTrigger>
              <TabsTrigger value="receta">Receta</TabsTrigger>
              <TabsTrigger value="inventario">Inventario</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                {form.image ? (
                  <img src={form.image} alt="" className="w-16 h-16 rounded-lg object-cover bg-muted" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Label>URL de imagen</Label>
                  <Input placeholder="https://..." value={form.image || ''} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nombre *</Label>
                  <Input placeholder="Nombre del producto" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select value={form.category || 'Hamburguesas'} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{categorias.map(c => <SelectItem key={c.idCategoria} value={c.nombre}>{c.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de producto</Label>
                  <Select value={form.type || 'PREPARADO'} onValueChange={v => setForm(f => ({ ...f, type: v as Product['type'] }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PREPARADO">Elaborado</SelectItem>
                      <SelectItem value="INVENTARIO_DIRECTO">Directo</SelectItem>
                      <SelectItem value="COMBO">Combo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Precio base (S/)</Label>
                  <Input type="number" step="0.01" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))} className="mt-1" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.active ?? true} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                  <Label>Producto activo</Label>
                </div>
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea placeholder="Descripción breve..." value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 resize-none" rows={2} />
              </div>
            </TabsContent>

            {/* Variantes */}
            <TabsContent value="variantes" className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">Define tamaños o presentaciones para este producto.</p>
              <div className="flex gap-2">
                <Input placeholder="Ej: Mediana" value={newVariant.name} onChange={e => setNewVariant(v => ({ ...v, name: e.target.value }))} />
                <Input placeholder="Precio" type="number" className="w-28" value={newVariant.price} onChange={e => setNewVariant(v => ({ ...v, price: e.target.value }))} />
                <Button onClick={addVariant} type="button"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2">
                {(form.variants || []).map(v => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium">{v.name}</span>
                    <span className="text-sm text-muted-foreground">S/ {v.price.toFixed(2)}</span>
                    <Switch checked={v.active} onCheckedChange={val => setForm(f => ({ ...f, variants: (f.variants || []).map(vv => vv.id === v.id ? { ...vv, active: val } : vv) }))} />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeVariant(v.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {(form.variants || []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin variantes configuradas</p>
                )}
              </div>
            </TabsContent>

            {/* Receta */}
            <TabsContent value="receta" className="mt-4">
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <FlaskConical className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm font-medium">Gestión de receta</p>
                <p className="text-xs text-muted-foreground max-w-xs">Configura los insumos y cantidades desde el módulo de Recetas para mayor detalle.</p>
                <Button variant="outline" size="sm">
                  <ChevronRight className="w-4 h-4 mr-1" /> Ir al constructor de recetas
                </Button>
              </div>
            </TabsContent>

            {/* Inventario */}
            <TabsContent value="inventario" className="mt-4 space-y-4">
              {form.type === 'INVENTARIO_DIRECTO' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Stock actual</Label>
                      <Input type="number" value={form.stock || 0} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) }))} className="mt-1" />
                    </div>
                    <div>
                      <Label>Stock mínimo</Label>
                      <Input type="number" defaultValue={5} className="mt-1" />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    Los productos directos requieren gestión manual de inventario.
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                  <Layers className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Inventario automático</p>
                  <p className="text-xs text-muted-foreground max-w-xs">El stock se descuenta automáticamente de los insumos al registrar una venta.</p>
                </div>
              )}
            </TabsContent>

            {/* Historial */}
            <TabsContent value="historial" className="mt-4">
              <div className="space-y-3">
                {historyData.map((h, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg border border-border">
                    <History className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{h.action}</p>
                      {h.detail && <p className="text-muted-foreground">{h.detail}</p>}
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <p>{h.date}</p>
                      <p>{h.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name?.trim()}>
              {selected ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Eliminar producto</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar <strong>{deleting?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleting) { await deleteProducto(Number(deleting.id)); } setDeleteOpen(false); }}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Card de producto para vista grid ──────────────────────── */
function ProductGridCard({
  product,
  onEdit,
  onDelete,
  onNavigateReceta,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: () => void;
  onNavigateReceta: () => void;
}) {
  const stockColor =
    !product.active          ? 'bg-gray-100 text-gray-500'
    : product.type === 'PREPARADO' ? 'bg-blue-100 text-blue-700'
    : product.stock < 5     ? 'bg-red-100 text-red-700'
    : product.stock < 20    ? 'bg-orange-100 text-orange-700'
    : 'bg-green-100 text-green-700';

  const stockLabel =
    product.type === 'PREPARADO'
      ? 'Elaborado'
      : `${product.stock} uds`;

  const hasVariants = product.variants?.length > 0 || product.type === 'PREPARADO';

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-border transition-all duration-200 flex flex-col group">
      {/* Imagen */}
      <div className="relative overflow-hidden" style={{ height: '155px' }}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
          onClick={() => onEdit(product)}
        />
        {/* Stock / tipo badge */}
        <span className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${stockColor}`}>
          {stockLabel}
        </span>
        {/* Estado badge */}
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
          product.active ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {product.active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        {/* Nombre + categoría */}
        <div className="flex items-start gap-1.5">
          <h3
            className="font-bold text-sm leading-tight flex-1 cursor-pointer hover:text-red-600 transition-colors line-clamp-2"
            onClick={() => onEdit(product)}
          >
            {product.name}
          </h3>
          <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-md leading-none mt-0.5 ${typeLabels[product.type].color}`}>
            {typeLabels[product.type].label}
          </span>
        </div>

        {/* Descripción */}
        {product.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
            {product.description}
          </p>
        )}

        {/* Precio */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/60">
          <span className="text-xs text-muted-foreground">Precio</span>
          <span className="text-base font-extrabold text-red-600 dark:text-red-400">
            S/ {product.price.toFixed(2)}
          </span>
        </div>

        {/* Receta link */}
        {hasVariants && (
          <button
            className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 font-medium transition-colors w-fit"
            onClick={onNavigateReceta}
          >
            <BookOpen className="w-3 h-3" />
            Ver receta
          </button>
        )}

        {/* Botones: Editar + Eliminar */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            onClick={() => onEdit(product)}
          >
            <Pencil className="w-3 h-3" />
            Editar
          </button>
          <button
            className="h-8 w-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shrink-0"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
