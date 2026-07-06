import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Pencil, Trash2, MoreHorizontal,
  Package, ChevronRight, Star, FlaskConical, Layers,
  LayoutGrid, List, RotateCcw
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';

import { useProductos } from '../../hooks/useProductos';
import { useCategorias } from '../../hooks/useCategorias';
import { ProductoEstadoFiltro, ProductoRequest } from '../../api/productos';
import { getFullImageUrl } from '../components/ui/utils';
import { ImageUploadZone } from '../components/ui/image-upload-zone';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';

interface Product {
  id: string;
  name: string;
  category: string;
  idCategoria?: number;
  price: number | null;
  type: 'PREPARADO' | 'INVENTARIO_DIRECTO';
  active: boolean;
  image: string;
  rawImagenUrl?: string;
  description: string;
  stock: number;
  stockMinimo?: number;
  sku?: string;
  esSku: boolean;
  idProductoPadre?: number;
  nombreProductoPadre?: string;
  tieneSkus?: boolean;
  lotesDisponibles?: number;
  proximoVencimiento?: string;
  skuCount: number;
  activeSkuCount: number;
  priceLabel: string;
  stockLabel: string;
}

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=320&h=240&fit=crop&auto=format';

export function Products() {
  const navigate = useNavigate();
  const [estadoFilter, setEstadoFilter] = useState<ProductoEstadoFiltro>('ACTIVO');
  const { productos, createProducto, updateProducto, deleteProducto, updateProductoEstado, getProductoDetail } = useProductos({ estado: estadoFilter });
  const { productos: allProductos } = useProductos({ estado: 'TODOS' });
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
  const [formError, setFormError] = useState('');
  const estadoLabel = estadoFilter === 'TODOS' ? 'en el catálogo' : estadoFilter === 'ACTIVO' ? 'activos' : 'inactivos';

  const skusByParent = useMemo(() => {
    const map = new Map<number, typeof allProductos>();
    allProductos.forEach(producto => {
      if (producto.esSku !== false && producto.idProductoPadre) {
        const current = map.get(producto.idProductoPadre) || [];
        current.push(producto);
        map.set(producto.idProductoPadre, current);
      }
    });
    return map;
  }, [allProductos]);

  const mappedProducts: Product[] = useMemo(() => productos.map(p => {
    const childSkus = skusByParent.get(p.idProducto) || [];
    const activeChildSkus = childSkus.filter(sku => sku.estado === 'ACTIVO');
    const prices = activeChildSkus
      .map(sku => sku.precio)
      .filter((price): price is number => price != null && price > 0);
    const isParent = p.esSku === false;
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const stockTotal = isParent
      ? childSkus.reduce((sum, sku) => sum + (sku.stockActual ?? sku.stockTotal ?? 0), 0)
      : (p.stockActual ?? p.stockTotal ?? 0);
    const priceLabel = isParent
      ? prices.length === 0
        ? 'Sin SKUs'
        : minPrice === maxPrice
          ? `S/ ${minPrice.toFixed(2)}`
          : `S/ ${minPrice.toFixed(2)} - S/ ${maxPrice.toFixed(2)}`
      : `S/ ${p.precio != null ? p.precio.toFixed(2) : '—'}`;

    return {
      id: String(p.idProducto),
      name: p.nombre,
      category: p.nombreCategoria || 'Sin Categoría',
      idCategoria: p.idCategoria,
      price: isParent ? minPrice : p.precio,
      type: p.tipoProducto,
      active: p.estado === 'ACTIVO',
      image: p.imagenUrl ? getFullImageUrl(p.imagenUrl) : DEFAULT_PRODUCT_IMAGE,
      rawImagenUrl: p.imagenUrl || '',
      description: p.descripcion || '',
      stock: stockTotal,
      stockMinimo: p.stockMinimo ?? 5,
      sku: p.sku || '',
      esSku: p.esSku !== false,
      idProductoPadre: p.idProductoPadre,
      nombreProductoPadre: p.nombreProductoPadre,
      tieneSkus: p.tieneSkus,
      lotesDisponibles: p.lotesDisponibles,
      proximoVencimiento: p.proximoVencimiento,
      skuCount: childSkus.length,
      activeSkuCount: activeChildSkus.length,
      priceLabel,
      stockLabel: isParent ? `${stockTotal} uds en ${childSkus.length} SKU` : `${stockTotal} uds`,
    };
  }), [productos, skusByParent]);

  const filtered = mappedProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category === filterCat;
    return !p.esSku && matchSearch && matchCat;
  });
  const parentOptions = allProductos.filter(p => p.esSku === false);
  const selectedProductId = selected ? Number(selected.id) : undefined;
  const childSkuRows = allProductos.filter(p =>
    p.esSku !== false
    && p.idProductoPadre === (selectedProductId ?? form.idProductoPadre)
  );

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', category: categorias[0]?.nombre || '', price: 0, type: 'PREPARADO', active: true, description: '', image: '', stock: 0, stockMinimo: 5, sku: '', esSku: false });
    setFormError('');
    setProductTab('general');
    setDialogOpen(true);
  };

  const openEdit = async (p: Product) => {
    setSelected(p);
    setFormError('');
    setForm({ ...p, image: p.rawImagenUrl || '' });
    
    try {
      const detail = await getProductoDetail(Number(p.id));
      if (detail) {
        setForm(prev => ({
          ...prev,
          stock: detail.inventario?.stock || 0,
          stockMinimo: detail.inventario?.stockMinimo || 5,
        }));
      }
    } catch (error) {
      console.error('Error fetching product detail:', error);
    }
    
    setProductTab('general');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const matchedCat = categorias.find(c => c.nombre === form.category);
    const isParent = form.esSku === false;

    setFormError('');

    if (!form.name?.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }

    if (!isParent && !form.idProductoPadre) {
      setFormError('El SKU debe estar vinculado a un producto padre.');
      return;
    }

    if (!isParent && (!form.price || form.price <= 0)) {
      setFormError('El precio del SKU debe ser mayor a cero.');
      return;
    }
    
    const requestData: ProductoRequest = {
      nombre: form.name || '',
      descripcion: form.description || '',
      imagenUrl: form.image && !form.image.startsWith('http') ? form.image : (form.image ? form.image.replace(/^https?:\/\/[^/]+/, '') : ''),
      precio: isParent ? 0 : form.price || 0,
      tipoProducto: form.type || 'PREPARADO',
      estado: form.active ? 'ACTIVO' : 'INACTIVO',
      idCategoria: form.idCategoria || matchedCat?.idCategoria || (categorias.length > 0 ? categorias[0].idCategoria : undefined),
      esSku: !isParent,
      idProductoPadre: isParent ? undefined : form.idProductoPadre,
      sku: isParent ? undefined : form.sku,
      stockMinimo: isParent ? undefined : form.stockMinimo || 5,
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

  const openCreateSkuChild = () => {
    if (!selected) return;
    const parent = selected;
    setSelected(null);
    setFormError('');
    setForm({
      name: '',
      category: parent.category,
      idCategoria: parent.idCategoria,
      price: 0,
      type: parent.type,
      active: true,
      description: '',
      image: parent.rawImagenUrl || '',
      stock: 0,
      stockMinimo: 5,
      sku: '',
      esSku: true,
      idProductoPadre: Number(parent.id),
    });
    setProductTab('general');
  };

  const dialogMode = selected ? (selected.esSku ? 'Editar SKU hijo' : 'Editar producto padre') : form.esSku === false ? 'Nuevo producto padre' : 'Nuevo SKU hijo';
  const isFormParent = form.esSku === false;
  const showRecipeTab = !isFormParent && form.type === 'PREPARADO';
  const tabCount = isFormParent ? 3 : showRecipeTab ? 3 : 2;

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Catálogo' },
          { label: 'Productos' },
        ]}
        icon={Package}
        iconColor="blue"
        title="Productos"
        subtitle={`Administración de productos de catálogo, SKUs vendibles, inventario y recetas asociadas.`}
        action={
          <Button onClick={openCreate} className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nuevo Producto
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Package}
          label="Productos Padres"
          value={allProductos.filter(p => p.esSku === false).length}
          color="slate"
        />
        <KpiCard
          icon={Star}
          label="Padres activos"
          value={allProductos.filter(p => p.esSku === false && p.estado === 'ACTIVO').length}
          color="green"
        />
        <KpiCard
          icon={RotateCcw}
          label="Padres inactivos"
          value={allProductos.filter(p => p.esSku === false && p.estado === 'INACTIVO').length}
          color="red"
        />
        <KpiCard
          icon={FlaskConical}
          label="SKUs Hijos"
          value={allProductos.filter(p => p.esSku !== false).length}
          color="blue"
        />
      </div>

      {/* Toolbar filters + view toggle */}
      <FilterToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar producto...',
        }}
        filters={
          <>
            <Tabs
              value={estadoFilter}
              onValueChange={(value) => setEstadoFilter(value as ProductoEstadoFiltro)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 sm:w-[260px] rounded-xl h-11 p-1 bg-muted/30">
                <TabsTrigger value="ACTIVO" className="rounded-lg h-9">Activos</TabsTrigger>
                <TabsTrigger value="INACTIVO" className="rounded-lg h-9">Inactivos</TabsTrigger>
                <TabsTrigger value="TODOS" className="rounded-lg h-9">Todos</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-48 h-11 rounded-xl">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categorias.map(c => <SelectItem key={c.idCategoria} value={c.nombre}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        }
        actions={
          <div className="flex items-center rounded-xl border border-border overflow-hidden bg-muted/20 p-1">
            <Button
              size="icon"
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              className="h-9 w-9 rounded-lg"
              aria-label="Vista de tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={() => setViewMode('table')}
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              className="h-9 w-9 rounded-lg"
              aria-label="Vista de tabla"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      {/* Main Content Area */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin productos en el catálogo"
          description="Crea tu primer producto para comenzar a configurar tu carta y menú."
          action={
            <Button onClick={openCreate} className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => (
            <ProductGridCard
              key={p.id}
              product={p}
              onEdit={openEdit}
              onDelete={() => { setDeleting(p); setDeleteOpen(true); }}
              onReactivate={() => updateProductoEstado({ id: Number(p.id), estado: 'ACTIVO' })}
            />
          ))}
        </div>
      ) : (
        <SectionCard
          title="Listado de productos"
          description={`Visualizando ${filtered.length} productos registrados ${estadoLabel}.`}
          icon={Package}
          iconColor="blue"
        >
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Img</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead>Rango de Precio</TableHead>
                  <TableHead className="hidden sm:table-cell">SKUs</TableHead>
                  <TableHead className="hidden lg:table-cell">Stock total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => openEdit(p)}>
                    <TableCell>
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-muted border border-border" />
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        Producto padre
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm font-medium text-muted-foreground">{p.category}</TableCell>
                    <TableCell className="font-bold text-foreground ui-tabular">{p.priceLabel}</TableCell>
                    <TableCell className="hidden sm:table-cell font-medium ui-tabular">{p.skuCount}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs font-semibold text-muted-foreground">{p.stockLabel}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={p.active ? 'success' : 'secondary'} className="shadow-2xs">{p.active ? 'Activo' : 'Inactivo'}</Badge>
                        <Badge variant="type" className="shadow-2xs">Padre</Badge>
                      </div>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openEdit(p)} className="rounded-lg">
                            <Pencil className="w-4 h-4 mr-2 text-muted-foreground" /> Editar
                          </DropdownMenuItem>
                          {p.active ? (
                            <DropdownMenuItem className="ui-status-danger rounded-lg focus:bg-[var(--status-danger-surface)]" onClick={() => { setDeleting(p); setDeleteOpen(true); }}>
                              <Trash2 className="w-4 h-4 mr-2" /> Desactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => updateProductoEstado({ id: Number(p.id), estado: 'ACTIVO' })} className="rounded-lg">
                              <RotateCcw className="w-4 h-4 mr-2 text-muted-foreground" /> Reactivar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      {/* Product Dialog with Tabs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{dialogMode}</DialogTitle>
          </DialogHeader>
          <Tabs
            value={productTab}
            onValueChange={(value) =>
              setProductTab(!showRecipeTab && value === 'receta' ? 'inventario' : value)
            }
          >
            <TabsList className="grid w-full rounded-xl h-11 p-1 bg-muted/30" style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
              <TabsTrigger value="general" className="rounded-lg h-9">General</TabsTrigger>
              {isFormParent && <TabsTrigger value="variantes" className="rounded-lg h-9">SKUs hijos</TabsTrigger>}
              {showRecipeTab && <TabsTrigger value="receta" className="rounded-lg h-9">Receta</TabsTrigger>}
              <TabsTrigger value="inventario" className="rounded-lg h-9">Inventario</TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <ImageUploadZone
                label="Imagen del producto"
                value={form.image}
                onChange={(url) => setForm(f => ({ ...f, image: url }))}
                module="productos"
                description="Sube una imagen o arrástrala desde tu equipo o internet. Formatos: JPG, PNG, WEBP."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-sm font-semibold">Nombre *</Label>
                  <Input placeholder="Nombre del producto" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Categoría</Label>
                  <Select value={form.category || 'Hamburguesas'} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">{categorias.map(c => <SelectItem key={c.idCategoria} value={c.nombre} className="rounded-lg">{c.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {isFormParent ? (
                  <div className="md:col-span-2 rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="type" className="shadow-2xs">Producto padre</Badge>
                      <span className="text-xs text-muted-foreground font-medium">Unidad organizadora del catálogo visual.</span>
                    </div>
                    <div className="grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
                      <div>
                        <p className="uppercase tracking-wider text-[10px] text-muted-foreground/80 font-bold">Unidad de catálogo</p>
                        <p className="font-semibold text-foreground mt-0.5">Producto padre</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wider text-[10px] text-muted-foreground/80 font-bold">Precio base</p>
                        <p className="font-semibold text-foreground mt-0.5">Gestionado en SKUs hijos</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed border-t border-border/40 pt-2.5">
                      El precio real, stock, tipo operativo, lotes y receta se configuran individualmente en cada SKU hijo.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Tipo de producto</Label>
                      <Select
                        value={form.type || 'PREPARADO'}
                        onValueChange={v => {
                          const nextType = v as Product['type'];
                          setForm(f => ({ ...f, type: nextType }));
                          if (nextType === 'INVENTARIO_DIRECTO' && productTab === 'receta') {
                            setProductTab('inventario');
                          }
                        }}
                      >
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="PREPARADO" className="rounded-lg">Elaborado</SelectItem>
                          <SelectItem value="INVENTARIO_DIRECTO" className="rounded-lg">Directo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Precio SKU (S/*) *</Label>
                      <Input type="number" step="0.01" min="0" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))} className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Producto padre</Label>
                      <Select
                        value={form.idProductoPadre ? String(form.idProductoPadre) : ''}
                        onValueChange={v => setForm(f => ({ ...f, idProductoPadre: Number(v) }))}
                        disabled={parentOptions.length === 0}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Selecciona un producto padre" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {parentOptions
                            .filter(p => !selected || p.idProducto !== Number(selected.id))
                            .map(p => <SelectItem key={p.idProducto} value={String(p.idProducto)} className="rounded-lg">{p.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Código SKU</Label>
                      <Input
                        value={form.sku || ''}
                        onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                        className="h-11 rounded-xl uppercase font-mono"
                        placeholder="Ej: PIZ-FAM-001"
                      />
                    </div>
                  </>
                )}
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.active ?? true} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                  <Label className="text-sm font-semibold">Producto activo en carta</Label>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Descripción</Label>
                <Textarea placeholder="Descripción breve para la carta..." value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="rounded-xl resize-none" rows={2} />
              </div>
              {formError && (
                <div className="rounded-xl border ui-status-warning-soft px-4 py-3 text-xs font-semibold">
                  {formError}
                </div>
              )}
            </TabsContent>

            {/* Variantes */}
            <TabsContent value="variantes" className="mt-4 space-y-4">
              {form.esSku === false ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground font-medium">SKUs hijos vinculados a este producto del catálogo.</p>
                    <Button type="button" size="sm" onClick={openCreateSkuChild} disabled={!selected} className="h-9 rounded-xl gap-1">
                      <Plus className="w-4 h-4" /> Nuevo SKU hijo
                    </Button>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Precio real</TableHead>
                          <TableHead>Stock computado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {childSkuRows.map(sku => {
                          const mappedSku = mappedProducts.find(p => p.id === String(sku.idProducto));
                          return (
                            <TableRow
                              key={sku.idProducto}
                              className={mappedSku ? 'cursor-pointer hover:bg-accent/40' : undefined}
                              onClick={() => mappedSku && openEdit(mappedSku)}
                            >
                              <TableCell className="font-mono text-xs font-bold">{sku.sku || 'Sin código'}</TableCell>
                              <TableCell className="font-semibold text-foreground text-sm">{sku.nombre}</TableCell>
                              <TableCell className="font-bold text-foreground ui-tabular">S/ {sku.precio != null ? sku.precio.toFixed(2) : '—'}</TableCell>
                              <TableCell className="ui-tabular text-sm">{sku.stockActual ?? sku.stockTotal ?? 0}</TableCell>
                            </TableRow>
                          );
                        })}
                        {childSkuRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6 font-medium">
                              Sin SKUs hijos configurados para este producto padre.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-muted/10 border border-dashed border-border rounded-xl">
                  <Layers className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">Registro de SKU vendible</p>
                  <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                    Este registro ya es una variante vendible. Las relaciones y la jerarquía se administran desde su producto padre.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Receta */}
            <TabsContent value="receta" className="mt-4">
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-muted/10 border border-dashed border-border rounded-xl">
                <FlaskConical className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-bold text-foreground">Constructor de Recetas</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                  Configura insumos, cantidades y costos unitarios detallados para el descuento automático de ingredientes.
                </p>
                <Button variant="outline" size="sm" onClick={() => selected && navigate(`/recetas?producto=${selected.id}`)} className="h-9 rounded-xl gap-1 mt-1 text-xs font-bold">
                  <ChevronRight className="w-4 h-4" /> Ir a recetas
                </Button>
              </div>
            </TabsContent>

            {/* Inventario */}
            <TabsContent value="inventario" className="mt-4 space-y-4">
              {form.esSku === false ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-muted/10 border border-dashed border-border rounded-xl">
                  <Layers className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">Producto padre sin stock propio</p>
                  <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                    El inventario se controla en los SKUs hijos vinculados. El producto padre solo organiza la visualización en la carta.
                  </p>
                </div>
              ) : form.type === 'INVENTARIO_DIRECTO' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border p-4 bg-muted/20">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stock actual</p>
                      <p className="text-xl font-bold text-foreground mt-1 ui-tabular">{form.stock || 0} unidades</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Stock mínimo de seguridad</Label>
                      <Input type="number" value={form.stockMinimo || 5} onChange={e => setForm(f => ({ ...f, stockMinimo: parseInt(e.target.value) }))} className="h-11 rounded-xl bg-background" />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground leading-normal font-medium">
                    El stock actual de venta es informativo en este panel. Registra entradas desde Compras y salidas/ajustes mediante el Kardex del almacén.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-muted/10 border border-dashed border-border rounded-xl">
                  <Layers className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">Descuento por Receta Activa</p>
                  <p className="text-xs text-muted-foreground max-w-xs leading-normal font-medium">
                    Este item se prepara al momento. El stock se deduce de forma automatizada y unitaria de cada uno de sus insumos base al procesar la venta.
                  </p>
                </div>
              )}
            </TabsContent>

          </Tabs>
          <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name?.trim()} className="h-10 rounded-xl font-semibold">
              {selected ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Desactivar producto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            ¿Desactivar <strong>{deleting?.name}</strong>? Quedará oculto de la carta de ventas del POS, pero podrás reactivarlo en cualquier momento.
          </p>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="h-10 rounded-xl">Cancelar</Button>
            <Button variant="destructive" onClick={async () => { if (deleting) { await deleteProducto(Number(deleting.id)); } setDeleteOpen(false); }} className="h-10 rounded-xl">Desactivar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

/* ── Card de producto para vista grid ──────────────────────── */
function ProductGridCard({
  product,
  onEdit,
  onDelete,
  onReactivate,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: () => void;
  onReactivate: () => void;
}) {
  return (
    <Card className="group flex min-w-0 flex-col border border-border bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden hover:border-primary/40 transition-all">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted border-b border-border/60">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
          onClick={() => onEdit(product)}
          title={product.name}
        />
        <Badge
          variant={product.active ? 'success' : 'secondary'}
          className="absolute right-2 top-2 max-w-[calc(100%-1rem)] shadow-2xs font-semibold text-[9px]"
        >
          {product.active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3.5 p-4 justify-between">
        <div className="space-y-2">
          <h3
            className="line-clamp-2 cursor-pointer text-xs font-bold leading-normal text-foreground hover:text-primary transition-colors"
            onClick={() => onEdit(product)}
            title={product.name}
          >
            {product.name}
          </h3>
          <div className="flex min-w-0 flex-wrap gap-1">
            <Badge variant="type" className="text-[9px] font-bold px-1.5 py-0">Padre</Badge>
            <Badge variant={product.activeSkuCount > 0 ? 'info' : 'warning'} className="text-[9px] font-bold px-1.5 py-0 shadow-2xs">
              {product.skuCount} SKU
            </Badge>
          </div>
        </div>

        {product.description && (
          <p className="line-clamp-2 text-[11px] leading-normal text-muted-foreground font-medium" title={product.description}>
            {product.description}
          </p>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-[10px] font-semibold text-muted-foreground">
          <div className="min-w-0">
            <p className="uppercase tracking-wider text-[9px] text-muted-foreground/80">Precio</p>
            <p className="truncate text-xs font-bold text-foreground mt-0.5 ui-tabular" title={product.priceLabel}>
              {product.priceLabel}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="uppercase tracking-wider text-[9px] text-muted-foreground/80">Stock total</p>
            <p className="truncate text-xs font-bold text-foreground mt-0.5 ui-tabular" title={product.stockLabel}>
              {product.stockLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-t border-border/40 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs font-semibold flex-1 gap-1"
            onClick={() => onEdit(product)}
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Button>
          {product.active ? (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-lg"
              onClick={onDelete}
              aria-label="Desactivar producto"
              title="Desactivar producto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-lg"
              onClick={onReactivate}
              aria-label="Reactivar producto"
              title="Reactivar producto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
