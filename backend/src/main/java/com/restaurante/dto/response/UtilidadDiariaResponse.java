package com.restaurante.dto.response;

import java.math.BigDecimal;

public class UtilidadDiariaResponse {
    private String fecha;
    private BigDecimal ventas;
    private BigDecimal costo;
    private BigDecimal utilidad;

    public UtilidadDiariaResponse() {
    }

    public UtilidadDiariaResponse(String fecha, BigDecimal ventas, BigDecimal costo, BigDecimal utilidad) {
        this.fecha = fecha;
        this.ventas = ventas;
        this.costo = costo;
        this.utilidad = utilidad;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getVentas() {
        return ventas;
    }

    public void setVentas(BigDecimal ventas) {
        this.ventas = ventas;
    }

    public BigDecimal getCosto() {
        return costo;
    }

    public void setCosto(BigDecimal costo) {
        this.costo = costo;
    }

    public BigDecimal getUtilidad() {
        return utilidad;
    }

    public void setUtilidad(BigDecimal utilidad) {
        this.utilidad = utilidad;
    }
}
