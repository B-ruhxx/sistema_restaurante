package com.restaurante.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class RecetaProductoRequest {
    @NotNull(message = "El ID de insumo es obligatorio")
    private Integer idInsumo;

    @NotNull(message = "La cantidad es obligatoria")
    @Positive(message = "La cantidad debe ser mayor a 0")
    private BigDecimal cantidad;

    public Integer getIdInsumo() {
        return idInsumo;
    }

    public void setIdInsumo(Integer idInsumo) {
        this.idInsumo = idInsumo;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

}
