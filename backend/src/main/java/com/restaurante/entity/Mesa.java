package com.restaurante.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "mesa")
public class Mesa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mesa")
    private Integer idMesa;

    @Column(nullable = false, unique = true, length = 20)
    private String numero;

    @Column(nullable = false)
    private Integer capacidad = 4;

    @Column(length = 80)
    private String ubicacion;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('DISPONIBLE','ATENCION','EN_COCINA','SERVIDO','CUENTA','BLOQUEADA') DEFAULT 'DISPONIBLE'")
    private Estado estado = Estado.DISPONIBLE;

    @Version
    private Long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum Estado {
        DISPONIBLE, ATENCION, EN_COCINA, SERVIDO, CUENTA, BLOQUEADA
    }

    public Integer getIdMesa() {
        return idMesa;
    }

    public void setIdMesa(Integer idMesa) {
        this.idMesa = idMesa;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public Integer getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(Integer capacidad) {
        this.capacidad = capacidad;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
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
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Mesa mesa = (Mesa) o;
        return Objects.equals(idMesa, mesa.idMesa);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idMesa);
    }
}
