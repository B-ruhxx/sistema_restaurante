import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriasApi, CategoriaRequest } from '../api/categorias';

export const useCategorias = () => {
  const queryClient = useQueryClient();

  const categoriasQuery = useQuery({
    queryKey: ['categorias'],
    queryFn: categoriasApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: categoriasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoriaRequest }) =>
      categoriasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });

  return {
    categorias: categoriasQuery.data || [],
    isLoading: categoriasQuery.isLoading,
    isError: categoriasQuery.isError,
    createCategoria: createMutation.mutateAsync,
    updateCategoria: updateMutation.mutateAsync,
    deleteCategoria: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
