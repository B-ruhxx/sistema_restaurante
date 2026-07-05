import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ventasApi, VentaPagoRequest } from '../api/ventas';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useVentas = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const ventasQuery = useQuery({
    queryKey: ['ventas'],
    queryFn: ventasApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const createVentaMutation = useMutation({
    mutationFn: ventasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
    },
  });

  const pagarVentaMutation = useMutation({
    mutationFn: ({ id, pagos }: { id: number; pagos: VentaPagoRequest[] }) =>
      ventasApi.pagar(id, pagos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      // Invalidate products as stock changes after sale payment
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['cajas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });

  const anularVentaMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      ventasApi.anular(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['cajas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });

  return {
    ventas: ventasQuery.data || [],
    isLoading: ventasQuery.isLoading,
    isError: ventasQuery.isError,
    createVenta: createVentaMutation.mutateAsync,
    pagarVenta: pagarVentaMutation.mutateAsync,
    anularVenta: anularVentaMutation.mutateAsync,
    isCreating: createVentaMutation.isPending,
    isPaying: pagarVentaMutation.isPending,
    isAnulling: anularVentaMutation.isPending,
  };
};
