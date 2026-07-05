import api from './auth';

export interface MovimientoInventario {
  idMovimiento: number;
  tipoRecurso: 'INSUMO' | 'PRODUCTO';
  idInsumo?: number;
  nombreInsumo?: string;
  idLoteInsumo?: number;
  idLoteProducto?: number;
  fechaVencimientoLote?: string;
  idProducto?: number;
  nombreProducto?: string;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'CONSUMO';
  referenceType: string;
  referenceId?: number;
  cantidad: number;
  stockAnterior?: number;
  stockNuevo?: number;
  costoUnitario?: number;
  saldoValorizado?: number;
  motivo?: string;
  fecha: string;
  idEmpleado?: number;
  nombreEmpleado?: string;
}

export interface AjusteInventarioRequest {
  tipoRecurso: 'INSUMO' | 'PRODUCTO';
  idInsumo?: number;
  idProducto?: number;
  cantidad: number;
  motivo: string;
}

export const movimientosApi = {
  getAll: async (): Promise<MovimientoInventario[]> => {
    const response = await api.get('/inventario/movimientos');
    return response.data;
  },

  getByInsumo: async (idInsumo: number): Promise<MovimientoInventario[]> => {
    const response = await api.get(`/inventario/movimientos/insumo/${idInsumo}`);
    return response.data;
  },

  getByProducto: async (idProducto: number): Promise<MovimientoInventario[]> => {
    const response = await api.get(`/inventario/movimientos/producto/${idProducto}`);
    return response.data;
  },

  ajustar: async (data: AjusteInventarioRequest): Promise<MovimientoInventario> => {
    const response = await api.post('/inventario/ajustes', data);
    return response.data;
  },
};
