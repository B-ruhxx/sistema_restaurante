package com.restaurante.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(name = "extra_producto")
public class ExtraProducto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_extra")
    private Integer idExtra;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_insumo", nullable = false)
    private Insumo insumo;

    @Column(name = "cantidad_consumida", nullable = false, precision = 12, scale = 3)
    private BigDecimal cantidadConsumida;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Estado estado = Estado.ACTIVO;

    public enum Estado {
        ACTIVO, INACTIVO
    }

    public ExtraProducto() {}

    public Integer getIdExtra() { return idExtra; }
    public void setIdExtra(Integer idExtra) { this.idExtra = idExtra; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }

    public Insumo getInsumo() { return insumo; }
    public void setInsumo(Insumo insumo) { this.insumo = insumo; }

    public BigDecimal getCantidadConsumida() { return cantidadConsumida; }
    public void setCantidadConsumida(BigDecimal cantidadConsumida) { this.cantidadConsumida = cantidadConsumida; }

    public Estado getEstado() { return estado; }
    public void setEstado(Estado estado) { this.estado = estado; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ExtraProducto that = (ExtraProducto) o;
        return Objects.equals(idExtra, that.idExtra);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idExtra);
    }
}
