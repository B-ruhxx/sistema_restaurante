import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Ban, ChefHat, CheckCircle2, Clock, Package, PlayCircle, RefreshCw, Loader2 } from 'lucide-react';
import { cocinaApi, Comanda, ComandaDetalle } from '../../api/cocina';
import { toast } from '../../lib/notifications';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { PageWrapper, ModuleHeader, KpiCard } from '../components/ui/erp-layout';

function minutesSince(value: string | undefined, now: number) {
  if (!value) return 0;
  return Math.max(0, Math.round((now - new Date(value).getTime()) / 60000));
}

function urgency(min: number, estimated?: number) {
  if (estimated && min > estimated) return 'urgent';
  if (min > 30) return 'urgent';
  if (min > 20) return 'warning';
  return 'ok';
}

function formatCountdown(totalSeconds: number) {
  const absSeconds = Math.abs(totalSeconds);
  const minutes = Math.floor(absSeconds / 60);
  const seconds = absSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function countdownTo(value: string | undefined, estimatedMinutes: number | undefined, now: number) {
  if (!value || !estimatedMinutes) return null;
  const target = new Date(value).getTime() + estimatedMinutes * 60_000;
  const totalSeconds = Math.ceil((target - now) / 1000);
  return {
    overdue: totalSeconds < 0,
    label: formatCountdown(totalSeconds),
  };
}

const URG_STYLE = {
  ok: { ring: 'border-l-[var(--status-success)]', badge: 'success' },
  warning: { ring: 'border-l-[var(--status-warning)]', badge: 'warning' },
  urgent: { ring: 'border-l-[var(--status-danger)]', badge: 'danger' },
} as const;

const ESTADO_BADGE: Record<ComandaDetalle['estadoCocina'], 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
  PENDIENTE: 'warning',
  EN_PREPARACION: 'info',
  LISTO: 'success',
  CANCELADO: 'danger',
};

function Ticket({
  comanda,
  now,
  onFinalizar,
  onDetalleEstado,
}: {
  comanda: Comanda;
  now: number;
  onFinalizar: (idPedido: number) => void;
  onDetalleEstado: (idDetalle: number, estado: ComandaDetalle['estadoCocina']) => void;
}) {
  const min = minutesSince(comanda.fechaInicioPreparacion || comanda.fechaEnvioCocina, now);
  const urg = urgency(min, comanda.tiempoEstimadoMinutos);
  const style = URG_STYLE[urg];
  const detallesPreparables = comanda.detalles.filter((detalle) => detalle.requierePreparacion !== false && !detalle.esDespachoDirecto);
  const detallesActivos = detallesPreparables.filter((detalle) => detalle.estadoCocina !== 'CANCELADO');
  const detallesListos = detallesActivos.filter((detalle) => detalle.estadoCocina === 'LISTO').length;
  const progress = detallesActivos.length > 0 ? Math.round((detallesListos / detallesActivos.length) * 100) : 0;
  const ticketCountdown = comanda.estado === 'EN_COCINA'
    ? countdownTo(comanda.fechaInicioPreparacion, comanda.tiempoEstimadoMinutos, now)
    : null;
  const showLiveTime = comanda.estado !== 'LISTO';

  return (
    <Card className={cn('border-l-4 overflow-hidden shadow-sm border border-border rounded-2xl', style.ring)}>
      <CardHeader className="pb-3 border-b border-border bg-muted/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground">Pedido #{comanda.idPedido}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {comanda.numeroMesa ? `Mesa ${comanda.numeroMesa}` : 'Sin mesa'}
              {comanda.clienteNombre ? ` · ${comanda.clienteNombre}` : ''}
            </p>
          </div>
          <Badge variant={showLiveTime ? style.badge : 'success'} className="shadow-2xs font-semibold text-[10px] px-2 py-0.5 gap-1">
            {showLiveTime ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
            {showLiveTime ? `${min} min` : 'Listo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4 p-5">
        <div className="space-y-3">
          {detallesPreparables.map((detalle) => {
            const itemCountdown = countdownTo(detalle.fechaInicioPreparacion, detalle.tiempoEstimadoMinutos, now);

            return (
              <div key={detalle.idDetallePedido} className="rounded-xl border border-border p-3.5 bg-card">
                <div className="flex gap-3">
                  <span className="font-bold text-primary text-sm w-6">{detalle.cantidad}x</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm leading-snug">{detalle.itemNombre}</p>
                    {detalle.varianteNombre && <p className="text-xs text-muted-foreground mt-0.5">Variante: {detalle.varianteNombre}</p>}
                    {detalle.extras && detalle.extras.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">+ {detalle.extras.join(', ')}</p>
                    )}
                    {itemCountdown && detalle.estadoCocina === 'EN_PREPARACION' && (
                      <p className={cn('mt-1 text-[11px] font-semibold', itemCountdown.overdue ? 'ui-status-danger' : 'ui-status-info')}>
                        {itemCountdown.overdue ? 'Vencido hace' : 'Restan'} {itemCountdown.label}
                      </p>
                    )}
                    {detalle.observacion && (
                      <div className="mt-2 rounded-lg border border-[var(--status-warning)]/20 px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 ui-status-warning-soft">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        {detalle.observacion}
                      </div>
                    )}
                  </div>
                  <Badge variant={ESTADO_BADGE[detalle.estadoCocina]} className="h-5 text-[9px] font-semibold shadow-2xs">{detalle.estadoCocina}</Badge>
                </div>
                {detalle.estadoCocina !== 'LISTO' && detalle.estadoCocina !== 'CANCELADO' && (
                  <div className="mt-3.5 flex flex-wrap gap-2 pl-9 border-t border-border/40 pt-3">
                    {detalle.estadoCocina === 'PENDIENTE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDetalleEstado(detalle.idDetallePedido, 'EN_PREPARACION')}
                        className="h-8 rounded-lg text-xs font-semibold gap-1.5"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        Iniciar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => onDetalleEstado(detalle.idDetallePedido, 'LISTO')}
                      className="h-8 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Listo
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-lg text-xs font-semibold ui-status-danger hover:bg-[var(--status-danger-surface)] gap-1.5 ml-auto"
                      onClick={() => {
                        if (window.confirm('Este cambio solo cancela el item seleccionado. El pedido seguirá activo. ¿Continuar?')) {
                          onDetalleEstado(detalle.idDetallePedido, 'CANCELADO');
                        }
                      }}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Progreso de platos</span>
            <span>{detallesListos}/{detallesActivos.length} listos</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-[var(--status-success)] transition-all rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {comanda.tiempoEstimadoMinutos != null && (
          <p className="text-xs text-muted-foreground font-semibold">Tiempo estimado: {comanda.tiempoEstimadoMinutos} min</p>
        )}
        {ticketCountdown && (
          <div className={cn(
            'rounded-xl border px-3 py-2 text-xs font-bold leading-none',
            ticketCountdown.overdue ? 'border-[var(--status-danger)]/20 ui-status-danger-soft' : 'border-[var(--status-info)]/20 ui-status-info-soft'
          )}>
            {ticketCountdown.overdue ? 'Comanda demorada por' : 'Tiempo de entrega restante:'} {ticketCountdown.label}
          </div>
        )}

        {comanda.estado === 'EN_COCINA' && (
          <Button className="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs gap-1.5" onClick={() => onFinalizar(comanda.idPedido)}>
            <CheckCircle2 className="w-4 h-4" />
            {progress === 100 ? 'Marcar pedido listo' : 'Finalizar pedido'}
          </Button>
        )}
        {comanda.estado === 'LISTO' && (
          <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground flex items-center gap-2 font-semibold">
            <Package className="w-4 h-4 ui-status-success" />
            Comanda lista para entrega en salón
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Column({
  title,
  items,
  accent,
  now,
  onFinalizar,
  onDetalleEstado,
}: {
  title: string;
  items: Comanda[];
  accent: string;
  now: number;
  onFinalizar: (idPedido: number) => void;
  onDetalleEstado: (idDetalle: number, estado: ComandaDetalle['estadoCocina']) => void;
}) {
  return (
    <div className="space-y-3.5 bg-muted/15 p-3 rounded-2xl border border-border/40">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <span className="font-bold text-sm text-foreground">{title}</span>
        <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: accent }}>
          {items.length}
        </span>
      </div>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
        {items.map(c => (
          <Ticket
            key={c.idPedido}
            comanda={c}
            now={now}
            onFinalizar={onFinalizar}
            onDetalleEstado={onDetalleEstado}
          />
        ))}
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-xs text-muted-foreground bg-card/40">
            Sin comandas activas
          </div>
        )}
      </div>
    </div>
  );
}

export function Kitchen() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const comandasQuery = useQuery({
    queryKey: ['cocina', 'comandas'],
    queryFn: cocinaApi.getComandas,
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
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

  const detalleEstadoMutation = useMutation({
    mutationFn: ({ idDetalle, estado }: { idDetalle: number; estado: ComandaDetalle['estadoCocina'] }) =>
      cocinaApi.updateDetalleEstado(idDetalle, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cocina', 'comandas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      toast.success('Item de cocina actualizado');
    },
  });

  const comandas = comandasQuery.data || [];
  const enPreparacion = comandas.filter(c => c.estado === 'EN_COCINA');
  const listos = comandas.filter(c => c.estado === 'LISTO');
  const now = currentTime;
  const avgTime = enPreparacion.length
    ? Math.round(enPreparacion.reduce((sum, c) => sum + minutesSince(c.fechaInicioPreparacion || c.fechaEnvioCocina, now), 0) / enPreparacion.length)
    : 0;

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Operaciones' },
          { label: 'Cocina' },
        ]}
        icon={ChefHat}
        iconColor="blue"
        title="Cocina"
        subtitle="Monitor en tiempo real de comandas de platos y bebidas sin precios ni transacciones comerciales."
        action={
          <Button variant="outline" onClick={() => comandasQuery.refetch()} className="h-11 rounded-xl gap-2 font-semibold text-sm">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={ChefHat}
          label="Comandas Activas"
          value={comandas.length}
          color="slate"
        />
        <KpiCard
          icon={ChefHat}
          label="Preparando"
          value={enPreparacion.length}
          color="blue"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Listos"
          value={listos.length}
          color="green"
        />
        <KpiCard
          icon={Clock}
          label="Tiempo Promedio"
          value={`${avgTime} min`}
          color="amber"
        />
      </div>

      {comandasQuery.isLoading ? (
        <div className="h-40 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Cargando comandas de cocina...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Column title="En preparación" items={enPreparacion} accent="var(--status-info)" now={now} onFinalizar={finalizarMutation.mutate} onDetalleEstado={(idDetalle, estado) => detalleEstadoMutation.mutate({ idDetalle, estado })} />
          <Column title="Listos para despacho" items={listos} accent="var(--status-success)" now={now} onFinalizar={finalizarMutation.mutate} onDetalleEstado={(idDetalle, estado) => detalleEstadoMutation.mutate({ idDetalle, estado })} />
        </div>
      )}
    </PageWrapper>
  );
}
