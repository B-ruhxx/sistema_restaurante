import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi, Cliente, ClienteRequest } from '../api/clientes';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

const EMPTY_ARRAY: Cliente[] = [];

export const useClientes = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const clientesQuery = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
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
    clientes: clientesQuery.data || EMPTY_ARRAY,
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
