import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock,
  Eye,
  LayoutGrid,
  List,
  Package,
  ReceiptText,
  RefreshCw,
  XCircle,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { usePedidos } from '../../hooks/usePedidos';
import { pedidosApi, Pedido } from '../../api/pedidos';
import { precuentasApi } from '../../api/precuentas';
import { toast } from '../../lib/notifications';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

const ESTADO_META: Record<string, { label: string; variant: 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'type'; icon: React.ElementType; group: string; color: 'slate' | 'blue' | 'green' | 'violet' | 'red' }> = {
  BORRADOR_ATENCION: { label: 'Atención', variant: 'secondary', icon: Clock, group: 'atencion', color: 'slate' },
  EN_COCINA: { label: 'En cocina', variant: 'info', icon: ChefHat, group: 'cocina', color: 'blue' },
  LISTO: { label: 'Listo', variant: 'success', icon: CheckCircle2, group: 'entrega', color: 'green' },
  SERVIDO: { label: 'Servido', variant: 'type', icon: Package, group: 'cuenta', color: 'slate' },
  CUENTA: { label: 'En cuenta', variant: 'info', icon: ReceiptText, group: 'cuenta', color: 'violet' },
  CERRADO: { label: 'Cerrado', variant: 'success', icon: CheckCircle2, group: 'cerrado', color: 'green' },
  CANCELADO: { label: 'Cancelado', variant: 'danger', icon: XCircle, group: 'cerrado', color: 'red' },
};

const GROUPS = [
  { id: 'atencion', title: 'Atención', accent: 'slate' as const },
  { id: 'cocina', title: 'Cocina', accent: 'blue' as const },
  { id: 'entrega', title: 'Entrega', accent: 'green' as const },
  { id: 'cuenta', title: 'Cuenta', accent: 'violet' as const },
  { id: 'cerrado', title: 'Cerrados', accent: 'slate' as const },
];

function elapsed(date: string | undefined, now: number) {
  if (!date) return 0;
  return Math.max(0, Math.round((now - new Date(date).getTime()) / 60000));
}

function estadoMeta(estado: string) {
  return ESTADO_META[estado] || ESTADO_META.BORRADOR_ATENCION;
}

function PedidoActions({
  pedido,
  onSelect,
  onUpdateEstado,
  onEmitirPrecuenta,
  onEnviarCocina,
  onCancelar,
  onReabrir,
}: {
  pedido: Pedido;
  onSelect: (pedido: Pedido) => void;
  onUpdateEstado: (id: number, estado: string) => void;
  onEmitirPrecuenta: (id: number) => void;
  onEnviarCocina: (id: number) => void;
  onCancelar: (pedido: Pedido) => void;
  onReabrir: (id: number) => void;
}) {
  const canCancel = ['BORRADOR_ATENCION', 'EN_COCINA', 'LISTO', 'SERVIDO', 'CUENTA'].includes(pedido.estado);
  const canReopen = pedido.estado === 'CUENTA';
  const actionButtons: ReactNode[] = [];

  actionButtons.push(
    <Button key="view" size="sm" variant="outline" onClick={() => onSelect(pedido)} className="h-9 rounded-xl gap-1">
      <Eye className="w-4 h-4" />
      Ver
    </Button>
  );

  if (pedido.estado === 'LISTO') {
    actionButtons.push(
      <Button key="delivered" size="sm" onClick={() => onUpdateEstado(pedido.idPedido, 'SERVIDO')} className="h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-1">
        <Package className="w-4 h-4" />
        Entregado
      </Button>
    );
  }
  if (pedido.estado === 'SERVIDO' || pedido.estado === 'CUENTA') {
    actionButtons.push(
      <Button key="precuenta" size="sm" onClick={() => onEmitirPrecuenta(pedido.idPedido)} className="h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 gap-1">
        <ReceiptText className="w-4 h-4" />
        Precuenta
      </Button>
    );
  }
  if (pedido.estado === 'BORRADOR_ATENCION') {
    actionButtons.push(
      <Button key="cocina" size="sm" variant="outline" onClick={() => onEnviarCocina(pedido.idPedido)} className="h-9 rounded-xl gap-1">
        <ChefHat className="w-4 h-4" />
        Cocina
      </Button>
    );
  }
  if (canReopen) {
    actionButtons.push(
      <Button key="reopen" size="sm" variant="outline" onClick={() => onReabrir(pedido.idPedido)} className="h-9 rounded-xl gap-1">
        <RefreshCw className="w-4 h-4" />
        Reabrir
      </Button>
    );
  }
  if (canCancel) {
    actionButtons.push(
      <Button key="cancel" size="sm" variant="destructive" onClick={() => onCancelar(pedido)} className="h-9 rounded-xl gap-1">
        <XCircle className="w-4 h-4" />
        Cancelar
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {actionButtons.length > 0 ? actionButtons : <span className="text-xs text-muted-foreground">Sin acciones</span>}
    </div>
  );
}

function PedidoCard({ pedido, now, onSelect }: { pedido: Pedido; now: number; onSelect: (pedido: Pedido) => void }) {
  const meta = estadoMeta(pedido.estado);
  const Icon = meta.icon;
  const min = elapsed(pedido.fecha, now);
  return (
    <Card className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all rounded-2xl border border-border" onClick={() => onSelect(pedido)}>
      <CardHeader className="pb-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">Pedido #{pedido.idPedido}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {pedido.numeroMesa ? `Mesa ${pedido.numeroMesa}` : 'Sin mesa'} · {pedido.detalles?.length || 0} items
            </p>
          </div>
          <Badge variant={meta.variant} className="shadow-2xs text-[10px] font-semibold px-2 py-0.5">
            <Icon className="w-3 h-3 mr-1" />
            {meta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="space-y-1.5 border-t border-border/40 pt-2.5">
          {(pedido.detalles || []).slice(0, 3).map(detalle => (
            <div key={detalle.idDetallePedido} className="flex gap-2 text-xs text-foreground/80 leading-snug">
              <span className="font-bold text-primary w-6">{detalle.cantidad}x</span>
              <span className="truncate flex-1">{detalle.nombreProducto || detalle.nombreCombo || 'Item'}</span>
            </div>
          ))}
          {(pedido.detalles || []).length > 3 && (
            <p className="text-[10px] text-muted-foreground font-medium pl-8">
              +{(pedido.detalles || []).length - 3} items más
            </p>
          )}
        </div>
        <div className="flex items-center justify-between text-xs border-t border-border/40 pt-2.5 font-medium">
          <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {min} min</span>
          <span className="font-bold text-foreground ui-tabular">S/ {(pedido.total || 0).toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function Orders() {
  const queryClient = useQueryClient();
  const { pedidos, isLoading, refetch } = usePedidos({ pollingEnabled: true });
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Pedido | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const precuentasQuery = useQuery({
    queryKey: ['precuentas', 'pedido', selected?.idPedido],
    queryFn: () => precuentasApi.getByPedido(selected!.idPedido),
    enabled: !!selected,
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

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

  const emitirPrecuentaMutation = useMutation({
    mutationFn: async (idPedido: number) => {
      return precuentasApi.emitir(idPedido);
    },
    onSuccess: async (precuenta) => {
      invalidate();
      const pedido = await pedidosApi.getById(precuenta.idPedido);
      setSelected(pedido);
      toast.success(`Precuenta ${precuenta.numero} emitida`);
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => pedidosApi.cancelar(id, { motivo }),
    onSuccess: (pedido) => {
      invalidate();
      setSelected(pedido);
      setCancelTarget(null);
      setCancelMotivo('');
      toast.success('Pedido cancelado');
    },
  });

  const reabrirMutation = useMutation({
    mutationFn: pedidosApi.reabrir,
    onSuccess: (pedido) => {
      invalidate();
      setSelected(pedido);
      toast.success('Pedido reabierto');
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

  const handleEnviarCocina = (idPedido: number) => {
    pedidosApi.enviarCocina(idPedido).then(() => {
      invalidate();
      toast.success('Pedido enviado a cocina');
    });
  };

  const renderPedidoActions = (pedido: Pedido) => (
    <PedidoActions
      pedido={pedido}
      onSelect={setSelected}
      onUpdateEstado={(id, estado) => updateEstadoMutation.mutate({ id, estado })}
      onEmitirPrecuenta={emitirPrecuentaMutation.mutate}
      onEnviarCocina={handleEnviarCocina}
      onCancelar={(target) => {
        setCancelTarget(target);
        setCancelMotivo('');
      }}
      onReabrir={reabrirMutation.mutate}
    />
  );

  const confirmCancel = () => {
    if (!cancelTarget) return;
    const motivo = cancelMotivo.trim();
    if (!motivo) {
      toast.error('Ingresa el motivo de cancelación');
      return;
    }
    cancelarMutation.mutate({ id: cancelTarget.idPedido, motivo });
  };

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Operaciones' },
          { label: 'Pedidos' },
        ]}
        icon={ClipboardList}
        iconColor="blue"
        title="Pedidos"
        subtitle="Seguimiento en tiempo real de comandas, preparación en cocina y estados de precuenta."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {GROUPS.map(group => {
          // Find first status belonging to group to get its icon
          const matchingStatus = Object.values(ESTADO_META).find(meta => meta.group === group.id);
          const Icon = matchingStatus?.icon || Clock;
          return (
            <KpiCard
              key={group.id}
              icon={Icon as any}
              label={group.title}
              value={byGroup(group.id).length}
              color={group.accent}
            />
          );
        })}
      </div>

      {/* Toolbar */}
      <FilterToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar por pedido, mesa o cliente...',
        }}
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} className="h-11 rounded-xl gap-2 font-medium text-sm">
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
            <div className="flex items-center gap-1 rounded-xl border border-border p-1 bg-muted/20">
              <Button size="icon" className="h-9 w-9 rounded-lg" variant={view === 'kanban' ? 'default' : 'ghost'} onClick={() => setView('kanban')} title="Vista kanban">
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button size="icon" className="h-9 w-9 rounded-lg" variant={view === 'table' ? 'default' : 'ghost'} onClick={() => setView('table')} title="Vista tabla">
                <List className="w-4 h-4" />
              </Button>
            </div>
          </>
        }
      />

      {/* Main Area */}
      {isLoading ? (
        <div className="h-40 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Cargando pedidos...</span>
        </div>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {GROUPS.map(group => (
            <div key={group.id} className="space-y-3.5 bg-muted/15 p-3 rounded-2xl border border-border/40">
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <span className="font-bold text-sm text-foreground">{group.title}</span>
                <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: `var(--color-${group.accent}, var(--action-primary))` }}>
                  {byGroup(group.id).length}
                </span>
              </div>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
                {byGroup(group.id).map(pedido => (
                  <PedidoCard key={pedido.idPedido} pedido={pedido} now={now} onSelect={setSelected} />
                ))}
                {byGroup(group.id).length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground bg-card/40">
                    Sin pedidos
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <SectionCard
          title="Registro de pedidos"
          description="Consulta rápida de comandas emitidas y estado de atención."
          icon={ClipboardList}
          iconColor="blue"
        >
          {filteredPedidos.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin pedidos encontrados"
              description="No hay pedidos registrados para los criterios actuales."
            />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
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
                        <TableCell className="font-bold text-foreground">#{pedido.idPedido}</TableCell>
                        <TableCell className="font-medium">{pedido.numeroMesa ? `Mesa ${pedido.numeroMesa}` : 'Sin mesa'}</TableCell>
                        <TableCell className="text-sm">{pedido.clienteNombre || 'Cliente general'}</TableCell>
                        <TableCell>
                          <Badge variant={meta.variant} className="shadow-2xs font-medium">
                            <Icon className="w-3 h-3 mr-1" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="ui-tabular text-sm">{pedido.detalles?.length || 0}</TableCell>
                        <TableCell className="text-right font-bold text-foreground ui-tabular">S/ {(pedido.total || 0).toFixed(2)}</TableCell>
                        <TableCell>{renderPedidoActions(pedido)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      )}

      {/* Detalle del Pedido */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Pedido #{selected?.idPedido}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 mt-2">
              <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
                <Badge variant={estadoMeta(selected.estado).variant} className="font-medium">
                  {estadoMeta(selected.estado).label}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  {format(new Date(selected.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                </span>
                {selected.numeroMesa && <span className="text-xs text-muted-foreground font-semibold bg-muted/40 px-2 py-0.5 rounded-lg">Mesa {selected.numeroMesa}</span>}
              </div>

              <div className="space-y-2.5">
                {(selected.detalles || []).map(detalle => (
                  <div key={detalle.idDetallePedido} className="rounded-xl border border-border p-3.5 flex justify-between gap-3 bg-muted/5">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{detalle.cantidad}x {detalle.nombreProducto || detalle.nombreCombo || 'Item'}</p>
                      {detalle.nombreVariante && <p className="text-xs text-muted-foreground mt-0.5">Variante: {detalle.nombreVariante}</p>}
                      {detalle.extras && detalle.extras.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">Extras: {detalle.extras.map(e => e.nombre).join(', ')}</p>
                      )}
                      {detalle.observacion && (
                        <p className="text-xs ui-status-warning font-medium mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {detalle.observacion}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-foreground text-sm ui-tabular">S/ {(detalle.subtotal || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-xs">
                <span className="font-semibold text-sm">Total a cobrar</span>
                <span className="text-xl font-black ui-tabular">S/ {(selected.total || 0).toFixed(2)}</span>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Historial de precuentas</h3>
                  {precuentasQuery.isFetching && <span className="text-xs text-muted-foreground">Actualizando...</span>}
                </div>
                {(precuentasQuery.data || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground font-medium">Sin precuentas emitidas para este pedido.</p>
                ) : (
                  <div className="space-y-2">
                    {(precuentasQuery.data || []).map((precuenta) => (
                      <div key={precuenta.idPrecuenta} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs shadow-2xs">
                        <div>
                          <div className="font-bold text-foreground">{precuenta.numero}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(precuenta.fechaEmision), 'dd MMM HH:mm', { locale: es })}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="font-medium text-[10px]">{precuenta.estado}</Badge>
                          <div className="text-xs font-bold text-foreground mt-1 ui-tabular">S/ {(precuenta.total || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-4">
                {renderPedidoActions(selected)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancelación de Pedido */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cancelar pedido #{cancelTarget?.idPedido}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 mt-2">
            <p className="text-sm text-muted-foreground">
              La cancelación requiere un motivo justificado y será registrada para auditoría.
            </p>
            <Textarea
              value={cancelMotivo}
              onChange={(event) => setCancelMotivo(event.target.value)}
              placeholder="Ingresa el motivo de cancelación..."
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setCancelTarget(null)} className="h-10 rounded-xl">Volver</Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelarMutation.isPending} className="h-10 rounded-xl">
              Cancelar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
