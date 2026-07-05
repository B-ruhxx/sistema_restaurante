package com.restaurante.dto.response;

import java.math.BigDecimal;

public class ResumenFinancieroResponse {
    private BigDecimal totalVentas;
    private BigDecimal baseImponible;
    private BigDecimal igv;
    private BigDecimal costoTotal;
    private BigDecimal totalCompras;
    private BigDecimal gananciaNeta;

    public BigDecimal getTotalVentas() {
        return totalVentas;
    }

    public void setTotalVentas(BigDecimal totalVentas) {
        this.totalVentas = totalVentas;
    }

    public BigDecimal getBaseImponible() {
        return baseImponible;
    }

    public void setBaseImponible(BigDecimal baseImponible) {
        this.baseImponible = baseImponible;
    }

    public BigDecimal getIgv() {
        return igv;
    }

    public void setIgv(BigDecimal igv) {
        this.igv = igv;
    }

    public BigDecimal getCostoTotal() {
        return costoTotal;
    }

    public void setCostoTotal(BigDecimal costoTotal) {
        this.costoTotal = costoTotal;
    }

    public BigDecimal getTotalCompras() {
        return totalCompras;
    }

    public void setTotalCompras(BigDecimal totalCompras) {
        this.totalCompras = totalCompras;
    }

    public BigDecimal getGananciaNeta() {
        return gananciaNeta;
    }

    public void setGananciaNeta(BigDecimal gananciaNeta) {
        this.gananciaNeta = gananciaNeta;
    }
}
