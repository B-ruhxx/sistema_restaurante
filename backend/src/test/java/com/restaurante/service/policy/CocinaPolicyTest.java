package com.restaurante.service.policy;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.restaurante.entity.DetallePedido;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class CocinaPolicyTest {
    private final CocinaPolicy policy = new CocinaPolicy();

    @Test
    void detalleDirectoNoPuedeOperarseEnKds() {
        DetallePedido detalle = new DetallePedido();
        detalle.setRequierePreparacion(false);

        assertThrows(IllegalStateException.class, () -> policy.validarDetallePreparacion(detalle));
    }

    @Test
    void detalleListoConTiempoRealQuedaCongelado() {
        DetallePedido detalle = new DetallePedido();
        detalle.setEstadoCocina(DetallePedido.EstadoCocina.LISTO);
        detalle.setFechaFinPreparacion(LocalDateTime.now());
        detalle.setTiempoRealMinutos(7);

        assertTrue(policy.estaCongelado(detalle));
    }

    @Test
    void detalleListoSinTiempoNoEstaCongelado() {
        DetallePedido detalle = new DetallePedido();
        detalle.setEstadoCocina(DetallePedido.EstadoCocina.LISTO);

        assertFalse(policy.estaCongelado(detalle));
    }
}
