import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { combosApi, ComboRequest } from '../api/combos';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

const EMPTY_ARRAY: any[] = [];

export const useCombos = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const combosQuery = useQuery({
    queryKey: ['combos'],
    queryFn: combosApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: combosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ComboRequest }) =>
      combosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: combosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });

  return {
    combos: combosQuery.data || EMPTY_ARRAY,
    isLoading: combosQuery.isLoading,
    isError: combosQuery.isError,
    createCombo: createMutation.mutateAsync,
    updateCombo: updateMutation.mutateAsync,
    deleteCombo: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
