package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(name = "receta_producto")
public class RecetaProducto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_receta")
    private Integer idReceta;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto producto;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_insumo", nullable = false)
    private Insumo insumo;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal cantidad;

    public RecetaProducto() {
    }

    public Integer getIdReceta() {
        return idReceta;
    }

    public void setIdReceta(Integer idReceta) {
        this.idReceta = idReceta;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Insumo getInsumo() {
        return insumo;
    }

    public void setInsumo(Insumo insumo) {
        this.insumo = insumo;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        RecetaProducto that = (RecetaProducto) o;
        return Objects.equals(idReceta, that.idReceta);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idReceta);
    }
}
