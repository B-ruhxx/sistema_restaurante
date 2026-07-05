package com.restaurante.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class VentaPagoRequest {

    @NotNull(message = "El método de pago es obligatorio.")
    private Integer idMetodoPago;

    @NotNull(message = "El monto del pago es obligatorio.")
    @Positive(message = "El monto del pago debe ser mayor a 0.")
    private BigDecimal monto;

    private String referencia;

    public VentaPagoRequest() {}

    public Integer getIdMetodoPago() { return idMetodoPago; }
    public void setIdMetodoPago(Integer idMetodoPago) { this.idMetodoPago = idMetodoPago; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }

    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
}
