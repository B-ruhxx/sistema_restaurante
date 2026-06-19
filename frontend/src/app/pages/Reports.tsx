import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  FileText,
  Download,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useReportes } from '../../hooks/useReportes';
import { useClientes } from '../../hooks/useClientes';
import { useVentas } from '../../hooks/useVentas';
import { useCaja } from '../../hooks/useCaja';
import { useProductos } from '../../hooks/useProductos';
import { useInsumos } from '../../hooks/useInsumos';
import { usePedidos } from '../../hooks/usePedidos';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export function Reports() {
  const [periodo, setPeriodo] = useState('mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [categoria, setCategoria] = useState('all');
  const [empleado, setEmpleado] = useState('all');
  const [activeTab, setActiveTab] = useState('ventas');

  // Load backend hooks
  const { alertaStock, stockInsuficiente, resumenFinanciero, isLoading: isLoadingReportes } = useReportes();
  const { clientes, isLoading: isLoadingClientes } = useClientes();
  const { ventas, isLoading: isLoadingVentas } = useVentas();
  const { historial: historialCajas, isLoadingHistorial } = useCaja();
  const { productos: products, isLoading: isLoadingProductos } = useProductos();
  const { insumos, isLoading: isLoadingInsumos } = useInsumos();
  const { pedidos, isLoading: isLoadingPedidos } = usePedidos();

  // Loading state handler
  const isGlobalLoading =
    isLoadingReportes ||
    isLoadingClientes ||
    isLoadingVentas ||
    isLoadingHistorial ||
    isLoadingProductos ||
    isLoadingInsumos ||
    isLoadingPedidos;

  // Filter helper for date periods
  const isWithinPeriod = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();

    // Set to start of today for comparison
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (periodo === 'hoy') {
      return date >= startOfDay;
    } else if (periodo === 'semana') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    } else if (periodo === 'mes') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date >= monthAgo;
    } else if (periodo === 'trimestre') {
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return date >= quarterAgo;
    } else if (periodo === 'anio') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return date >= yearAgo;
    } else if (periodo === 'personalizado') {
      const start = fechaInicio ? new Date(fechaInicio + 'T00:00:00') : null;
      const end = fechaFin ? new Date(fechaFin + 'T23:59:59') : null;
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    }
    return true;
  };

  // Extract unique categories & cashiers dynamically
  const uniqueCategories = Array.from(
    new Set((products || []).map(p => p.nombreCategoria).filter((c): c is string => !!c))
  );

  const uniqueCashiers = Array.from(
    new Set((ventas || []).map(v => v.cajeroNombre).filter((c): c is string => !!c))
  );

  // Apply filters to sales
  const filteredVentas = (ventas || []).filter(v => {
    if (v.estado !== 'PAGADA') return false;
    if (!isWithinPeriod(v.fecha)) return false;
    if (empleado !== 'all' && v.cajeroNombre !== empleado) return false;
    return true;
  });

  // Calculate dynamic sales evolution (daily group)
  const salesByDate: Record<string, { total: number; count: number }> = {};
  filteredVentas.forEach(v => {
    const dateStr = v.fecha.split('T')[0];
    if (!salesByDate[dateStr]) {
      salesByDate[dateStr] = { total: 0, count: 0 };
    }
    salesByDate[dateStr].total += v.total;
    salesByDate[dateStr].count += 1;
  });

  const sortedDates = Object.keys(salesByDate).sort();
  const dynamicVentasData = sortedDates.map(dateStr => {
    const dateLabel = new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
    const total = salesByDate[dateStr].total;
    const cost = total * 0.35; // cost approximation (35%)
    return {
      mes: dateLabel,
      ventas: total,
      compras: cost,
      utilidad: total - cost,
      rawDate: dateStr
    };
  });

  // Calculate product popularity
  const productQtyMap: Record<string, { name: string; qty: number; total: number }> = {};
  filteredVentas.forEach(v => {
    (v.detalles || []).forEach(d => {
      const name = d.nombreProducto || d.nombreCombo || 'Desconocido';

      // Category filter check
      if (categoria !== 'all') {
        const product = (products || []).find(p => p.idProducto === d.idProducto);
        if (product?.nombreCategoria !== categoria) return;
      }

      if (!productQtyMap[name]) {
        productQtyMap[name] = { name, qty: 0, total: 0 };
      }
      productQtyMap[name].qty += d.cantidad;
      productQtyMap[name].total += d.subtotal;
    });
  });

  const dynamicProductosData = Object.values(productQtyMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
    .map(p => ({
      categoria: p.name,
      cantidad: p.qty,
      ingresos: p.total
    }));

  // Calculate payment methods distribution
  const paymentMethodsMap: Record<string, number> = {};
  let totalPaymentsValue = 0;
  filteredVentas.forEach(v => {
    (v.pagos || []).forEach(p => {
      const name = p.metodoPagoNombre || 'Efectivo';
      paymentMethodsMap[name] = (paymentMethodsMap[name] || 0) + p.monto;
      totalPaymentsValue += p.monto;
    });
  });

  const paymentMethodsColors: Record<string, string> = {
    Efectivo: '#10b981',
    Tarjeta: '#3b82f6',
    Yape: '#8b5cf6',
    Plin: '#f59e0b',
  };

  const dynamicMetodoPagoData = Object.entries(paymentMethodsMap).map(([metodo, valor]) => ({
    metodo,
    value: totalPaymentsValue > 0 ? Math.round((valor / totalPaymentsValue) * 100) : 0,
    color: paymentMethodsColors[metodo] || '#' + Math.floor(Math.random() * 16777215).toString(16)
  }));

  // Calculate client segmentation
  const customerSpentMap: Record<string, number> = {};
  filteredVentas.forEach(v => {
    if (v.idPedido) {
      const ped = (pedidos || []).find(p => p.idPedido === v.idPedido);
      if (ped && ped.idCliente) {
        customerSpentMap[String(ped.idCliente)] = (customerSpentMap[String(ped.idCliente)] || 0) + v.total;
      }
    }
  });

  let vipCount = 0, vipTotal = 0;
  let freqCount = 0, freqTotal = 0;
  let ocCount = 0, ocTotal = 0;
  let newCount = 0, newTotal = 0;

  (clientes || []).forEach(c => {
    const spent = customerSpentMap[String(c.idCliente)] || 0;
    if (spent > 500) {
      vipCount++;
      vipTotal += spent;
    } else if (spent > 150) {
      freqCount++;
      freqTotal += spent;
    } else if (spent > 0) {
      ocCount++;
      ocTotal += spent;
    } else {
      newCount++;
      newTotal += spent;
    }
  });

  const dynamicClientesData = [
    { segmento: 'VIP', cantidad: vipCount, gastado: vipTotal },
    { segmento: 'Frecuente', cantidad: freqCount, gastado: freqTotal },
    { segmento: 'Ocasional', cantidad: ocCount, gastado: ocTotal },
    { segmento: 'Nuevo', cantidad: newCount, gastado: newTotal },
  ];

  // Calculate employee sales performance
  const employeeSalesMap: Record<string, { empleado: string; ventas: number; total: number }> = {};
  filteredVentas.forEach(v => {
    const name = v.cajeroNombre || 'Cajero';
    if (!employeeSalesMap[name]) {
      employeeSalesMap[name] = { empleado: name, ventas: 0, total: 0 };
    }
    employeeSalesMap[name].ventas++;
    employeeSalesMap[name].total += v.total;
  });

  const dynamicEmpleadosData = Object.values(employeeSalesMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const maxEmpTotal = Math.max(...dynamicEmpleadosData.map(e => e.total), 1);

  // Calculate inventory top products (based on insumos)
  const dynamicStockData = [...(insumos || [])]
    .map(i => ({
      producto: i.nombre,
      stock: i.stock,
      valorizado: i.stock * (i.costoPromedio || 0)
    }))
    .sort((a, b) => b.valorizado - a.valorizado)
    .slice(0, 5);

  // General KPIs based on filtered context
  const totalSalesCount = filteredVentas.length;
  const totalSalesValue = filteredVentas.reduce((sum, v) => sum + v.total, 0);
  const totalQtySold = filteredVentas.reduce(
    (sum, v) => sum + (v.detalles?.reduce((s, d) => s + d.cantidad, 0) ?? 0),
    0
  );

  const totalInsumosValuation = (insumos || []).reduce(
    (sum, ins) => sum + (ins.stock * (ins.costoPromedio || 0)),
    0
  );

  const averageRotationDays = totalQtySold > 0 ? ((totalInsumosValuation / (totalSalesValue * 0.35 || 1)) * 30).toFixed(1) : '8.5';

  const handleExportCSV = (dataName: string, data: any[]) => {
    if (!data || data.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_${dataName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Reporte de ${dataName} exportado en CSV correctamente`);
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      let exportData: any[] = [];
      let name = '';
      if (activeTab === 'ventas') {
        exportData = dynamicVentasData;
        name = 'Ventas_Diarias';
      } else if (activeTab === 'clientes') {
        exportData = dynamicClientesData;
        name = 'Clientes_Segmentos';
      } else if (activeTab === 'empleados') {
        exportData = dynamicEmpleadosData;
        name = 'Empleados_Rendimiento';
      } else if (activeTab === 'inventario') {
        exportData = dynamicStockData;
        name = 'Inventario_Top5';
      } else if (activeTab === 'rentabilidad') {
        exportData = dynamicVentasData.map(d => ({ Fecha: d.mes, Ventas: d.ventas, Compras: d.compras, Utilidad: d.utilidad }));
        name = 'Rentabilidad_Mensual';
      } else if (activeTab === 'caja') {
        exportData = (historialCajas || []).map(c => ({
          ID: c.idCaja,
          Apertura: c.fechaApertura,
          Cierre: c.fechaCierre || 'Abierta',
          Cajero: c.empleadoNombre,
          MontoApertura: c.montoApertura,
          MontoCierre: c.montoCierre || 0,
          SaldoEsperado: c.saldoEsperado || c.montoApertura
        }));
        name = 'Cajas_Historial';
      } else if (activeTab === 'compras') {
        exportData = (alertaStock || []).map(al => ({ Insumo: al.nombre, StockActual: al.stock, StockMinimo: al.stockMinimo }));
        name = 'Insumos_StockBajo';
      }
      handleExportCSV(name, exportData);
    } else {
      window.print();
    }
  };

  if (isGlobalLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground font-medium">Cargando reportes analíticos...</span>
      </div>
    );
  }

  // Profitability metrics
  const totalRevenue = totalSalesValue;
  const totalCost = totalRevenue * 0.35; // cost model
  const netProfit = totalRevenue - totalCost;
  const grossMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Reportes y Análisis</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Dashboard analítico con reportes detallados y exportación
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Filtros y Exportación
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mes</SelectItem>
                  <SelectItem value="trimestre">Este Trimestre</SelectItem>
                  <SelectItem value="anio">Este Año</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select value={empleado} onValueChange={setEmpleado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cajero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueCashiers.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional Custom Date Picker */}
          {periodo === 'personalizado' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border rounded-lg bg-muted/40">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="caja">Caja</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="empleados">Empleados</TabsTrigger>
          <TabsTrigger value="rentabilidad">Rentabilidad</TabsTrigger>
        </TabsList>

        {/* Ventas Tab */}
        <TabsContent value="ventas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Ventas Totales</CardDescription>
                <CardTitle className="text-3xl">S/ {totalSalesValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Total bruto para periodo
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Órdenes</CardDescription>
                <CardTitle className="text-3xl">{totalSalesCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Ventas completadas</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Ticket Promedio</CardDescription>
                <CardTitle className="text-3xl">S/ {(totalSalesCount > 0 ? totalSalesValue / totalSalesCount : 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-green-600 font-semibold">Por orden pagada</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Productos Vendidos</CardDescription>
                <CardTitle className="text-3xl">{totalQtySold}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Unidades entregadas</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolución de Ventas</CardTitle>
              <CardDescription>Ventas y costos estimados por fecha</CardDescription>
            </CardHeader>
            <CardContent>
              {dynamicVentasData.length === 0 ? (
                <div className="flex items-center justify-center min-h-[300px] text-muted-foreground text-sm">
                  No hay ventas registradas en el período seleccionado.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dynamicVentasData}>
                    <CartesianGrid key="r1-grid" strokeDasharray="3 3" />
                    <XAxis key="r1-xaxis" dataKey="mes" />
                    <YAxis key="r1-yaxis" />
                    <Tooltip key="r1-tooltip" />
                    <Legend key="r1-legend" />
                    <Line
                      key="r1-line-ventas"
                      type="monotone"
                      dataKey="ventas"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Ventas"
                    />
                    <Line
                      key="r1-line-compras"
                      type="monotone"
                      dataKey="compras"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Compras (Costo Est.)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Producto</CardTitle>
              </CardHeader>
              <CardContent>
                {dynamicProductosData.length === 0 ? (
                  <div className="flex items-center justify-center min-h-[250px] text-muted-foreground text-sm">
                    Sin datos de productos para este filtro.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dynamicProductosData}>
                      <CartesianGrid key="r2-grid" strokeDasharray="3 3" />
                      <XAxis key="r2-xaxis" dataKey="categoria" />
                      <YAxis key="r2-yaxis" />
                      <Tooltip key="r2-tooltip" />
                      <Bar key="r2-bar" dataKey="cantidad" fill="#3b82f6" name="Cantidad" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                {dynamicMetodoPagoData.length === 0 ? (
                  <div className="flex items-center justify-center min-h-[250px] text-muted-foreground text-sm">
                    Sin transacciones en este período.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        key="r3-pie"
                        data={dynamicMetodoPagoData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ metodo, value }) => `${metodo} ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dynamicMetodoPagoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip key="r3-tooltip" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compras Tab */}
        <TabsContent value="compras" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Insumos Críticos</CardDescription>
                <CardTitle className="text-3xl text-red-600">{alertaStock.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Requieren reabastecimiento urgente</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Insumos</CardDescription>
                <CardTitle className="text-3xl">{insumos.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Registrados en catálogo</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Valorización de Almacén</CardDescription>
                <CardTitle className="text-3xl">S/ {totalInsumosValuation.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Costo de stock actual</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Insumos Críticos / Bajo Stock</CardTitle>
              <CardDescription>Lista de insumos con stock por debajo del mínimo establecido</CardDescription>
            </CardHeader>
            <CardContent>
              {alertaStock.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No hay insumos críticos actualmente. ¡Todo en orden!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Stock Mínimo</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertaStock.map((ins, idx) => {
                      const insumoUnit = (insumos || []).find(i => i.nombre === ins.nombre)?.unidad || 'Unidades';
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{ins.nombre}</TableCell>
                          <TableCell className="text-red-600 font-semibold">{ins.stock}</TableCell>
                          <TableCell>{ins.stockMinimo}</TableCell>
                          <TableCell>{insumoUnit}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                              CRÍTICO
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventario Tab */}
        <TabsContent value="inventario" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Stock Valorizado</CardDescription>
                <CardTitle className="text-3xl">S/ {totalInsumosValuation.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Total en inventario</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Insumos en Catálogo</CardDescription>
                <CardTitle className="text-3xl">{insumos.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">SKUs activos</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Stock Bajo (Insumos)</CardDescription>
                <CardTitle className="text-3xl text-red-600">{alertaStock.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Requieren reabastecimiento</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Rotación Estimada</CardDescription>
                <CardTitle className="text-3xl">{averageRotationDays}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Días (Stock / Ventas)</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Insumos en Stock</CardTitle>
              <CardDescription>Por valorización (Stock * Costo Promedio)</CardDescription>
            </CardHeader>
            <CardContent>
              {dynamicStockData.length === 0 ? (
                <div className="flex items-center justify-center min-h-[300px] text-muted-foreground text-sm">
                  Sin insumos disponibles.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dynamicStockData} layout="vertical">
                    <CartesianGrid key="r5-grid" strokeDasharray="3 3" />
                    <XAxis key="r5-xaxis" type="number" />
                    <YAxis key="r5-yaxis" dataKey="producto" type="category" width={140} />
                    <Tooltip key="r5-tooltip" />
                    <Bar key="r5-bar" dataKey="valorizado" fill="#8b5cf6" name="Valorizado (S/)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Caja Tab */}
        <TabsContent value="caja" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Sesiones de Caja</CardDescription>
                <CardTitle className="text-3xl">{historialCajas.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Total sesiones registradas</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Cajas Abiertas</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {historialCajas.filter(c => c.estado === 'ABIERTA').length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Turnos activos actualmente</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Recaudado (Cierres)</CardDescription>
                <CardTitle className="text-3xl">
                  S/ {historialCajas
                    .filter(c => c.estado === 'CERRADA')
                    .reduce((sum, c) => sum + (c.montoVentas || 0), 0)
                    .toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Suma de cierres de caja</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Descuadre Acumulado</CardDescription>
                <CardTitle className="text-3xl text-red-600">
                  S/ {historialCajas
                    .filter(c => c.estado === 'CERRADA')
                    .reduce((sum, c) => {
                      const diff = (c.montoCierre || 0) - (c.saldoEsperado || 0);
                      return sum + diff;
                    }, 0)
                    .toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Suma de descuadres</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Caja</CardTitle>
              <CardDescription>Bitácora completa de turnos, aperturas y arqueos</CardDescription>
            </CardHeader>
            <CardContent>
              {historialCajas.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No hay registros de caja disponibles.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Cajero</TableHead>
                        <TableHead>Apertura</TableHead>
                        <TableHead>Cierre</TableHead>
                        <TableHead className="text-right">Monto Inicial</TableHead>
                        <TableHead className="text-right">Ventas</TableHead>
                        <TableHead className="text-right">Monto Cierre</TableHead>
                        <TableHead className="text-right">Diferencia</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historialCajas.map((caja, idx) => {
                        const diferencia = caja.montoCierre !== undefined && caja.saldoEsperado !== undefined
                          ? caja.montoCierre - caja.saldoEsperado
                          : 0;

                        return (
                          <TableRow key={caja.idCaja || idx}>
                            <TableCell className="font-semibold">#{caja.idCaja}</TableCell>
                            <TableCell>{caja.empleadoNombre}</TableCell>
                            <TableCell className="text-xs">
                              {new Date(caja.fechaApertura).toLocaleString('es-PE')}
                            </TableCell>
                            <TableCell className="text-xs">
                              {caja.fechaCierre ? new Date(caja.fechaCierre).toLocaleString('es-PE') : '-'}
                            </TableCell>
                            <TableCell className="text-right">S/ {(caja.montoApertura ?? 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">S/ {(caja.montoVentas || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {caja.montoCierre !== undefined && caja.montoCierre !== null
                                ? `S/ ${(caja.montoCierre).toFixed(2)}`
                                : '-'}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${diferencia < 0 ? 'text-red-600' : diferencia > 0 ? 'text-green-600' : ''}`}>
                              {caja.estado === 'CERRADA' ? `S/ ${(diferencia ?? 0).toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge className={caja.estado === 'ABIERTA' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}>
                                {caja.estado}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clientes Tab */}
        <TabsContent value="clientes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Clientes</CardDescription>
                <CardTitle className="text-3xl">{clientes.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Registrados en catálogo</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Clientes Activos</CardDescription>
                <CardTitle className="text-3xl">{Object.keys(customerSpentMap).length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Con compras registradas</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Nuevos / Inactivos</CardDescription>
                <CardTitle className="text-3xl">{newCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Sin compras registradas</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Ticket Promedio Cliente</CardDescription>
                <CardTitle className="text-3xl">
                  S/ {(Object.keys(customerSpentMap).length > 0 ? totalSalesValue / Object.keys(customerSpentMap).length : 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Por cliente activo</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Clientes por Segmento</CardTitle>
            </CardHeader>
            <CardContent>
              {dynamicClientesData.length === 0 ? (
                <div className="flex items-center justify-center min-h-[300px] text-muted-foreground text-sm">
                  Sin datos de clientes.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dynamicClientesData}>
                    <CartesianGrid key="r4-grid" strokeDasharray="3 3" />
                    <XAxis key="r4-xaxis" dataKey="segmento" />
                    <YAxis key="r4-yaxis-left" yAxisId="left" />
                    <YAxis key="r4-yaxis-right" yAxisId="right" orientation="right" />
                    <Tooltip key="r4-tooltip" />
                    <Legend key="r4-legend" />
                    <Bar key="r4-bar-cantidad" yAxisId="left" dataKey="cantidad" fill="#3b82f6" name="Cantidad" />
                    <Bar key="r4-bar-gastado" yAxisId="right" dataKey="gastado" fill="#10b981" name="Total Gastado (S/)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Empleados Tab */}
        <TabsContent value="empleados" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Empleado</CardTitle>
              <CardDescription>Top 5 vendedores del periodo</CardDescription>
            </CardHeader>
            <CardContent>
              {dynamicEmpleadosData.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No hay ventas registradas para evaluar rendimiento.
                </div>
              ) : (
                <div className="space-y-3">
                  {dynamicEmpleadosData.map((emp, idx) => (
                    <div key={emp.empleado} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{emp.empleado}</div>
                        <div className="text-sm text-muted-foreground">
                          {emp.ventas} ventas
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">S/ {(emp.total ?? 0).toFixed(2)}</div>
                        <Badge variant="secondary" className="mt-1">
                          {((emp.total ?? 0) / maxEmpTotal * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rentabilidad Tab */}
        <TabsContent value="rentabilidad" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Margen Bruto Estimado</CardDescription>
                <CardTitle className="text-3xl">{(grossMargin ?? 0).toFixed(1)}%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-green-600">Basado en costo del 35%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Utilidad Neta Estimada</CardDescription>
                <CardTitle className="text-3xl">S/ {netProfit.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-green-600">Ventas - Costos Estimados</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>ROI Estimado</CardDescription>
                <CardTitle className="text-3xl">{(roi ?? 0).toFixed(0)}%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Retorno sobre costos de mercadería</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Utilidad vs Costos</CardTitle>
              <CardDescription>Evolución por fecha</CardDescription>
            </CardHeader>
            <CardContent>
              {dynamicVentasData.length === 0 ? (
                <div className="flex items-center justify-center min-h-[350px] text-muted-foreground text-sm">
                  Sin datos financieros en el periodo.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dynamicVentasData}>
                    <CartesianGrid key="r6-grid" strokeDasharray="3 3" />
                    <XAxis key="r6-xaxis" dataKey="mes" />
                    <YAxis key="r6-yaxis" />
                    <Tooltip key="r6-tooltip" />
                    <Legend key="r6-legend" />
                    <Bar key="r6-bar-ventas" dataKey="ventas" fill="#10b981" name="Ventas" />
                    <Bar key="r6-bar-costos" dataKey="compras" fill="#ef4444" name="Costos (Est.)" />
                    <Bar key="r6-bar-utilidad" dataKey="utilidad" fill="#3b82f6" name="Utilidad" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
