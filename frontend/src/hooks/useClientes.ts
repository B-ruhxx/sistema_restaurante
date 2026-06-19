import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi, ClienteRequest } from '../api/clientes';

export const useClientes = () => {
  const queryClient = useQueryClient();

  const clientesQuery = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: clientesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClienteRequest }) =>
      clientesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: clientesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  return {
    clientes: clientesQuery.data || [],
    isLoading: clientesQuery.isLoading,
    isError: clientesQuery.isError,
    createCliente: createMutation.mutateAsync,
    updateCliente: updateMutation.mutateAsync,
    deleteCliente: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
