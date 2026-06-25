package com.restaurante.dto.mapper;

import com.restaurante.dto.response.DetallePedidoResponse;
import com.restaurante.dto.response.PrecuentaResponse;
import com.restaurante.entity.Precuenta;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PrecuentaMapper {
    public PrecuentaResponse toResponse(Precuenta precuenta, List<DetallePedidoResponse> detalles) {
        PrecuentaResponse response = new PrecuentaResponse();
        response.setIdPrecuenta(precuenta.getIdPrecuenta());
        response.setNumero(precuenta.getNumero());
        response.setFechaEmision(precuenta.getFechaEmision());
        response.setSubtotal(precuenta.getSubtotal());
        response.setIgv(precuenta.getIgv());
        response.setTotal(precuenta.getTotal());
        response.setEstado(precuenta.getEstado() != null ? precuenta.getEstado().name() : null);
        response.setDetalles(detalles);

        if (precuenta.getPedido() != null) {
            response.setIdPedido(precuenta.getPedido().getIdPedido());
            if (precuenta.getPedido().getMesa() != null) {
                response.setIdMesa(precuenta.getPedido().getMesa().getIdMesa());
                response.setNumeroMesa(precuenta.getPedido().getMesa().getNumero());
            }
        }

        if (precuenta.getEmitidoPor() != null) {
            response.setEmitidoPorNombre((precuenta.getEmitidoPor().getNombre() + " "
                    + precuenta.getEmitidoPor().getApellido()).trim());
        }

        return response;
    }
}
