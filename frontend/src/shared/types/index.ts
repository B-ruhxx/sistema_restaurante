// ============================================================
// TIPOS GLOBALES — Sistema ERP Restaurante
// Actualizado con imagen_url, avatar_url, logo_url
// ============================================================

export interface Rol {
  idRol?: number;
  nombre: string;
  descripcion?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface Permiso {
  idPermiso?: number;
  nombre: string;
  descripcion?: string;
}

export interface Empleado {
  idEmpleado?: number;
  nombre: string;
  apellido: string;
  username: string;
  passwordHash?: string;
  telefono?: string;
  email?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  rol?: Rol;
  avatar_url?: string;
  avatarUrl?: string;
}

export interface SesionUsuario {
  idSesion?: number;
  empleado: Empleado;
  fechaLogin?: string;
  fechaLogout?: string;
  ip?: string;
}

export interface Cliente {
  idCliente?: number;
  nombre?: string;
  apellido?: string;
  tipoDocumento?: 'DNI' | 'RUC' | 'CE';
  documentoIdentidad?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface Proveedor {
  idProveedor?: number;
  razonSocial: string;
  nombreComercial?: string;
  ruc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contactoPrincipal?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface Categoria {
  idCategoria?: number;
  nombre: string;
  descripcion?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  imagen_url?: string;
  imagenUrl?: string;
}

export interface Insumo {
  idInsumo?: number;
  nombre: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  costoPromedio?: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface Producto {
  idProducto?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  tipoProducto: 'PREPARADO' | 'INVENTARIO_DIRECTO';
  estado?: 'ACTIVO' | 'INACTIVO';
  categoria?: Categoria;
  imagen_url?: string;
  imagenUrl?: string;
}

export interface InventarioProducto {
  idInventario?: number;
  producto: Producto;
  stock: number;
  stockMinimo: number;
}

export interface RecetaProducto {
  idReceta?: number;
  producto: Producto;
  insumo: Insumo;
  cantidad: number;
}

export interface ComboProducto {
  idCombo?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface ComboDetalle {
  idComboDetalle?: number;
  combo: ComboProducto;
  producto: Producto;
  cantidad: number;
}

export interface ExtraProducto {
  idExtra?: number;
  nombre: string;
  precio: number;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface MetodoPago {
  idMetodoPago?: number;
  nombre: string;
  requiereOperacion?: boolean;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface Caja {
  idCaja?: number;
  empleado: Empleado;
  estado: 'ABIERTA' | 'CERRADA';
  montoApertura: number;
  montoCierre?: number;
  montoSistema?: number;
  diferencia?: number;
  observacion?: string;
  fechaApertura?: string;
  fechaCierre?: string;
}

export interface MovimientoCaja {
  idMovimiento?: number;
  caja: Caja;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  fecha?: string;
}

export interface Pedido {
  idPedido?: number;
  empleado: Empleado;
  cliente?: Cliente;
  estado: 'PENDIENTE' | 'EN_COCINA' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
  fecha?: string;
}

export interface DetallePedido {
  idDetallePedido?: number;
  pedido: Pedido;
  producto?: Producto;
  combo?: ComboProducto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observacion?: string;
}

export interface Venta {
  idVenta?: number;
  codigoVenta?: string;
  fecha?: string;
  subtotal: number;
  subtotalGravado: number;
  igv: number;
  igvPorcentaje: number;
  total: number;
  tipoComprobante: 'BOLETA' | 'FACTURA';
  serie?: string;
  correlativo?: string;
  estado: 'PENDIENTE' | 'PAGADA' | 'ANULADA';
  pedido?: Pedido;
  empleado: Empleado;
}

export interface VentaPago {
  idVentaPago?: number;
  venta: Venta;
  metodoPago: MetodoPago;
  monto: number;
  numeroOperacion?: string;
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}

export interface ConfiguracionEmpresa {
  idConfiguracion?: number;
  nombreEmpresa: string;
  razonSocial?: string;
  ruc: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  moneda?: string;
  igv?: number;
  serieBoleta?: string;
  serieFactura?: string;
  logo_url?: string;
  logoUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    idEmpleado: number;
    nombre: string;
    apellido: string;
    username: string;
    rol: string;
  };
}

export interface AlertaStockDto {
  nombre: string;
  stock: number;
  stockMinimo: number;
}

export interface StockInsuficienteDto {
  producto: string;
  insumo: string;
  stock: number;
  cantidadNecesaria: number;
}

export interface UploadResponse {
  filename: string;
  url: string;
  size?: number;
  contentType?: string;
}
