package com.restaurante.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "sesion_usuario")
public class SesionUsuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sesion")
    private Integer idSesion;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_empleado", nullable = false)
    private Empleado empleado;

    @CreationTimestamp
    @Column(name = "fecha_login", nullable = false, updatable = false)
    private LocalDateTime fechaLogin;

    @Column(name = "fecha_logout")
    private LocalDateTime fechaLogout;

    @Column(length = 100)
    private String ip;

    public SesionUsuario() {
    }

    public Integer getIdSesion() {
        return idSesion;
    }

    public void setIdSesion(Integer idSesion) {
        this.idSesion = idSesion;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public LocalDateTime getFechaLogin() {
        return fechaLogin;
    }

    public LocalDateTime getFechaLogout() {
        return fechaLogout;
    }

    public void setFechaLogout(LocalDateTime fechaLogout) {
        this.fechaLogout = fechaLogout;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        SesionUsuario that = (SesionUsuario) o;
        return Objects.equals(idSesion, that.idSesion);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idSesion);
    }
}