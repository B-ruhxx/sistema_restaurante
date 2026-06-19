package com.restaurante.dto.response;

import java.math.BigDecimal;

public class ExtraProductoResponse {
    private Integer idExtra;
    private String nombre;
    private BigDecimal precio;
    private String estado;

    public Integer getIdExtra() {
        return idExtra;
    }

    public void setIdExtra(Integer idExtra) {
        this.idExtra = idExtra;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
