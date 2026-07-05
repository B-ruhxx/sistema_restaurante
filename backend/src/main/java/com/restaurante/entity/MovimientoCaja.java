package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "movimiento_caja")
public class MovimientoCaja {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_movimiento")
    private Integer idMovimiento;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_caja", nullable = false)
    private Caja caja;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('INGRESO', 'EGRESO') NOT NULL")
    private Tipo tipo;

    @Column(length = 255)
    private String concepto;

    @Column(precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "reference_type", nullable = false, length = 40)
    private String referenceType;

    @Column(name = "reference_id", nullable = false)
    private Integer referenceId;

    @Column(nullable = false, length = 80)
    private String comprobante;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_empleado", nullable = false)
    private Empleado empleado;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;

    public enum Tipo {
        INGRESO, EGRESO
    }

    public MovimientoCaja() {
    }

    public Integer getIdMovimiento() {
        return idMovimiento;
    }

    public void setIdMovimiento(Integer idMovimiento) {
        this.idMovimiento = idMovimiento;
    }

    public Caja getCaja() {
        return caja;
    }

    public void setCaja(Caja caja) {
        this.caja = caja;
    }

    public Tipo getTipo() {
        return tipo;
    }

    public void setTipo(Tipo tipo) {
        this.tipo = tipo;
    }

    public String getConcepto() {
        return concepto;
    }

    public void setConcepto(String concepto) {
        this.concepto = concepto;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
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

    public String getComprobante() {
        return comprobante;
    }

    public void setComprobante(String comprobante) {
        this.comprobante = comprobante;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
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
        MovimientoCaja that = (MovimientoCaja) o;
        return Objects.equals(idMovimiento, that.idMovimiento);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idMovimiento);
    }
}
