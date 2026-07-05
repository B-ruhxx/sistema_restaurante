SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS vista_alerta_producto_sku;
DROP VIEW IF EXISTS vista_alerta_insumo;
DROP VIEW IF EXISTS vista_stock_padre;
DROP VIEW IF EXISTS vista_stock_producto_sku;

DROP TABLE IF EXISTS alerta_seguridad;
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS movimiento_caja;
DROP TABLE IF EXISTS venta_pago;
DROP TABLE IF EXISTS detalle_venta;
DROP TABLE IF EXISTS venta;
DROP TABLE IF EXISTS precuenta;
DROP TABLE IF EXISTS pedido_estado_historial;
DROP TABLE IF EXISTS pedido_extra;
DROP TABLE IF EXISTS detalle_pedido;
DROP TABLE IF EXISTS pedido;
DROP TABLE IF EXISTS consumo_insumo_venta;
DROP TABLE IF EXISTS movimiento_inventario;
DROP TABLE IF EXISTS ajuste_inventario;
DROP TABLE IF EXISTS lote_producto;
DROP TABLE IF EXISTS lote_insumo;
DROP TABLE IF EXISTS detalle_compra_insumo;
DROP TABLE IF EXISTS compra_insumo;
DROP TABLE IF EXISTS combo_detalle;
DROP TABLE IF EXISTS combo_producto;
DROP TABLE IF EXISTS extra_producto;
DROP TABLE IF EXISTS receta_producto;
DROP TABLE IF EXISTS producto;
DROP TABLE IF EXISTS insumo;
DROP TABLE IF EXISTS proveedor;
DROP TABLE IF EXISTS mesa;
DROP TABLE IF EXISTS cliente;
DROP TABLE IF EXISTS categoria;
DROP TABLE IF EXISTS metodo_pago;
DROP TABLE IF EXISTS caja;
DROP TABLE IF EXISTS sesion_usuario;
DROP TABLE IF EXISTS rol_permiso;
DROP TABLE IF EXISTS permiso;
DROP TABLE IF EXISTS empleado;
DROP TABLE IF EXISTS rol;
DROP TABLE IF EXISTS configuracion_empresa;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE configuracion_empresa (
    id_configuracion INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empresa VARCHAR(150) NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    ruc VARCHAR(11),
    direccion VARCHAR(255),
    telefono VARCHAR(30),
    email VARCHAR(120),
    logo_url VARCHAR(255),
    moneda VARCHAR(10) NOT NULL DEFAULT 'PEN',
    igv DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    serie_boleta VARCHAR(10),
    serie_factura VARCHAR(10),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_configuracion_empresa_ruc UNIQUE (ruc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rol (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_rol_nombre UNIQUE (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permiso (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    modulo VARCHAR(60) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_permiso_codigo UNIQUE (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rol_permiso (
    id_rol INT NOT NULL,
    id_permiso INT NOT NULL,
    PRIMARY KEY (id_rol, id_permiso),
    CONSTRAINT fk_rol_permiso_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rol_permiso_permiso FOREIGN KEY (id_permiso) REFERENCES permiso(id_permiso) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE empleado (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL,
    email VARCHAR(120),
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(30),
    avatar_url VARCHAR(255),
    id_rol INT NOT NULL,
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    ultimo_login DATETIME,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_empleado_usuario UNIQUE (usuario),
    CONSTRAINT uk_empleado_email UNIQUE (email),
    CONSTRAINT fk_empleado_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sesion_usuario (
    id_sesion BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip VARCHAR(45),
    user_agent VARCHAR(255),
    fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NOT NULL,
    fecha_cierre DATETIME,
    estado ENUM('ACTIVA','EXPIRADA','CERRADA','REVOCADA') NOT NULL DEFAULT 'ACTIVA',
    CONSTRAINT uk_sesion_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_sesion_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE caja (
    id_caja INT AUTO_INCREMENT PRIMARY KEY,
    fecha_apertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre DATETIME,
    monto_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_final DECIMAL(10,2),
    saldo_esperado DECIMAL(10,2),
    diferencia DECIMAL(10,2),
    estado ENUM('ABIERTA','CERRADA') NOT NULL DEFAULT 'ABIERTA',
    id_empleado_apertura INT NOT NULL,
    id_empleado_cierre INT,
    observacion TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_caja_empleado_apertura FOREIGN KEY (id_empleado_apertura) REFERENCES empleado(id_empleado),
    CONSTRAINT fk_caja_empleado_cierre FOREIGN KEY (id_empleado_cierre) REFERENCES empleado(id_empleado),
    CONSTRAINT chk_caja_montos CHECK (monto_inicial >= 0 AND (monto_final IS NULL OR monto_final >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE metodo_pago (
    id_metodo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    requiere_referencia BOOLEAN NOT NULL DEFAULT FALSE,
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_metodo_pago_codigo UNIQUE (codigo),
    CONSTRAINT uk_metodo_pago_nombre UNIQUE (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    imagen_url VARCHAR(255),
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_categoria_nombre UNIQUE (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento ENUM('DNI','RUC','CE','PASAPORTE','SIN_DOCUMENTO') NOT NULL DEFAULT 'SIN_DOCUMENTO',
    numero_documento VARCHAR(20),
    nombre VARCHAR(120) NOT NULL,
    apellido VARCHAR(120),
    razon_social VARCHAR(180),
    telefono VARCHAR(30),
    email VARCHAR(120),
    direccion VARCHAR(255),
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_cliente_documento UNIQUE (tipo_documento, numero_documento),
    CONSTRAINT chk_cliente_documento CHECK (
        (tipo_documento = 'SIN_DOCUMENTO' AND numero_documento IS NULL)
        OR (tipo_documento <> 'SIN_DOCUMENTO' AND numero_documento IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mesa (
    id_mesa INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL,
    capacidad INT NOT NULL,
    ubicacion VARCHAR(80),
    estado ENUM('DISPONIBLE','ATENCION','EN_COCINA','SERVIDO','CUENTA','BLOQUEADA') NOT NULL DEFAULT 'DISPONIBLE',
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_mesa_numero UNIQUE (numero),
    CONSTRAINT chk_mesa_capacidad CHECK (capacidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proveedor (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    ruc VARCHAR(11),
    telefono VARCHAR(30),
    email VARCHAR(120),
    direccion VARCHAR(255),
    contacto VARCHAR(120),
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_proveedor_ruc UNIQUE (ruc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE insumo (
    id_insumo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL,
    costo_promedio DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    stock_minimo DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_insumo_nombre UNIQUE (nombre),
    CONSTRAINT chk_insumo_costos CHECK (costo_promedio >= 0 AND stock_minimo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT,
    sku VARCHAR(60),
    es_sku BOOLEAN NOT NULL DEFAULT TRUE,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255),
    precio DECIMAL(10,2),
    tipo_producto ENUM('PREPARADO','INVENTARIO_DIRECTO'),
    tiempo_preparacion_minutos INT,
    stock_minimo DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    id_categoria INT,
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_producto_sku UNIQUE (sku),
    CONSTRAINT fk_producto_padre FOREIGN KEY (parent_id) REFERENCES producto(id_producto) ON UPDATE CASCADE,
    CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria) ON UPDATE CASCADE,
    CONSTRAINT chk_producto_valores CHECK ((precio IS NULL OR precio > 0) AND (tiempo_preparacion_minutos IS NULL OR tiempo_preparacion_minutos > 0) AND stock_minimo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE receta_producto (
    id_receta INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_insumo INT NOT NULL,
    cantidad DECIMAL(12,3) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_receta_producto_insumo UNIQUE (id_producto, id_insumo),
    CONSTRAINT fk_receta_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_receta_insumo FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo) ON UPDATE CASCADE,
    CONSTRAINT chk_receta_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE extra_producto (
    id_extra INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    id_insumo INT NOT NULL,
    cantidad_consumida DECIMAL(12,3) NOT NULL,
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_extra_nombre UNIQUE (nombre),
    CONSTRAINT fk_extra_insumo FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo) ON UPDATE CASCADE,
    CONSTRAINT chk_extra_valores CHECK (precio >= 0 AND cantidad_consumida > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE combo_producto (
    id_combo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen_url VARCHAR(255),
    etiqueta VARCHAR(80),
    valido_hasta DATE,
    estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_combo_nombre UNIQUE (nombre),
    CONSTRAINT chk_combo_precio CHECK (precio > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE combo_detalle (
    id_combo_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_combo INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_combo_producto UNIQUE (id_combo, id_producto),
    CONSTRAINT fk_combo_detalle_combo FOREIGN KEY (id_combo) REFERENCES combo_producto(id_combo) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_combo_detalle_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON UPDATE CASCADE,
    CONSTRAINT chk_combo_detalle_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE compra_insumo (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_proveedor INT NOT NULL,
    numero_documento VARCHAR(60) NOT NULL,
    fecha_compra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    igv DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('REGISTRADA','ANULADA') NOT NULL DEFAULT 'REGISTRADA',
    id_empleado INT NOT NULL,
    observacion TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_compra_documento UNIQUE (id_proveedor, numero_documento),
    CONSTRAINT fk_compra_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor) ON UPDATE CASCADE,
    CONSTRAINT fk_compra_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    CONSTRAINT chk_compra_totales CHECK (subtotal >= 0 AND igv >= 0 AND total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_compra_insumo (
    id_detalle_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT NOT NULL,
    id_insumo INT,
    id_producto INT,
    cantidad DECIMAL(12,3) NOT NULL,
    costo_unitario DECIMAL(10,4) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    numero_lote VARCHAR(80) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_detalle_compra FOREIGN KEY (id_compra) REFERENCES compra_insumo(id_compra) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_compra_insumo FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo) ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_compra_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON UPDATE CASCADE,
    CONSTRAINT chk_detalle_compra_valores CHECK (cantidad > 0 AND costo_unitario >= 0 AND subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lote_insumo (
    id_lote_insumo INT AUTO_INCREMENT PRIMARY KEY,
    id_insumo INT NOT NULL,
    id_detalle_compra INT NOT NULL,
    numero_lote VARCHAR(80) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    cantidad_inicial DECIMAL(12,3) NOT NULL,
    cantidad_disponible DECIMAL(12,3) NOT NULL,
    costo_unitario DECIMAL(10,4) NOT NULL,
    estado ENUM('DISPONIBLE','AGOTADO','VENCIDO','ANULADO') NOT NULL DEFAULT 'DISPONIBLE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_lote_insumo UNIQUE (id_insumo, numero_lote),
    CONSTRAINT fk_lote_insumo_insumo FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo) ON UPDATE CASCADE,
    CONSTRAINT fk_lote_insumo_detalle FOREIGN KEY (id_detalle_compra) REFERENCES detalle_compra_insumo(id_detalle_compra),
    CONSTRAINT chk_lote_insumo_cantidades CHECK (cantidad_inicial > 0 AND cantidad_disponible >= 0 AND cantidad_disponible <= cantidad_inicial AND costo_unitario >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lote_producto (
    id_lote_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_detalle_compra INT NOT NULL,
    numero_lote VARCHAR(80) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    cantidad_inicial INT NOT NULL,
    cantidad_disponible INT NOT NULL,
    costo_unitario DECIMAL(10,4) NOT NULL,
    estado ENUM('DISPONIBLE','AGOTADO','VENCIDO','ANULADO') NOT NULL DEFAULT 'DISPONIBLE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_lote_producto UNIQUE (id_producto, numero_lote),
    CONSTRAINT fk_lote_producto_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON UPDATE CASCADE,
    CONSTRAINT fk_lote_producto_detalle FOREIGN KEY (id_detalle_compra) REFERENCES detalle_compra_insumo(id_detalle_compra),
    CONSTRAINT chk_lote_producto_cantidades CHECK (cantidad_inicial > 0 AND cantidad_disponible >= 0 AND cantidad_disponible <= cantidad_inicial AND costo_unitario >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ajuste_inventario (
    id_ajuste INT AUTO_INCREMENT PRIMARY KEY,
    tipo_recurso ENUM('INSUMO','PRODUCTO') NOT NULL,
    id_insumo INT,
    id_producto INT,
    cantidad DECIMAL(12,3) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    estado ENUM('REGISTRADO','ANULADO') NOT NULL DEFAULT 'REGISTRADO',
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_empleado INT NOT NULL,
    CONSTRAINT fk_ajuste_inv_insumo FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo) ON UPDATE CASCADE,
    CONSTRAINT fk_ajuste_inv_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON UPDATE CASCADE,
    CONSTRAINT fk_ajuste_inv_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    CONSTRAINT chk_ajuste_inv_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movimiento_inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    tipo_recurso ENUM('INSUMO','PRODUCTO') NOT NULL,
    id_insumo INT,
    id_lote_insumo INT,
    id_producto INT,
    id_lote_producto INT,
    tipo_movimiento ENUM('ENTRADA_COMPRA','SALIDA_VENTA','SALIDA_AJUSTE','ENTRADA_ANULACION','MERMA','DEVOLUCION','CORRECCION') NOT NULL,
    reference_type VARCHAR(40) NOT NULL,
    reference_id INT NOT NULL,
    cantidad DECIMAL(12,3) NOT NULL,
    stock_anterior DECIMAL(12,3) NOT NULL,
    stock_nuevo DECIMAL(12,3) NOT NULL,
    costo_unitario DECIMAL(10,4),
    saldo_valorizado DECIMAL(12,2),
    motivo VARCHAR(255) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_empleado INT NOT NULL,
    CONSTRAINT fk_mov_inv_insumo FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo) ON UPDATE CASCADE,
    CONSTRAINT fk_mov_inv_lote_insumo FOREIGN KEY (id_lote_insumo) REFERENCES lote_insumo(id_lote_insumo),
    CONSTRAINT fk_mov_inv_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON UPDATE CASCADE,
    CONSTRAINT fk_mov_inv_lote_producto FOREIGN KEY (id_lote_producto) REFERENCES lote_producto(id_lote_producto),
    CONSTRAINT fk_mov_inv_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    CONSTRAINT chk_mov_inv_cantidad CHECK (cantidad > 0 AND stock_anterior >= 0 AND stock_nuevo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_mesa INT NOT NULL,
    id_cliente INT,
    estado ENUM('BORRADOR_ATENCION','EN_COCINA','LISTO','SERVIDO','CUENTA','CERRADO','CANCELADO') NOT NULL DEFAULT 'BORRADOR_ATENCION',
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fecha_apertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_envio_cocina DATETIME,
    fecha_servicio DATETIME,
    fecha_cuenta DATETIME,
    fecha_cierre DATETIME,
    tiempo_estimado_minutos INT,
    tiempo_real_minutos INT,
    id_empleado_apertura INT NOT NULL,
    id_empleado_cierre INT,
    motivo_cancelacion VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_mesa FOREIGN KEY (id_mesa) REFERENCES mesa(id_mesa),
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente),
    CONSTRAINT fk_pedido_empleado_apertura FOREIGN KEY (id_empleado_apertura) REFERENCES empleado(id_empleado),
    CONSTRAINT fk_pedido_empleado_cierre FOREIGN KEY (id_empleado_cierre) REFERENCES empleado(id_empleado),
    CONSTRAINT chk_pedido_total CHECK (total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_pedido (
    id_detalle_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT,
    id_combo INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    observacion TEXT,
    requiere_preparacion BOOLEAN NOT NULL DEFAULT FALSE,
    estado_cocina ENUM('PENDIENTE','EN_PREPARACION','LISTO','CANCELADO'),
    fecha_inicio_preparacion DATETIME,
    fecha_fin_preparacion DATETIME,
    tiempo_estimado_minutos INT,
    tiempo_real_minutos INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_detalle_pedido_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_pedido_combo FOREIGN KEY (id_combo) REFERENCES combo_producto(id_combo) ON UPDATE CASCADE,
    CONSTRAINT chk_detalle_pedido_valores CHECK (cantidad > 0 AND precio_unitario >= 0 AND subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedido_extra (
    id_pedido_extra INT AUTO_INCREMENT PRIMARY KEY,
    id_detalle_pedido INT NOT NULL,
    id_extra INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_pedido_extra_detalle FOREIGN KEY (id_detalle_pedido) REFERENCES detalle_pedido(id_detalle_pedido) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pedido_extra_extra FOREIGN KEY (id_extra) REFERENCES extra_producto(id_extra) ON UPDATE CASCADE,
    CONSTRAINT chk_pedido_extra_valores CHECK (cantidad > 0 AND precio_unitario >= 0 AND subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedido_estado_historial (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    estado ENUM('BORRADOR_ATENCION','EN_COCINA','LISTO','SERVIDO','CUENTA','CERRADO','CANCELADO') NOT NULL,
    id_empleado INT NOT NULL,
    motivo VARCHAR(255),
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_historial_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE precuenta (
    id_precuenta INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    numero VARCHAR(50) NOT NULL,
    version_pedido BIGINT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('EMITIDA','INVALIDADA_POR_ADICION','CONVERTIDA_VENTA','ANULADA') NOT NULL DEFAULT 'EMITIDA',
    emitido_por INT NOT NULL,
    fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_invalidacion DATETIME,
    motivo_invalidacion VARCHAR(255),
    CONSTRAINT uk_precuenta_numero UNIQUE (numero),
    CONSTRAINT fk_precuenta_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
    CONSTRAINT fk_precuenta_empleado FOREIGN KEY (emitido_por) REFERENCES empleado(id_empleado),
    CONSTRAINT chk_precuenta_totales CHECK (subtotal >= 0 AND igv >= 0 AND total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE venta (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    id_cliente INT,
    id_caja INT NOT NULL,
    tipo_comprobante ENUM('BOLETA','FACTURA','TICKET') NOT NULL DEFAULT 'TICKET',
    serie VARCHAR(10) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    fecha_venta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('EMITIDA','ANULADA') NOT NULL DEFAULT 'EMITIDA',
    id_empleado INT NOT NULL,
    motivo_anulacion VARCHAR(255),
    fecha_anulacion DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_venta_comprobante UNIQUE (tipo_comprobante, serie, numero),
    CONSTRAINT fk_venta_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
    CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente),
    CONSTRAINT fk_venta_caja FOREIGN KEY (id_caja) REFERENCES caja(id_caja),
    CONSTRAINT fk_venta_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    CONSTRAINT chk_venta_totales CHECK (subtotal >= 0 AND igv >= 0 AND total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_venta (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_detalle_pedido INT,
    id_producto INT,
    id_combo INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_detalle_venta_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_venta_detalle_pedido FOREIGN KEY (id_detalle_pedido) REFERENCES detalle_pedido(id_detalle_pedido),
    CONSTRAINT fk_detalle_venta_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_venta_combo FOREIGN KEY (id_combo) REFERENCES combo_producto(id_combo) ON UPDATE CASCADE,
    CONSTRAINT chk_detalle_venta_valores CHECK (cantidad > 0 AND precio_unitario >= 0 AND costo_unitario >= 0 AND subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE consumo_insumo_venta (
    id_consumo INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_detalle_venta INT NOT NULL,
    id_insumo INT NOT NULL,
    id_lote_insumo INT,
    cantidad DECIMAL(12,3) NOT NULL,
    costo_unitario DECIMAL(10,4) NOT NULL,
    costo_total DECIMAL(10,2) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_consumo_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta),
    CONSTRAINT fk_consumo_detalle_venta FOREIGN KEY (id_detalle_venta) REFERENCES detalle_venta(id_detalle),
    CONSTRAINT fk_consumo_insumo FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo),
    CONSTRAINT fk_consumo_lote_insumo FOREIGN KEY (id_lote_insumo) REFERENCES lote_insumo(id_lote_insumo),
    CONSTRAINT chk_consumo_valores CHECK (cantidad > 0 AND costo_unitario >= 0 AND costo_total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE venta_pago (
    id_venta_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_metodo INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    referencia VARCHAR(120),
    estado ENUM('APROBADO','ANULADO','RECHAZADO') NOT NULL DEFAULT 'APROBADO',
    fecha_pago DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_venta_pago_venta FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_venta_pago_metodo FOREIGN KEY (id_metodo) REFERENCES metodo_pago(id_metodo),
    CONSTRAINT chk_venta_pago_monto CHECK (monto > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movimiento_caja (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_caja INT NOT NULL,
    tipo ENUM('INGRESO','EGRESO') NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(40) NOT NULL,
    reference_id INT NOT NULL,
    comprobante VARCHAR(80) NOT NULL,
    id_empleado INT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mov_caja_caja FOREIGN KEY (id_caja) REFERENCES caja(id_caja),
    CONSTRAINT fk_mov_caja_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    CONSTRAINT chk_mov_caja_monto CHECK (monto > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria (
    id_auditoria BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT,
    entidad VARCHAR(80) NOT NULL,
    id_registro VARCHAR(80) NOT NULL,
    accion ENUM('CREAR','ACTUALIZAR','ELIMINAR','ANULAR','LOGIN','LOGOUT','ERROR','OTRO') NOT NULL,
    resumen VARCHAR(255),
    detalle JSON,
    ip VARCHAR(45),
    user_agent VARCHAR(255),
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditoria_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE alerta_seguridad (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('INFO','WARNING','ERROR') NOT NULL,
    titulo VARCHAR(120) NOT NULL,
    descripcion TEXT NOT NULL,
    id_empleado INT,
    usuario VARCHAR(100),
    ip VARCHAR(100),
    estado ENUM('ABIERTA','RESUELTA') NOT NULL DEFAULT 'ABIERTA',
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alerta_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_producto_parent ON producto(parent_id);
CREATE INDEX idx_producto_categoria_estado ON producto(id_categoria, estado);
CREATE INDEX idx_lote_insumo_fifo ON lote_insumo(id_insumo, estado, fecha_vencimiento, id_lote_insumo);
CREATE INDEX idx_lote_producto_fifo ON lote_producto(id_producto, estado, fecha_vencimiento, id_lote_producto);
CREATE INDEX idx_ajuste_inv_fecha ON ajuste_inventario(fecha, id_ajuste);
CREATE INDEX idx_mov_inv_recurso_fecha ON movimiento_inventario(tipo_recurso, id_insumo, id_producto, fecha, id_movimiento);
CREATE INDEX idx_pedido_mesa_estado ON pedido(id_mesa, estado);
CREATE INDEX idx_detalle_pedido_producto ON detalle_pedido(id_producto);
CREATE INDEX idx_detalle_pedido_combo ON detalle_pedido(id_combo);
CREATE INDEX idx_mov_caja_fecha ON movimiento_caja(fecha, id_movimiento);
CREATE INDEX idx_venta_fecha_estado ON venta(fecha_venta, estado);

CREATE VIEW vista_stock_producto_sku AS
SELECT
    p.id_producto,
    p.parent_id,
    p.sku,
    p.nombre,
    p.tipo_producto,
    COALESCE(SUM(CASE WHEN lp.estado = 'DISPONIBLE' THEN lp.cantidad_disponible ELSE 0 END), 0) AS stock_disponible,
    p.stock_minimo
FROM producto p
LEFT JOIN lote_producto lp ON lp.id_producto = p.id_producto
WHERE p.es_sku = TRUE
GROUP BY p.id_producto, p.parent_id, p.sku, p.nombre, p.tipo_producto, p.stock_minimo;

CREATE VIEW vista_stock_padre AS
SELECT
    padre.id_producto,
    padre.nombre,
    COALESCE(SUM(vs.stock_disponible), 0) AS stock_total,
    MIN(hijo.precio) AS precio_minimo,
    MAX(hijo.precio) AS precio_maximo
FROM producto padre
LEFT JOIN producto hijo ON hijo.parent_id = padre.id_producto AND hijo.estado = 'ACTIVO'
LEFT JOIN vista_stock_producto_sku vs ON vs.id_producto = hijo.id_producto
WHERE padre.es_sku = FALSE
GROUP BY padre.id_producto, padre.nombre;

CREATE VIEW vista_alerta_insumo AS
SELECT
    i.id_insumo,
    i.nombre,
    COALESCE(SUM(CASE WHEN li.estado = 'DISPONIBLE' THEN li.cantidad_disponible ELSE 0 END), 0) AS stock_disponible,
    i.stock_minimo
FROM insumo i
LEFT JOIN lote_insumo li ON li.id_insumo = i.id_insumo
WHERE i.estado = 'ACTIVO'
GROUP BY i.id_insumo, i.nombre, i.stock_minimo
HAVING stock_disponible <= i.stock_minimo;

CREATE VIEW vista_alerta_producto_sku AS
SELECT
    id_producto,
    sku,
    nombre,
    stock_disponible,
    stock_minimo
FROM vista_stock_producto_sku
WHERE stock_disponible <= stock_minimo;
