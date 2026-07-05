import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MetodoPago, MetodoPagoRequest } from '../api/metodoPagos';
import { metodoPagosApi } from '../api/metodoPagos';
import { metodoPagosQueryKeys } from '../lib/queryKeys/metodoPagos';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

const EMPTY_METODO_PAGOS: MetodoPago[] = [];

export const useMetodoPagos = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const metodoPagosQuery = useQuery({
    queryKey: metodoPagosQueryKeys.all,
    queryFn: metodoPagosApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const activosQuery = useQuery({
    queryKey: metodoPagosQueryKeys.activos,
    queryFn: metodoPagosApi.getActivos,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: metodoPagosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metodoPagosQueryKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MetodoPagoRequest }) =>
      metodoPagosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metodoPagosQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: metodoPagosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metodoPagosQueryKeys.all });
    },
  });

  return {
    metodoPagos: metodoPagosQuery.data ?? EMPTY_METODO_PAGOS,
    activos: activosQuery.data ?? EMPTY_METODO_PAGOS,
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
