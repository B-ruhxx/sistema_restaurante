package com.restaurante.dto;

import jakarta.validation.constraints.NotBlank;

public class VentaAnulacionRequest {

    @NotBlank(message = "El motivo de anulación es obligatorio.")
    private String motivo;

    public VentaAnulacionRequest() {}

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
