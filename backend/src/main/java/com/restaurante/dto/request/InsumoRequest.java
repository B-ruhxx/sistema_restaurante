package com.restaurante.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class InsumoRequest {
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder los 100 caracteres")
    private String nombre;

    @NotBlank(message = "La unidad es obligatoria")
    @Size(max = 20, message = "La unidad no puede exceder los 20 caracteres")
    private String unidad;

    @NotNull(message = "El stock es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El stock no puede ser negativo")
    private BigDecimal stock;

    @NotNull(message = "El stock mínimo es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El stock mínimo no puede ser negativo")
    private BigDecimal stockMinimo;

    @DecimalMin(value = "0.0", inclusive = true, message = "El costo promedio no puede ser negativo")
    private BigDecimal costoPromedio;

    private String estado; // ACTIVO / INACTIVO

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getUnidad() {
        return unidad;
    }

    public void setUnidad(String unidad) {
        this.unidad = unidad;
    }

    public BigDecimal getStock() {
        return stock;
    }

    public void setStock(BigDecimal stock) {
        this.stock = stock;
    }

    public BigDecimal getStockMinimo() {
        return stockMinimo;
    }

    public void setStockMinimo(BigDecimal stockMinimo) {
        this.stockMinimo = stockMinimo;
    }

    public BigDecimal getCostoPromedio() {
        return costoPromedio;
    }

    public void setCostoPromedio(BigDecimal costoPromedio) {
        this.costoPromedio = costoPromedio;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
