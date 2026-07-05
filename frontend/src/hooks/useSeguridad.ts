import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { seguridadApi } from '../api/seguridad';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useSeguridad = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const sesionesQuery = useQuery({
    queryKey: ['sesiones-seguridad'],
    queryFn: seguridadApi.getSesiones,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const alertasQuery = useQuery({
    queryKey: ['alertas-seguridad'],
    queryFn: seguridadApi.getAlertas,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const resolverAlertaMutation = useMutation({
    mutationFn: seguridadApi.resolverAlerta,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertas-seguridad'] }),
  });

  const cerrarSesionMutation = useMutation({
    mutationFn: seguridadApi.cerrarSesion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sesiones-seguridad'] }),
  });

  return {
    sesiones: sesionesQuery.data || [],
    alertas: alertasQuery.data || [],
    isLoading: sesionesQuery.isLoading || alertasQuery.isLoading,
    isError: sesionesQuery.isError || alertasQuery.isError,
    refetch: () => {
      sesionesQuery.refetch();
      alertasQuery.refetch();
    },
    resolverAlerta: resolverAlertaMutation.mutateAsync,
    cerrarSesion: cerrarSesionMutation.mutateAsync,
    isResolvingAlert: resolverAlertaMutation.isPending,
    isClosingSession: cerrarSesionMutation.isPending,
  };
};
