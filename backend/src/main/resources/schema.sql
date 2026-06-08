-- =====================================================
-- ERP RESTAURANTE 
-- =====================================================

DROP DATABASE IF EXISTS sistema_restaurante;
CREATE DATABASE sistema_restaurante;
USE sistema_restaurante;

-- =====================================================
-- CONFIGURACIÓN GLOBAL
-- =====================================================

CREATE TABLE configuracion_empresa (
    id_configuracion INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empresa VARCHAR(150) NOT NULL,
    razon_social VARCHAR(150),
    ruc VARCHAR(20) NOT NULL,
    logo_url VARCHAR(255) NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(100),
    moneda VARCHAR(10) DEFAULT 'PEN',
    igv DECIMAL(5,2) DEFAULT 18.00,
    serie_boleta VARCHAR(10),
    serie_factura VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- SEGURIDAD
-- =====================================================

CREATE TABLE rol (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permiso (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
) ENGINE=InnoDB;

CREATE TABLE rol_permiso (
    id_rol INT NOT NULL,
    id_permiso INT NOT NULL,
    PRIMARY KEY(id_rol, id_permiso),
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol),
    FOREIGN KEY (id_permiso) REFERENCES permiso(id_permiso)
) ENGINE=InnoDB;

CREATE TABLE empleado (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    avatar_url VARCHAR(255) NULL,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    id_rol INT NOT NULL,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
) ENGINE=InnoDB;

CREATE TABLE sesion_usuario (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    fecha_login DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_logout DATETIME NULL,
    ip VARCHAR(100),
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
) ENGINE=InnoDB;

-- =====================================================
-- CLIENTES
-- =====================================================

CREATE TABLE cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50),
    apellido VARCHAR(50),
    tipo_documento ENUM('DNI', 'RUC', 'CE') DEFAULT 'DNI',
    documento_identidad VARCHAR(20),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion VARCHAR(255),
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- CATÁLOGOS
-- =====================================================

CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    imagen_url VARCHAR(255) NULL,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE metodo_pago (
    id_metodo_pago INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50),
    requiere_operacion BOOLEAN DEFAULT FALSE,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO'
) ENGINE=InnoDB;

CREATE TABLE extra_producto (
    id_extra INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    CONSTRAINT chk_extra_precio CHECK (precio >= 0)
) ENGINE=InnoDB;

-- =====================================================
-- PROVEEDORES
-- =====================================================

CREATE TABLE proveedor (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    nombre_comercial VARCHAR(150),
    ruc VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion VARCHAR(255),
    contacto_principal VARCHAR(100),
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO'
) ENGINE=InnoDB;

-- =====================================================
-- INVENTARIO
-- =====================================================

CREATE TABLE insumo (
    id_insumo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    unidad VARCHAR(20),
    stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 0,
    costo_promedio DECIMAL(10,2) DEFAULT 0,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_insumo_stock CHECK (stock >= 0 AND stock_minimo >= 0)
) ENGINE=InnoDB;

-- =====================================================
-- PRODUCTOS
-- =====================================================

CREATE TABLE producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255) NULL,
    precio DECIMAL(10,2) NOT NULL,
    tipo_producto ENUM('PREPARADO', 'INVENTARIO_DIRECTO') NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    id_categoria INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
    CONSTRAINT chk_producto_precio CHECK (precio >= 0)
) ENGINE=InnoDB;

CREATE TABLE inventario_producto (
    id_inventario INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL UNIQUE,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    CONSTRAINT chk_inventario_producto CHECK (stock >= 0 AND stock_minimo >= 0)
) ENGINE=InnoDB;

CREATE TABLE variante_producto (
    id_variante INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_extra DECIMAL(10,2) DEFAULT 0,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    -- CONSTRAINT chk_variante_precio CHECK (precio_extra >= 0)
) ENGINE=InnoDB;

CREATE TABLE receta_producto (
    id_receta INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_insumo INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo),
    CONSTRAINT chk_receta_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- =====================================================
-- MOVIMIENTO INVENTARIO
-- =====================================================

CREATE TABLE movimiento_inventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    tipo_recurso ENUM('INSUMO', 'PRODUCTO') NOT NULL,
    id_insumo INT NULL,
    id_producto INT NULL,
    tipo_movimiento ENUM('ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION', 'CONSUMO') NOT NULL,
    origen ENUM('VENTA', 'COMPRA', 'AJUSTE', 'ANULACION', 'OTRO') NOT NULL,
    referencia_id INT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    motivo VARCHAR(255),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_empleado INT,
    FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo),
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    CONSTRAINT chk_movimiento_inventario CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- =====================================================
-- COMBOS
-- =====================================================

CREATE TABLE combo_producto (
    id_combo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO',
    CONSTRAINT chk_combo_precio CHECK (precio >= 0)
) ENGINE=InnoDB;

CREATE TABLE combo_detalle (
    id_combo_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_combo INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (id_combo) REFERENCES combo_producto(id_combo) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    CONSTRAINT chk_combo_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- =====================================================
-- PEDIDOS
-- =====================================================

CREATE TABLE pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    id_cliente INT NULL,
    estado ENUM('PENDIENTE', 'EN_COCINA', 'LISTO', 'ENTREGADO', 'CANCELADO') DEFAULT 'PENDIENTE',
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
) ENGINE=InnoDB;

CREATE TABLE pedido_estado_historial (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    estado ENUM('PENDIENTE', 'EN_COCINA', 'LISTO', 'ENTREGADO', 'CANCELADO'),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_empleado INT,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
) ENGINE=InnoDB;

CREATE TABLE detalle_pedido (
    id_detalle_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NULL,
    id_combo INT NULL,
    id_variante INT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    observacion TEXT,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    FOREIGN KEY (id_combo) REFERENCES combo_producto(id_combo),
    FOREIGN KEY (id_variante) REFERENCES variante_producto(id_variante),
    CONSTRAINT chk_detalle_pedido_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_pedido_item CHECK (
        (id_producto IS NOT NULL AND id_combo IS NULL) OR
        (id_producto IS NULL AND id_combo IS NOT NULL)
    )
) ENGINE=InnoDB;

CREATE TABLE pedido_extra (
    id_pedido_extra INT AUTO_INCREMENT PRIMARY KEY,
    id_detalle_pedido INT NOT NULL,
    id_extra INT NOT NULL,
    cantidad INT DEFAULT 1,
    FOREIGN KEY (id_detalle_pedido) REFERENCES detalle_pedido(id_detalle_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_extra) REFERENCES extra_producto(id_extra)
) ENGINE=InnoDB;

-- =====================================================
-- VENTAS
-- =====================================================

CREATE TABLE venta (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    codigo_venta VARCHAR(50) UNIQUE,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2),
    subtotal_gravado DECIMAL(10,2),
    igv DECIMAL(10,2),
    igv_porcentaje DECIMAL(5,2) DEFAULT 18.00,
    total DECIMAL(10,2),
    tipo_comprobante ENUM('BOLETA', 'FACTURA') DEFAULT 'BOLETA',
    serie VARCHAR(10),
    correlativo VARCHAR(20),
    estado ENUM('PENDIENTE', 'PAGADA', 'ANULADA') DEFAULT 'PENDIENTE',
    id_pedido INT NULL,
    id_empleado INT NOT NULL,
    fecha_anulacion DATETIME NULL,
    motivo_anulacion TEXT NULL,
    id_empleado_anulacion INT NULL,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    FOREIGN KEY (id_empleado_anulacion) REFERENCES empleado(id_empleado)
) ENGINE=InnoDB;

CREATE TABLE detalle_venta (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NULL,
    id_combo INT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2),
    costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2),
    FOREIGN KEY (id_venta) REFERENCES venta(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    FOREIGN KEY (id_combo) REFERENCES combo_producto(id_combo),
    CONSTRAINT chk_detalle_venta_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_venta_item CHECK (
        (id_producto IS NOT NULL AND id_combo IS NULL) OR
        (id_producto IS NULL AND id_combo IS NOT NULL)
    )
) ENGINE=InnoDB;

CREATE TABLE consumo_insumo_venta (
    id_consumo INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_insumo INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_venta) REFERENCES venta(id_venta),
    FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo)
) ENGINE=InnoDB;

CREATE TABLE venta_pago (
    id_venta_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_metodo_pago INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    numero_operacion VARCHAR(100),
    estado ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO'),
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_venta) REFERENCES venta(id_venta),
    FOREIGN KEY (id_metodo_pago) REFERENCES metodo_pago(id_metodo_pago)
) ENGINE=InnoDB;

-- =====================================================
-- COMPRAS
-- =====================================================

CREATE TABLE compra_insumo (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    codigo_compra VARCHAR(50) UNIQUE,
    id_proveedor INT NOT NULL,
    id_empleado INT NOT NULL,
    subtotal DECIMAL(10,2),
    igv DECIMAL(10,2),
    total DECIMAL(10,2),
    estado ENUM('REGISTRADA', 'ANULADA') DEFAULT 'REGISTRADA',
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor),
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
) ENGINE=InnoDB;

CREATE TABLE detalle_compra_insumo (
    id_detalle_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT NOT NULL,
    id_insumo INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2),
    FOREIGN KEY (id_compra) REFERENCES compra_insumo(id_compra) ON DELETE CASCADE,
    FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo)
) ENGINE=InnoDB;

-- =====================================================
-- CAJA
-- =====================================================

CREATE TABLE caja (
    id_caja INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT NOT NULL,
    estado ENUM('ABIERTA', 'CERRADA') DEFAULT 'ABIERTA',
    caja_abierta BOOLEAN GENERATED ALWAYS AS (
        CASE
            WHEN estado = 'ABIERTA' THEN 1
            ELSE NULL
        END
    ) STORED,
    monto_apertura DECIMAL(10,2),
    monto_cierre DECIMAL(10,2),
    monto_sistema DECIMAL(10,2),
    diferencia DECIMAL(10,2),
    observacion TEXT,
    fecha_apertura DATETIME,
    fecha_cierre DATETIME,
    version BIGINT DEFAULT 0,
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    UNIQUE KEY uk_empleado_caja_abierta (id_empleado, caja_abierta)
) ENGINE=InnoDB;

-- INGRESO/EGRESO en caja
CREATE TABLE movimiento_caja (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_caja INT NOT NULL,
    tipo ENUM('INGRESO', 'EGRESO') NOT NULL,
    concepto VARCHAR(255),
    monto DECIMAL(10,2),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_caja) REFERENCES caja(id_caja)
) ENGINE=InnoDB;

-- =====================================================
-- AUDITORÍA
-- =====================================================

CREATE TABLE auditoria (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(100),
    accion ENUM('INSERT', 'UPDATE', 'DELETE'),
    id_registro VARCHAR(100),
    id_empleado INT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
) ENGINE=InnoDB;

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_empleado_username ON empleado(username);
CREATE INDEX idx_producto_categoria ON producto(id_categoria);
CREATE INDEX idx_producto_tipo ON producto(tipo_producto);
CREATE INDEX idx_pedido_estado ON pedido(estado);
CREATE INDEX idx_venta_fecha ON venta(fecha);
CREATE INDEX idx_venta_estado ON venta(estado);
CREATE INDEX idx_movimiento_inventario_fecha ON movimiento_inventario(fecha);
CREATE INDEX idx_movimiento_inventario_origen ON movimiento_inventario(origen);
CREATE INDEX idx_caja_estado ON caja(estado);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_evento);

-- =====================================================
-- VISTAS
-- =====================================================

CREATE VIEW vista_stock_insuficiente AS
SELECT
    p.nombre AS producto,
    i.nombre AS insumo,
    i.stock,
    rp.cantidad
FROM receta_producto rp
INNER JOIN producto p ON rp.id_producto = p.id_producto
INNER JOIN insumo i ON rp.id_insumo = i.id_insumo
WHERE i.stock < rp.cantidad;

CREATE VIEW vista_alerta_stock AS
SELECT
    p.nombre,
    ip.stock,
    ip.stock_minimo
FROM inventario_producto ip
INNER JOIN producto p ON ip.id_producto = p.id_producto
WHERE ip.stock <= ip.stock_minimo;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER $$

CREATE TRIGGER trg_venta_anulada
AFTER UPDATE ON venta
FOR EACH ROW
BEGIN
    IF NEW.estado = 'ANULADA'
    AND OLD.estado <> 'ANULADA'
    AND NEW.id_pedido IS NOT NULL
    THEN
        UPDATE pedido
        SET estado = 'CANCELADO'
        WHERE id_pedido = NEW.id_pedido;
    END IF;
END$$

DELIMITER ;
