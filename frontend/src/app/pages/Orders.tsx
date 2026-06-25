import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock,
  FileText,
  LayoutGrid,
  List,
  Package,
  ReceiptText,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { usePedidos } from '../../hooks/usePedidos';
import { pedidosApi, Pedido, PedidoEstado } from '../../api/pedidos';
import { precuentasApi } from '../../api/precuentas';
import { toast } from '../../lib/notifications';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { cn } from '../components/ui/utils';

const ESTADOS: PedidoEstado[] = [
  'ABIERTO',
  'ENVIADO_COCINA',
  'EN_PREPARACION',
  'LISTO',
  'ENTREGADO',
  'CUENTA_SOLICITADA',
  'CUENTA_EMITIDA',
  'PAGADO',
  'CANCELADO',
];

const ESTADO_META: Record<string, { label: string; badge: string; icon: React.ElementType; group: string }> = {
  ABIERTO: { label: 'Abierto', badge: 'bg-slate-50 text-slate-700 border-slate-200', icon: Clock, group: 'atencion' },
  ENVIADO_COCINA: { label: 'Enviado cocina', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: ChefHat, group: 'cocina' },
  EN_PREPARACION: { label: 'En preparación', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: ChefHat, group: 'cocina' },
  LISTO: { label: 'Listo', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, group: 'entrega' },
  ENTREGADO: { label: 'Entregado', badge: 'bg-teal-50 text-teal-700 border-teal-200', icon: Package, group: 'cuenta' },
  CUENTA_SOLICITADA: { label: 'Cuenta solicitada', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: FileText, group: 'cuenta' },
  CUENTA_EMITIDA: { label: 'Cuenta emitida', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: ReceiptText, group: 'cuenta' },
  PAGADO: { label: 'Pagado', badge: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2, group: 'cerrado' },
  CANCELADO: { label: 'Cancelado', badge: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, group: 'cerrado' },
  PENDIENTE: { label: 'Pendiente', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, group: 'atencion' },
  EN_COCINA: { label: 'En cocina', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: ChefHat, group: 'cocina' },
  EN_PROCESO: { label: 'En proceso', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: ChefHat, group: 'cocina' },
};

const GROUPS = [
  { id: 'atencion', title: 'Atención', accent: '#64748b' },
  { id: 'cocina', title: 'Cocina', accent: '#3b82f6' },
  { id: 'entrega', title: 'Entrega', accent: '#10b981' },
  { id: 'cuenta', title: 'Cuenta', accent: '#8b5cf6' },
  { id: 'cerrado', title: 'Cerrados', accent: '#475569' },
];

function elapsed(date?: string) {
  if (!date) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60000));
}

function estadoMeta(estado: string) {
  return ESTADO_META[estado] || ESTADO_META.ABIERTO;
}

export function Orders() {
  const queryClient = useQueryClient();
  const { pedidos, isLoading, refetch } = usePedidos({ pollingEnabled: true });
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    queryClient.invalidateQueries({ queryKey: ['mesas'] });
    queryClient.invalidateQueries({ queryKey: ['cocina', 'comandas'] });
    queryClient.invalidateQueries({ queryKey: ['caja', 'pedidos-pendientes'] });
    queryClient.invalidateQueries({ queryKey: ['precuentas'] });
  };

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) => pedidosApi.updateEstado(id, estado),
    onSuccess: (pedido) => {
      invalidate();
      setSelected(pedido);
      toast.success('Pedido actualizado');
    },
  });

  const solicitarCuentaMutation = useMutation({
    mutationFn: pedidosApi.solicitarCuenta,
    onSuccess: (pedido) => {
      invalidate();
      setSelected(pedido);
      toast.success('Cuenta solicitada');
    },
  });

  const emitirPrecuentaMutation = useMutation({
    mutationFn: precuentasApi.emitir,
    onSuccess: async (precuenta) => {
      invalidate();
      const pedido = await pedidosApi.getById(precuenta.idPedido);
      setSelected(pedido);
      toast.success(`Precuenta ${precuenta.numero} emitida`);
    },
  });

  const filteredPedidos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pedidos.filter((pedido) => {
      if (!query) return true;
      return [
        pedido.idPedido,
        pedido.numeroMesa,
        pedido.clienteNombre,
        pedido.estado,
      ].some(value => String(value || '').toLowerCase().includes(query));
    });
  }, [pedidos, search]);

  const byGroup = (group: string) => filteredPedidos.filter(p => estadoMeta(p.estado).group === group);

  const PedidoActions = ({ pedido }: { pedido: Pedido }) => (
    <div className="flex flex-wrap gap-2">
      {pedido.estado === 'LISTO' && (
        <Button size="sm" onClick={() => updateEstadoMutation.mutate({ id: pedido.idPedido, estado: 'ENTREGADO' })}>
          <Package className="w-4 h-4 mr-2" />
          Marcar entregado
        </Button>
      )}
      {pedido.estado === 'ENTREGADO' && (
        <Button size="sm" variant="outline" onClick={() => solicitarCuentaMutation.mutate(pedido.idPedido)}>
          <FileText className="w-4 h-4 mr-2" />
          Solicitar cuenta
        </Button>
      )}
      {['ENTREGADO', 'CUENTA_SOLICITADA'].includes(pedido.estado) && (
        <Button size="sm" onClick={() => emitirPrecuentaMutation.mutate(pedido.idPedido)}>
          <ReceiptText className="w-4 h-4 mr-2" />
          Emitir precuenta
        </Button>
      )}
      {pedido.estado === 'ABIERTO' && (
        <Button size="sm" variant="outline" onClick={() => pedidosApi.enviarCocina(pedido.idPedido).then(() => {
          invalidate();
          toast.success('Pedido enviado a cocina');
        })}>
          <ChefHat className="w-4 h-4 mr-2" />
          Enviar cocina
        </Button>
      )}
    </div>
  );

  const PedidoCard = ({ pedido }: { pedido: Pedido }) => {
    const meta = estadoMeta(pedido.estado);
    const Icon = meta.icon;
    const min = elapsed(pedido.fecha);
    return (
      <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelected(pedido)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Pedido #{pedido.idPedido}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {pedido.numeroMesa ? `Mesa ${pedido.numeroMesa}` : 'Sin mesa'} · {pedido.detalles?.length || 0} items
              </p>
            </div>
            <Badge variant="outline" className={cn('border', meta.badge)}>
              <Icon className="w-3 h-3 mr-1" />
              {meta.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            {(pedido.detalles || []).slice(0, 3).map(detalle => (
              <div key={detalle.idDetallePedido} className="flex gap-2 text-sm">
                <span className="font-bold text-red-600 w-6">{detalle.cantidad}x</span>
                <span className="truncate">{detalle.nombreProducto || detalle.nombreCombo || 'Item'}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {min} min</span>
            <span className="font-semibold">S/ {(pedido.total || 0).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Seguimiento real de pedidos, cocina y precuenta</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedido, mesa o cliente" className="pl-9" />
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button size="sm" variant={view === 'kanban' ? 'default' : 'ghost'} onClick={() => setView('kanban')}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button size="sm" variant={view === 'table' ? 'default' : 'ghost'} onClick={() => setView('table')}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {GROUPS.map(group => (
          <Card key={group.id}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{group.title}</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold" style={{ color: group.accent }}>{byGroup(group.id).length}</CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando pedidos...</div>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {GROUPS.map(group => (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                <span className="font-semibold">{group.title}</span>
                <span className="w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center" style={{ background: group.accent }}>
                  {byGroup(group.id).length}
                </span>
              </div>
              {byGroup(group.id).map(pedido => <PedidoCard key={pedido.idPedido} pedido={pedido} />)}
              {byGroup(group.id).length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Sin pedidos</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPedidos.map(pedido => {
                  const meta = estadoMeta(pedido.estado);
                  const Icon = meta.icon;
                  return (
                    <TableRow key={pedido.idPedido}>
                      <TableCell className="font-medium">#{pedido.idPedido}</TableCell>
                      <TableCell>{pedido.numeroMesa || 'Sin mesa'}</TableCell>
                      <TableCell>{pedido.clienteNombre || 'Cliente general'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('border', meta.badge)}>
                          <Icon className="w-3 h-3 mr-1" />
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{pedido.detalles?.length || 0}</TableCell>
                      <TableCell className="text-right font-semibold">S/ {(pedido.total || 0).toFixed(2)}</TableCell>
                      <TableCell><PedidoActions pedido={pedido} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pedido #{selected?.idPedido}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn('border', estadoMeta(selected.estado).badge)}>
                  {estadoMeta(selected.estado).label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selected.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                </span>
                {selected.numeroMesa && <span className="text-sm text-muted-foreground">Mesa {selected.numeroMesa}</span>}
              </div>
              <div className="space-y-2">
                {(selected.detalles || []).map(detalle => (
                  <div key={detalle.idDetallePedido} className="rounded-lg border p-3 flex justify-between gap-3">
                    <div>
                      <p className="font-medium">{detalle.cantidad}x {detalle.nombreProducto || detalle.nombreCombo || 'Item'}</p>
                      {detalle.nombreVariante && <p className="text-xs text-muted-foreground">Variante: {detalle.nombreVariante}</p>}
                      {detalle.extras && detalle.extras.length > 0 && (
                        <p className="text-xs text-muted-foreground">Extras: {detalle.extras.map(e => e.nombre).join(', ')}</p>
                      )}
                      {detalle.observacion && (
                        <p className="text-xs text-amber-700 mt-1"><AlertTriangle className="inline w-3 h-3 mr-1" />{detalle.observacion}</p>
                      )}
                    </div>
                    <span className="font-semibold">S/ {(detalle.subtotal || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-red-600 text-white p-4 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">S/ {(selected.total || 0).toFixed(2)}</span>
              </div>
              <PedidoActions pedido={selected} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
