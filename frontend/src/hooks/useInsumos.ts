import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insumosApi, InsumoRequest } from '../api/insumos';

export const useInsumos = () => {
  const queryClient = useQueryClient();

  const insumosQuery = useQuery({
    queryKey: ['insumos'],
    queryFn: insumosApi.getAll,
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
