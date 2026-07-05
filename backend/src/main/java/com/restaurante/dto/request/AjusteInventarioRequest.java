package com.restaurante.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class AjusteInventarioRequest {
    @NotBlank(message = "El tipo de recurso es obligatorio.")
    private String tipoRecurso;

    private Integer idInsumo;
    private Integer idProducto;

    @NotNull(message = "La cantidad es obligatoria.")
    @Positive(message = "La cantidad debe ser mayor a 0.")
    private BigDecimal cantidad;

    @NotBlank(message = "El motivo es obligatorio.")
    @Size(max = 255, message = "El motivo no puede exceder 255 caracteres.")
    private String motivo;

    public String getTipoRecurso() {
        return tipoRecurso;
    }

    public void setTipoRecurso(String tipoRecurso) {
        this.tipoRecurso = tipoRecurso;
    }

    public Integer getIdInsumo() {
        return idInsumo;
    }

    public void setIdInsumo(Integer idInsumo) {
        this.idInsumo = idInsumo;
    }

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}
