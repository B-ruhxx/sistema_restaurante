import { useQuery } from '@tanstack/react-query';
import { reportesApi } from '../api/reportes';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

interface UseReportesOptions extends PrivateQueryOptions {
  fechaVentasPorHora?: string;
}

export const useReportes = ({ enabled = true, fechaVentasPorHora }: UseReportesOptions = {}) => {
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const alertaStockQuery = useQuery({
    queryKey: ['reportes', 'alerta-stock'],
    queryFn: reportesApi.getAlertaStock,
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const stockInsuficienteQuery = useQuery({
    queryKey: ['reportes', 'stock-insuficiente'],
    queryFn: reportesApi.getStockInsuficiente,
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const ventasDiariasQuery = useQuery({
    queryKey: ['reportes', 'ventas-diarias'],
    queryFn: reportesApi.getVentasDiarias,
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const comprasDiariasQuery = useQuery({
    queryKey: ['reportes', 'compras-diarias'],
    queryFn: reportesApi.getComprasDiarias,
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const utilidadDiariaQuery = useQuery({
    queryKey: ['reportes', 'utilidad-diaria'],
    queryFn: reportesApi.getUtilidadDiaria,
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const ventasPorHoraQuery = useQuery({
    queryKey: ['reportes', 'ventas-por-hora', fechaVentasPorHora || 'hoy'],
    queryFn: () => reportesApi.getVentasPorHora(fechaVentasPorHora),
    enabled: queryEnabled,
    staleTime: 60_000,
  });

  const productosPopularesQuery = useQuery({
    queryKey: ['reportes', 'productos-populares'],
    queryFn: reportesApi.getProductosPopulares,
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const resumenFinancieroQuery = useQuery({
    queryKey: ['reportes', 'resumen-financiero'],
    queryFn: reportesApi.getResumenFinanciero,
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    alertaStock: alertaStockQuery.data || [],
    stockInsuficiente: stockInsuficienteQuery.data || [],
    ventasDiarias: ventasDiariasQuery.data || [],
    comprasDiarias: comprasDiariasQuery.data || [],
    utilidadDiaria: utilidadDiariaQuery.data || [],
    ventasPorHora: ventasPorHoraQuery.data || [],
    productosPopulares: productosPopularesQuery.data || [],
    resumenFinanciero: resumenFinancieroQuery.data,
    isLoading: 
      alertaStockQuery.isLoading || 
      stockInsuficienteQuery.isLoading || 
      ventasDiariasQuery.isLoading || 
      comprasDiariasQuery.isLoading ||
      utilidadDiariaQuery.isLoading ||
      ventasPorHoraQuery.isLoading ||
      productosPopularesQuery.isLoading || 
      resumenFinancieroQuery.isLoading,
    isError: 
      alertaStockQuery.isError || 
      stockInsuficienteQuery.isError || 
      ventasDiariasQuery.isError || 
      comprasDiariasQuery.isError ||
      utilidadDiariaQuery.isError ||
      ventasPorHoraQuery.isError ||
      productosPopularesQuery.isError || 
      resumenFinancieroQuery.isError,
    refetchAll: () => {
      alertaStockQuery.refetch();
      stockInsuficienteQuery.refetch();
      ventasDiariasQuery.refetch();
      comprasDiariasQuery.refetch();
      utilidadDiariaQuery.refetch();
      ventasPorHoraQuery.refetch();
      productosPopularesQuery.refetch();
      resumenFinancieroQuery.refetch();
    }
  };
};
