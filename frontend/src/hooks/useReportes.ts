import { useQuery } from '@tanstack/react-query';
import { reportesApi } from '../api/reportes';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useReportes = ({ enabled = true }: PrivateQueryOptions = {}) => {
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
    productosPopulares: productosPopularesQuery.data || [],
    resumenFinanciero: resumenFinancieroQuery.data,
    isLoading: 
      alertaStockQuery.isLoading || 
      stockInsuficienteQuery.isLoading || 
      ventasDiariasQuery.isLoading || 
      productosPopularesQuery.isLoading || 
      resumenFinancieroQuery.isLoading,
    isError: 
      alertaStockQuery.isError || 
      stockInsuficienteQuery.isError || 
      ventasDiariasQuery.isError || 
      productosPopularesQuery.isError || 
      resumenFinancieroQuery.isError,
    refetchAll: () => {
      alertaStockQuery.refetch();
      stockInsuficienteQuery.refetch();
      ventasDiariasQuery.refetch();
      productosPopularesQuery.refetch();
      resumenFinancieroQuery.refetch();
    }
  };
};
