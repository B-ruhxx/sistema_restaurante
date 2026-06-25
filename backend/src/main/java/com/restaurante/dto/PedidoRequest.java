package com.restaurante.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class PedidoRequest {
    private Integer idCliente;
    private Integer idMesa;

    @NotEmpty(message = "El pedido debe contener al menos un producto o combo.")
    private List<DetallePedidoRequest> detalles;

    public PedidoRequest() {}

    public Integer getIdCliente() { return idCliente; }
    public void setIdCliente(Integer idCliente) { this.idCliente = idCliente; }

    public Integer getIdMesa() { return idMesa; }
    public void setIdMesa(Integer idMesa) { this.idMesa = idMesa; }

    public List<DetallePedidoRequest> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePedidoRequest> detalles) { this.detalles = detalles; }
}
