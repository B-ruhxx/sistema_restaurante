import api from './auth';

export interface Producto {
  idProducto: number;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  precio: number;
  tipoProducto: 'PREPARADO' | 'INVENTARIO_DIRECTO';
  estado: 'ACTIVO' | 'INACTIVO';
  idCategoria?: number;
  nombreCategoria?: string;
}

export interface RecetaItemRequest {
  idInsumo: number;
  cantidad: number;
}

export interface ProductoRequest {
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  precio: number;
  tipoProducto: 'PREPARADO' | 'INVENTARIO_DIRECTO';
  estado?: 'ACTIVO' | 'INACTIVO';
  idCategoria?: number;
  stockInicial?: number;
  stockMinimo?: number;
  receta?: RecetaItemRequest[];
}

export interface InventarioProducto {
  idInventario: number;
  idProducto: number;
  nombreProducto: string;
  stock: number;
  stockMinimo: number;
}

export interface RecetaProducto {
  idReceta: number;
  idProducto: number;
  nombreProducto: string;
  idInsumo: number;
  nombreInsumo: string;
  unidadMedidaInsumo: string;
  cantidad: number;
}

export interface ProductoDetalle {
  producto: Producto;
  inventario?: InventarioProducto;
  receta?: RecetaProducto[];
}

export const productosApi = {
  getAll: async (): Promise<Producto[]> => {
    const response = await api.get('/productos');
    return response.data;
  },

  getById: async (id: number): Promise<ProductoDetalle> => {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  },

  create: async (data: ProductoRequest): Promise<ProductoDetalle> => {
    const response = await api.post('/productos', data);
    return response.data;
  },

  update: async (id: number, data: ProductoRequest): Promise<ProductoDetalle> => {
    const response = await api.put(`/productos/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/productos/${id}`);
  }
};
