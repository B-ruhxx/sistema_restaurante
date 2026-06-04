package com.restaurante.dto;

import jakarta.validation.constraints.NotBlank;

public class PedidoEstadoRequest {

    @NotBlank(message = "El estado del pedido es obligatorio.")
    private String estado;

    public PedidoEstadoRequest() {}

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
