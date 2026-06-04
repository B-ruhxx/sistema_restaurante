package com.restaurante.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public class CajaCierreRequest {

    @NotNull(message = "El monto de cierre es obligatorio.")
    @PositiveOrZero(message = "El monto de cierre debe ser mayor o igual a 0.")
    private BigDecimal montoCierre;

    private String observacion;

    public CajaCierreRequest() {}

    public CajaCierreRequest(BigDecimal montoCierre, String observacion) {
        this.montoCierre = montoCierre;
        this.observacion = observacion;
    }

    public BigDecimal getMontoCierre() { return montoCierre; }
    public void setMontoCierre(BigDecimal montoCierre) { this.montoCierre = montoCierre; }

    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
}
