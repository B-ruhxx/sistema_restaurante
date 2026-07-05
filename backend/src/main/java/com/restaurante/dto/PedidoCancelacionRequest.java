package com.restaurante.dto;

import jakarta.validation.constraints.NotBlank;

public class PedidoCancelacionRequest {
    @NotBlank(message = "El motivo de cancelación es obligatorio.")
    private String motivo;

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}
