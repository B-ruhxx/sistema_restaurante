package com.restaurante.service;

import com.restaurante.dto.AlertaStockDto;
import com.restaurante.dto.StockInsuficienteDto;
import com.restaurante.dto.response.CompraDiariaResponse;
import com.restaurante.dto.response.ProductoPopularResponse;
import com.restaurante.dto.response.ResumenFinancieroResponse;
import com.restaurante.dto.response.UtilidadDiariaResponse;
import com.restaurante.dto.response.VentaDiariaResponse;
import com.restaurante.dto.response.VentaPorHoraResponse;
import com.restaurante.repository.VentaRepository;
import com.restaurante.repository.projection.VentaPorHoraProjection;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReporteService {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private VentaRepository ventaRepository;

    @SuppressWarnings("unchecked")
    public List<StockInsuficienteDto> obtenerStockInsuficiente() {
        List<Object[]> results = entityManager.createNativeQuery(
                "SELECT producto, insumo, stock, cantidad FROM vista_stock_insuficiente"
        ).getResultList();

        return results.stream().map(row -> new StockInsuficienteDto(
                (String) row[0],
                (String) row[1],
                toBigDecimal(row[2]),
                toBigDecimal(row[3])
        )).collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    public List<AlertaStockDto> obtenerAlertaStock() {
        List<Object[]> results = entityManager.createNativeQuery(
                "SELECT nombre, stock, stock_minimo FROM vista_alerta_stock"
        ).getResultList();

        return results.stream().map(row -> new AlertaStockDto(
                (String) row[0],
                ((Number) row[1]).intValue(),
                ((Number) row[2]).intValue()
        )).collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    public List<VentaDiariaResponse> obtenerVentasDiarias() {
        List<Object[]> results = entityManager.createNativeQuery(
                "SELECT DATE(fecha_venta) as dia, SUM(total) as total_ventas, COUNT(id_venta) as cantidad_ventas " +
                        "FROM venta WHERE estado = 'EMITIDA' GROUP BY DATE(fecha_venta) " +
                        "ORDER BY DATE(fecha_venta) DESC LIMIT 15"
        ).getResultList();

        List<VentaDiariaResponse> list = new ArrayList<>();
        for (Object[] row : results) {
            list.add(new VentaDiariaResponse(row[0].toString(), toBigDecimal(row[1]), toLong(row[2])));
        }
        return list;
    }

    @SuppressWarnings("unchecked")
    public List<CompraDiariaResponse> obtenerComprasDiarias() {
        List<Object[]> results = entityManager.createNativeQuery(
                "SELECT DATE(fecha_compra) as dia, SUM(total) as total_compras, COUNT(id_compra) as cantidad_compras " +
                        "FROM compra_insumo WHERE estado = 'REGISTRADA' GROUP BY DATE(fecha_compra) " +
                        "ORDER BY DATE(fecha_compra) DESC LIMIT 15"
        ).getResultList();

        List<CompraDiariaResponse> list = new ArrayList<>();
        for (Object[] row : results) {
            list.add(new CompraDiariaResponse(row[0].toString(), toBigDecimal(row[1]), toLong(row[2])));
        }
        return list;
    }

    @SuppressWarnings("unchecked")
    public List<UtilidadDiariaResponse> obtenerUtilidadDiaria() {
        List<Object[]> results = entityManager.createNativeQuery(
                "SELECT DATE(v.fecha_venta) as dia, " +
                        "       COALESCE(SUM(v.total), 0) as total_ventas, " +
                        "       COALESCE(SUM(dv.cantidad * dv.costo_unitario), 0) as total_costo, " +
                        "       COALESCE(SUM(v.total), 0) - COALESCE(SUM(dv.cantidad * dv.costo_unitario), 0) as utilidad " +
                        "FROM venta v " +
                        "LEFT JOIN detalle_venta dv ON dv.id_venta = v.id_venta " +
                        "WHERE v.estado = 'EMITIDA' " +
                        "GROUP BY DATE(v.fecha_venta) " +
                        "ORDER BY DATE(v.fecha_venta) DESC LIMIT 15"
        ).getResultList();

        List<UtilidadDiariaResponse> list = new ArrayList<>();
        for (Object[] row : results) {
            list.add(new UtilidadDiariaResponse(
                    row[0].toString(),
                    toBigDecimal(row[1]),
                    toBigDecimal(row[2]),
                    toBigDecimal(row[3])
            ));
        }
        return list;
    }

    public List<VentaPorHoraResponse> obtenerVentasPorHora(String fecha) {
        LocalDate dia = fecha != null && !fecha.isBlank() ? LocalDate.parse(fecha) : LocalDate.now();
        LocalDateTime inicio = dia.atStartOfDay();
        LocalDateTime fin = inicio.plusDays(1);

        Map<Integer, VentaPorHoraProjection> ventasPorHora = ventaRepository.ventasPorHora(inicio, fin).stream()
                .collect(Collectors.toMap(VentaPorHoraProjection::getHora, Function.identity()));

        List<VentaPorHoraResponse> response = new ArrayList<>();
        for (int hora = 0; hora < 24; hora++) {
            VentaPorHoraProjection item = ventasPorHora.get(hora);
            response.add(new VentaPorHoraResponse(
                    hora,
                    String.format("%02d:00", hora),
                    item != null ? item.getTotal() : BigDecimal.ZERO,
                    item != null ? item.getCantidad() : 0L));
        }

        return response;
    }

    @SuppressWarnings("unchecked")
    public List<ProductoPopularResponse> obtenerProductosPopulares() {
        List<Object[]> results = entityManager.createNativeQuery(
                "SELECT item.producto, item.categoria, SUM(item.cantidad) as total_vendido, " +
                        "SUM(item.total) as total_recaudado " +
                        "FROM (" +
                        "  SELECT p.nombre as producto, COALESCE(c.nombre, 'Sin categoria') as categoria, " +
                        "         dv.cantidad as cantidad, dv.subtotal as total " +
                        "  FROM detalle_venta dv " +
                        "  JOIN producto p ON dv.id_producto = p.id_producto " +
                        "  LEFT JOIN categoria c ON p.id_categoria = c.id_categoria " +
                        "  JOIN venta v ON dv.id_venta = v.id_venta " +
                        "  WHERE v.estado = 'EMITIDA' AND dv.id_producto IS NOT NULL " +
                        "  UNION ALL " +
                        "  SELECT cp.nombre as producto, 'Combos' as categoria, " +
                        "         dv.cantidad as cantidad, dv.subtotal as total " +
                        "  FROM detalle_venta dv " +
                        "  JOIN combo_producto cp ON dv.id_combo = cp.id_combo " +
                        "  JOIN venta v ON dv.id_venta = v.id_venta " +
                        "  WHERE v.estado = 'EMITIDA' AND dv.id_combo IS NOT NULL " +
                        ") item " +
                        "GROUP BY item.producto, item.categoria " +
                        "ORDER BY total_vendido DESC LIMIT 8"
        ).getResultList();

        List<ProductoPopularResponse> list = new ArrayList<>();
        for (Object[] row : results) {
            list.add(new ProductoPopularResponse(
                    (String) row[0],
                    (String) row[1],
                    toLong(row[2]),
                    toBigDecimal(row[3])));
        }
        return list;
    }

    public ResumenFinancieroResponse obtenerResumenFinanciero() {
        BigDecimal ingresos = singleBigDecimal(
                "SELECT COALESCE(SUM(total), 0) FROM venta WHERE estado = 'EMITIDA'");
        BigDecimal baseImponible = singleBigDecimal(
                "SELECT COALESCE(SUM(subtotal), 0) FROM venta WHERE estado = 'EMITIDA'");
        BigDecimal totalIgv = singleBigDecimal(
                "SELECT COALESCE(SUM(igv), 0) FROM venta WHERE estado = 'EMITIDA'");
        BigDecimal totalCosto = singleBigDecimal(
                "SELECT COALESCE(SUM(dv.cantidad * dv.costo_unitario), 0) FROM detalle_venta dv " +
                        "JOIN venta v ON dv.id_venta = v.id_venta WHERE v.estado = 'EMITIDA'");
        BigDecimal totalCompras = singleBigDecimal(
                "SELECT COALESCE(SUM(total), 0) FROM compra_insumo WHERE estado = 'REGISTRADA'");

        ResumenFinancieroResponse response = new ResumenFinancieroResponse();
        response.setTotalVentas(ingresos);
        response.setBaseImponible(baseImponible);
        response.setIgv(totalIgv);
        response.setCostoTotal(totalCosto);
        response.setTotalCompras(totalCompras);
        response.setGananciaNeta(ingresos.subtract(totalCosto));
        return response;
    }

    private BigDecimal singleBigDecimal(String sql) {
        return toBigDecimal(entityManager.createNativeQuery(sql).getSingleResult());
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }

    private Long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.valueOf(value.toString());
    }
}
