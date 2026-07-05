import type { ApiSchemas } from '../api/generated/openapi-types';

declare global {
  type AppCaja = ApiSchemas.CajaResponse;
  type AppMovimientoCaja = ApiSchemas.MovimientoCajaResponse;
  type AppPedido = ApiSchemas.PedidoResponse;
  type AppVenta = ApiSchemas.VentaResponse;
  type AppProducto = ApiSchemas.ProductoResponse;
  type AppCombo = ApiSchemas.ComboResponse;
  type AppComboDetalle = ApiSchemas.ComboDetalleResponse;
  type AppCliente = ApiSchemas.ClienteResponse;
  type AppRol = ApiSchemas.RolResponse;
  type AppEmpleadoSesion = ApiSchemas.EmpleadoSesionResponse;
  type AppEmpleadoActividad = ApiSchemas.EmpleadoActividadResponse;
  type AppSecurityAlert = ApiSchemas.SecurityAlertResponse;

  type AppUnknownRecord = Record<string, unknown>;
  type AppExportRow = Record<string, string | number | boolean | null | undefined>;

  interface AppApiErrorPayload {
    message?: string;
    validationErrors?: Record<string, string>;
  }

  interface AppApiErrorLike {
    response?: {
      status?: number;
      data?: AppApiErrorPayload | string;
    };
    config?: {
      url?: string;
    };
  }
}

export {};
