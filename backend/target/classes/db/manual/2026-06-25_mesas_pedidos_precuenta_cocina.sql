-- Migración manual incremental para BD existente.
-- Ejecutar con backup previo. No elimina ni recrea datos.

INSERT IGNORE INTO permiso(nombre, descripcion) VALUES
('GESTION_MESAS', 'Gestión de mesas'),
('GESTION_POS', 'Gestión de punto de venta'),
('GESTION_COCINA', 'Gestión de cocina y comandas'),
('GESTION_PRECUENTA', 'Emisión de precuentas'),
('GESTION_CAJA', 'Gestión de caja y cobros'),
('GESTION_VENTAS', 'Gestión de ventas'),
('ACCESO_TOTAL', 'Acceso total al sistema');

INSERT IGNORE INTO rol_permiso(id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r
JOIN permiso p ON p.nombre IN ('GESTION_MESAS','GESTION_POS','GESTION_COCINA','GESTION_PRECUENTA','GESTION_CAJA','GESTION_VENTAS','ACCESO_TOTAL')
WHERE UPPER(r.nombre) = 'ADMINISTRADOR';

INSERT IGNORE INTO rol_permiso(id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r
JOIN permiso p ON p.nombre IN ('GESTION_MESAS','GESTION_POS','GESTION_PRECUENTA')
WHERE UPPER(r.nombre) = 'MESERO';

INSERT IGNORE INTO rol_permiso(id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r
JOIN permiso p ON p.nombre IN ('GESTION_CAJA','GESTION_VENTAS')
WHERE UPPER(r.nombre) = 'CAJERO';

INSERT IGNORE INTO rol_permiso(id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r
JOIN permiso p ON p.nombre = 'GESTION_COCINA'
WHERE UPPER(r.nombre) LIKE '%COCINERO%';

CREATE TABLE IF NOT EXISTS mesa (
    id_mesa INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(80),
    capacidad INT NOT NULL DEFAULT 4,
    ubicacion VARCHAR(80),
    estado ENUM('LIBRE','OCUPADA','ESPERANDO_COCINA','SERVIDO','CUENTA_EMITIDA','PAGADA') NOT NULL DEFAULT 'LIBRE',
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_mesa_capacidad CHECK (capacidad > 0)
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS idx_mesa_estado ON mesa(estado);

ALTER TABLE pedido
    ADD COLUMN IF NOT EXISTS id_mesa INT NULL AFTER id_cliente,
    ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0 AFTER fecha,
    ADD COLUMN IF NOT EXISTS igv DECIMAL(10,2) DEFAULT 0 AFTER subtotal,
    ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0 AFTER igv,
    ADD COLUMN IF NOT EXISTS fecha_envio_cocina DATETIME NULL AFTER total,
    ADD COLUMN IF NOT EXISTS fecha_inicio_preparacion DATETIME NULL AFTER fecha_envio_cocina,
    ADD COLUMN IF NOT EXISTS fecha_fin_preparacion DATETIME NULL AFTER fecha_inicio_preparacion,
    ADD COLUMN IF NOT EXISTS tiempo_estimado_minutos INT NULL AFTER fecha_fin_preparacion,
    ADD COLUMN IF NOT EXISTS tiempo_real_minutos INT NULL AFTER tiempo_estimado_minutos;

ALTER TABLE pedido
    MODIFY estado ENUM('PENDIENTE','EN_COCINA','ABIERTO','ENVIADO_COCINA','EN_PREPARACION','LISTO','ENTREGADO','CUENTA_SOLICITADA','CUENTA_EMITIDA','PAGADO','CANCELADO') DEFAULT 'ABIERTO';

UPDATE pedido SET estado = 'ABIERTO' WHERE estado = 'PENDIENTE';
UPDATE pedido SET estado = 'ENVIADO_COCINA' WHERE estado = 'EN_COCINA';

ALTER TABLE pedido
    MODIFY estado ENUM('ABIERTO','ENVIADO_COCINA','EN_PREPARACION','LISTO','ENTREGADO','CUENTA_SOLICITADA','CUENTA_EMITIDA','PAGADO','CANCELADO') DEFAULT 'ABIERTO';

ALTER TABLE pedido
    ADD CONSTRAINT fk_pedido_mesa FOREIGN KEY (id_mesa) REFERENCES mesa(id_mesa);

ALTER TABLE pedido
    ADD COLUMN IF NOT EXISTS mesa_pedido_activo TINYINT
    GENERATED ALWAYS AS (
        CASE
            WHEN id_mesa IS NOT NULL
             AND estado IN ('ABIERTO','ENVIADO_COCINA','EN_PREPARACION','LISTO','ENTREGADO','CUENTA_SOLICITADA','CUENTA_EMITIDA')
            THEN 1
            ELSE NULL
        END
    ) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS uk_pedido_activo_por_mesa ON pedido(id_mesa, mesa_pedido_activo);
CREATE INDEX IF NOT EXISTS idx_pedido_mesa ON pedido(id_mesa);
CREATE INDEX IF NOT EXISTS idx_pedido_cliente ON pedido(id_cliente);

ALTER TABLE pedido_estado_historial
    MODIFY estado ENUM('PENDIENTE','EN_COCINA','ABIERTO','ENVIADO_COCINA','EN_PREPARACION','LISTO','ENTREGADO','CUENTA_SOLICITADA','CUENTA_EMITIDA','PAGADO','CANCELADO');

UPDATE pedido_estado_historial SET estado = 'ABIERTO' WHERE estado = 'PENDIENTE';
UPDATE pedido_estado_historial SET estado = 'ENVIADO_COCINA' WHERE estado = 'EN_COCINA';

ALTER TABLE pedido_estado_historial
    MODIFY estado ENUM('ABIERTO','ENVIADO_COCINA','EN_PREPARACION','LISTO','ENTREGADO','CUENTA_SOLICITADA','CUENTA_EMITIDA','PAGADO','CANCELADO');

ALTER TABLE detalle_pedido
    ADD COLUMN IF NOT EXISTS estado_cocina ENUM('PENDIENTE','EN_PREPARACION','LISTO','CANCELADO') DEFAULT 'PENDIENTE' AFTER observacion,
    ADD COLUMN IF NOT EXISTS fecha_inicio_preparacion DATETIME NULL AFTER estado_cocina,
    ADD COLUMN IF NOT EXISTS fecha_fin_preparacion DATETIME NULL AFTER fecha_inicio_preparacion,
    ADD COLUMN IF NOT EXISTS tiempo_estimado_minutos INT NULL AFTER fecha_fin_preparacion,
    ADD COLUMN IF NOT EXISTS tiempo_real_minutos INT NULL AFTER tiempo_estimado_minutos;

CREATE INDEX IF NOT EXISTS idx_detalle_pedido_estado_cocina ON detalle_pedido(estado_cocina);

ALTER TABLE receta_producto
    ADD COLUMN IF NOT EXISTS tiempo_preparacion_minutos INT NOT NULL DEFAULT 1 AFTER cantidad;

CREATE TABLE IF NOT EXISTS precuenta (
    id_precuenta INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    numero VARCHAR(50) NOT NULL UNIQUE,
    fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
    emitido_por INT NOT NULL,
    subtotal DECIMAL(10,2),
    igv DECIMAL(10,2),
    total DECIMAL(10,2),
    estado ENUM('EMITIDA','ANULADA','CONVERTIDA_VENTA') DEFAULT 'EMITIDA',
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido),
    FOREIGN KEY (emitido_por) REFERENCES empleado(id_empleado)
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS idx_precuenta_pedido ON precuenta(id_pedido);
CREATE INDEX IF NOT EXISTS idx_precuenta_numero ON precuenta(numero);
