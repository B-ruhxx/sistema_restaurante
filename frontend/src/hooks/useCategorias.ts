import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriasApi, Categoria, CategoriaEstadoFiltro, CategoriaRequest } from '../api/categorias';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

const EMPTY_ARRAY: Categoria[] = [];

type UseCategoriasOptions = PrivateQueryOptions & {
  estado?: CategoriaEstadoFiltro;
};

export const useCategorias = ({ enabled = true, estado = 'ACTIVO' }: UseCategoriasOptions = {}) => {
  const queryClient = useQueryClient();
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const categoriasQuery = useQuery({
    queryKey: ['categorias', estado],
    queryFn: () => categoriasApi.getAll(estado),
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: categoriasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoriaRequest }) =>
      categoriasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: 'ACTIVO' | 'INACTIVO' }) =>
      categoriasApi.updateEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });

  return {
    categorias: categoriasQuery.data || EMPTY_ARRAY,
    isLoading: categoriasQuery.isLoading,
    isError: categoriasQuery.isError,
    createCategoria: createMutation.mutateAsync,
    updateCategoria: updateMutation.mutateAsync,
    deleteCategoria: deleteMutation.mutateAsync,
    updateCategoriaEstado: updateEstadoMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingEstado: updateEstadoMutation.isPending,
  };
};
