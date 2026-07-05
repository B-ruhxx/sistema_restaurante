package com.restaurante.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class VentaResponse {
    private Integer idVenta;
    private String comprobante;
    private LocalDateTime fecha;
    private BigDecimal subtotal;
    private BigDecimal igv;
    private BigDecimal total;
    private String tipoComprobante;
    private String serie;
    private String numero;
    private String estado;
    private Integer idPedido;
    private String cajeroNombre;
    private Integer idCaja;

    public Integer getIdVenta() {
        return idVenta;
    }

    public void setIdVenta(Integer idVenta) {
        this.idVenta = idVenta;
    }

    public String getComprobante() {
        return comprobante;
    }

    public void setComprobante(String comprobante) {
        this.comprobante = comprobante;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getIgv() {
        return igv;
    }

    public void setIgv(BigDecimal igv) {
        this.igv = igv;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getTipoComprobante() {
        return tipoComprobante;
    }

    public void setTipoComprobante(String tipoComprobante) {
        this.tipoComprobante = tipoComprobante;
    }

    public String getSerie() {
        return serie;
    }

    public void setSerie(String serie) {
        this.serie = serie;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Integer getIdPedido() {
        return idPedido;
    }

    public void setIdPedido(Integer idPedido) {
        this.idPedido = idPedido;
    }

    public String getCajeroNombre() {
        return cajeroNombre;
    }

    public void setCajeroNombre(String cajeroNombre) {
        this.cajeroNombre = cajeroNombre;
    }

    public Integer getIdCaja() {
        return idCaja;
    }

    public void setIdCaja(Integer idCaja) {
        this.idCaja = idCaja;
    }

    private java.util.List<DetalleVentaResponse> detalles;
    private java.util.List<VentaPagoResponse> pagos;

    public java.util.List<DetalleVentaResponse> getDetalles() {
        return detalles;
    }

    public void setDetalles(java.util.List<DetalleVentaResponse> detalles) {
        this.detalles = detalles;
    }

    public java.util.List<VentaPagoResponse> getPagos() {
        return pagos;
    }

    public void setPagos(java.util.List<VentaPagoResponse> pagos) {
        this.pagos = pagos;
    }
}
