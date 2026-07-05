import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Loader2,
  Package,
  Clock,
  TrendingDown,
  Info,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { toast } from '../../lib/notifications';
import { useReportes } from '../../hooks/useReportes';
import { useCaja } from '../../hooks/useCaja';
import { useInsumos } from '../../hooks/useInsumos';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { PageWrapper, ModuleHeader, KpiCard, SectionCard } from '../components/ui/erp-layout';

const formatShortDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
  });

const formatCurrency = (value: number) =>
  `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString('es-PE') : '-';

export function Reports() {
  const [activeTab, setActiveTab] = useState('ventas');
  const [fechaVentasPorHora, setFechaVentasPorHora] = useState(() => new Date().toISOString().slice(0, 10));

  const {
    alertaStock,
    stockInsuficiente,
    ventasDiarias,
    comprasDiarias,
    ventasPorHora,
    productosPopulares,
    resumenFinanciero,
    isLoading: isLoadingReportes,
  } = useReportes({ fechaVentasPorHora });
  const { historial: historialCajas, isLoadingHistorial } = useCaja();
  const { insumos, isLoading: isLoadingInsumos } = useInsumos();

  const isGlobalLoading = isLoadingReportes || isLoadingHistorial || isLoadingInsumos;

  const totalVentasGlobal = resumenFinanciero?.totalVentas ?? 0;
  const totalComprasGlobal = resumenFinanciero?.totalCompras ?? 0;
  const costoTotalGlobal = resumenFinanciero?.costoTotal ?? 0;
  const gananciaNetaGlobal = resumenFinanciero?.gananciaNeta ?? 0;
  const baseImponibleGlobal = resumenFinanciero?.baseImponible ?? 0;
  const igvGlobal = resumenFinanciero?.igv ?? 0;
  const margenBruto = totalVentasGlobal > 0 ? (gananciaNetaGlobal / totalVentasGlobal) * 100 : 0;
  const costRatio = totalVentasGlobal > 0 ? Math.max(costoTotalGlobal / totalVentasGlobal, 0) : 0.35;
  const costSourceLabel = totalVentasGlobal > 0
    ? 'Costo derivado del ratio global del resumen financiero sobre la serie diaria.'
    : 'Serie costo derivado del 35% temporal por falta de base financiera global.';

  const ventasDiariasData = [...ventasDiarias]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((item) => {
      const costoEstimado = item.total * costRatio;
      return {
        fecha: item.fecha,
        etiqueta: formatShortDate(item.fecha),
        ventas: item.total,
        tickets: item.cantidad,
        costoEstimado,
        utilidadEstimada: item.total - costoEstimado,
      };
    });

  const comprasDiariasData = [...comprasDiarias]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((item) => ({
      fecha: item.fecha,
      etiqueta: formatShortDate(item.fecha),
      total: item.total,
      cantidad: item.cantidad,
    }));

  const productosPopularesData = productosPopulares.map((item) => ({
    producto: item.producto,
    categoria: item.categoria || 'Sin categoria',
    cantidad: item.cantidad,
    total: item.total,
  }));

  const ventasPorHoraData = ventasPorHora.map((item) => ({
    hora: item.hora,
    etiqueta: item.etiqueta,
    total: item.total,
    cantidad: item.cantidad,
  }));

  const stockTopData = [...insumos]
    .map((insumo) => ({
      producto: insumo.nombre,
      stock: insumo.stock,
      valorizado: insumo.stock * (insumo.costoPromedio || 0),
    }))
    .sort((a, b) => b.valorizado - a.valorizado)
    .slice(0, 5);

  const totalVentasRecientes = ventasDiariasData.reduce((sum, item) => sum + item.ventas, 0);
  const totalTicketsRecientes = ventasDiariasData.reduce((sum, item) => sum + item.tickets, 0);
  const ticketPromedioReciente = totalTicketsRecientes > 0 ? totalVentasRecientes / totalTicketsRecientes : 0;
  const promedioDiarioVentas = ventasDiariasData.length > 0 ? totalVentasRecientes / ventasDiariasData.length : 0;

  const totalComprasRecientes = comprasDiariasData.reduce((sum, item) => sum + item.total, 0);
  const totalOrdenesCompraRecientes = comprasDiariasData.reduce((sum, item) => sum + item.cantidad, 0);
  const compraPromedioReciente = totalOrdenesCompraRecientes > 0 ? totalComprasRecientes / totalOrdenesCompraRecientes : 0;

  const totalInsumosValuation = insumos.reduce(
    (sum, insumo) => sum + insumo.stock * (insumo.costoPromedio || 0),
    0
  );

  const averageRotationDays = costoTotalGlobal > 0
    ? ((totalInsumosValuation / costoTotalGlobal) * 30).toFixed(1)
    : '0.0';

  const peakHour = ventasPorHoraData.reduce(
    (best, item) => (item.total > best.total ? item : best),
    { hora: 0, etiqueta: '00:00', total: 0, cantidad: 0 }
  );

  const handleExportCSV = (dataName: string, data: AppExportRow[]) => {
    if (data.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row).map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = `data:text/csv;charset=utf-8,\uFEFF${[headers, ...rows].join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_${dataName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Reporte de ${dataName} exportado en CSV`);
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    let exportData: AppExportRow[] = [];
    let reportName = '';

    if (activeTab === 'ventas') {
      exportData = ventasDiariasData.map((item) => ({
        Fecha: item.fecha,
        Ventas: item.ventas,
        Tickets: item.tickets,
        CostoEstimado: item.costoEstimado,
        UtilidadEstimada: item.utilidadEstimada,
      }));
      reportName = 'Ventas_Recientes';
    } else if (activeTab === 'compras') {
      exportData = comprasDiariasData.map((item) => ({
        Fecha: item.fecha,
        TotalCompras: item.total,
        Ordenes: item.cantidad,
      }));
      reportName = 'Compras_Recientes';
    } else if (activeTab === 'inventario') {
      exportData = alertaStock.map((item) => ({
        Insumo: item.nombre,
        StockActual: item.stock,
        StockMinimo: item.stockMinimo,
      }));
      reportName = 'Inventario_Alertas';
    } else if (activeTab === 'caja') {
      exportData = historialCajas.map((caja) => ({
        ID: caja.idCaja,
        Cajero: caja.empleadoNombre,
        Apertura: caja.fechaApertura,
        Cierre: caja.fechaCierre || 'Abierta',
        Estado: caja.estado,
        Ventas: caja.montoVentas || 0,
        SaldoEsperado: caja.saldoEsperado || 0,
        MontoCierre: caja.montoCierre || 0,
      }));
      reportName = 'Caja_Historial';
    } else if (activeTab === 'rentabilidad') {
      exportData = ventasDiariasData.map((item) => ({
        Fecha: item.fecha,
        Ventas: item.ventas,
        CostoEstimado: item.costoEstimado,
        UtilidadEstimada: item.utilidadEstimada,
      }));
      reportName = 'Rentabilidad_Serie';
    }

    if (format === 'excel') {
      handleExportCSV(reportName, exportData);
      return;
    }

    if (exportData.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const headers = Object.keys(exportData[0]);
      const rows = exportData.map((row) => headers.map((header) => String(row[header] ?? '')));
      const colWidth = (pageWidth - margin * 2) / headers.length;
      let y = 48;

      doc.setFontSize(16);
      doc.text(`Reporte ${reportName.replaceAll('_', ' ')}`, margin, y);
      y += 18;
      doc.setFontSize(9);
      doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, margin, y);
      y += 24;

      const drawHeader = () => {
        doc.setFillColor(35, 35, 35);
        doc.rect(margin, y - 12, pageWidth - margin * 2, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        headers.forEach((header, index) => {
          doc.text(header.slice(0, 22), margin + index * colWidth + 4, y);
        });
        doc.setTextColor(0, 0, 0);
        y += 18;
      };

      drawHeader();
      rows.forEach((row) => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 48;
          drawHeader();
        }
        row.forEach((cell, index) => {
          doc.text(cell.slice(0, 28), margin + index * colWidth + 4, y);
        });
        y += 16;
      });

      doc.save(`Reporte_${reportName}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Reporte PDF generado correctamente');
    });
  };

  if (isGlobalLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando reportes operativos...</p>
      </div>
    );
  }

  return (
    <PageWrapper>
      <ModuleHeader
        breadcrumbs={[
          { label: 'Administración' },
          { label: 'Reportes y Analíticas' },
        ]}
        icon={FileText}
        iconColor="blue"
        title="Reportes y Análisis"
        subtitle="Analiza la facturación diaria, stock valorizado, rentabilidad financiera y turnos de caja."
      />

      {/* Scope Selector Row */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Alcance del reporte operativo
          </h3>
          <p className="text-xs text-muted-foreground font-semibold">
            Serie de 15 días analizada por backend. La consulta horaria se realiza sobre la fecha elegida.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-40">
            <Input
              id="fechaVentasPorHora"
              type="date"
              value={fechaVentasPorHora}
              onChange={(event) => setFechaVentasPorHora(event.target.value)}
              className="h-10 rounded-xl bg-background"
            />
          </div>
          <Button variant="outline" onClick={() => handleExport('excel')} className="h-10 rounded-xl gap-2 font-semibold">
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" /> Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} className="h-10 rounded-xl gap-2 font-semibold">
            <Download className="w-4 h-4 text-muted-foreground" /> PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 xl:grid-cols-5 h-11 bg-muted/40 p-1 rounded-xl">
          <TabsTrigger value="ventas" className="rounded-lg text-xs font-bold transition-all">Ventas</TabsTrigger>
          <TabsTrigger value="compras" className="rounded-lg text-xs font-bold transition-all">Compras</TabsTrigger>
          <TabsTrigger value="inventario" className="rounded-lg text-xs font-bold transition-all">Inventario</TabsTrigger>
          <TabsTrigger value="caja" className="rounded-lg text-xs font-bold transition-all">Turnos Caja</TabsTrigger>
          <TabsTrigger value="rentabilidad" className="rounded-lg text-xs font-bold transition-all">Rentabilidad</TabsTrigger>
        </TabsList>

        {/* Ventas Tab */}
        <TabsContent value="ventas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard icon={TrendingUp} label="Ventas Recientes" value={formatCurrency(totalVentasRecientes)} color="blue" />
            <KpiCard icon={FileText} label="Tickets Emitidos" value={totalTicketsRecientes} color="slate" />
            <KpiCard icon={TrendingUp} label="Ticket Promedio" value={formatCurrency(ticketPromedioReciente)} color="green" />
            <KpiCard icon={Clock} label="Hora Pico (Día)" value={`${peakHour.etiqueta} (${formatCurrency(peakHour.total)})`} color="violet" />
          </div>

          <SectionCard
            title="Evolución diaria de ventas"
            description="Línea de tiempo acumulada de ingresos brutos diarios."
            icon={TrendingUp}
            iconColor="blue"
          >
            {ventasDiariasData.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center text-xs font-semibold text-muted-foreground">
                No hay ventas diarias disponibles para graficar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ventasDiariasData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Monto']} />
                  <Legend />
                  <Line type="monotone" dataKey="ventas" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4 }} name="Ventas brutas" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SectionCard
              title="Ranking de Ventas"
              description="Productos y platos con mayor número de pedidos."
              icon={TrendingUp}
              iconColor="blue"
            >
              {productosPopularesData.length === 0 ? (
                <div className="flex min-h-[260px] items-center justify-center text-xs font-semibold text-muted-foreground">
                  No hay datos de popularidad de platos disponibles.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={productosPopularesData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="producto" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [v, 'Cantidad']} />
                    <Bar dataKey="cantidad" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Cant. Pedida" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            <SectionCard
              title="Ventas por Franja Horaria"
              description={`Distribución de ingresos durante el día ${fechaVentasPorHora}.`}
              icon={Clock}
              iconColor="amber"
            >
              {ventasPorHoraData.length === 0 ? (
                <div className="flex min-h-[260px] items-center justify-center text-xs font-semibold text-muted-foreground">
                  Sin registros de ventas en la fecha seleccionada.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ventasPorHoraData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="etiqueta" interval={2} tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Ventas']} />
                    <Bar dataKey="total" fill="var(--status-success)" radius={[4, 4, 0, 0]} name="Ventas" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </div>
        </TabsContent>

        {/* Compras Tab */}
        <TabsContent value="compras" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard icon={FileText} label="Compras Totales" value={formatCurrency(totalComprasGlobal)} color="slate" />
            <KpiCard icon={TrendingUp} label="Gasto Reciente" value={formatCurrency(totalComprasRecientes)} color="blue" />
            <KpiCard icon={FileText} label="Órdenes de Compra" value={totalOrdenesCompraRecientes} color="violet" />
            <KpiCard icon={TrendingUp} label="Compra Promedio" value={formatCurrency(compraPromedioReciente)} color="green" />
          </div>

          <SectionCard
            title="Histórico de Abastecimiento diario"
            description="Registro diario de compras registradas en almacén."
            icon={FileText}
            iconColor="violet"
          >
            {comprasDiariasData.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center text-xs font-semibold text-muted-foreground">
                No hay compras registradas para visualizar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={comprasDiariasData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Compra']} />
                  <Legend />
                  <Bar dataKey="total" fill="var(--status-info)" radius={[4, 4, 0, 0]} name="Inversión compra" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard
            title="Riesgo de Rotura de Stock para Producción"
            description="Insumos que impiden la preparación de platos por desabastecimiento."
            icon={Package}
            iconColor="red"
          >
            {stockInsuficiente.length === 0 ? (
              <p className="text-xs font-bold ui-status-success text-center py-6">
                ✓ Todo el stock actual cumple con las recetas de producción.
              </p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plato final</TableHead>
                      <TableHead>Insumo deficitario</TableHead>
                      <TableHead className="text-right">Stock actual</TableHead>
                      <TableHead className="text-right">Requerido mínimo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockInsuficiente.map((item, index) => (
                      <TableRow key={`${item.producto}-${item.insumo}-${index}`}>
                        <TableCell className="font-bold text-foreground">{item.producto}</TableCell>
                        <TableCell className="text-xs font-semibold text-muted-foreground">{item.insumo}</TableCell>
                        <TableCell className="text-right font-bold text-foreground ui-tabular">{item.stock}</TableCell>
                        <TableCell className="text-right font-bold text-destructive ui-tabular">{item.cantidad}</TableCell>
                        <TableCell>
                          <Badge variant="danger" className="text-[9px] font-bold shadow-3xs">Agotado</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* Inventario Tab */}
        <TabsContent value="inventario" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard icon={Package} label="Almacén Valorizado" value={formatCurrency(totalInsumosValuation)} color="blue" />
            <KpiCard icon={Package} label="Insumos Activos" value={insumos.length} color="slate" />
            <KpiCard icon={Package} label="Alertas Stock Mínimo" value={alertaStock.length} color="red" />
            <KpiCard icon={Clock} label="Rotación Estimada" value={`${averageRotationDays} días`} color="violet" />
          </div>

          <SectionCard
            title="Valorización de stock por insumo"
            description="Ranking de insumos con mayor capital inmovilizado."
            icon={Package}
            iconColor="violet"
          >
            {stockTopData.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center text-xs font-semibold text-muted-foreground">
                Sin datos de insumos para valorizar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stockTopData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="producto" type="category" width={160} tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Valorizado']} />
                  <Bar dataKey="valorizado" fill="var(--status-info)" radius={[0, 4, 4, 0]} name="Valor total" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard
            title="Alertas de Reabastecimiento"
            description="Insumos bajo el nivel mínimo requerido de seguridad."
            icon={Package}
            iconColor="red"
          >
            {alertaStock.length === 0 ? (
              <p className="text-xs font-bold ui-status-success text-center py-6">
                ✓ Todos los insumos se encuentran sobre su stock mínimo de seguridad.
              </p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead className="text-right">Stock actual</TableHead>
                      <TableHead className="text-right">Stock mínimo</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertaStock.map((item) => (
                      <TableRow key={item.nombre}>
                        <TableCell className="font-bold text-foreground">{item.nombre}</TableCell>
                        <TableCell className="text-right font-bold text-foreground ui-tabular">{item.stock}</TableCell>
                        <TableCell className="text-right font-bold text-foreground ui-tabular">{item.stockMinimo}</TableCell>
                        <TableCell>
                          <Badge variant="warning" className="text-[9px] font-bold shadow-3xs">Reordenar</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* Caja Tab */}
        <TabsContent value="caja" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard icon={Clock} label="Turnos de Caja" value={historialCajas.length} color="slate" />
            <KpiCard icon={CheckCircle2} label="Cajas Abiertas" value={historialCajas.filter(c => c.estado === 'ABIERTA').length} color="green" />
            <KpiCard icon={TrendingUp} label="Recaudado cierres" value={formatCurrency(historialCajas.filter(c => c.estado === 'CERRADA').reduce((sum, c) => sum + (c.montoVentas || 0), 0))} color="blue" />
            <KpiCard icon={TrendingDown} label="Descuadre Cierres" value={formatCurrency(historialCajas.filter(c => c.estado === 'CERRADA').reduce((sum, c) => sum + ((c.montoCierre || 0) - (c.saldoEsperado || 0)), 0))} color="red" />
          </div>

          <SectionCard
            title="Turnos y arqueos de caja"
            description="Historial de cierres de caja y validación de descuadres."
            icon={Clock}
            iconColor="slate"
          >
            {historialCajas.length === 0 ? (
              <div className="text-center py-8 text-xs font-semibold text-muted-foreground">
                No hay sesiones de caja registradas en el ERP.
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turno</TableHead>
                      <TableHead>Cajero</TableHead>
                      <TableHead>Apertura</TableHead>
                      <TableHead>Cierre</TableHead>
                      <TableHead className="text-right">Fondo</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Cierre Físico</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialCajas.map((caja, index) => {
                      const diferencia = caja.estado === 'CERRADA'
                        ? (caja.montoCierre || 0) - (caja.saldoEsperado || 0)
                        : 0;

                      return (
                        <TableRow key={caja.idCaja || index}>
                          <TableCell className="font-mono text-xs font-bold text-foreground">#{caja.idCaja}</TableCell>
                          <TableCell className="text-xs font-bold text-foreground">{caja.empleadoNombre}</TableCell>
                          <TableCell className="text-xs font-semibold text-muted-foreground font-mono">{formatDateTime(caja.fechaApertura)}</TableCell>
                          <TableCell className="text-xs font-semibold text-muted-foreground font-mono">{formatDateTime(caja.fechaCierre)}</TableCell>
                          <TableCell className="text-right text-xs font-semibold text-muted-foreground ui-tabular">{formatCurrency(caja.montoApertura || 0)}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-foreground ui-tabular">{formatCurrency(caja.montoVentas || 0)}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-foreground ui-tabular">{formatCurrency(caja.montoCierre || 0)}</TableCell>
                          <TableCell className={cn(
                            'text-right text-xs font-bold ui-tabular',
                            diferencia < 0 ? 'ui-status-danger' : diferencia > 0 ? 'ui-status-success' : 'text-muted-foreground'
                          )}>
                            {caja.estado === 'CERRADA' ? formatCurrency(diferencia) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={caja.estado === 'ABIERTA' ? 'success' : 'secondary'} className="text-[9px] font-bold shadow-3xs">
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
          </SectionCard>
        </TabsContent>

        {/* Rentabilidad Tab */}
        <TabsContent value="rentabilidad" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard icon={TrendingUp} label="Ventas Brutas" value={formatCurrency(totalVentasGlobal)} color="blue" />
            <KpiCard icon={TrendingDown} label="Costo Mercadería" value={formatCurrency(costoTotalGlobal)} color="red" />
            <KpiCard icon={TrendingUp} label="Ganancia Neta" value={formatCurrency(gananciaNetaGlobal)} color="green" />
            <KpiCard icon={TrendingUp} label="Margen Bruto" value={`${margenBruto.toFixed(1)}%`} color="violet" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SectionCard
              title="Utilidad estimada diaria"
              description={costSourceLabel}
              icon={TrendingUp}
              iconColor="green"
            >
              {ventasDiariasData.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center text-xs font-semibold text-muted-foreground">
                  No hay serie diaria disponible para rentabilidad.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ventasDiariasData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Monto']} />
                    <Legend />
                    <Bar dataKey="ventas" fill="var(--status-success)" radius={[4, 4, 0, 0]} name="Ventas" />
                    <Bar dataKey="costoEstimado" fill="var(--status-warning)" radius={[4, 4, 0, 0]} name="Costo derivado" />
                    <Bar dataKey="utilidadEstimada" fill="var(--status-info)" radius={[4, 4, 0, 0]} name="Utilidad" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            <SectionCard
              title="Estructura Impositiva & Tributaria"
              description="Desglose fiscal del acumulado de ventas brutas."
              icon={Info}
              iconColor="slate"
            >
              <div className="space-y-4 font-semibold">
                <div className="rounded-xl border border-border p-4.5 bg-muted/10">
                  <div className="text-xs text-muted-foreground">Base imponible (Subtotal)</div>
                  <div className="mt-1.5 text-2xl font-black text-foreground ui-tabular">{formatCurrency(baseImponibleGlobal)}</div>
                </div>
                <div className="rounded-xl border border-border p-4.5 bg-muted/10">
                  <div className="text-xs text-muted-foreground">IGV acumulado (18%)</div>
                  <div className="mt-1.5 text-2xl font-black text-foreground ui-tabular">{formatCurrency(igvGlobal)}</div>
                </div>
                <div className="rounded-xl border border-border p-4.5 bg-muted/10">
                  <div className="text-xs text-muted-foreground">Promedio diario ventas recientes</div>
                  <div className="mt-1.5 text-2xl font-black text-foreground ui-tabular">{formatCurrency(promedioDiarioVentas)}</div>
                </div>
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
