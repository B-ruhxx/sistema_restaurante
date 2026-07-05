package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "ajuste_inventario")
public class AjusteInventario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ajuste")
    private Integer idAjuste;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_recurso", columnDefinition = "ENUM('INSUMO','PRODUCTO') NOT NULL")
    private MovimientoInventario.TipoRecurso tipoRecurso;

    @ManyToOne
    @JoinColumn(name = "id_insumo")
    private Insumo insumo;

    @ManyToOne
    @JoinColumn(name = "id_producto")
    private Producto producto;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal cantidad;

    @Column(nullable = false, length = 255)
    private String motivo;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('REGISTRADO','ANULADO') DEFAULT 'REGISTRADO'")
    private Estado estado = Estado.REGISTRADO;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime fecha;

    @ManyToOne
    @JoinColumn(name = "id_empleado", nullable = false)
    private Empleado empleado;

    public enum Estado {
        REGISTRADO, ANULADO
    }

    public Integer getIdAjuste() {
        return idAjuste;
    }

    public void setIdAjuste(Integer idAjuste) {
        this.idAjuste = idAjuste;
    }

    public MovimientoInventario.TipoRecurso getTipoRecurso() {
        return tipoRecurso;
    }

    public void setTipoRecurso(MovimientoInventario.TipoRecurso tipoRecurso) {
        this.tipoRecurso = tipoRecurso;
    }

    public Insumo getInsumo() {
        return insumo;
    }

    public void setInsumo(Insumo insumo) {
        this.insumo = insumo;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
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
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AjusteInventario that = (AjusteInventario) o;
        return Objects.equals(idAjuste, that.idAjuste);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idAjuste);
    }
}
