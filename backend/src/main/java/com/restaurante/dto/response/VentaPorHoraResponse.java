package com.restaurante.dto.response;

import java.math.BigDecimal;

public class VentaPorHoraResponse {
    private Integer hora;
    private String etiqueta;
    private BigDecimal total;
    private Long cantidad;

    public VentaPorHoraResponse() {
    }

    public VentaPorHoraResponse(Integer hora, String etiqueta, BigDecimal total, Long cantidad) {
        this.hora = hora;
        this.etiqueta = etiqueta;
        this.total = total;
        this.cantidad = cantidad;
    }

    public Integer getHora() {
        return hora;
    }

    public void setHora(Integer hora) {
        this.hora = hora;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public void setEtiqueta(String etiqueta) {
        this.etiqueta = etiqueta;
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
