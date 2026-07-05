import { useQuery } from '@tanstack/react-query';
import { MovimientoInventario, movimientosApi } from '../api/movimientos';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

const EMPTY_MOVIMIENTOS: MovimientoInventario[] = [];

export const useMovimientos = (
  filters?: { idInsumo?: number; idProducto?: number },
  { enabled = true }: PrivateQueryOptions = {}
) => {
  const queryKey = ['movimientos', filters?.idInsumo ?? null, filters?.idProducto ?? null];
  const queryEnabled = usePrivateQueryEnabled(enabled);

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
    enabled: queryEnabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    movimientos: movimientosQuery.data ?? EMPTY_MOVIMIENTOS,
    isLoading: movimientosQuery.isLoading,
    isError: movimientosQuery.isError,
    refetch: movimientosQuery.refetch,
  };
};
