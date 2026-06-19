import { useERP } from '../contexts/ERPContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Wallet, 
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';

import { useReportes } from '../../hooks/useReportes';
import { useAuthStore } from '../../store/authStore';
import { PERMISSIONS } from '../../config/permissions';

export function Dashboard() {
  const { orders, cashRegister } = useERP();
  const { hasPermission } = useAuthStore();
  const { 
    ventasDiarias, 
    productosPopulares, 
    resumenFinanciero, 
    alertaStock, 
    stockInsuficiente,
    isLoading,
    isError 
  } = useReportes();

  const canViewVentas = hasPermission(PERMISSIONS.VER_VENTAS) || hasPermission(PERMISSIONS.VER_REPORTES);
  const canViewInventario = hasPermission(PERMISSIONS.VER_INVENTARIO) || hasPermission(PERMISSIONS.VER_REPORTES);

  const activeOrders = orders.filter(o => 
    o.status === 'pendiente' || o.status === 'en-cocina'
  ).length;

  const todaySales = resumenFinanciero?.totalVentas || 0;
  // TODO: Implement month sales from backend or calculate
  const monthSales = todaySales * 30; // mock logic for now

  // Process data for charts
  const salesDataChart = ventasDiarias.map(v => ({ day: v.fecha, ventas: v.total }));
  // Category sales mock because we don't have an endpoint for category sales yet
  const categorySales = [
    { name: 'Hamburguesas', value: 3500, color: '#ef4444' },
    { name: 'Pizzas', value: 2800, color: '#f97316' },
  ];
  const cashFlowData = [
    { hora: '09:00', ingresos: 450, egresos: 200 }
  ];

  if (isLoading) {
    return <div className="p-6">Cargando dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {canViewVentas && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ventas del Día</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S/ {todaySales.toFixed(2)}</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5% vs ayer</span>
              </div>
            </CardContent>
          </Card>
        )}

        {canViewVentas && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">S/ {monthSales.toFixed(2)}</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <TrendingUp className="w-4 h-4" />
                <span>+8.3% vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Activos</CardTitle>
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Clock className="w-4 h-4" />
              <span>En preparación</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Caja Activa</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {cashRegister?.currentBalance.toFixed(2) || '0.00'}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{cashRegister?.status === 'abierta' ? 'Abierta' : 'Cerrada'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Diarias */}
        {canViewVentas && (
          <Card>
            <CardHeader>
              <CardTitle>Ventas de la Semana</CardTitle>
              <CardDescription>Tendencia de ventas por día</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesDataChart}>
                  <CartesianGrid key="ac-grid" strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis key="ac-xaxis" dataKey="day" className="text-xs" />
                  <YAxis key="ac-yaxis" className="text-xs" />
                  <Tooltip
                    key="ac-tooltip"
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    key="ac-area"
                    type="monotone"
                    dataKey="ventas"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Ventas por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
            <CardDescription>Distribución de ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  key="pc-pie"
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  key="pc-tooltip"
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Flujo de Caja */}
        <Card>
          <CardHeader>
            <CardTitle>Flujo de Caja del Día</CardTitle>
            <CardDescription>Ingresos vs Egresos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={cashFlowData}>
                <CartesianGrid key="cc-grid" strokeDasharray="3 3" className="stroke-muted" />
                <XAxis key="cc-xaxis" dataKey="hora" className="text-xs" />
                <YAxis key="cc-yaxis" className="text-xs" />
                <Tooltip
                  key="cc-tooltip"
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend key="cc-legend" />
                <Bar key="cc-bar" dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Line key="cc-line" dataKey="egresos" name="Egresos" stroke="#ef4444" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Productos */}
        {canViewVentas && (
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
              <CardDescription>Top 5 del período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productosPopulares.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.producto}</span>
                        <Badge variant="default" className="bg-green-500">
                          <TrendingUp className="w-3 h-3 mr-1" />
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{product.cantidad} unidades</span>
                        <span>S/ {Number(product.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos Recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recientes</CardTitle>
            <CardDescription>Últimos pedidos del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium">{order.orderNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.length} items - S/ {order.total.toFixed(2)}
                    </div>
                  </div>
                  <Badge 
                    variant={
                      order.status === 'entregado' ? 'default' :
                      order.status === 'en-cocina' ? 'secondary' :
                      order.status === 'cancelado' ? 'destructive' :
                      'outline'
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock Crítico */}
        {canViewInventario && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Stock Crítico
              </CardTitle>
              <CardDescription>Productos por debajo del stock mínimo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertaStock.map((product, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{product.nombre}</span>
                      <span className="text-muted-foreground">
                        {product.stock} / {product.stockMinimo}
                      </span>
                    </div>
                    <Progress 
                      value={(product.stock / product.stockMinimo) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
