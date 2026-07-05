CREATE OR REPLACE VIEW vista_stock_producto_sku AS
SELECT
    p.id_producto,
    p.parent_id,
    p.sku,
    p.nombre,
    p.tipo_producto,
    COALESCE(SUM(CASE
        WHEN lp.estado = 'DISPONIBLE' AND lp.fecha_vencimiento >= CURRENT_DATE THEN lp.cantidad_disponible
        ELSE 0
    END), 0) AS stock_disponible,
    p.stock_minimo
FROM producto p
LEFT JOIN lote_producto lp ON lp.id_producto = p.id_producto
WHERE p.es_sku = TRUE
GROUP BY p.id_producto, p.parent_id, p.sku, p.nombre, p.tipo_producto, p.stock_minimo;

CREATE OR REPLACE VIEW vista_alerta_insumo AS
SELECT
    i.id_insumo,
    i.nombre,
    COALESCE(SUM(CASE
        WHEN li.estado = 'DISPONIBLE' AND li.fecha_vencimiento >= CURRENT_DATE THEN li.cantidad_disponible
        ELSE 0
    END), 0) AS stock_disponible,
    i.stock_minimo,
    'INSUMO' AS tipo_recurso
FROM insumo i
LEFT JOIN lote_insumo li ON li.id_insumo = i.id_insumo
WHERE i.estado = 'ACTIVO'
GROUP BY i.id_insumo, i.nombre, i.stock_minimo
HAVING stock_disponible <= i.stock_minimo;

CREATE OR REPLACE VIEW vista_alerta_producto_sku AS
SELECT
    id_producto,
    sku,
    nombre,
    stock_disponible,
    stock_minimo,
    'PRODUCTO_DIRECTO' AS tipo_recurso
FROM vista_stock_producto_sku
WHERE tipo_producto = 'INVENTARIO_DIRECTO'
  AND stock_disponible <= stock_minimo;
