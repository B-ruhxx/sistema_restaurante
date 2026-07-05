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

    @NotBlank(message = "El tipo de referencia es obligatorio.")
    private String referenceType;

    @NotNull(message = "El id de referencia es obligatorio.")
    private Integer referenceId;

    @NotBlank(message = "El comprobante es obligatorio.")
    private String comprobante;

    public MovimientoCajaRequest() {}

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getConcepto() { return concepto; }
    public void setConcepto(String concepto) { this.concepto = concepto; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }

    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }

    public Integer getReferenceId() { return referenceId; }
    public void setReferenceId(Integer referenceId) { this.referenceId = referenceId; }

    public String getComprobante() { return comprobante; }
    public void setComprobante(String comprobante) { this.comprobante = comprobante; }
}
