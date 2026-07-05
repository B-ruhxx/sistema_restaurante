import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CompraResponse } from '../api/compras';
import { comprasApi } from '../api/compras';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

const EMPTY_COMPRAS: CompraResponse[] = [];

export const useCompras = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const invalidateCompraRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['compras'] });
    queryClient.invalidateQueries({ queryKey: ['insumos'] });
    queryClient.invalidateQueries({ queryKey: ['productos'] });
    queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    queryClient.invalidateQueries({ queryKey: ['reportes'] });
  };

  const comprasQuery = useQuery({
    queryKey: ['compras'],
    queryFn: comprasApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: comprasApi.create,
    onSuccess: () => {
      invalidateCompraRelatedQueries();
    },
  });

  const anularMutation = useMutation({
    mutationFn: comprasApi.anular,
    onSuccess: () => {
      invalidateCompraRelatedQueries();
    },
  });

  return {
    compras: comprasQuery.data ?? EMPTY_COMPRAS,
    isLoading: comprasQuery.isLoading,
    isError: comprasQuery.isError,
    createCompra: createMutation.mutateAsync,
    anularCompra: anularMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isAnulando: anularMutation.isPending,
  };
};
