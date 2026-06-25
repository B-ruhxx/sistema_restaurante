import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metodoPagosApi, MetodoPagoRequest } from '../api/metodoPagos';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useMetodoPagos = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const metodoPagosQuery = useQuery({
    queryKey: ['metodoPagos'],
    queryFn: metodoPagosApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const activosQuery = useQuery({
    queryKey: ['metodoPagos', 'activos'],
    queryFn: metodoPagosApi.getActivos,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: metodoPagosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metodoPagos'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MetodoPagoRequest }) =>
      metodoPagosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metodoPagos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: metodoPagosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metodoPagos'] });
    },
  });

  return {
    metodoPagos: metodoPagosQuery.data || [],
    activos: activosQuery.data || [],
    isLoading: metodoPagosQuery.isLoading || activosQuery.isLoading,
    isError: metodoPagosQuery.isError || activosQuery.isError,
    createMetodoPago: createMutation.mutateAsync,
    updateMetodoPago: updateMutation.mutateAsync,
    deleteMetodoPago: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
