package com.restaurante.dto.response;

import java.math.BigDecimal;

public class VarianteProductoResponse {
    private Integer idVariante;
    private Integer idProducto;
    private String nombreProducto;
    private String nombre;
    private String descripcion;
    private BigDecimal precioExtra;
    private String estado;

    public Integer getIdVariante() {
        return idVariante;
    }

    public void setIdVariante(Integer idVariante) {
        this.idVariante = idVariante;
    }

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getPrecioExtra() {
        return precioExtra;
    }

    public void setPrecioExtra(BigDecimal precioExtra) {
        this.precioExtra = precioExtra;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
