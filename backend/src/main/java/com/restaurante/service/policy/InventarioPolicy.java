package com.restaurante.service.policy;

import com.restaurante.entity.Empleado;
import com.restaurante.entity.Insumo;
import com.restaurante.entity.MovimientoInventario;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
public class InventarioPolicy {

    public MovimientoInventario.TipoRecurso parseTipoRecurso(String tipoRecurso) {
        if (tipoRecurso == null || tipoRecurso.isBlank()) {
            throw new IllegalArgumentException("El tipo de recurso es obligatorio.");
        }
        try {
            return MovimientoInventario.TipoRecurso.valueOf(tipoRecurso.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Tipo de recurso inválido: " + tipoRecurso);
        }
    }

    public void validarAjusteManual(BigDecimal cantidad, String motivo, Empleado empleado) {
        if (cantidad == null || cantidad.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La cantidad del ajuste debe ser mayor a 0.");
        }
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("El motivo del ajuste es obligatorio.");
        }
        if (empleado == null || empleado.getIdEmpleado() == null) {
            throw new IllegalArgumentException("El empleado es obligatorio para registrar ajustes de inventario.");
        }
    }

    public void validarStockSuficiente(Insumo insumo, BigDecimal cantidad) {
        BigDecimal stockActual = insumo.getStock() != null ? insumo.getStock() : BigDecimal.ZERO;
        if (stockActual.compareTo(cantidad) < 0) {
            throw new IllegalStateException("Stock insuficiente para ajustar el insumo " + insumo.getNombre() + ".");
        }
    }
}
