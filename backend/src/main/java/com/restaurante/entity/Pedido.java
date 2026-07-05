package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "pedido")
public class Pedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido")
    private Integer idPedido;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_empleado_apertura", nullable = false)
    private Empleado empleadoApertura;

    @ManyToOne
    @JoinColumn(name = "id_empleado_cierre")
    private Empleado empleadoCierre;

    @ManyToOne
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_mesa", nullable = false)
    private Mesa mesa;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('BORRADOR_ATENCION','EN_COCINA','LISTO','SERVIDO','CUENTA','CERRADO','CANCELADO') DEFAULT 'BORRADOR_ATENCION'")
    private Estado estado = Estado.BORRADOR_ATENCION;

    @CreationTimestamp
    @Column(name = "fecha_apertura", nullable = false, updatable = false)
    private LocalDateTime fechaApertura;

    @Transient
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Transient
    private BigDecimal igv = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "fecha_envio_cocina")
    private LocalDateTime fechaEnvioCocina;

    @Column(name = "fecha_servicio")
    private LocalDateTime fechaServicio;

    @Column(name = "fecha_cuenta")
    private LocalDateTime fechaCuenta;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Column(name = "tiempo_estimado_minutos")
    private Integer tiempoEstimadoMinutos;

    @Column(name = "tiempo_real_minutos")
    private Integer tiempoRealMinutos;

    @Column(name = "motivo_cancelacion", length = 255)
    private String motivoCancelacion;

    @Version
    private Long version = 0L;

    public enum Estado {
        BORRADOR_ATENCION, EN_COCINA, LISTO, SERVIDO, CUENTA, CERRADO, CANCELADO
    }

    public Pedido() {
    }

    public Integer getIdPedido() {
        return idPedido;
    }

    public void setIdPedido(Integer idPedido) {
        this.idPedido = idPedido;
    }

    public Empleado getEmpleado() {
        return empleadoApertura;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleadoApertura = empleado;
    }

    public Empleado getEmpleadoApertura() {
        return empleadoApertura;
    }

    public void setEmpleadoApertura(Empleado empleadoApertura) {
        this.empleadoApertura = empleadoApertura;
    }

    public Empleado getEmpleadoCierre() {
        return empleadoCierre;
    }

    public void setEmpleadoCierre(Empleado empleadoCierre) {
        this.empleadoCierre = empleadoCierre;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Mesa getMesa() {
        return mesa;
    }

    public void setMesa(Mesa mesa) {
        this.mesa = mesa;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
    }

    public LocalDateTime getFecha() {
        return fechaApertura;
    }

    public LocalDateTime getFechaApertura() {
        return fechaApertura;
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

    public LocalDateTime getFechaEnvioCocina() {
        return fechaEnvioCocina;
    }

    public void setFechaEnvioCocina(LocalDateTime fechaEnvioCocina) {
        this.fechaEnvioCocina = fechaEnvioCocina;
    }

    public LocalDateTime getFechaServicio() {
        return fechaServicio;
    }

    public void setFechaServicio(LocalDateTime fechaServicio) {
        this.fechaServicio = fechaServicio;
    }

    public LocalDateTime getFechaCuenta() {
        return fechaCuenta;
    }

    public void setFechaCuenta(LocalDateTime fechaCuenta) {
        this.fechaCuenta = fechaCuenta;
    }

    public LocalDateTime getFechaCierre() {
        return fechaCierre;
    }

    public void setFechaCierre(LocalDateTime fechaCierre) {
        this.fechaCierre = fechaCierre;
    }

    public Integer getTiempoEstimadoMinutos() {
        return tiempoEstimadoMinutos;
    }

    public void setTiempoEstimadoMinutos(Integer tiempoEstimadoMinutos) {
        this.tiempoEstimadoMinutos = tiempoEstimadoMinutos;
    }

    public Integer getTiempoRealMinutos() {
        return tiempoRealMinutos;
    }

    public void setTiempoRealMinutos(Integer tiempoRealMinutos) {
        this.tiempoRealMinutos = tiempoRealMinutos;
    }

    public String getMotivoCancelacion() {
        return motivoCancelacion;
    }

    public void setMotivoCancelacion(String motivoCancelacion) {
        this.motivoCancelacion = motivoCancelacion;
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
        Pedido pedido = (Pedido) o;
        return Objects.equals(idPedido, pedido.idPedido);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idPedido);
    }
}
