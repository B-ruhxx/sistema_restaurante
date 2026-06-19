import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configuracionApi, ConfiguracionEmpresa } from '../api/configuracion';
import { useConfigStore } from '../store/configStore';
import { useEffect } from 'react';

export const useConfiguracion = () => {
  const queryClient = useQueryClient();
  const setConfig = useConfigStore((s) => s.setConfig);

  const configQuery = useQuery({
    queryKey: ['configuracion'],
    queryFn: configuracionApi.get,
    staleTime: 5 * 60_000,
  });

  // Sync to global store whenever data loads
  useEffect(() => {
    if (configQuery.data) {
      setConfig({
        name: configQuery.data.nombreEmpresa || '',
        logoUrl: configQuery.data.logoUrl || '',
      });
    }
  }, [configQuery.data, setConfig]);

  const updateMutation = useMutation({
    mutationFn: configuracionApi.update,
    onSuccess: (data) => {
      queryClient.setQueryData(['configuracion'], data);
      setConfig({
        name: data.nombreEmpresa || '',
        logoUrl: data.logoUrl || '',
      });
    },
  });

  return {
    configuracion: configQuery.data,
    isLoading: configQuery.isLoading,
    isError: configQuery.isError,
    updateConfiguracion: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
