import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6'];

export function ExecutiveDashboard() {
  const { 
    ventasDiarias, 
    productosPopulares, 
    resumenFinanciero, 
    alertaStock, 
    isLoading 
  } = useReportes();

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando métricas ejecutivas...</p>
      </div>
    );
  }

  // Calculate financial KPIs
  const totalVentas = resumenFinanciero?.totalVentas || 0;
  const gananciaNeta = resumenFinanciero?.gananciaNeta || 0;
  const costoTotal = resumenFinanciero?.costoTotal || 0;
  const margenBruto = totalVentas > 0 ? (gananciaNeta / totalVentas) * 100 : 0;

  // Process data for charts
  const monthlyData = ventasDiarias.map(v => ({
    mes: v.fecha.slice(5), // YYYY-MM-DD -> MM-DD
    utilidad: v.total * (margenBruto / 100),
    margen: margenBruto,
  })).reverse();

  const salesVsPurchasesData = ventasDiarias.map(v => ({
    mes: v.fecha.slice(5),
    ventas: v.total,
    // Since compras isn't tracked in daily sales, show cost total ratio as mock purchases comparison
    compras: v.total * (costoTotal / (totalVentas || 1)),
    margenBruto: v.total * (margenBruto / 100),
  })).reverse();

  // Categories distribution chart data
  const categorySalesMap = productosPopulares.reduce((acc, curr) => {
    // Just mock categories since popular products doesn't include category directly
    const cat = curr.producto.toLowerCase().includes('pizza') ? 'Pizzas' 
              : curr.producto.toLowerCase().includes('hamburguesa') ? 'Hamburguesas'
              : curr.producto.toLowerCase().includes('combo') ? 'Combos'
              : curr.producto.toLowerCase().includes('gaseosa') || curr.producto.toLowerCase().includes('bebida') ? 'Bebidas'
              : 'Otros';
    acc[cat] = (acc[cat] || 0) + Number(curr.total);
    return acc;
  }, {} as Record<string, number>);

  const categoryDistribution = Object.entries(categorySalesMap).map(([name, total]) => ({
    categoria: name,
    value: totalVentas > 0 ? Math.round((total / totalVentas) * 100) : 0,
    monto: total
  })).filter(c => c.value > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Dashboard Gerencial</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Métricas ejecutivas calculadas desde transacciones reales, con costos distribuidos como estimación cuando no hay desglose diario.
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Utilidad (Ganancia Neta)
            </CardDescription>
            <CardTitle className="text-3xl">S/ {gananciaNeta.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              Acumulado histórico
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(margenBruto, 100)}%` }} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">Margen de rendimiento general</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Margen de Utilidad
            </CardDescription>
            <CardTitle className="text-3xl">{margenBruto.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              Retorno sobre ventas
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Costo de mercadería: {totalVentas > 0 ? ((costoTotal / totalVentas) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ingresos por Ventas
            </CardDescription>
            <CardTitle className="text-3xl">S/ {totalVentas.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              Ventas brutas pagadas
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              IGV recaudado: S/ {(resumenFinanciero?.igv || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Costo Total (Insumos)
            </CardDescription>
            <CardTitle className="text-3xl">S/ {costoTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-red-600">
              Costo de recetas consumidas
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Calculado según recetas asociadas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Utilidad y Rendimiento</CardTitle>
            <CardDescription>Ganancia neta estimada por período de ventas</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="utilidad"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="Utilidad (S/)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="margen"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    name="Margen (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                Sin ventas registradas para graficar utilidad.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas vs Costo vs Utilidad</CardTitle>
            <CardDescription>Análisis de ventas, costo estimado y ganancia</CardDescription>
          </CardHeader>
          <CardContent>
            {salesVsPurchasesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesVsPurchasesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ventas" fill="#3b82f6" name="Ventas brutas" />
                  <Bar dataKey="compras" fill="#ef4444" name="Costo insumos estimado" />
                  <Bar dataKey="margenBruto" fill="#10b981" name="Ganancia neta" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                Sin ventas registradas para comparar ventas y costos.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Top Productos Vendidos
            </CardTitle>
            <CardDescription>Ranking de recaudación en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productosPopulares.slice(0, 5).map((prod, idx) => (
                <div key={prod.producto} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{prod.producto}</div>
                    <div className="text-sm text-muted-foreground">
                      {prod.cantidad} unidades vendidas
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold">S/ {Number(prod.total).toLocaleString()}</div>
                    <Badge variant="secondary" className="mt-1">
                      Populares
                    </Badge>
                  </div>
                </div>
              ))}
              {productosPopulares.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No hay productos vendidos registrados.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participación por Categoría en Ventas</CardTitle>
            <CardDescription>Estimación basada en nombres de productos populares</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ categoria, value }) => `${categoria} ${value}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                Sin productos vendidos para calcular participación.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock warning widget */}
      <Card>
        <CardHeader>
          <CardTitle>Insumos Críticos Detectados</CardTitle>
          <CardDescription>Alertas de reabastecimiento urgente de inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alertaStock.slice(0, 3).map((item) => (
              <Card key={item.nombre} className="border-orange-200 dark:border-orange-950 bg-orange-50/20 dark:bg-orange-950/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Stock: {item.stock} (Min: {item.stockMinimo})
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {alertaStock.length === 0 && (
              <div className="col-span-3 text-center py-6 text-sm text-green-600 dark:text-green-400 font-semibold bg-green-50/20 dark:bg-green-950/10 border border-green-200 dark:border-green-950 rounded-lg">
                ✓ Todo el stock de insumos está en niveles óptimos.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
