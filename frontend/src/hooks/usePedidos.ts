import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pedidosApi, PedidoRequest } from '../api/pedidos';

export const usePedidos = () => {
  const queryClient = useQueryClient();

  const pedidosQuery = useQuery({
    queryKey: ['pedidos'],
    queryFn: pedidosApi.getAll,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates in Kitchen and Orders
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
    pedidos: pedidosQuery.data || [],
    isLoading: pedidosQuery.isLoading,
    isError: pedidosQuery.isError,
    createPedido: createPedidoMutation.mutateAsync,
    updateEstadoPedido: updateEstadoMutation.mutateAsync,
    isCreating: createPedidoMutation.isPending,
    isUpdatingEstado: updateEstadoMutation.isPending,
  };
};
