import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, CheckCircle2, XCircle, History, RefreshCw, Loader2, Package, Boxes
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';

import { useProductos } from '../../hooks/useProductos';
import { useMovimientos } from '../../hooks/useMovimientos';
import { usePrivateQueryEnabled } from '../../hooks/usePrivateQuery';
import { Producto } from '../../api/productos';
import { productosApi } from '../../api/productos';
import {
  getInventoryMovementLabel,
  getInventoryMovementSignedQuantity,
  movimientosApi,
} from '../../api/movimientos';
import { getFullImageUrl } from '../components/ui/utils';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState } from '../components/ui/erp-layout';

const statusConf = {
  normal: { label: 'Normal', icon: CheckCircle2, colorClass: 'ui-status-success', bgClass: 'ui-status-success-soft', badgeVariant: 'success' as const },
  bajo: { label: 'Bajo', icon: AlertTriangle, colorClass: 'ui-status-warning', bgClass: 'ui-status-warning-soft', badgeVariant: 'warning' as const },
  critico: { label: 'Crítico', icon: AlertTriangle, colorClass: 'ui-status-danger', bgClass: 'ui-status-danger-soft', badgeVariant: 'danger' as const },
  agotado: { label: 'Agotado', icon: XCircle, colorClass: 'ui-status-danger', bgClass: 'ui-status-danger-soft', badgeVariant: 'danger' as const },
};

export function DirectInventory() {
  const queryClient = useQueryClient();
  const { productos, isLoading } = useProductos();
  const [search, setSearch] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lotsOpen, setLotsOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [adjForm, setAdjForm] = useState({ qty: '', note: '' });

  const ajusteMutation = useMutation({
    mutationFn: movimientosApi.ajustar,
    onSuccess: (_movimiento, variables) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['productos', variables.idProducto] });
      queryClient.invalidateQueries({ queryKey: ['productos', variables.idProducto, 'lotes'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    },
  });

  const directProducts = productos.filter(p => p.tipoProducto === 'INVENTARIO_DIRECTO');

  const filtered = directProducts.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.nombreCategoria && p.nombreCategoria.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdjust = async () => {
    if (!selectedProductId || !adjForm.qty || !adjForm.note.trim()) return;
    const qty = parseFloat(adjForm.qty);
    if (!Number.isInteger(qty) || qty <= 0) return;

    try {
      await ajusteMutation.mutateAsync({
        tipoRecurso: 'PRODUCTO',
        idProducto: selectedProductId,
        cantidad: qty,
        motivo: adjForm.note.trim(),
      });
      setAdjustOpen(false);
      setAdjForm({ qty: '', note: '' });
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  const agotados = directProducts.filter(p => (p.stockActual ?? p.stockTotal ?? 0) === 0).length;

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Inventario' },
          { label: 'Inventario Directo' },
        ]}
        icon={Package}
        iconColor="blue"
        title="Inventario de Productos Directos"
        subtitle="Productos vendibles con stock controlado por lotes. Entradas por compras, salidas por ajuste justificado."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard icon={Package} label="Productos Directos" value={directProducts.length} color="slate" />
        <KpiCard icon={Boxes} label="Con Lotes Activos" value={directProducts.filter(p => (p.lotesDisponibles ?? 0) > 0).length} color="blue" />
        <KpiCard icon={XCircle} label="Agotados" value={agotados} color="red" />
      </div>

      {/* Info Banner */}
      <div className="rounded-2xl border ui-status-warning-soft px-5 py-3.5 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 ui-status-warning mt-0.5 flex-shrink-0" />
        <p className="text-xs font-semibold leading-relaxed">
          No se permite alterar el stock escribiendo una cantidad arbitraria. Todo cambio debe quedar respaldado por una compra o un movimiento Kardex de ajuste justificado.
        </p>
      </div>

      {/* Filters */}
      <FilterToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar producto directo...',
        }}
      />

      {/* Product Grid */}
      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin productos de inventario directo"
          description="No hay productos con tipo 'Inventario Directo' configurados en el catálogo."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <DirectProductCard
              key={p.idProducto}
              product={p}
              onAdjust={(id) => {
                setSelectedProductId(id);
                setAdjForm({ qty: '', note: '' });
                setAdjustOpen(true);
              }}
              onHistory={(id) => {
                setSelectedProductId(id);
                setHistoryOpen(true);
              }}
              onLots={(id) => {
                setSelectedProductId(id);
                setLotsOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Adjust Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Registrar salida — {productos.find(p => p.idProducto === selectedProductId)?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-xs text-muted-foreground font-medium leading-relaxed">
              Las entradas de stock deben registrarse desde Compras. Este ajuste solo descuenta stock con motivo obligatorio y genera registro en Kardex.
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Cantidad a descontar</Label>
              <Input type="number" min="1" step="1" value={adjForm.qty} onChange={e => setAdjForm(f => ({ ...f, qty: e.target.value }))} className="h-11 rounded-xl" placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Motivo *</Label>
              <Textarea rows={2} className="resize-none rounded-xl" placeholder="Ej: merma, vencimiento, rotura" value={adjForm.note} onChange={e => setAdjForm(f => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-5 pt-3 border-t border-border/40">
            <Button variant="outline" onClick={() => setAdjustOpen(false)} className="h-10 rounded-xl">Cancelar</Button>
            <Button onClick={handleAdjust} disabled={!adjForm.qty || !adjForm.note.trim() || ajusteMutation.isPending} className="h-10 rounded-xl font-semibold">
              {ajusteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar salida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      {historyOpen && selectedProductId && (
        <HistoryDialog
          idProducto={selectedProductId}
          nombre={productos.find(p => p.idProducto === selectedProductId)?.nombre || ''}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {lotsOpen && selectedProductId && (
        <LotsDialog
          idProducto={selectedProductId}
          nombre={productos.find(p => p.idProducto === selectedProductId)?.nombre || ''}
          onClose={() => setLotsOpen(false)}
        />
      )}
    </PageWrapper>
  );
}

interface CardProps {
  product: Producto;
  onAdjust: (id: number) => void;
  onHistory: (id: number) => void;
  onLots: (id: number) => void;
}

function DirectProductCard({ product, onAdjust, onHistory, onLots }: CardProps) {
  const queryEnabled = usePrivateQueryEnabled();

  const { data: detail, isLoading } = useQuery({
    queryKey: ['productos', product.idProducto],
    queryFn: () => productosApi.getById(product.idProducto),
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const detailProduct = detail?.producto;
  const stock = detailProduct?.stockActual ?? product.stockActual ?? product.stockTotal ?? detail?.inventario?.stock ?? 0;
  const minStock = detailProduct?.stockMinimo ?? product.stockMinimo ?? detail?.inventario?.stockMinimo ?? 5;
  const lotesDisponibles = detailProduct?.lotesDisponibles ?? product.lotesDisponibles ?? 0;
  const proximoVencimiento = detailProduct?.proximoVencimiento ?? product.proximoVencimiento;
  const isParent = product.esSku === false;
  const maxStock = 100;
  const pct = Math.min((stock / maxStock) * 100, 100);

  const getStatus = () => {
    if (stock === 0) return 'agotado';
    if (stock < minStock) return 'critico';
    if (stock < minStock * 1.5) return 'bajo';
    return 'normal';
  };

  const status = getStatus();
  const cfg = statusConf[status];
  const Icon = cfg.icon;

  return (
    <Card className="border border-border bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all flex flex-col justify-between">
      <CardContent className="p-4 flex flex-col gap-3.5">
        <div className="flex items-start gap-3">
          <img
            src={product.imagenUrl ? getFullImageUrl(product.imagenUrl) : 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=60&h=60&fit=crop&auto=format'}
            alt={product.nombre}
            className="w-12 h-12 rounded-xl object-cover bg-muted flex-shrink-0 border border-border"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm truncate">{product.nombre}</h3>
            <p className="text-xs text-muted-foreground font-medium">
              {isParent ? 'Producto padre' : (product.sku || product.nombreCategoria || 'SKU directo')}
            </p>
            {isLoading ? (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Cargando stock...
              </span>
            ) : (
              <Badge variant={cfg.badgeVariant} className="text-[9px] h-5 mt-1.5 gap-1 px-1.5 shadow-2xs font-bold">
                <Icon className="w-3 h-3" />{cfg.label}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>{isParent ? 'Stock total' : 'Stock actual'}: <strong className="text-foreground">{isLoading ? '...' : stock} uds</strong></span>
            <span>Mín: {isLoading ? '...' : minStock}</span>
          </div>
          <Progress value={isLoading ? 0 : pct} className="h-1.5 rounded-full" />
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-foreground ui-tabular">S/ {product.precio != null ? product.precio.toFixed(2) : '—'}</span>
          <div className="text-right text-muted-foreground font-semibold space-y-0.5">
            <p>{lotesDisponibles} lotes disponibles</p>
            {proximoVencimiento && (
              <p className="text-[10px]">Vence: {new Date(proximoVencimiento + 'T00:00:00').toLocaleDateString()}</p>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 border-t border-border/40 pt-3">
          <Button size="sm" variant="outline" className="flex-1 h-9 text-xs rounded-xl gap-1 font-semibold" onClick={() => onAdjust(product.idProducto)} disabled={isLoading || isParent}>
            <RefreshCw className="w-3.5 h-3.5" /> Ajustar salida
          </Button>
          <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl" onClick={() => onLots(product.idProducto)} disabled={isLoading} title="Ver lotes">
            <Boxes className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => onHistory(product.idProducto)} disabled={isLoading} title="Ver historial">
            <History className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LotsDialog({ idProducto, nombre, onClose }: { idProducto: number; nombre: string; onClose: () => void }) {
  const queryEnabled = usePrivateQueryEnabled();
  const { data: lotes = [], isLoading } = useQuery({
    queryKey: ['productos', idProducto, 'lotes'],
    queryFn: () => productosApi.getLotes(idProducto),
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Lotes — {nombre}</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto rounded-xl border border-border">
          {isLoading ? (
            <div className="flex justify-center py-8 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : lotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 font-semibold">Sin lotes registrados para este producto</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU / Nombre</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead className="text-right">Inicial</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Compra</TableHead>
                  <TableHead>Proveedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotes.map(lote => (
                  <TableRow key={lote.idLoteProducto}>
                    <TableCell>
                      <p className="text-sm font-bold text-foreground">{lote.nombreProducto}</p>
                      {lote.skuProducto && <p className="text-xs text-muted-foreground font-mono">{lote.skuProducto}</p>}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground ui-tabular">{lote.cantidadDisponible}</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-muted-foreground ui-tabular">{lote.cantidadInicial}</TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">
                      {new Date(lote.fechaVencimiento + 'T00:00:00').toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">{lote.codigoCompra || (lote.idCompra ? `#${lote.idCompra}` : 'Sin compra')}</TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">{lote.proveedorNombre || 'Sin proveedor'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-10 rounded-xl">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ idProducto, nombre, onClose }: { idProducto: number; nombre: string; onClose: () => void }) {
  const { movimientos, isLoading } = useMovimientos({ idProducto });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Historial — {nombre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 mt-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : movimientos.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 font-semibold">Sin movimientos registrados</p>
          ) : (
            movimientos.map(h => {
              const signedQuantity = getInventoryMovementSignedQuantity(h);
              const movementDate = h.fecha ? new Date(h.fecha).toLocaleDateString() : 'Sin fecha';

              return (
                <div key={h.idMovimiento ?? `${h.fecha ?? 'mov'}-${h.referenceId ?? 'n/a'}`} className="flex gap-3 p-3.5 rounded-xl border border-border bg-muted/10">
                  <div className="flex-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={signedQuantity > 0 ? 'success' : signedQuantity < 0 ? 'danger' : 'secondary'}
                        className="text-[9px] font-bold shadow-2xs"
                      >
                        {getInventoryMovementLabel(h.tipoMovimiento)}
                      </Badge>
                      <span className="font-bold text-foreground text-xs">
                        {signedQuantity > 0 ? '+' : ''}{signedQuantity}
                      </span>
                    </div>
                    {h.motivo && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{h.motivo}</p>}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right font-semibold">
                    <p>{movementDate}</p>
                    {h.nombreEmpleado && <p>{h.nombreEmpleado}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-10 rounded-xl">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
