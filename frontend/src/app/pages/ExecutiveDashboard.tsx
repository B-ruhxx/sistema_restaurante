import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Percent,
  Target,
  Award,
} from 'lucide-react';

const utilidadMensual = [
  { mes: 'Ene', utilidad: 80000, margen: 64 },
  { mes: 'Feb', utilidad: 90000, margen: 63 },
  { mes: 'Mar', utilidad: 90000, margen: 65 },
  { mes: 'Abr', utilidad: 98000, margen: 63 },
  { mes: 'May', utilidad: 106000, margen: 63 },
  { mes: 'Jun', utilidad: 112000, margen: 62 },
];

const ventasVsCompras = [
  { mes: 'Ene', ventas: 125000, compras: 45000, margenBruto: 80000 },
  { mes: 'Feb', ventas: 142000, compras: 52000, margenBruto: 90000 },
  { mes: 'Mar', ventas: 138000, compras: 48000, margenBruto: 90000 },
  { mes: 'Abr', ventas: 156000, compras: 58000, margenBruto: 98000 },
  { mes: 'May', ventas: 168000, compras: 62000, margenBruto: 106000 },
  { mes: 'Jun', ventas: 180000, compras: 68000, margenBruto: 112000 },
];

const distribucionIngresos = [
  { categoria: 'Hamburguesas', value: 32, color: '#ef4444' },
  { categoria: 'Pizzas', value: 28, color: '#f97316' },
  { categoria: 'Pastas', value: 18, color: '#3b82f6' },
  { categoria: 'Ensaladas', value: 12, color: '#10b981' },
  { categoria: 'Bebidas', value: 10, color: '#8b5cf6' },
];

const productosRentables = [
  { producto: 'Hamburguesa Premium', ventas: 145, margen: 68, ingresos: 11250 },
  { producto: 'Pizza Margarita', ventas: 98, margen: 72, ingresos: 13300 },
  { producto: 'Lomo Saltado', ventas: 76, margen: 65, ingresos: 8880 },
  { producto: 'Pasta Carbonara', ventas: 68, margen: 70, ingresos: 8680 },
  { producto: 'Ensalada Caesar', ventas: 54, margen: 75, ingresos: 3850 },
];

const clientesFrecuentes = [
  { nombre: 'Carlos Rodríguez', gastado: 5680, visitas: 45, promedio: 126 },
  { nombre: 'Juan Pérez', gastado: 4890, visitas: 38, promedio: 129 },
  { nombre: 'María Fernández', gastado: 3250, visitas: 28, promedio: 116 },
  { nombre: 'Patricia Morales', gastado: 2890, visitas: 24, promedio: 120 },
  { nombre: 'Luis García', gastado: 280, visitas: 2, promedio: 140 },
];

const inventarioValorado = [
  { categoria: 'Carnes', cantidad: 180, valorizado: 12800 },
  { categoria: 'Lácteos', cantidad: 145, valorizado: 8500 },
  { categoria: 'Vegetales', cantidad: 220, valorizado: 4200 },
  { categoria: 'Abarrotes', cantidad: 320, valorizado: 6800 },
  { categoria: 'Bebidas', cantidad: 280, valorizado: 5600 },
];

const metricasOperativas = [
  { indicador: 'Satisfacción Cliente', actual: 92, meta: 90, color: '#10b981' },
  { indicador: 'Tiempo Prep. Promedio', actual: 12, meta: 15, color: '#10b981' },
  { indicador: 'Rotación Inventario', actual: 8, meta: 10, color: '#f59e0b' },
  { indicador: 'Productividad Staff', actual: 85, meta: 80, color: '#10b981' },
];

export function ExecutiveDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Dashboard Gerencial</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Métricas ejecutivas y KPIs estratégicos para la toma de decisiones
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Utilidad Mensual
            </CardDescription>
            <CardTitle className="text-3xl">S/ 112,000</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              +5.7% vs mes anterior
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">75% de la meta anual</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Margen Bruto
            </CardDescription>
            <CardTitle className="text-3xl">62.2%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              +2.5% vs mes anterior
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Objetivo: 60% · Superado por 2.2%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ventas Mensuales
            </CardDescription>
            <CardTitle className="text-3xl">S/ 180,000</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              +15% vs mes anterior
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              1,842 órdenes · Ticket prom: S/ 97.72
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Compras Mensuales
            </CardDescription>
            <CardTitle className="text-3xl">S/ 68,000</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-red-600">
              <TrendingUp className="w-4 h-4" />
              +9.7% vs mes anterior
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              238 órdenes de compra procesadas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Utilidad y Margen</CardTitle>
            <CardDescription>Tendencia mensual de rentabilidad</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={utilidadMensual}>
                <CartesianGrid key="e1-grid" strokeDasharray="3 3" />
                <XAxis key="e1-xaxis" dataKey="mes" />
                <YAxis key="e1-yaxis-left" yAxisId="left" />
                <YAxis key="e1-yaxis-right" yAxisId="right" orientation="right" />
                <Tooltip key="e1-tooltip" />
                <Legend key="e1-legend" />
                <Area
                  key="e1-area-utilidad"
                  yAxisId="left"
                  type="monotone"
                  dataKey="utilidad"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Utilidad (S/)"
                />
                <Line
                  key="e1-line-margen"
                  yAxisId="right"
                  type="monotone"
                  dataKey="margen"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Margen (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas vs Compras vs Margen Bruto</CardTitle>
            <CardDescription>Análisis comparativo mensual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasVsCompras}>
                <CartesianGrid key="e2-grid" strokeDasharray="3 3" />
                <XAxis key="e2-xaxis" dataKey="mes" />
                <YAxis key="e2-yaxis" />
                <Tooltip key="e2-tooltip" />
                <Legend key="e2-legend" />
                <Bar key="e2-bar-ventas" dataKey="ventas" fill="#3b82f6" name="Ventas" />
                <Bar key="e2-bar-compras" dataKey="compras" fill="#ef4444" name="Compras" />
                <Bar key="e2-bar-margen" dataKey="margenBruto" fill="#10b981" name="Margen Bruto" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Top 5 Productos Más Rentables
            </CardTitle>
            <CardDescription>Por margen de utilidad e ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productosRentables.map((prod, idx) => (
                <div key={prod.producto} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{prod.producto}</div>
                    <div className="text-sm text-muted-foreground">
                      {prod.ventas} ventas · Margen: {prod.margen}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">S/ {prod.ingresos.toLocaleString()}</div>
                    <Badge variant="secondary" className="mt-1">
                      {prod.margen}% margen
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de Ingresos por Categoría</CardTitle>
            <CardDescription>Participación en ventas totales</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  key="e3-pie"
                  data={distribucionIngresos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, value }) => `${categoria} ${value}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distribucionIngresos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip key="e3-tooltip" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Customer & Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Top 5 Clientes Frecuentes
            </CardTitle>
            <CardDescription>Mayor valor de vida del cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientesFrecuentes.map((cliente, idx) => (
                <div key={cliente.nombre} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center font-semibold text-purple-600">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{cliente.nombre}</div>
                    <div className="text-sm text-muted-foreground">
                      {cliente.visitas} visitas · Promedio: S/ {cliente.promedio}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">S/ {cliente.gastado.toLocaleString()}</div>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 mt-1">
                      VIP
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Stock Valorizado por Categoría
            </CardTitle>
            <CardDescription>Inversión total en inventario: S/ 37,900</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={inventarioValorado} layout="vertical">
                <CartesianGrid key="e4-grid" strokeDasharray="3 3" />
                <XAxis key="e4-xaxis" type="number" />
                <YAxis key="e4-yaxis" dataKey="categoria" type="category" width={80} />
                <Tooltip key="e4-tooltip" />
                <Bar key="e4-bar" dataKey="valorizado" fill="#8b5cf6" name="Valorizado (S/)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Operational Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Operativas Clave</CardTitle>
          <CardDescription>Indicadores de desempeño vs objetivos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricasOperativas.map(metric => {
              const porcentaje = (metric.actual / metric.meta) * 100;
              const cumpleMeta = metric.actual >= metric.meta;

              return (
                <div key={metric.indicador} className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">{metric.indicador}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{metric.actual}</span>
                      <span className="text-sm text-muted-foreground">
                        {metric.indicador.includes('Tiempo') ? 'min' : metric.indicador.includes('Rotación') ? 'días' : '%'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Meta: {metric.meta}</span>
                      <span className={cumpleMeta ? 'text-green-600' : 'text-red-600'}>
                        {cumpleMeta ? (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {((metric.actual - metric.meta) / metric.meta * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            {((metric.meta - metric.actual) / metric.meta * 100).toFixed(1)}%
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(porcentaje, 100)}%`,
                          backgroundColor: metric.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
