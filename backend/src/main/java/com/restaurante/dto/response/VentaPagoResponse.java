package com.restaurante.dto.response;

import java.math.BigDecimal;

public class VentaPagoResponse {
    private Integer idVentaPago;
    private Integer idMetodoPago;
    private String nombreMetodoPago;
    private BigDecimal monto;
    private String referencia;
    private String estado;

    public Integer getIdVentaPago() {
        return idVentaPago;
    }

    public void setIdVentaPago(Integer idVentaPago) {
        this.idVentaPago = idVentaPago;
    }

    public Integer getIdMetodoPago() {
        return idMetodoPago;
    }

    public void setIdMetodoPago(Integer idMetodoPago) {
        this.idMetodoPago = idMetodoPago;
    }

    public String getNombreMetodoPago() {
        return nombreMetodoPago;
    }

    public void setNombreMetodoPago(String nombreMetodoPago) {
        this.nombreMetodoPago = nombreMetodoPago;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
