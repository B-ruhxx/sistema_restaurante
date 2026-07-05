package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "consumo_insumo_venta")
public class ConsumoInsumoVenta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_consumo")
    private Integer idConsumo;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_venta", nullable = false)
    private Venta venta;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_detalle_venta", nullable = false)
    private DetalleVenta detalleVenta;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_insumo", nullable = false)
    private Insumo insumo;

    @ManyToOne
    @JoinColumn(name = "id_lote_insumo")
    private LoteInsumo loteInsumo;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal cantidad;

    @Column(name = "costo_unitario", nullable = false, precision = 10, scale = 4)
    private BigDecimal costoUnitario = BigDecimal.ZERO;

    @Column(name = "costo_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal costoTotal = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;

    public ConsumoInsumoVenta() {
    }

    public Integer getIdConsumo() {
        return idConsumo;
    }

    public void setIdConsumo(Integer idConsumo) {
        this.idConsumo = idConsumo;
    }

    public Venta getVenta() {
        return venta;
    }

    public void setVenta(Venta venta) {
        this.venta = venta;
    }

    public DetalleVenta getDetalleVenta() {
        return detalleVenta;
    }

    public void setDetalleVenta(DetalleVenta detalleVenta) {
        this.detalleVenta = detalleVenta;
    }

    public Insumo getInsumo() {
        return insumo;
    }

    public void setInsumo(Insumo insumo) {
        this.insumo = insumo;
    }

    public LoteInsumo getLoteInsumo() {
        return loteInsumo;
    }

    public void setLoteInsumo(LoteInsumo loteInsumo) {
        this.loteInsumo = loteInsumo;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getCostoUnitario() {
        return costoUnitario;
    }

    public void setCostoUnitario(BigDecimal costoUnitario) {
        this.costoUnitario = costoUnitario;
    }

    public BigDecimal getCostoTotal() {
        return costoTotal;
    }

    public void setCostoTotal(BigDecimal costoTotal) {
        this.costoTotal = costoTotal;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        ConsumoInsumoVenta that = (ConsumoInsumoVenta) o;
        return Objects.equals(idConsumo, that.idConsumo);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idConsumo);
    }
}
