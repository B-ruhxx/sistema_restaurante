package com.restaurante.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public class CajaAperturaRequest {

    @NotNull(message = "El monto de apertura es obligatorio.")
    @PositiveOrZero(message = "El monto de apertura debe ser mayor o igual a 0.")
    private BigDecimal montoApertura;

    private String observacion;

    public CajaAperturaRequest() {}

    public CajaAperturaRequest(BigDecimal montoApertura, String observacion) {
        this.montoApertura = montoApertura;
        this.observacion = observacion;
    }

    public BigDecimal getMontoApertura() { return montoApertura; }
    public void setMontoApertura(BigDecimal montoApertura) { this.montoApertura = montoApertura; }

    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
}
