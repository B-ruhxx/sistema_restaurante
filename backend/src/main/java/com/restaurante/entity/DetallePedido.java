package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "detalle_pedido")
public class DetallePedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle_pedido")
    private Integer idDetallePedido;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_pedido", nullable = false)
    private Pedido pedido;

    @ManyToOne
    @JoinColumn(name = "id_producto")
    private Producto producto;

    @ManyToOne
    @JoinColumn(name = "id_combo")
    private ComboProducto combo;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(columnDefinition = "TEXT")
    private String observacion;

    @Column(name = "requiere_preparacion", nullable = false)
    private Boolean requierePreparacion = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_cocina", columnDefinition = "ENUM('PENDIENTE','EN_PREPARACION','LISTO','CANCELADO') DEFAULT 'PENDIENTE'")
    private EstadoCocina estadoCocina = EstadoCocina.PENDIENTE;

    @Column(name = "fecha_inicio_preparacion")
    private LocalDateTime fechaInicioPreparacion;

    @Column(name = "fecha_fin_preparacion")
    private LocalDateTime fechaFinPreparacion;

    @Column(name = "tiempo_estimado_minutos")
    private Integer tiempoEstimadoMinutos;

    @Column(name = "tiempo_real_minutos")
    private Integer tiempoRealMinutos;

    public enum EstadoCocina {
        PENDIENTE, EN_PREPARACION, LISTO, CANCELADO
    }

    public DetallePedido() {}

    public Integer getIdDetallePedido() { return idDetallePedido; }
    public void setIdDetallePedido(Integer idDetallePedido) { this.idDetallePedido = idDetallePedido; }

    public Pedido getPedido() { return pedido; }
    public void setPedido(Pedido pedido) { this.pedido = pedido; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public ComboProducto getCombo() { return combo; }
    public void setCombo(ComboProducto combo) { this.combo = combo; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }

    public Boolean getRequierePreparacion() { return requierePreparacion; }
    public void setRequierePreparacion(Boolean requierePreparacion) { this.requierePreparacion = requierePreparacion; }

    public EstadoCocina getEstadoCocina() { return estadoCocina; }
    public void setEstadoCocina(EstadoCocina estadoCocina) { this.estadoCocina = estadoCocina; }

    public LocalDateTime getFechaInicioPreparacion() { return fechaInicioPreparacion; }
    public void setFechaInicioPreparacion(LocalDateTime fechaInicioPreparacion) { this.fechaInicioPreparacion = fechaInicioPreparacion; }

    public LocalDateTime getFechaFinPreparacion() { return fechaFinPreparacion; }
    public void setFechaFinPreparacion(LocalDateTime fechaFinPreparacion) { this.fechaFinPreparacion = fechaFinPreparacion; }

    public Integer getTiempoEstimadoMinutos() { return tiempoEstimadoMinutos; }
    public void setTiempoEstimadoMinutos(Integer tiempoEstimadoMinutos) { this.tiempoEstimadoMinutos = tiempoEstimadoMinutos; }

    public Integer getTiempoRealMinutos() { return tiempoRealMinutos; }
    public void setTiempoRealMinutos(Integer tiempoRealMinutos) { this.tiempoRealMinutos = tiempoRealMinutos; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DetallePedido that = (DetallePedido) o;
        return Objects.equals(idDetallePedido, that.idDetallePedido);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idDetallePedido);
    }
}
