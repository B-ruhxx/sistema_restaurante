import { useState } from 'react';
import { useERP, Order } from '../contexts/ERPContext';
import { Clock, ChefHat, CheckCircle2, AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { cn } from '../components/ui/utils';

function elapsed(date: Date) {
  return Math.round((Date.now() - date.getTime()) / 60000);
}

type Urg = 'ok' | 'warning' | 'urgent';

function urgency(min: number, priority?: string): Urg {
  if (priority === 'alta' || min > 30) return 'urgent';
  if (min > 20) return 'warning';
  return 'ok';
}

const URG_STYLE: Record<Urg, { ring: string; badge: string; text: string }> = {
  ok:      { ring: 'border-l-emerald-500', badge: 'bg-emerald-50 text-emerald-700',  text: 'text-emerald-600' },
  warning: { ring: 'border-l-orange-400',  badge: 'bg-orange-50 text-orange-700',   text: 'text-orange-500'  },
  urgent:  { ring: 'border-l-red-600',     badge: 'bg-red-50 text-red-700',         text: 'text-red-600'     },
};

export function Kitchen() {
  const { orders, updateOrderStatus } = useERP();
  const [tick, setTick] = useState(0); // force re-render for timer

  const pending  = orders.filter(o => o.status === 'pendiente');
  const cooking  = orders.filter(o => o.status === 'en-cocina');
  const ready    = orders.filter(o => o.status === 'listo');
  const active   = pending.length + cooking.length;

  const avgTime = cooking.length
    ? Math.round(cooking.reduce((s, o) => s + elapsed(o.createdAt), 0) / cooking.length)
    : 0;

  /* ── Order ticket ───────────────────────────────────────── */
  const Ticket = ({ order, col }: { order: Order; col: 'pendiente' | 'en-cocina' | 'listo' }) => {
    const min = elapsed(order.createdAt);
    const urg = urgency(min, order.priority);
    const s   = URG_STYLE[urg];

    return (
      <div className={cn(
        'bg-white rounded-2xl shadow-sm border border-orange-100 border-l-4 overflow-hidden flex flex-col transition-shadow hover:shadow-md',
        s.ring
      )}>
        {/* Ticket header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-orange-50">
          <div>
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">{order.orderNumber}</span>
            {order.priority === 'alta' && (
              <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                <AlertTriangle className="w-2.5 h-2.5" /> URGENTE
              </span>
            )}
          </div>
          <div className={cn('flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full', s.badge)}>
            <Clock className="w-3.5 h-3.5" />
            {min} min
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 px-4 py-3 space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex gap-2">
              <span className="text-red-600 font-extrabold text-sm w-6 shrink-0">{item.quantity}×</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</p>
                {item.variant && (
                  <p className="text-xs text-gray-400">• {item.variant}</p>
                )}
                {item.extras && item.extras.length > 0 && (
                  <p className="text-xs text-gray-400">• {item.extras.join(', ')}</p>
                )}
                {item.notes && (
                  <div className="mt-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                    <p className="text-xs font-medium text-amber-800">⚠ {item.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action */}
        <div className="px-4 pb-4 pt-2">
          {col === 'pendiente' && (
            <button
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              onClick={() => updateOrderStatus(order.id, 'en-cocina')}
            >
              <ChefHat className="w-4 h-4" />
              Iniciar Preparación
            </button>
          )}
          {col === 'en-cocina' && (
            <button
              className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              onClick={() => updateOrderStatus(order.id, 'listo')}
            >
              <CheckCircle2 className="w-4 h-4" />
              Marcar como Listo
            </button>
          )}
          {col === 'listo' && (
            <button
              className="w-full h-10 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2 hover:bg-gray-50"
              onClick={() => updateOrderStatus(order.id, 'entregado')}
            >
              <Package className="w-4 h-4" />
              Entregar Pedido
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ── Column wrapper ─────────────────────────────────────── */
  const Column = ({
    title, icon: Icon, accent, light, items, col,
  }: {
    title: string;
    icon: typeof Clock;
    accent: string;
    light: string;
    items: Order[];
    col: 'pendiente' | 'en-cocina' | 'listo';
  }) => (
    <div className="flex flex-col gap-3 min-h-[200px]">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-2xl"
        style={{ background: light }}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" style={{ color: accent }} />
          <span className="font-bold text-gray-800">{title}</span>
        </div>
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
          style={{ background: accent }}
        >
          {items.length}
        </span>
      </div>

      {/* Tickets */}
      <div className="space-y-3 overflow-y-auto flex-1">
        {items.map(o => <Ticket key={o.id} order={o} col={col} />)}
        {items.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-orange-100 p-8 text-center text-sm text-gray-400">
            Sin pedidos
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-orange-100 px-4 md:px-6 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Monitor de Cocina</h1>
              <p className="text-xs text-gray-500">
                {active > 0 ? `${active} pedidos activos` : 'Sin pedidos activos'}
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-400">En preparación</p>
              <p className="text-xl font-extrabold text-orange-600">{cooking.length}</p>
            </div>
            <div className="bg-blue-50 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-400">Tiempo prom.</p>
              <p className="text-xl font-extrabold text-blue-600">{avgTime} min</p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-400">Listos</p>
              <p className="text-xl font-extrabold text-emerald-600">{ready.length}</p>
            </div>
            <button
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
              onClick={() => setTick(t => t + 1)}
              title="Actualizar tiempos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Kanban board ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          <Column
            title="Pendiente"
            icon={Clock}
            accent="#f59e0b"
            light="#fffbeb"
            items={pending}
            col="pendiente"
          />
          <Column
            title="En Preparación"
            icon={ChefHat}
            accent="#3b82f6"
            light="#eff6ff"
            items={cooking}
            col="en-cocina"
          />
          <Column
            title="Listo para Entregar"
            icon={CheckCircle2}
            accent="#10b981"
            light="#ecfdf5"
            items={ready}
            col="listo"
          />
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────── */}
      <div className="bg-white border-t border-orange-100 px-6 py-3 shrink-0">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Normal (&lt; 20 min)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
            Atención (20–30 min)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
            Urgente (&gt; 30 min)
          </span>
        </div>
      </div>
    </div>
  );
}
