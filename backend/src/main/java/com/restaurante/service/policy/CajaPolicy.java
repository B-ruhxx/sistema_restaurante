package com.restaurante.service.policy;

import com.restaurante.entity.Caja;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.MovimientoCaja;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
public class CajaPolicy {

    public void validarMovimiento(Caja caja, MovimientoCaja.Tipo tipo, BigDecimal monto, Empleado empleado,
            String referenceType, Integer referenceId, String comprobante) {
        if (caja == null) {
            throw new IllegalArgumentException("La caja es obligatoria.");
        }
        if (caja.getEstado() == Caja.Estado.CERRADA) {
            throw new IllegalStateException("No se pueden registrar movimientos en una caja cerrada.");
        }
        if (tipo == null) {
            throw new IllegalArgumentException("El tipo de movimiento de caja es obligatorio.");
        }
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El monto del movimiento debe ser mayor a 0.");
        }
        if (empleado == null || empleado.getIdEmpleado() == null) {
            throw new IllegalArgumentException("El empleado es obligatorio para registrar movimientos de caja.");
        }
        if (referenceType == null || referenceType.isBlank()) {
            throw new IllegalArgumentException("El tipo de referencia es obligatorio para registrar movimientos de caja.");
        }
        if (referenceId == null) {
            throw new IllegalArgumentException("El id de referencia es obligatorio para registrar movimientos de caja.");
        }
        if (comprobante == null || comprobante.isBlank()) {
            throw new IllegalArgumentException("El comprobante es obligatorio para registrar movimientos de caja.");
        }
    }
}
