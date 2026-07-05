package com.restaurante.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class MovimientoInventarioResponse {
    private Integer idMovimiento;
    private String tipoRecurso;
    private Integer idInsumo;
    private String nombreInsumo;
    private Integer idLoteInsumo;
    private Integer idLoteProducto;
    private LocalDate fechaVencimientoLote;
    private Integer idProducto;
    private String nombreProducto;
    private String tipoMovimiento;
    private String referenceType;
    private Integer referenceId;
    private BigDecimal cantidad;
    private BigDecimal stockAnterior;
    private BigDecimal stockNuevo;
    private BigDecimal costoUnitario;
    private BigDecimal saldoValorizado;
    private String motivo;
    private LocalDateTime fecha;
    private Integer idEmpleado;
    private String nombreEmpleado;

    public Integer getIdMovimiento() {
        return idMovimiento;
    }

    public void setIdMovimiento(Integer idMovimiento) {
        this.idMovimiento = idMovimiento;
    }

    public String getTipoRecurso() {
        return tipoRecurso;
    }

    public void setTipoRecurso(String tipoRecurso) {
        this.tipoRecurso = tipoRecurso;
    }

    public Integer getIdInsumo() {
        return idInsumo;
    }

    public void setIdInsumo(Integer idInsumo) {
        this.idInsumo = idInsumo;
    }

    public String getNombreInsumo() {
        return nombreInsumo;
    }

    public void setNombreInsumo(String nombreInsumo) {
        this.nombreInsumo = nombreInsumo;
    }

    public Integer getIdLoteInsumo() {
        return idLoteInsumo;
    }

    public void setIdLoteInsumo(Integer idLoteInsumo) {
        this.idLoteInsumo = idLoteInsumo;
    }

    public Integer getIdLoteProducto() {
        return idLoteProducto;
    }

    public void setIdLoteProducto(Integer idLoteProducto) {
        this.idLoteProducto = idLoteProducto;
    }

    public LocalDate getFechaVencimientoLote() {
        return fechaVencimientoLote;
    }

    public void setFechaVencimientoLote(LocalDate fechaVencimientoLote) {
        this.fechaVencimientoLote = fechaVencimientoLote;
    }

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public String getTipoMovimiento() {
        return tipoMovimiento;
    }

    public void setTipoMovimiento(String tipoMovimiento) {
        this.tipoMovimiento = tipoMovimiento;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public Integer getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Integer referenceId) {
        this.referenceId = referenceId;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getStockAnterior() {
        return stockAnterior;
    }

    public void setStockAnterior(BigDecimal stockAnterior) {
        this.stockAnterior = stockAnterior;
    }

    public BigDecimal getStockNuevo() {
        return stockNuevo;
    }

    public void setStockNuevo(BigDecimal stockNuevo) {
        this.stockNuevo = stockNuevo;
    }

    public BigDecimal getCostoUnitario() {
        return costoUnitario;
    }

    public void setCostoUnitario(BigDecimal costoUnitario) {
        this.costoUnitario = costoUnitario;
    }

    public BigDecimal getSaldoValorizado() {
        return saldoValorizado;
    }

    public void setSaldoValorizado(BigDecimal saldoValorizado) {
        this.saldoValorizado = saldoValorizado;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
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
}
