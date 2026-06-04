package com.restaurante.controller;

import com.restaurante.dto.AlertaStockDto;
import com.restaurante.dto.StockInsuficienteDto;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/reportes")
public class ReportesController {

    @Autowired
    private EntityManager entityManager;

    @GetMapping("/stock-insuficiente")
    @SuppressWarnings("unchecked")
    public ResponseEntity<List<StockInsuficienteDto>> getStockInsuficiente() {
        try {
            List<Object[]> results = entityManager.createNativeQuery(
                    "SELECT producto, insumo, stock, cantidad FROM vista_stock_insuficiente"
            ).getResultList();

            List<StockInsuficienteDto> list = results.stream().map(row -> new StockInsuficienteDto(
                    (String) row[0],
                    (String) row[1],
                    (BigDecimal) row[2],
                    (BigDecimal) row[3]
            )).collect(Collectors.toList());

            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/alerta-stock")
    @SuppressWarnings("unchecked")
    public ResponseEntity<List<AlertaStockDto>> getAlertaStock() {
        try {
            List<Object[]> results = entityManager.createNativeQuery(
                    "SELECT nombre, stock, stock_minimo FROM vista_alerta_stock"
            ).getResultList();

            List<AlertaStockDto> list = results.stream().map(row -> new AlertaStockDto(
                    (String) row[0],
                    ((Number) row[1]).intValue(),
                    ((Number) row[2]).intValue()
            )).collect(Collectors.toList());

            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/ventas-diarias")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> getVentasDiarias() {
        try {
            List<Object[]> results = entityManager.createNativeQuery(
                    "SELECT DATE(fecha) as dia, SUM(total) as total_ventas, COUNT(id_venta) as cantidad_ventas " +
                            "FROM venta WHERE estado = 'PAGADA' GROUP BY DATE(fecha) " +
                            "ORDER BY DATE(fecha) DESC LIMIT 15"
            ).getResultList();

            List<Map<String, Object>> list = new ArrayList<>();
            for (Object[] row : results) {
                Map<String, Object> map = new HashMap<>();
                map.put("fecha", row[0].toString());
                map.put("total", row[1]);
                map.put("cantidad", row[2]);
                list.add(map);
            }
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al generar reporte: " + e.getMessage());
        }
    }

    @GetMapping("/productos-populares")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> getProductosPopulares() {
        try {
            List<Object[]> results = entityManager.createNativeQuery(
                    "SELECT p.nombre, SUM(dv.cantidad) as total_vendido, SUM(dv.subtotal) as total_recaudado " +
                            "FROM detalle_venta dv " +
                            "JOIN producto p ON dv.id_producto = p.id_producto " +
                            "JOIN venta v ON dv.id_venta = v.id_venta " +
                            "WHERE v.estado = 'PAGADA' GROUP BY p.id_producto, p.nombre " +
                            "ORDER BY total_vendido DESC LIMIT 8"
            ).getResultList();

            List<Map<String, Object>> list = new ArrayList<>();
            for (Object[] row : results) {
                Map<String, Object> map = new HashMap<>();
                map.put("producto", row[0]);
                map.put("cantidad", row[1]);
                map.put("total", row[2]);
                list.add(map);
            }
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al generar reporte: " + e.getMessage());
        }
    }

    @GetMapping("/resumen-financiero")
    public ResponseEntity<?> getResumenFinanciero() {
        try {
            BigDecimal ingresos = (BigDecimal) entityManager.createNativeQuery(
                    "SELECT COALESCE(SUM(total), 0) FROM venta WHERE estado = 'PAGADA'"
            ).getSingleResult();

            BigDecimal baseImponible = (BigDecimal) entityManager.createNativeQuery(
                    "SELECT COALESCE(SUM(subtotal), 0) FROM venta WHERE estado = 'PAGADA'"
            ).getSingleResult();

            BigDecimal totalIgv = (BigDecimal) entityManager.createNativeQuery(
                    "SELECT COALESCE(SUM(igv), 0) FROM venta WHERE estado = 'PAGADA'"
            ).getSingleResult();

            BigDecimal totalCosto = (BigDecimal) entityManager.createNativeQuery(
                    "SELECT COALESCE(SUM(dv.cantidad * dv.costo_unitario), 0) FROM detalle_venta dv " +
                            "JOIN venta v ON dv.id_venta = v.id_venta WHERE v.estado = 'PAGADA'"
            ).getSingleResult();

            Map<String, Object> response = new HashMap<>();
            response.put("totalVentas", ingresos);
            response.put("baseImponible", baseImponible);
            response.put("igv", totalIgv);
            response.put("costoTotal", totalCosto);
            response.put("gananciaNeta", ingresos.subtract(totalCosto));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al generar resumen: " + e.getMessage());
        }
    }
}
