import api from './auth';

export interface AlertaStock {
  nombre: string;
  stock: number;
  stockMinimo: number;
}

export interface StockInsuficiente {
  producto: string;
  insumo: string;
  stock: number;
  cantidad: number;
}

export interface VentaDiaria {
  fecha: string;
  total: number;
  cantidad: number;
}

export interface ProductoPopular {
  producto: string;
  cantidad: number;
  total: number;
}

export interface ResumenFinanciero {
  totalVentas: number;
  baseImponible: number;
  igv: number;
  costoTotal: number;
  gananciaNeta: number;
}

export const reportesApi = {
  getAlertaStock: async (): Promise<AlertaStock[]> => {
    const response = await api.get('/reportes/alerta-stock');
    return response.data;
  },

  getStockInsuficiente: async (): Promise<StockInsuficiente[]> => {
    const response = await api.get('/reportes/stock-insuficiente');
    return response.data;
  },

  getVentasDiarias: async (): Promise<VentaDiaria[]> => {
    const response = await api.get('/reportes/ventas-diarias');
    return response.data;
  },

  getProductosPopulares: async (): Promise<ProductoPopular[]> => {
    const response = await api.get('/reportes/productos-populares');
    return response.data;
  },

  getResumenFinanciero: async (): Promise<ResumenFinanciero> => {
    const response = await api.get('/reportes/resumen-financiero');
    return response.data;
  }
};
