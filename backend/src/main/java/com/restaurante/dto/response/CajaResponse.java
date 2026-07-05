package com.restaurante.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CajaResponse {
    private Integer idCaja;
    private Integer idEmpleado;
    private String nombreEmpleado;
    private String estado;
    private BigDecimal montoApertura;
    private BigDecimal montoCierre;
    private BigDecimal montoSistema;
    private BigDecimal diferencia;
    private BigDecimal montoVentas;
    private BigDecimal montoIngresos;
    private BigDecimal montoEgresos;
    private BigDecimal saldoEsperado;
    private String observacion;
    private LocalDateTime fechaApertura;
    private LocalDateTime fechaCierre;

    public Integer getIdCaja() {
        return idCaja;
    }

    public void setIdCaja(Integer idCaja) {
        this.idCaja = idCaja;
    }

    public Integer getIdEmpleado() {
        return idEmpleado;
    }

    public void setIdEmpleado(Integer idEmpleado) {
        this.idEmpleado = idEmpleado;
    }

    public String getNombreEmpleado() {
        return nombreEmpleado;
    }

    public void setNombreEmpleado(String nombreEmpleado) {
        this.nombreEmpleado = nombreEmpleado;
    }

    public String getEmpleadoNombre() {
        return nombreEmpleado;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public BigDecimal getMontoApertura() {
        return montoApertura;
    }

    public void setMontoApertura(BigDecimal montoApertura) {
        this.montoApertura = montoApertura;
    }

    public BigDecimal getMontoCierre() {
        return montoCierre;
    }

    public void setMontoCierre(BigDecimal montoCierre) {
        this.montoCierre = montoCierre;
    }

    public BigDecimal getMontoSistema() {
        return montoSistema;
    }

    public void setMontoSistema(BigDecimal montoSistema) {
        this.montoSistema = montoSistema;
    }

    public BigDecimal getDiferencia() {
        return diferencia;
    }

    public void setDiferencia(BigDecimal diferencia) {
        this.diferencia = diferencia;
    }

    public BigDecimal getMontoVentas() {
        return montoVentas;
    }

    public void setMontoVentas(BigDecimal montoVentas) {
        this.montoVentas = montoVentas;
    }

    public BigDecimal getMontoIngresos() {
        return montoIngresos;
    }

    public void setMontoIngresos(BigDecimal montoIngresos) {
        this.montoIngresos = montoIngresos;
    }

    public BigDecimal getMontoEgresos() {
        return montoEgresos;
    }

    public void setMontoEgresos(BigDecimal montoEgresos) {
        this.montoEgresos = montoEgresos;
    }

    public BigDecimal getSaldoEsperado() {
        return saldoEsperado;
    }

    public void setSaldoEsperado(BigDecimal saldoEsperado) {
        this.saldoEsperado = saldoEsperado;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public String getObservacionApertura() {
        return observacion;
    }

    public String getObservacionCierre() {
        return observacion;
    }

    public LocalDateTime getFechaApertura() {
        return fechaApertura;
    }

    public void setFechaApertura(LocalDateTime fechaApertura) {
        this.fechaApertura = fechaApertura;
    }

    public LocalDateTime getFechaCierre() {
        return fechaCierre;
    }

    public void setFechaCierre(LocalDateTime fechaCierre) {
        this.fechaCierre = fechaCierre;
    }
}
