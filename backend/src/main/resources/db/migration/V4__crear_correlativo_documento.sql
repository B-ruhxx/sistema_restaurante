CREATE TABLE IF NOT EXISTS correlativo_documento (
    id_correlativo INT AUTO_INCREMENT PRIMARY KEY,
    tipo_comprobante ENUM('BOLETA','FACTURA','TICKET') NOT NULL,
    serie VARCHAR(10) NOT NULL,
    ultimo_numero INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_correlativo_comprobante_serie UNIQUE (tipo_comprobante, serie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO correlativo_documento (tipo_comprobante, serie, ultimo_numero) VALUES
('BOLETA', 'B001', 0),
('FACTURA', 'F001', 0),
('TICKET', 'T001', 0)
ON DUPLICATE KEY UPDATE ultimo_numero = ultimo_numero;

INSERT INTO correlativo_documento (tipo_comprobante, serie, ultimo_numero)
SELECT tipo_comprobante,
       serie,
       COALESCE(MAX(CASE WHEN numero REGEXP '^[0-9]+$' THEN CAST(numero AS UNSIGNED) ELSE 0 END), 0)
FROM venta
GROUP BY tipo_comprobante, serie
ON DUPLICATE KEY UPDATE ultimo_numero = GREATEST(ultimo_numero, VALUES(ultimo_numero));

ALTER TABLE venta
    ADD CONSTRAINT uk_venta_serie_numero UNIQUE (serie, numero);
