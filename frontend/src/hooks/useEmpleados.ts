import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empleadosApi, EmpleadoRequest } from '../api/empleados';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useEmpleados = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const empleadosQuery = useQuery({
    queryKey: ['empleados'],
    queryFn: empleadosApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const rolesQuery = useQuery({
    queryKey: ['empleados-roles'],
    queryFn: empleadosApi.getRoles,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: empleadosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmpleadoRequest }) =>
      empleadosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: empleadosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
    },
  });

  const getSesionesEmpleado = (id: number) => empleadosApi.getSesiones(id);
  const getActividadEmpleado = (id: number) => empleadosApi.getActividad(id);

  return {
    empleados: empleadosQuery.data || [],
    roles: rolesQuery.data || [],
    isLoading: empleadosQuery.isLoading || rolesQuery.isLoading,
    isError: empleadosQuery.isError || rolesQuery.isError,
    createEmpleado: createMutation.mutateAsync,
    updateEmpleado: updateMutation.mutateAsync,
    deleteEmpleado: deleteMutation.mutateAsync,
    getSesionesEmpleado,
    getActividadEmpleado,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
