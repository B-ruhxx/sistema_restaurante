import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pedido, pedidosApi } from '../api/pedidos';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

const EMPTY_ARRAY: Pedido[] = [];

interface UsePedidosOptions extends PrivateQueryOptions {
  pollingEnabled?: boolean;
}

export const usePedidos = ({ enabled = true, pollingEnabled = false }: UsePedidosOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const pedidosQuery = useQuery({
    queryKey: ['pedidos'],
    queryFn: pedidosApi.getAll,
    enabled: queryEnabled,
    refetchInterval: queryEnabled && pollingEnabled ? 5000 : false,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const createPedidoMutation = useMutation({
    mutationFn: pedidosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      pedidosApi.updateEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });

  return {
    pedidos: pedidosQuery.data || EMPTY_ARRAY,
    isLoading: pedidosQuery.isLoading,
    isError: pedidosQuery.isError,
    createPedido: createPedidoMutation.mutateAsync,
    updateEstadoPedido: updateEstadoMutation.mutateAsync,
    isCreating: createPedidoMutation.isPending,
    isUpdatingEstado: updateEstadoMutation.isPending,
    refetch: pedidosQuery.refetch,
  };
};
