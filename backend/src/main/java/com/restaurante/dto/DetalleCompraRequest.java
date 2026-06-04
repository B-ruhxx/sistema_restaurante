package com.restaurante.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class DetalleCompraRequest {

    @NotNull(message = "El insumo es obligatorio.")
    private Integer idInsumo;

    @NotNull(message = "La cantidad es obligatoria.")
    @Positive(message = "La cantidad debe ser mayor a 0.")
    private BigDecimal cantidad;

    @NotNull(message = "El precio unitario es obligatorio.")
    @Positive(message = "El precio unitario debe ser mayor a 0.")
    private BigDecimal precioUnitario;

    public DetalleCompraRequest() {}

    public Integer getIdInsumo() { return idInsumo; }
    public void setIdInsumo(Integer idInsumo) { this.idInsumo = idInsumo; }

    public BigDecimal getCantidad() { return cantidad; }
    public void setCantidad(BigDecimal cantidad) { this.cantidad = cantidad; }

    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }
}
