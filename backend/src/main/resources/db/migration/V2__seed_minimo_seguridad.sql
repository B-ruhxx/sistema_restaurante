INSERT INTO configuracion_empresa (
    id_configuracion,
    nombre_empresa,
    razon_social,
    ruc,
    direccion,
    telefono,
    email,
    moneda,
    igv,
    serie_boleta,
    serie_factura
)
VALUES (1, 'Restaurante', 'Restaurante', NULL, NULL, NULL, NULL, 'PEN', 18.00, 'B001', 'F001');

INSERT INTO permiso (codigo, nombre, descripcion, modulo) VALUES
('ACCESO_TOTAL', 'ACCESO_TOTAL', 'Acceso total al sistema', 'SEGURIDAD'),
('VER_PANEL', 'VER_PANEL', 'Ver panel principal', 'GENERAL'),
('GESTION_EMPLEADOS', 'GESTION_EMPLEADOS', 'Gestionar empleados', 'SEGURIDAD'),
('GESTION_ROLES', 'GESTION_ROLES', 'Gestionar roles y permisos', 'SEGURIDAD'),
('GESTION_POS', 'GESTION_POS', 'Gestionar punto de venta', 'POS'),
('GESTION_MESAS', 'GESTION_MESAS', 'Gestionar mapa de mesas', 'SALON'),
('GESTION_PEDIDOS', 'GESTION_PEDIDOS', 'Gestionar pedidos', 'PEDIDOS'),
('GESTION_PRECUENTA', 'GESTION_PRECUENTA', 'Emitir y administrar precuentas', 'PEDIDOS'),
('GESTION_COCINA', 'GESTION_COCINA', 'Gestionar comandas de cocina', 'COCINA'),
('GESTION_CAJA', 'GESTION_CAJA', 'Gestionar caja', 'CAJA'),
('GESTION_VENTAS', 'GESTION_VENTAS', 'Gestionar ventas', 'VENTAS'),
('GESTION_COMPRAS', 'GESTION_COMPRAS', 'Gestionar compras', 'COMPRAS'),
('GESTION_INVENTARIO', 'GESTION_INVENTARIO', 'Gestionar inventario y kardex', 'INVENTARIO'),
('GESTION_PRODUCTOS', 'GESTION_PRODUCTOS', 'Gestionar catalogo y SKUs', 'CATALOGO'),
('GESTION_RECETAS', 'GESTION_RECETAS', 'Gestionar recetas y BOM', 'RECETAS'),
('GESTION_REPORTES', 'GESTION_REPORTES', 'Ver reportes', 'REPORTES'),
('GESTION_CONFIGURACION', 'GESTION_CONFIGURACION', 'Gestionar configuracion del sistema', 'CONFIGURACION'),
('GESTION_AUDITORIA', 'GESTION_AUDITORIA', 'Ver auditoria del sistema', 'AUDITORIA');

INSERT INTO rol (nombre, descripcion, estado) VALUES
('ADMINISTRADOR', 'Acceso total al sistema', 'ACTIVO'),
('MESERO', 'Operacion de salon y toma de pedidos', 'ACTIVO'),
('CAJERO', 'Cobros y control de caja', 'ACTIVO'),
('COCINA', 'Operacion de cocina y despacho', 'ACTIVO');

INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r
JOIN permiso p ON r.nombre = 'ADMINISTRADOR';

INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r
JOIN permiso p ON p.codigo IN ('VER_PANEL', 'GESTION_POS', 'GESTION_MESAS', 'GESTION_PEDIDOS', 'GESTION_PRECUENTA')
WHERE r.nombre = 'MESERO';

INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r
JOIN permiso p ON p.codigo IN ('VER_PANEL', 'GESTION_CAJA', 'GESTION_VENTAS', 'GESTION_PRECUENTA')
WHERE r.nombre = 'CAJERO';

INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r
JOIN permiso p ON p.codigo IN ('VER_PANEL', 'GESTION_COCINA')
WHERE r.nombre = 'COCINA';

INSERT INTO empleado (
    nombre,
    apellido,
    usuario,
    email,
    password_hash,
    telefono,
    id_rol,
    estado
)
SELECT
    'Admin',
    'Sistema',
    'admin',
    'admin@restaurante.local',
    '$2a$10$X7pA7.aL4i2I0.GQjMvGF.Zw7RF70oHw0lQSyBmIYYQRid9hWynM2',
    NULL,
    r.id_rol,
    'ACTIVO'
FROM rol r
WHERE r.nombre = 'ADMINISTRADOR';

INSERT INTO metodo_pago (nombre, codigo, requiere_referencia, estado) VALUES
('Efectivo', 'EFECTIVO', FALSE, 'ACTIVO'),
('Tarjeta', 'TARJETA', TRUE, 'ACTIVO'),
('Yape / Plin', 'YAPE_PLIN', TRUE, 'ACTIVO'),
('Transferencia', 'TRANSFERENCIA', TRUE, 'ACTIVO');
