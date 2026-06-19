import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productosApi, ProductoRequest } from '../api/productos';

export const useProductos = () => {
  const queryClient = useQueryClient();

  const productosQuery = useQuery({
    queryKey: ['productos'],
    queryFn: productosApi.getAll,
  });

  const getProductoDetail = (id: number) => {
    return queryClient.fetchQuery({
      queryKey: ['productos', id],
      queryFn: () => productosApi.getById(id),
    });
  };

  const createMutation = useMutation({
    mutationFn: productosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoRequest }) =>
      productosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });

  return {
    productos: productosQuery.data || [],
    isLoading: productosQuery.isLoading,
    isError: productosQuery.isError,
    getProductoDetail,
    createProducto: createMutation.mutateAsync,
    updateProducto: updateMutation.mutateAsync,
    deleteProducto: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
