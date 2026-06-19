import { useQuery } from '@tanstack/react-query';
import { movimientosApi } from '../api/movimientos';

export const useMovimientos = (filters?: { idInsumo?: number; idProducto?: number }) => {
  const queryKey = ['movimientos', filters];

  const queryFn = () => {
    if (filters?.idInsumo) {
      return movimientosApi.getByInsumo(filters.idInsumo);
    }
    if (filters?.idProducto) {
      return movimientosApi.getByProducto(filters.idProducto);
    }
    return movimientosApi.getAll();
  };

  const movimientosQuery = useQuery({
    queryKey,
    queryFn,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    movimientos: movimientosQuery.data || [],
    isLoading: movimientosQuery.isLoading,
    isError: movimientosQuery.isError,
    refetch: movimientosQuery.refetch,
  };
};
