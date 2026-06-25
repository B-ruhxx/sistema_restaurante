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

    @ManyToOne(optional = false)
    @JoinColumn(name = "emitido_por", nullable = false)
    private Empleado emitidoPor;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2)
    private BigDecimal igv;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('EMITIDA','ANULADA','CONVERTIDA_VENTA') DEFAULT 'EMITIDA'")
    private Estado estado = Estado.EMITIDA;

    public enum Estado {
        EMITIDA, ANULADA, CONVERTIDA_VENTA
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
