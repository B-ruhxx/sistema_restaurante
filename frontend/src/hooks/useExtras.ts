import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { extrasApi, ExtraProductoRequest } from '../api/extras';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useExtras = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const extrasQuery = useQuery({
    queryKey: ['extras'],
    queryFn: extrasApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: extrasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExtraProductoRequest }) =>
      extrasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: extrasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
    },
  });

  return {
    extras: extrasQuery.data || [],
    isLoading: extrasQuery.isLoading,
    isError: extrasQuery.isError,
    createExtra: createMutation.mutateAsync,
    updateExtra: updateMutation.mutateAsync,
    deleteExtra: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
