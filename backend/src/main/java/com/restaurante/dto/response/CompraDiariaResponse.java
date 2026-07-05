package com.restaurante.dto.response;

import java.math.BigDecimal;

public class CompraDiariaResponse {
    private String fecha;
    private BigDecimal total;
    private Long cantidad;

    public CompraDiariaResponse() {
    }

    public CompraDiariaResponse(String fecha, BigDecimal total, Long cantidad) {
        this.fecha = fecha;
        this.total = total;
        this.cantidad = cantidad;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public Long getCantidad() {
        return cantidad;
    }

    public void setCantidad(Long cantidad) {
        this.cantidad = cantidad;
    }
}
