package com.restaurante.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class MovimientoCajaRequest {

    @NotBlank(message = "El tipo de movimiento es obligatorio (INGRESO/EGRESO).")
    private String tipo;

    @NotBlank(message = "El concepto del movimiento es obligatorio.")
    private String concepto;

    @NotNull(message = "El monto del movimiento es obligatorio.")
    @Positive(message = "El monto debe ser mayor a 0.")
    private BigDecimal monto;

    public MovimientoCajaRequest() {}

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getConcepto() { return concepto; }
    public void setConcepto(String concepto) { this.concepto = concepto; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
}
