import { useState } from 'react';
import { Search, Filter, ArrowUpCircle, ArrowDownCircle, RefreshCw, Utensils, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { cn } from '../components/ui/utils';

import { useMovimientos } from '../../hooks/useMovimientos';
import { useInsumos } from '../../hooks/useInsumos';

type MoveType = 'entrada' | 'salida' | 'ajuste' | 'consumo';

const typeConfig: Record<MoveType, { label: string; icon: typeof ArrowUpCircle; color: string; badge: string }> = {
  entrada: { label: 'Entrada', icon: ArrowUpCircle, color: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  salida: { label: 'Salida', icon: ArrowDownCircle, color: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  ajuste: { label: 'Ajuste', icon: RefreshCw, color: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  consumo: { label: 'Consumo', icon: Utensils, color: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
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
    return <div className="p-6">Cargando movimientos de inventario...</div>;
  }

  // Get unique supplies from backend movements
  const supplies = [...new Set(movimientos.map(m => m.nombreInsumo || m.nombreProducto || ''))].filter(Boolean);

  // Map backend movements to frontend Movement interface
  const mappedMovements = movimientos.map(m => {
    const matchedInsumo = insumos.find(i => i.idInsumo === m.idInsumo);
    const datePart = m.fecha.split('T')[0];
    const timePart = m.fecha.split('T')[1]?.substring(0, 5) || '';
    
    return {
      id: String(m.idMovimiento),
      date: datePart,
      time: timePart,
      supply: m.tipoRecurso === 'INSUMO' ? (m.nombreInsumo || '') : (m.nombreProducto || ''),
      type: m.tipoMovimiento.toLowerCase() as MoveType,
      quantity: m.cantidad,
      unit: m.tipoRecurso === 'INSUMO' ? (matchedInsumo?.unidad || 'uds') : 'uds',
      prevStock: 0, // Mocked since DB doesn't store snapshots directly in this DTO
      newStock: m.cantidad,
      cost: m.cantidad * (matchedInsumo?.costoPromedio || 0), // Calculate cost based on current cost
      reference: m.origen + (m.referenciaId ? `-${m.referenciaId}` : ''),
      user: m.nombreEmpleado || 'Sistema',
    };
  });

  const filtered = mappedMovements.filter(m => {
    const matchSearch = m.supply.toLowerCase().includes(search.toLowerCase()) || m.reference.toLowerCase().includes(search.toLowerCase());
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kardex</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registro de movimientos de inventario</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" /> Exportar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Movimientos', value: filtered.length, color: 'text-foreground' },
          { label: 'Entradas', value: `S/ ${totalEntradas.toFixed(2)}`, color: 'text-green-600' },
          { label: 'Salidas', value: `S/ ${totalSalidas.toFixed(2)}`, color: 'text-red-600' },
          { label: 'Consumos', value: `S/ ${totalConsumos.toFixed(2)}`, color: 'text-orange-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="salida">Salida</SelectItem>
            <SelectItem value="ajuste">Ajuste</SelectItem>
            <SelectItem value="consumo">Consumo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSupply} onValueChange={setFilterSupply}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Insumo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los insumos</SelectItem>
            {supplies.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" className="w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <Input type="date" className="w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {dates.map(date => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm font-medium text-muted-foreground px-3 py-1 rounded-full border border-border bg-background">
                {new Date(date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              {grouped[date].map(m => {
                const cfg = typeConfig[m.type];
                const Icon = cfg.icon;
                return (
                  <div key={m.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
                    {/* Timeline dot */}
                    <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      m.type === 'entrada' ? 'bg-green-100' :
                      m.type === 'salida' ? 'bg-red-100' :
                      m.type === 'ajuste' ? 'bg-blue-100' : 'bg-orange-100'
                    }`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{m.supply}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-xs text-muted-foreground">{m.reference}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span>{m.time}</span>
                        <span>Cantidad: <strong className="text-foreground">{m.type === 'ajuste' && m.quantity > 0 ? '+' : ''}{m.quantity} {m.unit}</strong></span>
                        <span>Stock: {m.prevStock} → <strong className="text-foreground">{m.newStock}</strong></span>
                        <span>Por: {m.user}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold ${m.type === 'entrada' ? 'text-green-600' : m.type === 'salida' || m.type === 'consumo' ? 'text-red-600' : 'text-blue-600'}`}>
                        {m.type === 'entrada' ? '+' : '-'}S/ {m.cost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
