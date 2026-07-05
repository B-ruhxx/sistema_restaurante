package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "lote_producto")
public class LoteProducto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lote_producto")
    private Integer idLoteProducto;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto producto;

    @ManyToOne
    @JoinColumn(name = "id_detalle_compra")
    private DetalleCompraInsumo detalleCompra;

    @Column(name = "numero_lote", nullable = false, length = 80)
    private String numeroLote;

    @Column(name = "cantidad_inicial", nullable = false)
    private Integer cantidadInicial;

    @Column(name = "cantidad_disponible", nullable = false)
    private Integer cantidadDisponible;

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

    public Integer getIdLoteProducto() {
        return idLoteProducto;
    }

    public void setIdLoteProducto(Integer idLoteProducto) {
        this.idLoteProducto = idLoteProducto;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
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

    public Integer getCantidadInicial() {
        return cantidadInicial;
    }

    public void setCantidadInicial(Integer cantidadInicial) {
        this.cantidadInicial = cantidadInicial;
    }

    public Integer getCantidadDisponible() {
        return cantidadDisponible;
    }

    public void setCantidadDisponible(Integer cantidadDisponible) {
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
        LoteProducto that = (LoteProducto) o;
        return Objects.equals(idLoteProducto, that.idLoteProducto);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idLoteProducto);
    }
}
