import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proveedoresApi, ProveedorRequest } from '../api/proveedores';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useProveedores = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const proveedoresQuery = useQuery({
    queryKey: ['proveedores'],
    queryFn: proveedoresApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: proveedoresApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProveedorRequest }) =>
      proveedoresApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: proveedoresApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
  });

  return {
    proveedores: proveedoresQuery.data || [],
    isLoading: proveedoresQuery.isLoading,
    isError: proveedoresQuery.isError,
    createProveedor: createMutation.mutateAsync,
    updateProveedor: updateMutation.mutateAsync,
    deleteProveedor: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
