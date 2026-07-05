package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "movimiento_inventario")
public class MovimientoInventario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_movimiento")
    private Integer idMovimiento;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_recurso", columnDefinition = "ENUM('INSUMO', 'PRODUCTO') NOT NULL")
    private TipoRecurso tipoRecurso;

    @ManyToOne
    @JoinColumn(name = "id_insumo")
    private Insumo insumo;

    @ManyToOne
    @JoinColumn(name = "id_lote_insumo")
    private LoteInsumo loteInsumo;

    @ManyToOne
    @JoinColumn(name = "id_producto")
    private Producto producto;

    @ManyToOne
    @JoinColumn(name = "id_lote_producto")
    private LoteProducto loteProducto;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movimiento", columnDefinition = "ENUM('ENTRADA_COMPRA','SALIDA_VENTA','SALIDA_AJUSTE','ENTRADA_ANULACION','MERMA','DEVOLUCION','CORRECCION') NOT NULL")
    private TipoMovimiento tipoMovimiento;

    @Column(name = "reference_type", nullable = false, length = 40)
    private String referenceType;

    @Column(name = "reference_id", nullable = false)
    private Integer referenceId;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal cantidad;

    @Column(name = "stock_anterior", nullable = false, precision = 12, scale = 3)
    private BigDecimal stockAnterior;

    @Column(name = "stock_nuevo", nullable = false, precision = 12, scale = 3)
    private BigDecimal stockNuevo;

    @Column(name = "costo_unitario", precision = 10, scale = 4)
    private BigDecimal costoUnitario;

    @Column(name = "saldo_valorizado", precision = 12, scale = 2)
    private BigDecimal saldoValorizado;

    @Column(nullable = false, length = 255)
    private String motivo;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;

    @ManyToOne
    @JoinColumn(name = "id_empleado")
    private Empleado empleado;

    public enum TipoRecurso {
        INSUMO, PRODUCTO
    }

    public enum TipoMovimiento {
        ENTRADA_COMPRA, SALIDA_VENTA, SALIDA_AJUSTE, ENTRADA_ANULACION, MERMA, DEVOLUCION, CORRECCION
    }

    public MovimientoInventario() {
    }

    public Integer getIdMovimiento() {
        return idMovimiento;
    }

    public void setIdMovimiento(Integer idMovimiento) {
        this.idMovimiento = idMovimiento;
    }

    public TipoRecurso getTipoRecurso() {
        return tipoRecurso;
    }

    public void setTipoRecurso(TipoRecurso tipoRecurso) {
        this.tipoRecurso = tipoRecurso;
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

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public LoteProducto getLoteProducto() {
        return loteProducto;
    }

    public void setLoteProducto(LoteProducto loteProducto) {
        this.loteProducto = loteProducto;
    }

    public TipoMovimiento getTipoMovimiento() {
        return tipoMovimiento;
    }

    public void setTipoMovimiento(TipoMovimiento tipoMovimiento) {
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

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        MovimientoInventario that = (MovimientoInventario) o;
        return Objects.equals(idMovimiento, that.idMovimiento);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idMovimiento);
    }
}
