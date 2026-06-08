package com.restaurante.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "venta")
public class Venta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_venta")
    private Integer idVenta;

    @Column(name = "codigo_venta", unique = true, length = 50)
    private String codigoVenta;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime fecha;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "subtotal_gravado", precision = 10, scale = 2)
    private BigDecimal subtotalGravado;

    @Column(precision = 10, scale = 2)
    private BigDecimal igv;

    @Column(name = "igv_porcentaje", columnDefinition = "DECIMAL(5,2) DEFAULT 18.00")
    private BigDecimal igvPorcentaje = new BigDecimal("18.00");

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_comprobante", columnDefinition = "ENUM('BOLETA', 'FACTURA') DEFAULT 'BOLETA'")
    private TipoComprobante tipoComprobante = TipoComprobante.BOLETA;

    @Column(length = 10)
    private String serie;

    @Column(length = 20)
    private String correlativo;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('PENDIENTE', 'PAGADA', 'ANULADA') DEFAULT 'PENDIENTE'")
    private Estado estado = Estado.PENDIENTE;

    @ManyToOne
    @JoinColumn(name = "id_pedido")
    private Pedido pedido;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_empleado", nullable = false)
    private Empleado empleado;

    // [NUEVA RELACIÓN] Enlace directo al turno/sesión de caja activa
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_caja", nullable = false)
    private Caja caja;

    @Column(name = "fecha_anulacion", columnDefinition = "DATETIME(6)")
    private LocalDateTime fechaAnulacion;

    @Column(name = "motivo_anulacion", columnDefinition = "TEXT")
    private String motivoAnulacion;

    @ManyToOne
    @JoinColumn(name = "id_empleado_anulacion")
    private Empleado empleadoAnulacion;

    @Version
    private Long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime updatedAt;

    public enum TipoComprobante {
        BOLETA, FACTURA
    }

    public enum Estado {
        PENDIENTE, PAGADA, ANULADA
    }

    public Venta() {
    }

    // --- NUEVOS GETTER Y SETTER PARA CAJA ---
    public Caja getCaja() {
        return caja;
    }

    public void setCaja(Caja caja) {
        this.caja = caja;
    }

    // --- GETTERS Y SETTERS EXISTENTES ---
    public Integer getIdVenta() {
        return idVenta;
    }

    public void setIdVenta(Integer idVenta) {
        this.idVenta = idVenta;
    }

    public String getCodigoVenta() {
        return codigoVenta;
    }

    public void setCodigoVenta(String codigoVenta) {
        this.codigoVenta = codigoVenta;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getSubtotalGravado() {
        return subtotalGravado;
    }

    public void setSubtotalGravado(BigDecimal subtotalGravado) {
        this.subtotalGravado = subtotalGravado;
    }

    public BigDecimal getIgv() {
        return igv;
    }

    public void setIgv(BigDecimal igv) {
        this.igv = igv;
    }

    public BigDecimal getIgvPorcentaje() {
        return igvPorcentaje;
    }

    public void setIgvPorcentaje(BigDecimal igvPorcentaje) {
        this.igvPorcentaje = igvPorcentaje;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public TipoComprobante getTipoComprobante() {
        return tipoComprobante;
    }

    public void setTipoComprobante(TipoComprobante tipoComprobante) {
        this.tipoComprobante = tipoComprobante;
    }

    public String getSerie() {
        return serie;
    }

    public void setSerie(String serie) {
        this.serie = serie;
    }

    public String getCorrelativo() {
        return correlativo;
    }

    public void setCorrelativo(String correlativo) {
        this.correlativo = correlativo;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
    }

    public Pedido getPedido() {
        return pedido;
    }

    public void setPedido(Pedido pedido) {
        this.pedido = pedido;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public LocalDateTime getFechaAnulacion() {
        return fechaAnulacion;
    }

    public void setFechaAnulacion(LocalDateTime fechaAnulacion) {
        this.fechaAnulacion = fechaAnulacion;
    }

    public String getMotivoAnulacion() {
        return motivoAnulacion;
    }

    public void setMotivoAnulacion(String motivoAnulacion) {
        this.motivoAnulacion = motivoAnulacion;
    }

    public Empleado getEmpleadoAnulacion() {
        return empleadoAnulacion;
    }

    public void setEmpleadoAnulacion(Empleado empleadoAnulacion) {
        this.empleadoAnulacion = empleadoAnulacion;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Venta venta = (Venta) o;
        return Objects.equals(idVenta, venta.idVenta);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idVenta);
    }
}