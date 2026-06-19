import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, ChefHat, Package, LayoutGrid, List, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useERP, Order } from '../contexts/ERPContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const STATUS = {
  pendiente:  { label: 'Pendiente',  dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock },
  'en-cocina':{ label: 'En Cocina', dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200',      icon: ChefHat },
  listo:      { label: 'Listo',      dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  entregado:  { label: 'Entregado', dot: 'bg-gray-400',    badge: 'bg-gray-50 text-gray-600 border-gray-200',      icon: Package },
  cancelado:  { label: 'Cancelado', dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',         icon: XCircle },
} as const;

const COLUMNS: { status: Order['status']; label: string; accent: string; light: string; next?: Order['status'] }[] = [
  { status: 'pendiente',  label: 'Pendiente',      accent: '#f59e0b', light: '#fffbeb', next: 'en-cocina' },
  { status: 'en-cocina',  label: 'En Preparación', accent: '#3b82f6', light: '#eff6ff', next: 'listo'     },
  { status: 'listo',      label: 'Listo',           accent: '#10b981', light: '#ecfdf5', next: 'entregado' },
  { status: 'entregado',  label: 'Entregado',       accent: '#6b7280', light: '#f9fafb'                   },
];

function elapsed(date: Date) {
  return Math.round((Date.now() - date.getTime()) / 60000);
}

function urgency(min: number, priority?: string) {
  if (priority === 'alta' || min > 30) return 'urgent';
  if (min > 20) return 'warning';
  return 'ok';
}

export function Orders() {
  const { orders, updateOrderStatus } = useERP();
  const [selected, setSelected] = useState<Order | null>(null);
  const [view, setView]         = useState<'kanban' | 'table'>('kanban');

  const byStatus = (s: Order['status']) => orders.filter(o => o.status === s);

  const advance = (orderId: string, next: Order['status']) => {
    updateOrderStatus(orderId, next);
    if (selected?.id === orderId) setSelected({ ...selected, status: next });
  };

  /* ── Kanban card ─────────────────────────────────────────── */
  const KanbanCard = ({ order, col }: { order: Order; col: typeof COLUMNS[0] }) => {
    const min = elapsed(order.createdAt);
    const urg = urgency(min, order.priority);
    const borderColor = urg === 'urgent' ? '#ef4444' : urg === 'warning' ? '#f97316' : col.accent;

    return (
      <div
        className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
        style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
        onClick={() => setSelected(order)}
      >
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-gray-900 text-base">{order.orderNumber}</span>
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
              urg === 'urgent'  ? 'bg-red-50 text-red-600 border-red-200' :
              urg === 'warning' ? 'bg-orange-50 text-orange-600 border-orange-200' :
              'bg-green-50 text-green-600 border-green-200'
            }`}>
              <Clock className="w-3 h-3" />
              {min} min
            </span>
          </div>
          {order.priority === 'alta' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full mb-1">
              <AlertTriangle className="w-2.5 h-2.5" /> URGENTE
            </span>
          )}
          <p className="text-xs text-gray-400">
            {format(order.createdAt, "HH:mm", { locale: es })} · {order.items.length} items
          </p>
        </div>

        <div className="px-4 pb-2 space-y-1">
          {order.items.slice(0, 3).map(item => (
            <div key={item.id} className="flex gap-2 text-xs">
              <span className="font-bold text-red-600 w-5 shrink-0">{item.quantity}×</span>
              <span className="text-gray-700 truncate">{item.name}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-xs text-gray-400 pl-7">+{order.items.length - 3} más…</p>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-orange-50">
          <span className="font-bold text-gray-800 text-sm">S/ {order.total.toFixed(2)}</span>
          {col.next && (
            <button
              className="text-xs font-semibold px-3 py-1 rounded-full text-white transition-opacity hover:opacity-80"
              style={{ background: col.accent }}
              onClick={e => { e.stopPropagation(); advance(order.id, col.next!); }}
            >
              {col.next === 'en-cocina' ? '→ Cocinar' : col.next === 'listo' ? '✓ Listo' : '→ Entregar'}
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="p-4 md:p-6 space-y-4 min-h-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-sm text-gray-500">{orders.length} pedidos registrados</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-orange-100 rounded-lg p-1 self-start sm:self-auto">
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === 'kanban' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Kanban</span>
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === 'table' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Tabla</span>
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {COLUMNS.map(col => {
          const count = byStatus(col.status).length;
          const Ic = STATUS[col.status].icon;
          return (
            <div key={col.status} className="bg-white rounded-xl border border-orange-100 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: col.light }}>
                <Ic className="w-4 h-4" style={{ color: col.accent }} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{col.label}</p>
                <p className="text-xl font-bold text-gray-900">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Kanban ───────────────────────────────────────────── */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.status} className="flex flex-col gap-3">
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: col.light }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.accent }} />
                  <span className="font-semibold text-sm text-gray-800">{col.label}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: col.accent }}>
                  {byStatus(col.status).length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3 min-h-[120px]">
                {byStatus(col.status).map(order => (
                  <KanbanCard key={order.id} order={order} col={col} />
                ))}
                {byStatus(col.status).length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-orange-100 p-6 text-center text-sm text-gray-400">
                    Sin pedidos
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-orange-50/50 hover:bg-orange-50/50">
                  <TableHead className="font-semibold text-gray-700">Pedido</TableHead>
                  <TableHead className="font-semibold text-gray-700">Hora</TableHead>
                  <TableHead className="font-semibold text-gray-700">Items</TableHead>
                  <TableHead className="font-semibold text-gray-700">Total</TableHead>
                  <TableHead className="font-semibold text-gray-700">Estado</TableHead>
                  <TableHead className="font-semibold text-gray-700">Tiempo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => {
                  const cfg = STATUS[order.status];
                  const Ic  = cfg.icon;
                  const min = elapsed(order.createdAt);
                  return (
                    <TableRow
                      key={order.id}
                      className="hover:bg-orange-50/30 cursor-pointer transition-colors"
                      onClick={() => setSelected(order)}
                    >
                      <TableCell className="font-bold text-gray-900">{order.orderNumber}</TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {format(order.createdAt, 'HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell className="text-gray-700">{order.items.length}</TableCell>
                      <TableCell className="font-semibold text-red-600">S/ {order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                          <Ic className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${min > 30 ? 'text-red-600' : min > 20 ? 'text-orange-500' : 'text-gray-500'}`}>
                          {min} min
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selected?.orderNumber}</span>
              {selected && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS[selected.status].badge}`}>
                  {STATUS[selected.status].label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                {format(selected.createdAt, "dd 'de' MMMM, HH:mm", { locale: es })} · {elapsed(selected.createdAt)} min transcurridos
              </div>

              {/* Items */}
              <div className="space-y-2">
                {selected.items.map(item => (
                  <div key={item.id} className="flex justify-between items-start p-3 bg-orange-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{item.quantity}× {item.name}</p>
                      {item.variant && <p className="text-xs text-gray-500">Variante: {item.variant}</p>}
                      {item.extras && item.extras.length > 0 && (
                        <p className="text-xs text-gray-500">Extras: {item.extras.join(', ')}</p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded mt-1">⚠ {item.notes}</p>
                      )}
                    </div>
                    <span className="font-bold text-red-600 text-sm">S/ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-4 bg-red-600 text-white rounded-xl">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-extrabold">S/ {selected.total.toFixed(2)}</span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {selected.status === 'pendiente' && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => advance(selected.id, 'en-cocina')}>
                    <ChefHat className="w-4 h-4 mr-2" /> Enviar a Cocina
                  </Button>
                )}
                {selected.status === 'en-cocina' && (
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => advance(selected.id, 'listo')}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar Listo
                  </Button>
                )}
                {selected.status === 'listo' && (
                  <Button className="flex-1 bg-gray-700 hover:bg-gray-800 text-white" onClick={() => advance(selected.id, 'entregado')}>
                    <Package className="w-4 h-4 mr-2" /> Marcar Entregado
                  </Button>
                )}
                {['pendiente', 'en-cocina'].includes(selected.status) && (
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => advance(selected.id, 'cancelado')}>
                    <XCircle className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
