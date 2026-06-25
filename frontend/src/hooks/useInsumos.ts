import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insumosApi, InsumoRequest } from '../api/insumos';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useInsumos = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const insumosQuery = useQuery({
    queryKey: ['insumos'],
    queryFn: insumosApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: insumosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InsumoRequest }) =>
      insumosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: insumosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
    },
  });

  return {
    insumos: insumosQuery.data || [],
    isLoading: insumosQuery.isLoading,
    isError: insumosQuery.isError,
    createInsumo: createMutation.mutateAsync,
    updateInsumo: updateMutation.mutateAsync,
    deleteInsumo: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
