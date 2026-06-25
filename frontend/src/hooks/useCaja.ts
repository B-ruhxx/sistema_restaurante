import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cajasApi, MovimientoCajaRequest } from '../api/cajas';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useCaja = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const activaQuery = useQuery({
    queryKey: ['cajas', 'activa'],
    queryFn: cajasApi.getActiva,
    enabled: queryEnabled,
    staleTime: 30000, // cache active status for 30s
  });

  const activaId = activaQuery.data?.idCaja;

  const movimientosQuery = useQuery({
    queryKey: ['cajas', activaId, 'movimientos'],
    queryFn: () => activaId ? cajasApi.getMovimientos(activaId) : Promise.resolve([]),
    enabled: queryEnabled && !!activaId,
  });

  const historialQuery = useQuery({
    queryKey: ['cajas', 'historial'],
    queryFn: cajasApi.getHistorial,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const abrirMutation = useMutation({
    mutationFn: ({ monto, observacion }: { monto: number; observacion?: string }) =>
      cajasApi.abrir(monto, observacion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cajas'] });
    },
  });

  const cerrarMutation = useMutation({
    mutationFn: ({ id, monto, observacion }: { id: number; monto: number; observacion?: string }) =>
      cajasApi.cerrar(id, monto, observacion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cajas'] });
    },
  });

  const registrarMovimientoMutation = useMutation({
    mutationFn: ({ idCaja, data }: { idCaja: number; data: MovimientoCajaRequest }) =>
      cajasApi.registrarMovimiento(idCaja, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cajas'] });
    },
  });

  return {
    cajaActiva: activaQuery.data || null,
    movimientos: movimientosQuery.data || [],
    historial: historialQuery.data || [],
    isLoading: activaQuery.isLoading || movimientosQuery.isLoading,
    isLoadingHistorial: historialQuery.isLoading,
    isError: activaQuery.isError,
    abrirCaja: abrirMutation.mutateAsync,
    cerrarCaja: cerrarMutation.mutateAsync,
    registrarMovimiento: registrarMovimientoMutation.mutateAsync,
    isAbriendo: abrirMutation.isPending,
    isCerrando: cerrarMutation.isPending,
    isRegistrando: registrarMovimientoMutation.isPending,
  };
};
