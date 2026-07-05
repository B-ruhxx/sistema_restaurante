import { useState } from 'react';
import { Search, ArrowUpCircle, ArrowDownCircle, RefreshCw, Utensils, Download, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';

import { useMovimientos } from '../../hooks/useMovimientos';
import { useInsumos } from '../../hooks/useInsumos';
import { PageWrapper, ModuleHeader, KpiCard, FilterToolbar, EmptyState } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

type MoveType = 'entrada' | 'salida' | 'ajuste' | 'consumo';

const typeConfig: Record<MoveType, { label: string; icon: typeof ArrowUpCircle; color: string; badgeVariant: 'success' | 'danger' | 'info' | 'warning' }> = {
  entrada: { label: 'Entrada', icon: ArrowUpCircle, color: 'ui-status-success', badgeVariant: 'success' },
  salida: { label: 'Salida', icon: ArrowDownCircle, color: 'ui-status-danger', badgeVariant: 'danger' },
  ajuste: { label: 'Ajuste', icon: RefreshCw, color: 'ui-status-info', badgeVariant: 'info' },
  consumo: { label: 'Consumo', icon: Utensils, color: 'ui-status-warning', badgeVariant: 'warning' },
};

export function Kardex() {
  const { movimientos, isLoading: isLoadingMovs } = useMovimientos();
  const { insumos, isLoading: isLoadingInsumos } = useInsumos();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSupply, setFilterSupply] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  if (isLoadingMovs || isLoadingInsumos) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando movimientos de inventario...</p>
      </div>
    );
  }

  // Get unique supplies from backend movements
  const supplies = [...new Set(movimientos.map(m => m.nombreInsumo || m.nombreProducto || ''))].filter(Boolean);

  // Map backend movements to UI rows
  const mappedMovements = movimientos.map(m => {
    const matchedInsumo = insumos.find(i => i.idInsumo === m.idInsumo);
    const datePart = m.fecha.split('T')[0];
    const timePart = m.fecha.split('T')[1]?.substring(0, 5) || '';
    const prevStock = Number(m.stockAnterior ?? 0);
    const newStock = Number(m.stockNuevo ?? m.stockAnterior ?? 0);
    const unitCost = Number(m.costoUnitario ?? 0);
    const saldoValorizado = Number(m.saldoValorizado ?? unitCost * Number(m.cantidad || 0));

    return {
      id: String(m.idMovimiento),
      date: datePart,
      time: timePart,
      supply: m.tipoRecurso === 'INSUMO' ? (m.nombreInsumo || '') : (m.nombreProducto || ''),
      type: m.tipoMovimiento.toLowerCase() as MoveType,
      quantity: m.cantidad,
      unit: m.tipoRecurso === 'INSUMO' ? (matchedInsumo?.unidad || 'uds') : 'uds',
      prevStock,
      newStock,
      cost: saldoValorizado,
      unitCost,
      reference: `${m.referenceType}${m.referenceId ? ` #${m.referenceId}` : ''}`,
      lot: m.idLoteInsumo ? `Lote #${m.idLoteInsumo}` : '',
      expiresAt: m.fechaVencimientoLote || '',
      user: m.nombreEmpleado || 'Sistema',
    };
  });

  const filtered = mappedMovements.filter(m => {
    const matchSearch = m.supply.toLowerCase().includes(search.toLowerCase())
      || m.reference.toLowerCase().includes(search.toLowerCase())
      || m.lot.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || m.type === filterType;
    const matchSupply = filterSupply === 'all' || m.supply === filterSupply;
    const matchFrom = !dateFrom || m.date >= dateFrom;
    const matchTo = !dateTo || m.date <= dateTo;
    return matchSearch && matchType && matchSupply && matchFrom && matchTo;
  });

  const grouped = filtered.reduce<Record<string, typeof mappedMovements[0][]>>((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const totalEntradas = filtered.filter(m => m.type === 'entrada').reduce((s, m) => s + m.cost, 0);
  const totalSalidas = filtered.filter(m => m.type === 'salida').reduce((s, m) => s + m.cost, 0);
  const totalConsumos = filtered.filter(m => m.type === 'consumo').reduce((s, m) => s + m.cost, 0);

  const handleExport = () => {
    const headers = ['Fecha', 'Hora', 'Recurso', 'Tipo', 'Cantidad', 'Unidad', 'Lote', 'Vencimiento', 'Stock anterior', 'Stock nuevo', 'Costo', 'Referencia', 'Usuario'];
    const rows = filtered.map(m => [
      m.date,
      m.time,
      m.supply,
      typeConfig[m.type].label,
      String(m.quantity),
      m.unit,
      m.lot,
      m.expiresAt,
      String(m.prevStock),
      String(m.newStock),
      m.cost.toFixed(2),
      m.reference,
      m.user,
    ]);
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kardex-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Inventario' },
          { label: 'Kardex' },
        ]}
        icon={BookOpen}
        iconColor="blue"
        title="Kardex de Inventario"
        subtitle="Registro cronológico de entradas, salidas, ajustes y consumos del almacén."
        action={
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0} className="h-11 rounded-xl gap-2 font-semibold">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={BookOpen} label="Movimientos" value={filtered.length} color="slate" />
        <KpiCard icon={ArrowUpCircle} label="Entradas" value={`S/ ${totalEntradas.toFixed(2)}`} color="green" />
        <KpiCard icon={ArrowDownCircle} label="Salidas" value={`S/ ${totalSalidas.toFixed(2)}`} color="red" />
        <KpiCard icon={Utensils} label="Consumos" value={`S/ ${totalConsumos.toFixed(2)}`} color="amber" />
      </div>

      {/* Filters */}
      <FilterToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar insumo, referencia o lote...',
        }}
        filters={
          <>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36 h-11 rounded-xl"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">Todos los tipos</SelectItem>
                <SelectItem value="entrada" className="rounded-lg">Entrada</SelectItem>
                <SelectItem value="salida" className="rounded-lg">Salida</SelectItem>
                <SelectItem value="ajuste" className="rounded-lg">Ajuste</SelectItem>
                <SelectItem value="consumo" className="rounded-lg">Consumo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSupply} onValueChange={setFilterSupply}>
              <SelectTrigger className="w-48 h-11 rounded-xl"><SelectValue placeholder="Insumo" /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">Todos los insumos</SelectItem>
                {supplies.map(s => <SelectItem key={s} value={s} className="rounded-lg">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" className="w-36 h-11 rounded-xl bg-background" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <Input type="date" className="w-36 h-11 rounded-xl bg-background" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </>
        }
      />

      {/* Timeline */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Sin movimientos encontrados"
          description="Ajusta los filtros para visualizar el historial de movimientos del almacén."
        />
      ) : (
        <div className="space-y-6">
          {dates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold text-muted-foreground px-3 py-1.5 rounded-full border border-border bg-background">
                  {new Date(date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-2.5">
                {grouped[date].map(m => {
                  const cfg = typeConfig[m.type] ?? typeConfig['ajuste'];
                  const Icon = cfg.icon;
                  return (
                    <div key={m.id} className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
                      <div className={cn(
                        'mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
                        m.type === 'entrada' ? 'ui-status-success-soft' :
                        m.type === 'salida' ? 'ui-status-danger-soft' :
                        m.type === 'ajuste' ? 'ui-status-info-soft' : 'ui-status-warning-soft'
                      )}>
                        <Icon className={cn('w-4 h-4', cfg.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{m.supply}</span>
                          <Badge variant={cfg.badgeVariant} className="text-[9px] font-bold px-2 h-5">{cfg.label}</Badge>
                          <span className="text-xs text-muted-foreground font-semibold">{m.reference}</span>
                          {m.lot && <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-lg border border-border/40">{m.lot}</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap font-medium">
                          <span className="font-bold text-foreground/80">{m.time}</span>
                          <span>Cant: <strong className="text-foreground">{m.type === 'ajuste' && m.quantity > 0 ? '+' : ''}{m.quantity} {m.unit}</strong></span>
                          <span>Costo unit: <strong className="text-foreground">S/ {m.unitCost.toFixed(4)}</strong></span>
                          {m.expiresAt && (
                            <span>Vence: <strong className="text-foreground">{new Date(m.expiresAt + 'T00:00:00').toLocaleDateString()}</strong></span>
                          )}
                          <span>Stock: {m.prevStock} → <strong className="text-foreground">{m.newStock}</strong></span>
                          <span>Por: <em className="not-italic font-semibold text-foreground/70">{m.user}</em></span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className={cn(
                          'text-sm font-bold ui-tabular',
                          m.type === 'entrada' ? 'ui-status-success' : m.type === 'salida' || m.type === 'consumo' ? 'ui-status-danger' : 'ui-status-info'
                        )}>
                          {m.type === 'salida' || m.type === 'consumo' ? '-' : ''}S/ {m.cost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
