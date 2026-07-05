package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "precuenta")
public class Precuenta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_precuenta")
    private Integer idPrecuenta;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_pedido", nullable = false)
    private Pedido pedido;

    @Column(nullable = false, unique = true, length = 50)
    private String numero;

    @CreationTimestamp
    @Column(name = "fecha_emision", nullable = false, updatable = false)
    private LocalDateTime fechaEmision;

    @Column(name = "version_pedido", nullable = false)
    private Long versionPedido = 0L;

    @ManyToOne(optional = false)
    @JoinColumn(name = "emitido_por", nullable = false)
    private Empleado emitidoPor;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal igv;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('EMITIDA','INVALIDADA_POR_ADICION','CONVERTIDA_VENTA','ANULADA') DEFAULT 'EMITIDA'")
    private Estado estado = Estado.EMITIDA;

    @Column(name = "fecha_invalidacion")
    private LocalDateTime fechaInvalidacion;

    @Column(name = "motivo_invalidacion", length = 255)
    private String motivoInvalidacion;

    public enum Estado {
        EMITIDA, INVALIDADA_POR_ADICION, CONVERTIDA_VENTA, ANULADA
    }

    public Integer getIdPrecuenta() {
        return idPrecuenta;
    }

    public void setIdPrecuenta(Integer idPrecuenta) {
        this.idPrecuenta = idPrecuenta;
    }

    public Pedido getPedido() {
        return pedido;
    }

    public void setPedido(Pedido pedido) {
        this.pedido = pedido;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public LocalDateTime getFechaEmision() {
        return fechaEmision;
    }

    public Long getVersionPedido() {
        return versionPedido;
    }

    public void setVersionPedido(Long versionPedido) {
        this.versionPedido = versionPedido;
    }

    public Empleado getEmitidoPor() {
        return emitidoPor;
    }

    public void setEmitidoPor(Empleado emitidoPor) {
        this.emitidoPor = emitidoPor;
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

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaInvalidacion() {
        return fechaInvalidacion;
    }

    public void setFechaInvalidacion(LocalDateTime fechaInvalidacion) {
        this.fechaInvalidacion = fechaInvalidacion;
    }

    public String getMotivoInvalidacion() {
        return motivoInvalidacion;
    }

    public void setMotivoInvalidacion(String motivoInvalidacion) {
        this.motivoInvalidacion = motivoInvalidacion;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Precuenta that = (Precuenta) o;
        return Objects.equals(idPrecuenta, that.idPrecuenta);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idPrecuenta);
    }
}
