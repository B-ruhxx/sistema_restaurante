package com.restaurante.dto.response;

import java.math.BigDecimal;

public class DetalleVentaResponse {
    private Integer idDetalleVenta;
    private Integer idProducto;
    private String nombreProducto;
    private Integer idCombo;
    private String nombreCombo;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;

    public Integer getIdDetalleVenta() {
        return idDetalleVenta;
    }

    public void setIdDetalleVenta(Integer idDetalleVenta) {
        this.idDetalleVenta = idDetalleVenta;
    }

    public Integer getIdDetalle() {
        return idDetalleVenta;
    }

    public void setIdDetalle(Integer idDetalle) {
        this.idDetalleVenta = idDetalle;
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

    public Integer getIdCombo() {
        return idCombo;
    }

    public void setIdCombo(Integer idCombo) {
        this.idCombo = idCombo;
    }

    public String getNombreCombo() {
        return nombreCombo;
    }

    public void setNombreCombo(String nombreCombo) {
        this.nombreCombo = nombreCombo;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}
