import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, RolRequest } from '../api/roles';

export const useRoles = () => {
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['empleados-roles'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RolRequest }) =>
      rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['empleados-roles'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['empleados-roles'] });
    },
  });

  return {
    roles: rolesQuery.data || [],
    isLoading: rolesQuery.isLoading,
    isError: rolesQuery.isError,
    createRol: createMutation.mutateAsync,
    updateRol: updateMutation.mutateAsync,
    deleteRol: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
