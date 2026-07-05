package com.restaurante.entity;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "metodo_pago")
public class MetodoPago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_metodo")
    private Integer idMetodoPago;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(nullable = false, length = 30)
    private String codigo;

    @Column(name = "requiere_referencia", nullable = false)
    private Boolean requiereReferencia = false;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO'")
    private Estado estado = Estado.ACTIVO;

    public enum Estado {
        ACTIVO, INACTIVO
    }

    public MetodoPago() {
    }

    public Integer getIdMetodoPago() {
        return idMetodoPago;
    }

    public void setIdMetodoPago(Integer idMetodoPago) {
        this.idMetodoPago = idMetodoPago;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public Boolean getRequiereReferencia() {
        return requiereReferencia;
    }

    public void setRequiereReferencia(Boolean requiereReferencia) {
        this.requiereReferencia = requiereReferencia;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        MetodoPago that = (MetodoPago) o;
        return Objects.equals(idMetodoPago, that.idMetodoPago);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idMetodoPago);
    }
}
