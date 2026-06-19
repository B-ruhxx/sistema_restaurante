import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empleadosApi, EmpleadoRequest } from '../api/empleados';

export const useEmpleados = () => {
  const queryClient = useQueryClient();

  const empleadosQuery = useQuery({
    queryKey: ['empleados'],
    queryFn: empleadosApi.getAll,
  });

  const rolesQuery = useQuery({
    queryKey: ['empleados-roles'],
    queryFn: empleadosApi.getRoles,
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

  return {
    empleados: empleadosQuery.data || [],
    roles: rolesQuery.data || [],
    isLoading: empleadosQuery.isLoading || rolesQuery.isLoading,
    isError: empleadosQuery.isError || rolesQuery.isError,
    createEmpleado: createMutation.mutateAsync,
    updateEmpleado: updateMutation.mutateAsync,
    deleteEmpleado: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
