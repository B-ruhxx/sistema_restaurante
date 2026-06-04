package com.restaurante.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class PedidoRequest {
    private Integer idCliente;

    @NotEmpty(message = "El pedido debe contener al menos un producto o combo.")
    private List<DetallePedidoRequest> detalles;

    public PedidoRequest() {}

    public Integer getIdCliente() { return idCliente; }
    public void setIdCliente(Integer idCliente) { this.idCliente = idCliente; }

    public List<DetallePedidoRequest> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePedidoRequest> detalles) { this.detalles = detalles; }
}
