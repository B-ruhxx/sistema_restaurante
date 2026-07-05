import api from './auth';

export interface Producto {
  idProducto: number;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  precio: number;
  tipoProducto: 'PREPARADO' | 'INVENTARIO_DIRECTO';
  tiempoPreparacionMinutos?: number;
  estado: 'ACTIVO' | 'INACTIVO';
  idCategoria?: number;
  nombreCategoria?: string;
  idProductoPadre?: number;
  nombreProductoPadre?: string;
  sku?: string;
  esSku?: boolean;
  tieneSkus?: boolean;
  stockActual?: number;
  stockTotal?: number;
  stockMinimo?: number;
  lotesDisponibles?: number;
  proximoVencimiento?: string;
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
  tiempoPreparacionMinutos?: number;
  estado?: 'ACTIVO' | 'INACTIVO';
  idCategoria?: number;
  idProductoPadre?: number;
  sku?: string;
  esSku?: boolean;
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
  idVariante?: number;
  nombreVariante?: string;
  idInsumo: number;
  nombreInsumo: string;
  unidadMedidaInsumo: string;
  cantidad: number;
  tiempoPreparacionMinutos?: number;
}

export interface ProductoDetalle {
  producto: Producto;
  inventario?: InventarioProducto;
  receta?: RecetaProducto[];
}

export interface LoteProducto {
  idLoteProducto: number;
  idProducto: number;
  nombreProducto: string;
  skuProducto?: string;
  cantidadInicial: number;
  cantidadDisponible: number;
  costoUnitario: number;
  fechaVencimiento: string;
  estado: 'DISPONIBLE' | 'AGOTADO';
  idCompra?: number;
  codigoCompra?: string;
  proveedorNombre?: string;
  fechaCompra?: string;
}

export type ProductoEstadoFiltro = 'ACTIVO' | 'INACTIVO' | 'TODOS';

export const productosApi = {
  getAll: async (estado: ProductoEstadoFiltro = 'ACTIVO'): Promise<Producto[]> => {
    const response = await api.get('/productos', { params: { estado } });
    return response.data;
  },

  getById: async (id: number): Promise<ProductoDetalle> => {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  },

  getLotes: async (id: number): Promise<LoteProducto[]> => {
    const response = await api.get(`/productos/${id}/lotes`);
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
  },

  updateEstado: async (id: number, estado: 'ACTIVO' | 'INACTIVO'): Promise<Producto> => {
    const response = await api.patch(`/productos/${id}/estado`, { estado });
    return response.data;
  },
};
