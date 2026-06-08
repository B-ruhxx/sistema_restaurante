-- =====================================================
-- SEED DATA FOR SISTEMA RESTAURANTE
-- =====================================================

USE sistema_restaurante;

-- 1. Configuracion Empresa
INSERT INTO configuracion_empresa (nombre_empresa, razon_social, ruc, direccion, telefono, email, moneda, igv, serie_boleta, serie_factura)
VALUES ('Pizzería Bella Italia', 'Bella Italia Gourmet S.A.C.', '20987654321', 'Av. Larco 456, Miraflores', '01-234-5678', 'contacto@bellaitalia.com', 'PEN', 18.00, 'B001', 'F001');

-- 2. Roles
INSERT INTO rol (id_rol, nombre, descripcion, estado) VALUES
(1, 'ADMINISTRADOR', 'Acceso total al sistema', 'ACTIVO'),
(2, 'MESERO', 'Gestión de pedidos y mesas', 'ACTIVO'),
(3, 'CAJERO', 'Control de caja y cobros de ventas', 'ACTIVO'),
(4, 'COCINERO', 'Visualización y despacho de pedidos en cocina', 'ACTIVO');

-- 3. Permisos
INSERT INTO permiso (id_permiso, nombre, descripcion) VALUES
(1, 'ACCESO_TOTAL', 'Permite realizar cualquier operación'),
(2, 'VER_COCINA', 'Visualización de pedidos en monitor de cocina'),
(3, 'GESTIONAR_PEDIDOS', 'Creación y modificación de pedidos'),
(4, 'GESTIONAR_VENTAS', 'Cobros de pedidos y emisión de comprobantes'),
(5, 'CONTROL_CAJA', 'Apertura, cierre y movimientos de caja'),
(6, 'VER_DASHBOARD', 'Acceso a reportes y analítica de ventas'),
(7, 'GESTIONAR_INVENTARIO', 'Ingreso de compras, control de stock e insumos');

-- 4. Rol Permiso
INSERT INTO rol_permiso (id_rol, id_permiso) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
(2, 3),
(3, 4), (3, 5),
(4, 2);

-- 5. Empleados
-- Contraseñas por defecto (username/password): admin/admin123, mesero/admin123, cajero/admin123, cocinero/admin123
INSERT INTO empleado (id_empleado, nombre, apellido, username, password_hash, telefono, email, estado, id_rol, version) VALUES
(1, 'Admin', 'Pizzería', 'admin', '$2b$10$b4k2bRiYZzqIP/0UBOCUG.EI3dxZsy/t9G7cb01FBB7jr/l4dLkHu', '999999999', 'admin@bellaitalia.com', 'ACTIVO', 1, 0),
(2, 'Carlos', 'Rossi', 'mesero', '$2b$10$b4k2bRiYZzqIP/0UBOCUG.EI3dxZsy/t9G7cb01FBB7jr/l4dLkHu', '988888888', 'carlos@bellaitalia.com', 'ACTIVO', 2, 0),
(3, 'Elena', 'Nastri', 'cajero', '$2b$10$b4k2bRiYZzqIP/0UBOCUG.EI3dxZsy/t9G7cb01FBB7jr/l4dLkHu', '977777777', 'elena@bellaitalia.com', 'ACTIVO', 3, 0),
(4, 'Pizzaiolo', 'Mario', 'cocinero', '$2b$10$b4k2bRiYZzqIP/0UBOCUG.EI3dxZsy/t9G7cb01FBB7jr/l4dLkHu', '966666666', 'mario@bellaitalia.com', 'ACTIVO', 4, 0);

-- 6. Metodos de Pago
INSERT INTO metodo_pago (id_metodo_pago, nombre, requiere_operacion, estado) VALUES
(1, 'Efectivo', 0, 'ACTIVO'),
(2, 'Tarjeta Crédito/Débito', 1, 'ACTIVO'),
(3, 'Yape', 1, 'ACTIVO'),
(4, 'Plin', 1, 'ACTIVO');

-- 7. Categorias
INSERT INTO categoria (id_categoria, nombre, descripcion, estado) VALUES
(1, 'Entradas y Panes', 'Panes al ajo y aperitivos', 'ACTIVO'),
(2, 'Pizzas Artesanales', 'Nuestras pizzas hechas al horno de piedra', 'ACTIVO'),
(3, 'Bebidas', 'Gaseosas, aguas y cervezas', 'ACTIVO'),
(4, 'Postres Italianos', 'Dulces tradicionales', 'ACTIVO');

-- 8. Insumos (Inventario de Materia Prima)
INSERT INTO insumo (id_insumo, nombre, unidad, stock, stock_minimo, costo_promedio, estado, version) VALUES
(1, 'Masa Madura para Pizza', 'KG', 40.00, 10.00, 5.00, 'ACTIVO', 0),
(2, 'Salsa de Tomate Pomodoro', 'KG', 30.00, 5.00, 8.00, 'ACTIVO', 0),
(3, 'Queso Mozzarella', 'KG', 50.00, 8.00, 22.00, 'ACTIVO', 0),
(4, 'Pepperoni Americano', 'KG', 15.00, 3.00, 35.00, 'ACTIVO', 0),
(5, 'Jamón Inglés', 'KG', 20.00, 4.00, 18.00, 'ACTIVO', 0),
(6, 'Piña en Cubos', 'KG', 15.00, 3.00, 9.00, 'ACTIVO', 0),
(7, 'Coca-Cola 1.5L', 'UNIDAD', 60.00, 15.00, 4.50, 'ACTIVO', 0);

-- 9. Proveedores
INSERT INTO proveedor (id_proveedor, razon_social, nombre_comercial, ruc, telefono, email, direccion, contacto_principal, estado) VALUES
(1, 'Importaciones Italianas S.A.C.', 'EuroAlimentos Distribuidora', '20445566778', '01-555-1234', 'pedidos@euroalimentos.com', 'Av. Argentina 1200, Callao', 'Gianluca Pagliuca', 'ACTIVO');

-- 10. Productos
-- PREPARADO descuenta según receta, INVENTARIO_DIRECTO descuenta directamente de inventario_producto
INSERT INTO producto (id_producto, nombre, descripcion, precio, tipo_producto, estado, id_categoria) VALUES
(1, 'Pizza Pepperoni Classica', 'Salsa pomodoro, mozzarella y abundante pepperoni', 38.90, 'PREPARADO', 'ACTIVO', 2),
(2, 'Pizza Hawaiiana Deluxe', 'Salsa pomodoro, mozzarella, jamón seleccionado y piña', 36.90, 'PREPARADO', 'ACTIVO', 2),
(3, 'Gaseosa Coca-Cola 1.5L', 'Botella de plástico de 1.5 litros', 10.00, 'INVENTARIO_DIRECTO', 'ACTIVO', 3),
(4, 'Pan al Ajo Supremo', 'Porción de 4 panes con mantequilla de ajo y mozzarella', 16.90, 'PREPARADO', 'ACTIVO', 1);

-- 11. Inventario Producto (Para productos de venta DIRECTA sin receta compleja)
INSERT INTO inventario_producto (id_producto, stock, stock_minimo, version) VALUES
(3, 60, 15, 0);

-- 12. Receta Producto (Cantidades por unidad de plato/pizza)
-- Pizza Pepperoni Classica
INSERT INTO receta_producto (id_producto, id_insumo, cantidad) VALUES
(1, 1, 0.35), -- 350g de masa
(1, 2, 0.15), -- 150g de salsa pomodoro
(1, 3, 0.20), -- 200g de queso mozzarella
(1, 4, 0.10), -- 100g de pepperoni
-- Pizza Hawaiiana Deluxe
(2, 1, 0.35), -- 350g de masa
(2, 2, 0.15), -- 150g de salsa pomodoro
(2, 3, 0.20), -- 200g de queso mozzarella
(2, 5, 0.12), -- 120g de jamón inglés
(2, 6, 0.15), -- 150g de piña
-- Pan al Ajo Supremo
(4, 3, 0.10); -- 100g de queso mozzarella para gratinar

-- 13. Variante Producto (Tamaños o tipos de masa ideales para pizzerías)
INSERT INTO variante_producto (id_variante, id_producto, nombre, descripcion, precio_extra, estado) VALUES
(1, 1, 'Masa Tradicional', 'Masa clásica artesanal', 0.00, 'ACTIVO'),
(2, 1, 'Masa Fina y Crocante', 'Estilo New York delgada', 0.00, 'ACTIVO'),
(3, 2, 'Tamaño Familiar', 'Pizza Grande de 12 porciones', 15.00, 'ACTIVO'),
(4, 2, 'Tamaño Personal', 'Pizza Personal de 4 porciones', -10.00, 'ACTIVO');

-- 14. Extra Producto (Adicionales clásicos de pizza en el carrito del POS)
INSERT INTO extra_producto (id_extra, nombre, precio, estado) VALUES
(1, 'Extra Queso Mozzarella', 5.00, 'ACTIVO'),
(2, 'Extra Pepperoni', 6.50, 'ACTIVO'),
(3, 'Salsa BBQ Dip', 3.00, 'ACTIVO');

-- 15. Combo Producto
INSERT INTO combo_producto (id_combo, nombre, descripcion, precio, estado) VALUES
(1, 'Combo Amici', 'Pizza Pepperoni Classica + Coca-Cola 1.5L', 44.90, 'ACTIVO');

-- 16. Combo Detalle
INSERT INTO combo_detalle (id_combo, id_producto, cantidad) VALUES
(1, 1, 1),
(1, 3, 1);