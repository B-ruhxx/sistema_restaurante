import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { variantesApi, VarianteProductoRequest } from '../api/variantes';

export const useVariantes = (idProducto?: number) => {
  const queryClient = useQueryClient();

  const variantesQuery = useQuery({
    queryKey: ['variantes', idProducto],
    queryFn: () => (idProducto ? variantesApi.getByProducto(idProducto) : Promise.resolve([])),
    enabled: !!idProducto,
  });

  const createMutation = useMutation({
    mutationFn: variantesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variantes', idProducto] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: VarianteProductoRequest }) =>
      variantesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variantes', idProducto] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: variantesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variantes', idProducto] });
    },
  });

  return {
    variantes: variantesQuery.data || [],
    isLoading: variantesQuery.isLoading,
    isError: variantesQuery.isError,
    createVariante: createMutation.mutateAsync,
    updateVariante: updateMutation.mutateAsync,
    deleteVariante: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
