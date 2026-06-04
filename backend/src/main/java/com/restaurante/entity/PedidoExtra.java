package com.restaurante.entity;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "pedido_extra")
public class PedidoExtra {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido_extra")
    private Integer idPedidoExtra;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_detalle_pedido", nullable = false)
    private DetallePedido detallePedido;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_extra", nullable = false)
    private ExtraProducto extra;

    @Column(columnDefinition = "INT DEFAULT 1")
    private Integer cantidad = 1;

    public PedidoExtra() {
    }

    public Integer getIdPedidoExtra() {
        return idPedidoExtra;
    }

    public void setIdPedidoExtra(Integer idPedidoExtra) {
        this.idPedidoExtra = idPedidoExtra;
    }

    public DetallePedido getDetallePedido() {
        return detallePedido;
    }

    public void setDetallePedido(DetallePedido detallePedido) {
        this.detallePedido = detallePedido;
    }

    public ExtraProducto getExtra() {
        return extra;
    }

    public void setExtra(ExtraProducto extra) {
        this.extra = extra;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        PedidoExtra that = (PedidoExtra) o;
        return Objects.equals(idPedidoExtra, that.idPedidoExtra);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idPedidoExtra);
    }
}