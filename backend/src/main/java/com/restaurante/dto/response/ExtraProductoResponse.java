package com.restaurante.dto.response;

import java.math.BigDecimal;

public class ExtraProductoResponse {
    private Integer idExtra;
    private String nombre;
    private BigDecimal precio;
    private Integer idInsumo;
    private String nombreInsumo;
    private String unidadMedidaInsumo;
    private BigDecimal cantidadConsumida;
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

    public Integer getIdInsumo() {
        return idInsumo;
    }

    public void setIdInsumo(Integer idInsumo) {
        this.idInsumo = idInsumo;
    }

    public String getNombreInsumo() {
        return nombreInsumo;
    }

    public void setNombreInsumo(String nombreInsumo) {
        this.nombreInsumo = nombreInsumo;
    }

    public String getUnidadMedidaInsumo() {
        return unidadMedidaInsumo;
    }

    public void setUnidadMedidaInsumo(String unidadMedidaInsumo) {
        this.unidadMedidaInsumo = unidadMedidaInsumo;
    }

    public BigDecimal getCantidadConsumida() {
        return cantidadConsumida;
    }

    public void setCantidadConsumida(BigDecimal cantidadConsumida) {
        this.cantidadConsumida = cantidadConsumida;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
