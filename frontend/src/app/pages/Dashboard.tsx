import { useERP } from '../contexts/ERPContextValue';
import { CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Wallet, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  LayoutDashboard
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Line,
  LineChart
} from 'recharts';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useReportes } from '../../hooks/useReportes';
import { useAuthStore } from '../../store/authStore';
import { PERMISSIONS } from '../../config/permissions';
import { PageWrapper, ModuleHeader, KpiCard, SectionCard } from '../components/ui/erp-layout';

export function Dashboard() {
  const { orders, cashRegister } = useERP();
  const { hasPermission } = useAuthStore();
  const { 
    ventasDiarias, 
    ventasPorHora,
    productosPopulares, 
    resumenFinanciero, 
    alertaStock, 
    isLoading
  } = useReportes();

  const canViewVentas =
    hasPermission(PERMISSIONS.ACCESO_TOTAL) ||
    hasPermission(PERMISSIONS.GESTION_VENTAS) ||
    hasPermission(PERMISSIONS.GESTION_REPORTES);
  const canViewInventario =
    hasPermission(PERMISSIONS.ACCESO_TOTAL) ||
    hasPermission(PERMISSIONS.GESTION_REPORTES);

  const activeOrders = orders.filter(o => 
    o.status !== 'entregado' && o.status !== 'cancelado'
  ).length;

  const totalSales = resumenFinanciero?.totalVentas || 0;
  const netProfit = resumenFinanciero?.gananciaNeta || 0;
  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'Atención';
      case 'en-cocina':
        return 'En cocina';
      case 'listo':
        return 'Listo';
      case 'entregado':
        return 'Entregado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getOrderStatusVariant = (status: string) => {
    switch (status) {
      case 'entregado':
        return 'success';
      case 'en-cocina':
        return 'info';
      case 'cancelado':
        return 'danger';
      default:
        return 'outline';
    }
  };

  // Process data for charts
  const salesDataChart = ventasDiarias.map(v => ({ day: v.fecha, ventas: v.total }));
  const hourlySalesChart = ventasPorHora.map(v => ({
    hora: v.etiqueta,
    ventas: Number(v.total || 0),
    cantidad: Number(v.cantidad || 0),
  }));
  const hasHourlySales = hourlySalesChart.some(v => v.ventas > 0 || v.cantidad > 0);

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Operaciones' },
          { label: 'Dashboard' },
        ]}
        icon={LayoutDashboard}
        iconColor="blue"
        title="Dashboard"
        subtitle="Panel de control operativo, ventas del día, preparación de comandas y stock crítico."
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canViewVentas && (
          <KpiCard
            icon={DollarSign}
            label="Ventas Pagadas"
            value={`S/ ${totalSales.toFixed(2)}`}
            aux="Total acumulado del backend"
            color="green"
          />
        )}

        {canViewVentas && (
          <KpiCard
            icon={TrendingUp}
            label="Ganancia Neta"
            value={`S/ ${netProfit.toFixed(2)}`}
            aux="Ventas menos costos registrados"
            color="blue"
          />
        )}

        <KpiCard
          icon={ShoppingBag}
          label="Pedidos Activos"
          value={activeOrders}
          aux="En preparación"
          color="amber"
        />

        <KpiCard
          icon={Wallet}
          label="Caja Activa"
          value={`S/ ${cashRegister?.currentBalance.toFixed(2) || '0.00'}`}
          aux={cashRegister?.status === 'abierta' ? 'Abierta' : 'Cerrada'}
          color="violet"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Diarias */}
        {canViewVentas && (
          <SectionCard
            title="Ventas de la Semana"
            description="Tendencia de ventas por día"
            icon={TrendingUp}
            iconColor="blue"
          >
            {salesDataChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesDataChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="day" className="text-xs text-muted-foreground font-medium" />
                  <YAxis className="text-xs text-muted-foreground font-medium" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-low)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="var(--status-info)"
                    fill="var(--status-info)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                Sin ventas registradas para graficar.
              </div>
            )}
          </SectionCard>
        )}

        {/* Ventas por Hora */}
        {canViewVentas && (
          <SectionCard
            title="Ventas por Hora"
            description="Tendencia operativa de ventas pagadas durante el día"
            icon={Clock}
            iconColor="green"
          >
            {hasHourlySales ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlySalesChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="hora"
                    className="text-xs text-muted-foreground font-medium"
                    interval={2}
                  />
                  <YAxis className="text-xs text-muted-foreground font-medium" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'ventas' ? `S/ ${Number(value).toFixed(2)}` : value,
                      name === 'ventas' ? 'Ventas' : 'Cantidad',
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-low)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="var(--status-success)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                Sin ventas pagadas registradas hoy.
              </div>
            )}
          </SectionCard>
        )}

        {/* Top Productos */}
        {canViewVentas && (
          <SectionCard
            title="Productos Más Vendidos"
            description="Top 5 del período actual"
            icon={ShoppingBag}
            iconColor="violet"
          >
            <div className="space-y-4">
              {productosPopulares.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Aún no hay datos de productos populares.
                </div>
              ) : (
                productosPopulares.map((product, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{product.producto}</span>
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                          Top {index + 1}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-medium">
                        <span>{product.cantidad} unidades</span>
                        <span className="ui-tabular">S/ {Number(product.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        )}

        {/* Pedidos Recientes */}
        <SectionCard
          title="Pedidos Recientes"
          description="Últimos pedidos procesados por el sistema"
          icon={ShoppingBag}
          iconColor="slate"
        >
          <div className="space-y-3.5">
            {orders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Aún no hay pedidos registrados para mostrar.
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3.5 border border-border rounded-xl bg-card/40">
                  <div>
                    <div className="font-bold text-foreground text-sm">{order.orderNumber}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                      {order.items.length} items · <span className="ui-tabular font-semibold">S/ {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={getOrderStatusVariant(order.status)}
                    className="shadow-2xs text-[10px] font-semibold"
                  >
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Stock Crítico */}
        {canViewInventario && (
          <SectionCard
            title="Stock Crítico"
            description="Productos e insumos por debajo del stock de seguridad"
            icon={AlertTriangle}
            iconColor="red"
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alertaStock.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                  No hay alertas de stock mínimo crítico.
                </div>
              ) : (
                alertaStock.map((product, index) => (
                  <div key={index} className="space-y-2 rounded-xl border border-border p-3.5 bg-card/40">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">{product.nombre}</span>
                      <span className="text-xs font-bold text-destructive">
                        {product.stock} / {product.stockMinimo} uds
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, (product.stock / product.stockMinimo) * 100)} 
                      className="h-2 bg-destructive/10"
                    />
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </PageWrapper>
  );
}
