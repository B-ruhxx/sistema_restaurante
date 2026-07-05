package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "lote_insumo")
public class LoteInsumo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lote_insumo")
    private Integer idLoteInsumo;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_insumo", nullable = false)
    private Insumo insumo;

    @ManyToOne
    @JoinColumn(name = "id_detalle_compra")
    private DetalleCompraInsumo detalleCompra;

    @Column(name = "numero_lote", nullable = false, length = 80)
    private String numeroLote;

    @Column(name = "cantidad_inicial", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadInicial;

    @Column(name = "cantidad_disponible", nullable = false, precision = 10, scale = 2)
    private BigDecimal cantidadDisponible;

    @Column(name = "costo_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal costoUnitario = BigDecimal.ZERO;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('DISPONIBLE','AGOTADO') DEFAULT 'DISPONIBLE'")
    private Estado estado = Estado.DISPONIBLE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Estado {
        DISPONIBLE, AGOTADO
    }

    public Integer getIdLoteInsumo() {
        return idLoteInsumo;
    }

    public void setIdLoteInsumo(Integer idLoteInsumo) {
        this.idLoteInsumo = idLoteInsumo;
    }

    public Insumo getInsumo() {
        return insumo;
    }

    public void setInsumo(Insumo insumo) {
        this.insumo = insumo;
    }

    public DetalleCompraInsumo getDetalleCompra() {
        return detalleCompra;
    }

    public void setDetalleCompra(DetalleCompraInsumo detalleCompra) {
        this.detalleCompra = detalleCompra;
    }

    public String getNumeroLote() {
        return numeroLote;
    }

    public void setNumeroLote(String numeroLote) {
        this.numeroLote = numeroLote;
    }

    public BigDecimal getCantidadInicial() {
        return cantidadInicial;
    }

    public void setCantidadInicial(BigDecimal cantidadInicial) {
        this.cantidadInicial = cantidadInicial;
    }

    public BigDecimal getCantidadDisponible() {
        return cantidadDisponible;
    }

    public void setCantidadDisponible(BigDecimal cantidadDisponible) {
        this.cantidadDisponible = cantidadDisponible;
    }

    public BigDecimal getCostoUnitario() {
        return costoUnitario;
    }

    public void setCostoUnitario(BigDecimal costoUnitario) {
        this.costoUnitario = costoUnitario;
    }

    public LocalDate getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(LocalDate fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LoteInsumo that = (LoteInsumo) o;
        return Objects.equals(idLoteInsumo, that.idLoteInsumo);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idLoteInsumo);
    }
}
