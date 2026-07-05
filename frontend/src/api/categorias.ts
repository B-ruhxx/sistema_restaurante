import api from './auth';

export interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion?: string;
  img?: string;
  imagenUrl?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface CategoriaRequest {
  nombre: string;
  descripcion?: string;
  img?: string;
  imagenUrl?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export type CategoriaEstadoFiltro = 'ACTIVO' | 'INACTIVO' | 'TODOS';

const normalizeCategoriaPayload = (data: CategoriaRequest) => ({
  nombre: data.nombre?.trim(),
  descripcion: data.descripcion?.trim() || null,
  imagenUrl: data.imagenUrl || data.img || null,
  estado: data.estado ?? 'ACTIVO',
});

export const categoriasApi = {
  getAll: async (estado: CategoriaEstadoFiltro = 'ACTIVO'): Promise<Categoria[]> => {
    const response = await api.get('/categorias', { params: { estado } });
    return response.data;
  },

  getById: async (id: number): Promise<Categoria> => {
    const response = await api.get(`/categorias/${id}`);
    return response.data;
  },

  create: async (data: CategoriaRequest): Promise<Categoria> => {
    const response = await api.post(
      '/categorias',
      normalizeCategoriaPayload(data)
    );
    return response.data;
  },

  update: async (id: number, data: CategoriaRequest): Promise<Categoria> => {
    const response = await api.put(
      `/categorias/${id}`,
      normalizeCategoriaPayload(data)
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categorias/${id}`);
  },

  updateEstado: async (id: number, estado: 'ACTIVO' | 'INACTIVO'): Promise<Categoria> => {
    const response = await api.patch(`/categorias/${id}/estado`, { estado });
    return response.data;
  },
};
