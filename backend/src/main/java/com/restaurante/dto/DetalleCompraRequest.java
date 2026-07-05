package com.restaurante.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public class DetalleCompraRequest {

    private Integer idInsumo;
    private Integer idProducto;
    private String numeroLote;

    @NotNull(message = "La cantidad es obligatoria.")
    @Positive(message = "La cantidad debe ser mayor a 0.")
    private BigDecimal cantidad;

    @NotNull(message = "El precio unitario es obligatorio.")
    @Positive(message = "El precio unitario debe ser mayor a 0.")
    private BigDecimal precioUnitario;

    @NotNull(message = "La fecha de vencimiento es obligatoria.")
    private LocalDate fechaVencimiento;

    public DetalleCompraRequest() {}

    public Integer getIdInsumo() { return idInsumo; }
    public void setIdInsumo(Integer idInsumo) { this.idInsumo = idInsumo; }

    public Integer getIdProducto() { return idProducto; }
    public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }

    public String getNumeroLote() { return numeroLote; }
    public void setNumeroLote(String numeroLote) { this.numeroLote = numeroLote; }

    public BigDecimal getCantidad() { return cantidad; }
    public void setCantidad(BigDecimal cantidad) { this.cantidad = cantidad; }

    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }

    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(LocalDate fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }
}
