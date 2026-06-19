import { useState } from 'react';
import { Plus, Trash2, Search, FlaskConical, TrendingUp, DollarSign, ChefHat, X, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
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
import { Producto, RecetaProducto, RecetaItemRequest } from '../../api/productos';

interface RecipeItem {
  supplyId: number;
  supplyName: string;
  unit: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
}

interface LocalRecipe {
  productoId: number;
  productName: string;
  categoryName: string;
  salePrice: number;
  items: RecipeItem[];
  /** original receta from backend for dirty check */
  originalReceta: RecetaProducto[];
}

export function RecipeBuilder() {
  const { productos, isLoading: loadingProductos, updateProducto, isUpdating } = useProductos();
  const { insumos, isLoading: loadingInsumos } = useInsumos();
  const { categorias } = useCategorias();

  // Only PREPARADO products have recipes
  const preparados = productos.filter(p => p.tipoProducto === 'PREPARADO');

  // Local recipe state (editable copy)
  const [activeId, setActiveId] = useState<number | null>(null);
  const [localItems, setLocalItems] = useState<RecipeItem[]>([]);
  const [searchSupply, setSearchSupply] = useState('');
  const [addSupplyId, setAddSupplyId] = useState<number | null>(null);
  const [addQty, setAddQty] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Create product state
  const [newProductName, setNewProductName] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const { createProducto, isCreating } = useProductos();

  const activeProduct = preparados.find(p => p.idProducto === activeId) ?? null;

  const totalCost = localItems.reduce((sum, i) => sum + i.totalCost, 0);
  const margin = activeProduct ? activeProduct.precio - totalCost : 0;
  const marginPct = activeProduct && activeProduct.precio > 0 ? (margin / activeProduct.precio) * 100 : 0;

  const filteredSupplies = insumos.filter(s =>
    s.nombre.toLowerCase().includes(searchSupply.toLowerCase()) &&
    !localItems.some(i => i.supplyId === s.idInsumo)
  );

  // Select recipe to edit — load current receta from backend detail
  const selectRecipe = async (producto: Producto) => {
    setSaved(false);
    setSaveError('');
    setSearchSupply('');
    setAddSupplyId(null);
    setAddQty('');
    setActiveId(producto.idProducto);
    // Fetch detail to get current receta
    try {
      const { getProductoDetail } = useProductosRef;
      const detail = await getProductoDetail(producto.idProducto);
      const items: RecipeItem[] = (detail.receta || []).map(r => ({
        supplyId: r.idInsumo,
        supplyName: r.nombreInsumo,
        unit: r.unidadMedidaInsumo,
        quantity: r.cantidad,
        costPerUnit: insumos.find(i => i.idInsumo === r.idInsumo)?.costoPromedio ?? 0,
        totalCost: r.cantidad * (insumos.find(i => i.idInsumo === r.idInsumo)?.costoPromedio ?? 0),
      }));
      setLocalItems(items);
    } catch {
      setLocalItems([]);
    }
  };

  // We need a ref-like access for the hook inside async callback
  const { getProductoDetail } = useProductos();
  const useProductosRef = { getProductoDetail };

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
    try {
      await updateProducto({
        id: activeProduct.idProducto,
        data: {
          nombre: activeProduct.nombre,
          precio: activeProduct.precio,
          tipoProducto: 'PREPARADO',
          estado: activeProduct.estado,
          idCategoria: activeProduct.idCategoria,
          receta,
        },
      });
      setSaved(true);
    } catch (e: any) {
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
        estado: 'ACTIVO',
        idCategoria: newCategoryId ? parseInt(newCategoryId) : undefined,
        receta: [],
      });
      setNewProductName('');
      setNewSalePrice('');
      setNewCategoryId('');
      // Select the newly created product
      if (result.producto) {
        setActiveId(result.producto.idProducto);
        setLocalItems([]);
      }
    } catch {
      // handled by react-query
    }
  };

  const isLoading = loadingProductos || loadingInsumos;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Constructor de Recetas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Define los insumos y costos de cada producto elaborado</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando datos...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Recipe List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="space-y-1.5">
            <Input
              placeholder="Nuevo producto elaborado..."
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
            />
            <Input
              placeholder="Precio venta S/"
              type="number"
              value={newSalePrice}
              onChange={e => setNewSalePrice(e.target.value)}
            />
            <Select value={newCategoryId} onValueChange={setNewCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(c => (
                  <SelectItem key={c.idCategoria} value={String(c.idCategoria)}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              size="sm"
              onClick={handleCreateProducto}
              disabled={!newProductName || !newSalePrice || isCreating}
            >
              {isCreating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Nueva Receta
            </Button>
          </div>
          <Separator />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recetas guardadas ({preparados.length})</p>
          <div className="space-y-1">
            {preparados.map(p => (
              <button
                key={p.idProducto}
                onClick={() => selectRecipe(p)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${activeId === p.idProducto
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent/50'
                  }`}
              >
                <p className="text-sm font-medium truncate">{p.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  S/ {p.precio.toFixed(2)}
                  {p.nombreCategoria && <span className="ml-2 opacity-60">· {p.nombreCategoria}</span>}
                </p>
              </button>
            ))}
            {!isLoading && preparados.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Sin productos elaborados aún</p>
            )}
          </div>
        </div>

        {/* Main: Recipe Editor */}
        <div className="lg:col-span-2 space-y-4">
          {activeProduct ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{activeProduct.nombre}</CardTitle>
                      <p className="text-sm text-muted-foreground">Precio de venta: S/ {activeProduct.precio.toFixed(2)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead className="w-24">Cantidad</TableHead>
                        <TableHead className="hidden sm:table-cell">Unidad</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {localItems.map(item => (
                        <TableRow key={item.supplyId}>
                          <TableCell className="text-sm font-medium">{item.supplyName}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={e => updateQty(item.supplyId, parseFloat(e.target.value) || 0)}
                              className="h-7 w-20 text-sm"
                            />
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{item.unit}</TableCell>
                          <TableCell className="text-sm">S/ {item.totalCost.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.supplyId)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {localItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">Sin insumos. Agrega desde el panel de búsqueda.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Add supply */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium">Agregar insumo</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar insumo..."
                      className="pl-9"
                      value={searchSupply}
                      onChange={e => { setSearchSupply(e.target.value); setAddSupplyId(null); }}
                    />
                  </div>
                  {searchSupply && (
                    <div className="border border-border rounded-lg divide-y divide-border max-h-40 overflow-y-auto">
                      {filteredSupplies.length === 0 ? (
                        <p className="text-sm text-muted-foreground px-3 py-2">Sin resultados</p>
                      ) : filteredSupplies.map(s => (
                        <button
                          key={s.idInsumo}
                          onClick={() => { setAddSupplyId(s.idInsumo); setSearchSupply(s.nombre); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors ${addSupplyId === s.idInsumo ? 'bg-accent' : ''}`}
                        >
                          <span className="font-medium">{s.nombre}</span>
                          <span className="text-muted-foreground ml-2">S/ {s.costoPromedio.toFixed(3)}/{s.unidad}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Cantidad"
                      type="number"
                      className="w-32"
                      value={addQty}
                      onChange={e => setAddQty(e.target.value)}
                    />
                    <Button onClick={addItem} disabled={!addSupplyId || !addQty} className="flex-1">
                      <Plus className="w-4 h-4 mr-1" /> Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Selecciona o crea una receta</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Cost Summary */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Resumen de Costos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Costo total receta</span>
                  <span className="text-sm font-semibold">S/ {totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Precio de venta</span>
                  <span className="text-sm font-semibold">S/ {activeProduct?.precio.toFixed(2) || '0.00'}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Ganancia</span>
                  <span className={`text-sm font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    S/ {margin.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Margin indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Margen</span>
                  <span>{marginPct.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${marginPct >= 60 ? 'bg-green-500' : marginPct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.max(marginPct, 0), 100)}%` }}
                  />
                </div>
                <Badge variant={marginPct >= 60 ? 'default' : 'secondary'} className="text-xs w-full justify-center">
                  {marginPct >= 60 ? 'Excelente rentabilidad' : marginPct >= 40 ? 'Rentabilidad aceptable' : 'Revisar costos'}
                </Badge>
              </div>

              <Separator />

              {/* KPIs */}
              <div className="space-y-2">
                {[
                  { label: 'Insumos', value: localItems.length, suffix: 'items' },
                  { label: 'Costo/venta', value: activeProduct?.precio ? ((totalCost / activeProduct.precio) * 100).toFixed(1) : '0', suffix: '%' },
                ].map(k => (
                  <div key={k.label} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                    <span className="text-xs text-muted-foreground">{k.label}</span>
                    <span className="text-sm font-medium">{k.value} {k.suffix}</span>
                  </div>
                ))}
              </div>

              {saveError && (
                <p className="text-xs text-destructive">{saveError}</p>
              )}
              {saved && (
                <p className="text-xs text-green-600">✓ Receta guardada correctamente</p>
              )}

              <Button
                className="w-full"
                size="sm"
                onClick={handleSaveRecipe}
                disabled={!activeProduct || isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Guardar Receta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
