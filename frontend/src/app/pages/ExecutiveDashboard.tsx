import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Percent,
  Target,
  Award,
  Loader2,
} from 'lucide-react';
import { useReportes } from '../../hooks/useReportes';
import { PageWrapper, ModuleHeader, KpiCard, SectionCard } from '../components/ui/erp-layout';
import { cn } from '../components/ui/utils';

const COLORS = [
  'var(--status-info)',
  'var(--status-success)',
  'var(--status-warning)',
  'var(--action-primary)',
  'var(--text-secondary)',
  'var(--status-danger)',
  'var(--status-info)',
  'var(--status-success)',
];

export function ExecutiveDashboard() {
  const { 
    ventasDiarias, 
    comprasDiarias,
    utilidadDiaria,
    productosPopulares, 
    resumenFinanciero, 
    alertaStock, 
    isLoading 
  } = useReportes();

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando métricas ejecutivas...</p>
      </div>
    );
  }

  // Calculate financial KPIs
  const totalVentas = resumenFinanciero?.totalVentas || 0;
  const gananciaNeta = resumenFinanciero?.gananciaNeta || 0;
  const costoTotal = resumenFinanciero?.costoTotal || 0;
  const totalCompras = resumenFinanciero?.totalCompras || 0;
  const margenBruto = totalVentas > 0 ? (gananciaNeta / totalVentas) * 100 : 0;

  // Process data for charts
  const monthlyData = utilidadDiaria.map((item) => ({
    mes: item.fecha.slice(5),
    utilidad: Number(item.utilidad || 0),
    ventas: Number(item.ventas || 0),
    costo: Number(item.costo || 0),
    margen: Number(item.ventas || 0) > 0 ? (Number(item.utilidad || 0) / Number(item.ventas || 0)) * 100 : 0,
  })).reverse();

  const ventasPorFecha = ventasDiarias.reduce((acc, curr) => {
    acc[curr.fecha] = Number(curr.total);
    return acc;
  }, {} as Record<string, number>);
  const comprasPorFecha = comprasDiarias.reduce((acc, curr) => {
    acc[curr.fecha] = Number(curr.total);
    return acc;
  }, {} as Record<string, number>);
  const fechasFinancieras = Array.from(new Set([
    ...ventasDiarias.map(v => v.fecha),
    ...comprasDiarias.map(c => c.fecha),
    ...utilidadDiaria.map(u => u.fecha),
  ])).sort().slice(-15);
  const utilidadPorFecha = utilidadDiaria.reduce((acc, curr) => {
    acc[curr.fecha] = {
      ventas: Number(curr.ventas || 0),
      costo: Number(curr.costo || 0),
      utilidad: Number(curr.utilidad || 0),
    };
    return acc;
  }, {} as Record<string, { ventas: number; costo: number; utilidad: number }>);
  
  const salesVsPurchasesData = fechasFinancieras.map(fecha => {
    const ventas = utilidadPorFecha[fecha]?.ventas ?? ventasPorFecha[fecha] ?? 0;
    return {
      mes: fecha.slice(5),
      ventas,
      compras: comprasPorFecha[fecha] || 0,
      costoVentas: utilidadPorFecha[fecha]?.costo || 0,
      utilidad: utilidadPorFecha[fecha]?.utilidad || 0,
    };
  });

  // Categories distribution chart data
  const categorySalesMap = productosPopulares.reduce((acc, curr) => {
    const cat = curr.categoria || 'Sin categoria';
    acc[cat] = (acc[cat] || 0) + Number(curr.total);
    return acc;
  }, {} as Record<string, number>);

  const categoryDistribution = Object.entries(categorySalesMap).map(([name, total]) => ({
    categoria: name,
    value: totalVentas > 0 ? Math.round((total / totalVentas) * 100) : 0,
    monto: total
  })).filter(c => c.value > 0);

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Administración' },
          { label: 'Dashboard Gerencial' },
        ]}
        icon={TrendingUp}
        iconColor="blue"
        title="Dashboard Gerencial"
        subtitle="Métricas de rentabilidad y rendimiento acumulado de ventas, compras e insumos del restaurante."
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Utility KpiCard */}
        <div className="rounded-2xl border border-border p-5 bg-card shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ui-status-success-soft">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground leading-none ui-tabular">S/ {gananciaNeta.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-1">Utilidad Neta</p>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-border/40 space-y-2">
            <div className="flex items-center gap-1 text-xs font-bold ui-status-success">
              <TrendingUp className="w-4 h-4" />
              Acumulado histórico
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div className="bg-[var(--status-success)] h-full rounded-full" style={{ width: `${Math.min(margenBruto, 100)}%` }} />
            </div>
          </div>
        </div>

        <KpiCard icon={Percent} label="Margen de Utilidad" value={`${margenBruto.toFixed(1)}%`} color="green" aux={`Costo de mercadería: ${totalVentas > 0 ? ((costoTotal / totalVentas) * 100).toFixed(1) : 0}%`} />
        <KpiCard icon={DollarSign} label="Ingresos por Ventas" value={`S/ ${totalVentas.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="blue" aux={`IGV recaudado: S/ ${(resumenFinanciero?.igv || 0).toFixed(2)}`} />
        <KpiCard icon={ShoppingCart} label="Costo Recetas" value={`S/ ${costoTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="red" aux={`Compras registradas: S/ ${totalCompras.toFixed(2)}`} />
      </div>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title="Evolución de Utilidad y Rendimiento"
          description="Ganancia neta diaria en base a ventas emitidas y costo de recetas deducido."
          icon={TrendingUp}
          iconColor="green"
        >
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number, name: string) => [name.includes('%') ? `${v.toFixed(1)}%` : `S/ ${v.toFixed(2)}`, name]} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="utilidad"
                  stroke="var(--status-success)"
                  fill="url(#colorUtilidad)"
                  strokeWidth={2}
                  name="Utilidad (S/)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="margen"
                  stroke="var(--status-info)"
                  fill="url(#colorMargen)"
                  strokeWidth={2}
                  name="Margen (%)"
                />
                <defs>
                  <linearGradient id="colorUtilidad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--status-success)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--status-success)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMargen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--status-info)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--status-info)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-xs font-semibold text-muted-foreground">
              Sin ventas emitidas para graficar utilidad diaria.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Ventas vs Compras vs Utilidad"
          description="Comparativa diaria de facturación, inversión de insumos y ganancia neta."
          icon={ShoppingCart}
          iconColor="blue"
        >
          {salesVsPurchasesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesVsPurchasesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`S/ ${v.toFixed(2)}`, 'Monto']} />
                <Legend />
                <Bar dataKey="ventas" fill="var(--status-info)" radius={[4, 4, 0, 0]} name="Ventas brutas" />
                <Bar dataKey="compras" fill="var(--status-warning)" radius={[4, 4, 0, 0]} name="Compras" />
                <Bar dataKey="utilidad" fill="var(--status-success)" radius={[4, 4, 0, 0]} name="Ganancia neta" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-xs font-semibold text-muted-foreground">
              Sin transacciones comerciales registradas para comparar.
            </div>
          )}
        </SectionCard>
      </div>

      {/* Product Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title="Top Productos Vendidos"
          description="Productos estrella con mayor volumen y recaudación en ventas."
          icon={Award}
          iconColor="violet"
        >
          <div className="space-y-4">
            {productosPopulares.slice(0, 5).map((prod, idx) => (
              <div key={prod.producto} className="flex items-center gap-4 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shadow-3xs flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground text-sm truncate">{prod.producto}</div>
                  <div className="text-xs text-muted-foreground font-semibold mt-0.5">
                    {prod.cantidad} unidades vendidas
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-foreground text-sm ui-tabular">S/ {Number(prod.total).toLocaleString()}</div>
                  <Badge variant="secondary" className="mt-1 text-[9px] font-bold px-2.5 h-5 shadow-3xs">
                    Popular
                  </Badge>
                </div>
              </div>
            ))}
            {productosPopulares.length === 0 && (
              <p className="text-xs font-semibold text-muted-foreground text-center py-8">No hay productos vendidos registrados.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Participación por Categoría en Ventas"
          description="Distribución porcentual de facturación por línea de producto."
          icon={Target}
          iconColor="blue"
        >
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, value }) => `${categoria} (${value}%)`}
                  outerRadius={85}
                  fill="var(--status-info)"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, name: string, props: any) => [`${v}% (S/ ${props.payload.monto.toFixed(2)})`, 'Participación']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-xs font-semibold text-muted-foreground">
              Sin productos vendidos para calcular participación por categoría.
            </div>
          )}
        </SectionCard>
      </div>

      {/* Stock warning widget */}
      <SectionCard
        title="Alertas de Inventario Crítico"
        description="Insumos con niveles bajo mínimos urgentes de reabastecimiento."
        icon={Package}
        iconColor="red"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alertaStock.slice(0, 3).map((item) => (
            <div key={item.nombre} className="rounded-2xl border border-[var(--status-warning)]/20 ui-status-warning-soft p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--surface-panel)]/70 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-foreground truncate">{item.nombre}</p>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  Stock: {item.stock} (Min: {item.stockMinimo})
                </p>
              </div>
            </div>
          ))}
          {alertaStock.length === 0 && (
            <div className="col-span-3 text-center py-6 text-xs font-bold ui-status-success-soft border border-[var(--status-success)]/20 rounded-xl">
              ✓ Todo el stock de insumos se encuentra en niveles de seguridad óptimos.
            </div>
          )}
        </div>
      </SectionCard>
    </PageWrapper>
  );
}
