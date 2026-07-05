package com.restaurante.service.policy;

import com.restaurante.entity.DetallePedido;
import com.restaurante.entity.Pedido;
import org.springframework.stereotype.Component;

@Component
public class CocinaPolicy {

    public void validarPedidoIniciable(Pedido pedido) {
        if (pedido.getEstado() != Pedido.Estado.EN_COCINA) {
            throw new IllegalStateException("Solo se puede iniciar un pedido enviado a cocina.");
        }
    }

    public void validarPedidoFinalizable(Pedido pedido) {
        if (pedido.getEstado() != Pedido.Estado.EN_COCINA) {
            throw new IllegalStateException("Solo se puede finalizar un pedido en preparación.");
        }
    }

    public void validarDetallePreparacion(DetallePedido detalle) {
        if (!Boolean.TRUE.equals(detalle.getRequierePreparacion())) {
            throw new IllegalStateException("El ítem no requiere preparación y no puede operarse en KDS.");
        }
        if (detalle.getEstadoCocina() == DetallePedido.EstadoCocina.CANCELADO) {
            throw new IllegalStateException("El ítem está cancelado.");
        }
    }

    public boolean estaCongelado(DetallePedido detalle) {
        return detalle.getEstadoCocina() == DetallePedido.EstadoCocina.LISTO
                && detalle.getFechaFinPreparacion() != null
                && detalle.getTiempoRealMinutos() != null;
    }
}
