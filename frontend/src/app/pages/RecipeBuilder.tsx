import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, Search, FlaskConical, ChefHat, X, Loader2, DollarSign, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';

import { useProductos } from '../../hooks/useProductos';
import { useInsumos } from '../../hooks/useInsumos';
import { useCategorias } from '../../hooks/useCategorias';
import { Producto, RecetaItemRequest, RecetaProducto } from '../../api/productos';
import { PageWrapper, ModuleHeader, KpiCard, EmptyState, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

interface RecipeItem {
  supplyId: number;
  supplyName: string;
  unit: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
}

export function RecipeBuilder() {
  const [searchParams] = useSearchParams();
  const {
    productos,
    isLoading: loadingProductos,
    updateProducto,
    isUpdating,
    createProducto,
    isCreating,
    getProductoDetail,
  } = useProductos();
  const { insumos, isLoading: loadingInsumos } = useInsumos();
  const { categorias } = useCategorias();

  // Only PREPARADO products have recipes
  const preparados = productos.filter(p => p.tipoProducto === 'PREPARADO' && p.esSku === false);

  // Local recipe state (editable copy)
  const [activeId, setActiveId] = useState<number | null>(null);
  const [localItems, setLocalItems] = useState<RecipeItem[]>([]);
  const [searchSupply, setSearchSupply] = useState('');
  const [addSupplyId, setAddSupplyId] = useState<number | null>(null);
  const [addQty, setAddQty] = useState('');
  const [recipeTime, setRecipeTime] = useState('10');
  const [recipeTarget, setRecipeTarget] = useState('base');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const autoSelectedIdRef = useRef<number | null>(null);

  // Create product state
  const [newProductName, setNewProductName] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');

  const activeProduct = preparados.find(p => p.idProducto === activeId) ?? null;
  const activeVariants = productos.filter(p =>
    p.tipoProducto === 'PREPARADO' &&
    p.esSku !== false &&
    p.idProductoPadre === activeId
  );
  const activeVariant = recipeTarget !== 'base'
    ? activeVariants.find(v => String(v.idProducto) === recipeTarget) ?? null
    : null;
  const activeSalePrice = activeVariant?.precio ?? activeProduct?.precio ?? 0;

  const totalCost = localItems.reduce((sum, i) => sum + i.totalCost, 0);
  const margin = activeProduct ? activeSalePrice - totalCost : 0;
  const marginPct = activeSalePrice > 0 ? (margin / activeSalePrice) * 100 : 0;

  const filteredSupplies = insumos.filter(s =>
    s.nombre.toLowerCase().includes(searchSupply.toLowerCase()) &&
    !localItems.some(i => i.supplyId === s.idInsumo)
  );

  const buildRecipeItems = useCallback((receta: RecetaProducto[] = []): RecipeItem[] => receta.map(r => ({
    supplyId: r.idInsumo,
    supplyName: r.nombreInsumo,
    unit: r.unidadMedidaInsumo,
    quantity: r.cantidad,
    costPerUnit: insumos.find(i => i.idInsumo === r.idInsumo)?.costoPromedio ?? 0,
    totalCost: r.cantidad * (insumos.find(i => i.idInsumo === r.idInsumo)?.costoPromedio ?? 0),
  })), [insumos]);

  // Select recipe to edit — load current receta from backend detail
  const selectRecipe = useCallback(async (producto: Producto) => {
    try {
      const detail = await getProductoDetail(producto.idProducto);
      const fallbackTime = Math.max(0, ...(detail.receta || []).map(r => r.tiempoPreparacionMinutos || 0));
      setSaved(false);
      setSaveError('');
      setSearchSupply('');
      setAddSupplyId(null);
      setAddQty('');
      setActiveId(producto.idProducto);
      setRecipeTarget('base');
      setRecipeTime(String(detail.producto.tiempoPreparacionMinutos || producto.tiempoPreparacionMinutos || fallbackTime || 10));
      setLocalItems(buildRecipeItems(detail.receta || []));
    } catch {
      setSaved(false);
      setSaveError('');
      setSearchSupply('');
      setAddSupplyId(null);
      setAddQty('');
      setActiveId(producto.idProducto);
      setRecipeTarget('base');
      setRecipeTime(String(producto.tiempoPreparacionMinutos || 10));
      setLocalItems([]);
    }
  }, [buildRecipeItems, getProductoDetail]);

  useEffect(() => {
    const productoId = Number(searchParams.get('producto'));
    if (!productoId || productoId === activeId || autoSelectedIdRef.current === productoId || preparados.length === 0) return;
    const producto = preparados.find(p => p.idProducto === productoId);
    if (producto) {
      autoSelectedIdRef.current = productoId;
      const timer = window.setTimeout(() => {
        selectRecipe(producto);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [activeId, preparados, searchParams, selectRecipe]);

  const handleRecipeTargetChange = async (target: string) => {
    if (!activeProduct) return;
    setRecipeTarget(target);
    setSaved(false);
    setSaveError('');
    setSearchSupply('');
    setAddSupplyId(null);
    setAddQty('');

    try {
      if (target === 'base') {
        const detail = await getProductoDetail(activeProduct.idProducto);
        const fallbackTime = Math.max(0, ...(detail.receta || []).map(r => r.tiempoPreparacionMinutos || 0));
        setRecipeTime(String(detail.producto.tiempoPreparacionMinutos || activeProduct.tiempoPreparacionMinutos || fallbackTime || 10));
        setLocalItems(buildRecipeItems(detail.receta || []));
        return;
      }

      const detail = await getProductoDetail(Number(target));
      const fallbackTime = Math.max(0, ...(detail.receta || []).map(r => r.tiempoPreparacionMinutos || 0));
      setRecipeTime(String(detail.producto.tiempoPreparacionMinutos || fallbackTime || activeProduct.tiempoPreparacionMinutos || 10));
      setLocalItems(buildRecipeItems(detail.receta || []));
    } catch {
      setSaveError('No se pudo cargar la receta seleccionada.');
      setLocalItems([]);
    }
  };

  const addItem = () => {
    const supply = insumos.find(s => s.idInsumo === addSupplyId);
    if (!supply || !addQty || !activeId) return;
    const qty = parseFloat(addQty);
    const item: RecipeItem = {
      supplyId: supply.idInsumo,
      supplyName: supply.nombre,
      unit: supply.unidad,
      quantity: qty,
      costPerUnit: supply.costoPromedio,
      totalCost: qty * supply.costoPromedio,
    };
    setLocalItems(prev => [...prev, item]);
    setAddSupplyId(null);
    setAddQty('');
    setSearchSupply('');
    setSaved(false);
  };

  const removeItem = (supplyId: number) => {
    setLocalItems(prev => prev.filter(i => i.supplyId !== supplyId));
    setSaved(false);
  };

  const updateQty = (supplyId: number, qty: number) => {
    setLocalItems(prev => prev.map(i => i.supplyId === supplyId
      ? { ...i, quantity: qty, totalCost: qty * i.costPerUnit }
      : i
    ));
    setSaved(false);
  };

  const handleSaveRecipe = async () => {
    if (!activeProduct) return;
    setSaveError('');
    const receta: RecetaItemRequest[] = localItems.map(i => ({
      idInsumo: i.supplyId,
      cantidad: i.quantity,
    }));
    const tiempoPreparacionMinutos = Math.max(1, parseInt(recipeTime, 10) || 1);
    try {
      if (activeVariant) {
        await updateProducto({
          id: activeVariant.idProducto,
          data: {
            nombre: activeVariant.nombre,
            precio: activeVariant.precio,
            tipoProducto: 'PREPARADO',
            tiempoPreparacionMinutos,
            estado: activeVariant.estado,
            idCategoria: activeVariant.idCategoria,
            idProductoPadre: activeVariant.idProductoPadre,
            sku: activeVariant.sku,
            esSku: activeVariant.esSku,
            receta,
          },
        });
        setSaved(true);
        return;
      }

      await updateProducto({
        id: activeProduct.idProducto,
        data: {
          nombre: activeProduct.nombre,
          precio: activeProduct.precio,
          tipoProducto: 'PREPARADO',
          tiempoPreparacionMinutos,
          estado: activeProduct.estado,
          idCategoria: activeProduct.idCategoria,
          receta,
        },
      });
      setSaved(true);
    } catch {
      setSaveError('Error al guardar. Intenta de nuevo.');
    }
  };

  const handleCreateProducto = async () => {
    if (!newProductName || !newSalePrice) return;
    try {
      const result = await createProducto({
        nombre: newProductName,
        precio: parseFloat(newSalePrice),
        tipoProducto: 'PREPARADO',
        tiempoPreparacionMinutos: 10,
        estado: 'ACTIVO',
        idCategoria: newCategoryId ? parseInt(newCategoryId) : undefined,
        receta: [],
      });
      setNewProductName('');
      setNewSalePrice('');
      setNewCategoryId('');
      if (result.producto) {
        setActiveId(result.producto.idProducto);
        setRecipeTarget('base');
        setLocalItems([]);
        setRecipeTime(String(result.producto.tiempoPreparacionMinutos || 10));
      }
    } catch {
      // handled by react-query
    }
  };

  const isLoading = loadingProductos || loadingInsumos;

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Catálogo' },
          { label: 'Recetas' },
        ]}
        icon={FlaskConical}
        iconColor="blue"
        title="Constructor de Recetas"
        subtitle="Define la receta, ingredientes requeridos, mermas y calcula la rentabilidad por plato."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: List */}
        <div className="lg:col-span-1 space-y-4">
          <SectionCard
            title="Nueva Receta"
            description="Crea un plato preparado rápido"
            icon={Plus}
            iconColor="blue"
          >
            <div className="space-y-3 mt-1.5">
              <Input
                placeholder="Nombre del plato..."
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                className="h-10 rounded-xl"
              />
              <Input
                placeholder="Precio de venta (S/)"
                type="number"
                value={newSalePrice}
                onChange={e => setNewSalePrice(e.target.value)}
                className="h-10 rounded-xl"
              />
              <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Categoría (opcional)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categorias.map(c => (
                    <SelectItem key={c.idCategoria} value={String(c.idCategoria)} className="rounded-lg">{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-semibold gap-1.5"
                onClick={handleCreateProducto}
                disabled={!newProductName || !newSalePrice || isCreating}
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Crear Plato
              </Button>
            </div>
          </SectionCard>

          <Card className="border border-border bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 bg-muted/15">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Carta Elaborada ({preparados.length})</h2>
            </div>
            <CardContent className="p-3 space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
              {preparados.map(p => (
                <button
                  key={p.idProducto}
                  onClick={() => selectRecipe(p)}
                  className={cn(
                    'w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1',
                    activeId === p.idProducto
                      ? 'border-primary bg-primary/10 text-primary-foreground font-semibold shadow-2xs'
                      : 'border-border bg-card hover:bg-accent/60'
                  )}
                >
                  <p className="text-sm font-bold text-foreground leading-snug">{p.nombre}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold mt-0.5">
                    <span className="ui-tabular">S/ {p.precio.toFixed(2)}</span>
                    {p.nombreCategoria && <span className="text-[10px] bg-muted/65 border border-border/40 px-1.5 py-0.5 rounded-md font-bold">{p.nombreCategoria}</span>}
                  </div>
                </button>
              ))}
              {!isLoading && preparados.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 font-semibold">Sin platos elaborados aún</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main: Recipe Editor */}
        <div className="lg:col-span-2 space-y-4">
          {activeProduct ? (
            <>
              <SectionCard
                title={activeProduct.nombre}
                description={activeVariant ? `Variante SKU: ${activeVariant.nombre}` : 'Receta base de producto'}
                icon={ChefHat}
                iconColor="blue"
              >
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeVariants.length > 0 && (
                      <div className="space-y-1.5">
                        <Label htmlFor="recipe-target" className="text-xs font-bold text-foreground">Configurar variante específica</Label>
                        <select
                          id="recipe-target"
                          value={recipeTarget}
                          onChange={event => handleRecipeTargetChange(event.target.value)}
                          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring font-semibold text-foreground"
                        >
                          <option value="base">Producto base</option>
                          {activeVariants.map(variant => (
                            <option key={variant.idProducto} value={String(variant.idProducto)}>
                              {variant.nombre} - S/ {variant.precio.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="recipe-time" className="text-xs font-bold text-foreground">Tiempo de cocción / preparación</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="recipe-time"
                          type="number"
                          min={1}
                          value={recipeTime}
                          onChange={e => {
                            setRecipeTime(String(Math.max(1, parseInt(e.target.value, 10) || 1)));
                            setSaved(false);
                          }}
                          className="w-24 h-10 rounded-xl"
                        />
                        <span className="text-xs text-muted-foreground font-semibold">minutos</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border overflow-hidden mt-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente / Insumo</TableHead>
                          <TableHead className="w-24">Cantidad</TableHead>
                          <TableHead className="hidden sm:table-cell">Medida</TableHead>
                          <TableHead>Costo teo.</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {localItems.map(item => (
                          <TableRow key={item.supplyId}>
                            <TableCell className="text-xs font-bold text-foreground">{item.supplyName}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.001"
                                value={item.quantity}
                                onChange={e => updateQty(item.supplyId, parseFloat(e.target.value) || 0)}
                                className="h-8 w-20 text-xs rounded-lg font-bold"
                              />
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-semibold">{item.unit}</TableCell>
                            <TableCell className="text-xs font-bold text-foreground ui-tabular">S/ {item.totalCost.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg ui-status-danger hover:bg-[var(--status-danger-surface)]" onClick={() => removeItem(item.supplyId)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {localItems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-10 font-semibold">
                              <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
                              <p className="text-xs">Esta receta no tiene ingredientes. Agrega insumos utilizando el buscador inferior.</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </SectionCard>

              {/* Add supply */}
              <Card className="border border-border bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-5 space-y-3.5">
                  <p className="text-sm font-bold text-foreground">Buscar e incluir ingredientes</p>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Escribe nombre de insumo a buscar..."
                      className="pl-10 h-10 rounded-xl"
                      value={searchSupply}
                      onChange={e => { setSearchSupply(e.target.value); setAddSupplyId(null); }}
                    />
                  </div>
                  {searchSupply && (
                    <div className="border border-border rounded-xl divide-y divide-border/60 max-h-40 overflow-y-auto pr-1">
                      {filteredSupplies.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-3.5 py-2.5 font-semibold">Sin ingredientes coincidentes disponibles</p>
                      ) : filteredSupplies.map(s => (
                        <button
                          key={s.idInsumo}
                          onClick={() => { setAddSupplyId(s.idInsumo); setSearchSupply(s.nombre); }}
                          className={cn(
                            'w-full text-left px-3.5 py-2.5 text-xs hover:bg-accent/65 transition-colors font-medium flex justify-between items-center',
                            addSupplyId === s.idInsumo && 'bg-accent font-semibold text-primary'
                          )}
                        >
                          <span>{s.nombre}</span>
                          <span className="text-[10px] text-muted-foreground font-bold">S/ {s.costoPromedio.toFixed(3)} / {s.unidad}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Cantidad porción"
                      type="number"
                      step="0.001"
                      className="w-32 h-10 rounded-xl font-bold"
                      value={addQty}
                      onChange={e => setAddQty(e.target.value)}
                    />
                    <Button onClick={addItem} disabled={!addSupplyId || !addQty} className="flex-1 h-10 rounded-xl font-semibold gap-1.5">
                      <Plus className="w-4 h-4" /> Agregar ingrediente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState
              icon={FlaskConical}
              title="Sin receta seleccionada"
              description="Selecciona un plato de la carta elaborada a la izquierda o crea uno nuevo para empezar a detallar sus ingredientes."
            />
          )}
        </div>

        {/* Right Panel: Cost Summary */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-border bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border/60 bg-muted/15">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Margen y Costeo</h2>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-3 font-semibold text-xs leading-normal">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Costo ingredientes</span>
                  <span className="text-foreground ui-tabular">S/ {totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Precio de venta</span>
                  <span className="text-foreground ui-tabular">S/ {activeSalePrice.toFixed(2)}</span>
                </div>
                <Separator className="my-1.5" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">Utilidad bruta</span>
                  <span className={cn('text-sm font-bold ui-tabular', margin >= 0 ? 'ui-status-success' : 'ui-status-danger')}>
                    S/ {margin.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Margin indicator progress bar */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex justify-between text-xs text-muted-foreground font-bold">
                  <span>Margen bruto</span>
                  <span className="text-foreground">{marginPct.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      marginPct >= 65 ? 'bg-[var(--status-success)]' : marginPct >= 45 ? 'bg-[var(--status-warning)]' : 'bg-[var(--status-danger)]'
                    )}
                    style={{ width: `${Math.min(Math.max(marginPct, 0), 100)}%` }}
                  />
                </div>
                <Badge variant={marginPct >= 65 ? 'success' : marginPct >= 45 ? 'warning' : 'danger'} className="text-[10px] w-full justify-center py-1 font-bold shadow-2xs">
                  {marginPct >= 65 ? 'Excelente rentabilidad' : marginPct >= 45 ? 'Margen ajustado' : 'Costo elevado / Pérdida'}
                </Badge>
              </div>

              <Separator className="my-2" />

              {/* Stats lists */}
              <div className="space-y-2">
                {[
                  { label: 'Total ingredientes', value: localItems.length, suffix: 'insumos' },
                  { label: 'Tiempo de preparación', value: Math.max(1, parseInt(recipeTime, 10) || 1), suffix: 'minutos' },
                  { label: 'Porcentaje costo/venta', value: activeSalePrice ? ((totalCost / activeSalePrice) * 100).toFixed(1) : '0', suffix: '%' },
                ].map(k => (
                  <div key={k.label} className="flex justify-between items-center p-2.5 rounded-xl border border-border/40 bg-muted/20 text-xs font-semibold text-muted-foreground">
                    <span>{k.label}</span>
                    <span className="text-foreground">{k.value} {k.suffix}</span>
                  </div>
                ))}
              </div>

              {saveError && (
                <div className="rounded-xl border ui-status-warning-soft px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {saveError}
                </div>
              )}
              {saved && (
                <div className="rounded-xl border ui-status-success-soft px-3.5 py-2.5 text-xs font-bold text-center">
                  ✓ Receta guardada en el servidor
                </div>
              )}

              <Button
                className="w-full h-11 rounded-xl font-semibold gap-1.5 mt-2 bg-primary text-primary-foreground hover:bg-primary/95"
                onClick={handleSaveRecipe}
                disabled={!activeProduct || isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Guardar Receta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
