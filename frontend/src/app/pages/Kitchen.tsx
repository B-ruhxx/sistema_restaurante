import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ChefHat, CheckCircle2, Clock, Package, RefreshCw } from 'lucide-react';
import { cocinaApi, Comanda } from '../../api/cocina';
import { toast } from '../../lib/notifications';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../components/ui/utils';

function minutesSince(value?: string) {
  if (!value) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
}

function urgency(min: number, estimated?: number) {
  if (estimated && min > estimated) return 'urgent';
  if (min > 30) return 'urgent';
  if (min > 20) return 'warning';
  return 'ok';
}

const URG_STYLE = {
  ok: { ring: 'border-l-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  warning: { ring: 'border-l-orange-400', badge: 'bg-orange-50 text-orange-700' },
  urgent: { ring: 'border-l-red-600', badge: 'bg-red-50 text-red-700' },
};

export function Kitchen() {
  const queryClient = useQueryClient();
  const comandasQuery = useQuery({
    queryKey: ['cocina', 'comandas'],
    queryFn: cocinaApi.getComandas,
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
  });

  const iniciarMutation = useMutation({
    mutationFn: cocinaApi.iniciar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cocina', 'comandas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Preparación iniciada');
    },
  });

  const finalizarMutation = useMutation({
    mutationFn: cocinaApi.finalizar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cocina', 'comandas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast.success('Pedido listo para entregar');
    },
  });

  const comandas = comandasQuery.data || [];
  const enviados = comandas.filter(c => c.estado === 'ENVIADO_COCINA');
  const enPreparacion = comandas.filter(c => c.estado === 'EN_PREPARACION');
  const listos = comandas.filter(c => c.estado === 'LISTO');
  const avgTime = enPreparacion.length
    ? Math.round(enPreparacion.reduce((sum, c) => sum + minutesSince(c.fechaInicioPreparacion || c.fechaEnvioCocina), 0) / enPreparacion.length)
    : 0;

  const Ticket = ({ comanda }: { comanda: Comanda }) => {
    const min = minutesSince(comanda.fechaInicioPreparacion || comanda.fechaEnvioCocina);
    const urg = urgency(min, comanda.tiempoEstimadoMinutos);
    const style = URG_STYLE[urg];

    return (
      <Card className={cn('border-l-4 overflow-hidden', style.ring)}>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Pedido #{comanda.idPedido}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {comanda.numeroMesa ? `Mesa ${comanda.numeroMesa}` : 'Sin mesa'}
                {comanda.clienteNombre ? ` · ${comanda.clienteNombre}` : ''}
              </p>
            </div>
            <Badge className={style.badge} variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              {min} min
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-3">
            {comanda.detalles.map((detalle) => (
              <div key={detalle.idDetallePedido} className="flex gap-3">
                <span className="font-bold text-red-600 w-8">{detalle.cantidad}x</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{detalle.itemNombre}</p>
                  {detalle.varianteNombre && <p className="text-xs text-muted-foreground">{detalle.varianteNombre}</p>}
                  {detalle.extras && detalle.extras.length > 0 && (
                    <p className="text-xs text-muted-foreground">+ {detalle.extras.join(', ')}</p>
                  )}
                  {detalle.observacion && (
                    <div className="mt-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-800">
                      <AlertTriangle className="inline w-3 h-3 mr-1" />
                      {detalle.observacion}
                    </div>
                  )}
                </div>
                <Badge variant="outline">{detalle.estadoCocina}</Badge>
              </div>
            ))}
          </div>

          {comanda.tiempoEstimadoMinutos != null && (
            <p className="text-xs text-muted-foreground">Estimado: {comanda.tiempoEstimadoMinutos} min</p>
          )}

          {comanda.estado === 'ENVIADO_COCINA' && (
            <Button className="w-full" onClick={() => iniciarMutation.mutate(comanda.idPedido)}>
              <ChefHat className="w-4 h-4 mr-2" />
              Iniciar preparación
            </Button>
          )}
          {comanda.estado === 'EN_PREPARACION' && (
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => finalizarMutation.mutate(comanda.idPedido)}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Marcar listo
            </Button>
          )}
          {comanda.estado === 'LISTO' && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Listo para entregar
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const Column = ({ title, items, accent }: { title: string; items: Comanda[]; accent: string }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
        <span className="font-semibold">{title}</span>
        <span className="w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center" style={{ background: accent }}>
          {items.length}
        </span>
      </div>
      <div className="space-y-3">
        {items.map(c => <Ticket key={c.idPedido} comanda={c} />)}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Sin comandas
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            Cocina
          </h1>
          <p className="text-sm text-muted-foreground">Comandas reales sin precios ni pagos</p>
        </div>
        <Button variant="outline" onClick={() => comandasQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Activas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{comandas.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pendientes</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-amber-600">{enviados.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Preparando</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-600">{enPreparacion.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Promedio</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{avgTime} min</CardContent></Card>
      </div>

      {comandasQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando comandas...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Column title="Enviados" items={enviados} accent="#f59e0b" />
          <Column title="En preparación" items={enPreparacion} accent="#3b82f6" />
          <Column title="Listos" items={listos} accent="#10b981" />
        </div>
      )}
    </div>
  );
}
