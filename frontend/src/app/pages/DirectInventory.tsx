import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, AlertTriangle, CheckCircle2, XCircle, History, RefreshCw, Loader2, Package
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';

import { useProductos } from '../../hooks/useProductos';
import { useMovimientos } from '../../hooks/useMovimientos';
import { usePrivateQueryEnabled } from '../../hooks/usePrivateQuery';
import { Producto, ProductoRequest } from '../../api/productos';
import { productosApi } from '../../api/productos';
import { getFullImageUrl } from '../components/ui/utils';

const statusConf = {
  normal: { label: 'Normal', icon: CheckCircle2, color: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  bajo: { label: 'Bajo', icon: AlertTriangle, color: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  critico: { label: 'Crítico', icon: AlertTriangle, color: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  agotado: { label: 'Agotado', icon: XCircle, color: 'text-red-600', badge: 'bg-red-100 text-red-700' },
};

export function DirectInventory() {
  const queryClient = useQueryClient();
  const { productos, isLoading, updateProducto, isUpdating } = useProductos();
  const [search, setSearch] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [adjForm, setAdjForm] = useState({ type: 'entrada', qty: '', note: '' });

  // Filter products by INVENTARIO_DIRECTO
  const directProducts = productos.filter(p => p.tipoProducto === 'INVENTARIO_DIRECTO');

  const filtered = directProducts.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.nombreCategoria && p.nombreCategoria.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdjust = async () => {
    if (!selectedProductId || !adjForm.qty) return;
    const qty = parseFloat(adjForm.qty);
    const delta = adjForm.type === 'salida' ? -qty : qty;

    const baseProduct = productos.find(p => p.idProducto === selectedProductId);
    if (!baseProduct) return;

    try {
      // Fetch current stock first
      const detail = await queryClient.fetchQuery({
        queryKey: ['productos', selectedProductId],
        queryFn: () => productosApi.getById(selectedProductId),
      });

      const currentStock = detail.inventario?.stock ?? 0;
      const newStock = Math.max(0, currentStock + delta);

      const requestData: ProductoRequest = {
        nombre: baseProduct.nombre,
        descripcion: baseProduct.descripcion,
        imagenUrl: baseProduct.imagenUrl,
        precio: baseProduct.precio,
        tipoProducto: 'INVENTARIO_DIRECTO',
        estado: baseProduct.estado,
        idCategoria: baseProduct.idCategoria,
        stockInicial: newStock,
        stockMinimo: detail.inventario?.stockMinimo ?? 5,
      };

      await updateProducto({ id: selectedProductId, data: requestData });
      // Invalidate the detail query so stock updates immediately
      queryClient.invalidateQueries({ queryKey: ['productos', selectedProductId] });
      setAdjustOpen(false);
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventario de Productos Directos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gaseosas, bebidas y postres empaquetados</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar producto..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <DirectProductCard
            key={p.idProducto}
            product={p}
            onAdjust={(id) => {
              setSelectedProductId(id);
              setAdjForm({ type: 'entrada', qty: '', note: '' });
              setAdjustOpen(true);
            }}
            onHistory={(id) => {
              setSelectedProductId(id);
              setHistoryOpen(true);
            }}
          />
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No se encontraron productos directos</p>
          </div>
        )}
      </div>

      {/* Adjust Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustar stock — {productos.find(p => p.idProducto === selectedProductId)?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de movimiento</Label>
              <Select value={adjForm.type} onValueChange={v => setAdjForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (sumar stock)</SelectItem>
                  <SelectItem value="salida">Salida (restar stock)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input type="number" step="1" value={adjForm.qty} onChange={e => setAdjForm(f => ({ ...f, qty: e.target.value }))} className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label>Nota / Motivo</Label>
              <Textarea rows={2} className="mt-1 resize-none" placeholder="Ej: Reposición semanal" value={adjForm.note} onChange={e => setAdjForm(f => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdjust} disabled={!adjForm.qty || isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar
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
    </div>
  );
}

interface CardProps {
  product: Producto;
  onAdjust: (id: number) => void;
  onHistory: (id: number) => void;
}

function DirectProductCard({ product, onAdjust, onHistory }: CardProps) {
  const queryEnabled = usePrivateQueryEnabled();

  // Fetch full detail with React Query for this specific product
  const { data: detail, isLoading } = useQuery({
    queryKey: ['productos', product.idProducto],
    queryFn: () => productosApi.getById(product.idProducto),
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const stock = detail?.inventario?.stock ?? 0;
  const minStock = detail?.inventario?.stockMinimo ?? 5;
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <img
            src={product.imagenUrl ? getFullImageUrl(product.imagenUrl) : 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=60&h=60&fit=crop&auto=format'}
            alt={product.nombre}
            className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{product.nombre}</h3>
            <p className="text-xs text-muted-foreground">{product.nombreCategoria || 'Sin categoría'}</p>
            {isLoading ? (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Cargando stock...
              </span>
            ) : (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-flex items-center gap-1 ${cfg.badge}`}>
                <Icon className="w-3 h-3" />{cfg.label}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Stock: <strong className="text-foreground">{isLoading ? '...' : stock} unidades</strong></span>
            <span>Mín: {isLoading ? '...' : minStock}</span>
          </div>
          <Progress value={isLoading ? 0 : pct} className="h-2" />
        </div>

        <div className="flex justify-between items-center mb-3 text-xs">
          <span className="font-medium">Precio Venta: S/ {product.precio.toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => onAdjust(product.idProducto)} disabled={isLoading}>
            <RefreshCw className="w-3 h-3 mr-1" /> Ajustar
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8" onClick={() => onHistory(product.idProducto)} disabled={isLoading}>
            <History className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryDialog({ idProducto, nombre, onClose }: { idProducto: number; nombre: string; onClose: () => void }) {
  const { movimientos, isLoading } = useMovimientos({ idProducto });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Historial — {nombre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : movimientos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin movimientos registrados</p>
          ) : (
            movimientos.map(h => (
              <div key={h.idMovimiento} className="flex gap-3 p-3 rounded-lg border border-border">
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={h.tipoMovimiento === 'ENTRADA' ? 'default' : 'secondary'} className="text-xs">
                      {h.tipoMovimiento}
                    </Badge>
                    <span className="font-medium">
                      {h.tipoMovimiento === 'ENTRADA' ? '+' : '-'}{h.cantidad}
                    </span>
                  </div>
                  {h.motivo && <p className="text-xs text-muted-foreground mt-0.5">{h.motivo}</p>}
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <p>{new Date(h.fecha).toLocaleDateString()}</p>
                  {h.nombreEmpleado && <p>{h.nombreEmpleado}</p>}
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
