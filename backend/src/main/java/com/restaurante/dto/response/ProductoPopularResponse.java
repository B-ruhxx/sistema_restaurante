package com.restaurante.dto.response;

import java.math.BigDecimal;

public class ProductoPopularResponse {
    private String producto;
    private String categoria;
    private Long cantidad;
    private BigDecimal total;

    public ProductoPopularResponse() {
    }

    public ProductoPopularResponse(String producto, String categoria, Long cantidad, BigDecimal total) {
        this.producto = producto;
        this.categoria = categoria;
        this.cantidad = cantidad;
        this.total = total;
    }

    public String getProducto() {
        return producto;
    }

    public void setProducto(String producto) {
        this.producto = producto;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public Long getCantidad() {
        return cantidad;
    }

    public void setCantidad(Long cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}
