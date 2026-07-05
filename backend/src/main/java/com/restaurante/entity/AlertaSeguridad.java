package com.restaurante.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "alerta_seguridad")
public class AlertaSeguridad {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_alerta")
    private Integer idAlerta;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('INFO', 'WARNING', 'ERROR') NOT NULL")
    private Tipo tipo;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne
    @JoinColumn(name = "id_empleado")
    private Empleado empleado;

    @Column(length = 100)
    private String usuario;

    @Column(length = 100)
    private String ip;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('ABIERTA', 'RESUELTA') DEFAULT 'ABIERTA'")
    private Estado estado = Estado.ABIERTA;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;

    public enum Tipo {
        INFO, WARNING, ERROR
    }

    public enum Estado {
        ABIERTA, RESUELTA
    }

    public Integer getIdAlerta() {
        return idAlerta;
    }

    public void setIdAlerta(Integer idAlerta) {
        this.idAlerta = idAlerta;
    }

    public Tipo getTipo() {
        return tipo;
    }

    public void setTipo(Tipo tipo) {
        this.tipo = tipo;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        AlertaSeguridad that = (AlertaSeguridad) o;
        return Objects.equals(idAlerta, that.idAlerta);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idAlerta);
    }
}
