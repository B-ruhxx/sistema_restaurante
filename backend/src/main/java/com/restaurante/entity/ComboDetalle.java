package com.restaurante.entity;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "combo_detalle")
public class ComboDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_combo_detalle")
    private Integer idComboDetalle;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_combo", nullable = false)
    private ComboProducto combo;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    public ComboDetalle() {
    }

    public Integer getIdComboDetalle() {
        return idComboDetalle;
    }

    public void setIdComboDetalle(Integer idComboDetalle) {
        this.idComboDetalle = idComboDetalle;
    }

    public ComboProducto getCombo() {
        return combo;
    }

    public void setCombo(ComboProducto combo) {
        this.combo = combo;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
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
        ComboDetalle that = (ComboDetalle) o;
        return Objects.equals(idComboDetalle, that.idComboDetalle);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idComboDetalle);
    }
}