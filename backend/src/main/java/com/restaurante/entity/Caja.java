package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

@Entity
@Table(name = "caja", uniqueConstraints = {
        @UniqueConstraint(name = "uk_empleado_caja_abierta", columnNames = { "id_empleado", "caja_abierta" })
})
public class Caja {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_caja")
    private Integer idCaja;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_empleado", nullable = false)
    private Empleado empleado;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('ABIERTA', 'CERRADA') DEFAULT 'ABIERTA'")
    private Estado estado = Estado.ABIERTA;

    @Generated(event = { EventType.INSERT, EventType.UPDATE })
    @Column(name = "caja_abierta", insertable = false, updatable = false)
    private Boolean cajaAbierta;

    @Column(name = "monto_apertura", precision = 10, scale = 2)
    private BigDecimal montoApertura;

    @Column(name = "monto_cierre", precision = 10, scale = 2)
    private BigDecimal montoCierre;

    @Column(name = "monto_sistema", precision = 10, scale = 2)
    private BigDecimal montoSistema = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal diferencia;

    @Column(columnDefinition = "TEXT")
    private String observacion;

    @CreationTimestamp
    @Column(name = "fecha_apertura", updatable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime fechaApertura;

    @Column(name = "fecha_cierre", columnDefinition = "DATETIME(6)")
    private LocalDateTime fechaCierre;

    // [NUEVA RELACIÓN] Permite mapear todas las ventas cobradas durante este turno
    // de caja
    @OneToMany(mappedBy = "caja", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Venta> ventas = new ArrayList<>();

    @Version
    private Long version = 0L;

    public enum Estado {
        ABIERTA, CERRADA
    }

    public Caja() {
    }

    // --- NUEVOS GETTER Y SETTER PARA VENTAS ---
    public List<Venta> getVentas() {
        return ventas;
    }

    public void setVentas(List<Venta> ventas) {
        this.ventas = ventas;
    }

    // --- GETTERS Y SETTERS EXISTENTES ---
    public Integer getIdCaja() {
        return idCaja;
    }

    public void setIdCaja(Integer idCaja) {
        this.idCaja = idCaja;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
    }

    public Boolean getCajaAbierta() {
        return cajaAbierta;
    }

    public BigDecimal getMontoApertura() {
        return montoApertura;
    }

    public void setMontoApertura(BigDecimal montoApertura) {
        this.montoApertura = montoApertura;
    }

    public BigDecimal getMontoCierre() {
        return montoCierre;
    }

    public void setMontoCierre(BigDecimal montoCierre) {
        this.montoCierre = montoCierre;
    }

    public BigDecimal getMontoSistema() {
        return montoSistema;
    }

    public void setMontoSistema(BigDecimal montoSistema) {
        this.montoSistema = montoSistema;
    }

    public BigDecimal getDiferencia() {
        return diferencia;
    }

    public void setDiferencia(BigDecimal diferencia) {
        this.diferencia = diferencia;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public LocalDateTime getFechaApertura() {
        return fechaApertura;
    }

    public LocalDateTime getFechaCierre() {
        return fechaCierre;
    }

    public void setFechaCierre(LocalDateTime fechaCierre) {
        this.fechaCierre = fechaCierre;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Caja caja = (Caja) o;
        return Objects.equals(idCaja, caja.idCaja);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idCaja);
    }
}