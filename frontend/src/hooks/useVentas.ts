import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ventasApi, VentaRequest, VentaPagoRequest } from '../api/ventas';

export const useVentas = () => {
  const queryClient = useQueryClient();

  const ventasQuery = useQuery({
    queryKey: ['ventas'],
    queryFn: ventasApi.getAll,
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
    },
  });

  const anularVentaMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      ventasApi.anular(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
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
