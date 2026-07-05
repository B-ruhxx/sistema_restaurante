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

    @CreationTimestamp
    @Column(name = "fecha_venta", nullable = false, updatable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime fecha;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2)
    private BigDecimal igv;

    @Column(precision = 10, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_comprobante", columnDefinition = "ENUM('BOLETA','FACTURA','TICKET') DEFAULT 'TICKET'")
    private TipoComprobante tipoComprobante = TipoComprobante.TICKET;

    @Column(nullable = false, length = 10)
    private String serie;

    @Column(nullable = false, length = 20)
    private String numero;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('EMITIDA','ANULADA') DEFAULT 'EMITIDA'")
    private Estado estado = Estado.EMITIDA;

    @ManyToOne
    @JoinColumn(name = "id_pedido")
    private Pedido pedido;

    @ManyToOne
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

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

    @Column(name = "motivo_anulacion", length = 255)
    private String motivoAnulacion;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime updatedAt;

    public enum TipoComprobante {
        BOLETA, FACTURA, TICKET
    }

    public enum Estado {
        EMITIDA, ANULADA
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

    public String getComprobante() {
        if (serie != null && numero != null) {
            return serie + "-" + numero;
        }
        return null;
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

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
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

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
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
