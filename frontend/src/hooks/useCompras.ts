import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { comprasApi, CompraRequest } from '../api/compras';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useCompras = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const comprasQuery = useQuery({
    queryKey: ['compras'],
    queryFn: comprasApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: comprasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      // Invalidate stock alerts and insumos since purchases modify stock
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });

  const anularMutation = useMutation({
    mutationFn: comprasApi.anular,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });

  return {
    compras: comprasQuery.data || [],
    isLoading: comprasQuery.isLoading,
    isError: comprasQuery.isError,
    createCompra: createMutation.mutateAsync,
    anularCompra: anularMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isAnulando: anularMutation.isPending,
  };
};
