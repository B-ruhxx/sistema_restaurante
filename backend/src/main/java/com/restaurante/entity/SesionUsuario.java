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
    private Long idSesion;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_empleado", nullable = false)
    private Empleado empleado;

    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    private String tokenHash;

    @Column(length = 45)
    private String ip;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @CreationTimestamp
    @Column(name = "fecha_inicio", nullable = false, updatable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('ACTIVA','EXPIRADA','CERRADA','REVOCADA') DEFAULT 'ACTIVA'")
    private Estado estado = Estado.ACTIVA;

    public enum Estado {
        ACTIVA, EXPIRADA, CERRADA, REVOCADA
    }

    public SesionUsuario() {
    }

    public Long getIdSesion() {
        return idSesion;
    }

    public void setIdSesion(Long idSesion) {
        this.idSesion = idSesion;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public LocalDateTime getFechaLogin() {
        return fechaInicio;
    }

    public LocalDateTime getFechaLogout() {
        return fechaCierre;
    }

    public void setFechaLogout(LocalDateTime fechaLogout) {
        this.fechaCierre = fechaLogout;
        if (fechaLogout != null && this.estado == Estado.ACTIVA) {
            this.estado = Estado.CERRADA;
        }
    }

    public LocalDateTime getFechaInicio() {
        return fechaInicio;
    }

    public LocalDateTime getFechaExpiracion() {
        return fechaExpiracion;
    }

    public void setFechaExpiracion(LocalDateTime fechaExpiracion) {
        this.fechaExpiracion = fechaExpiracion;
    }

    public LocalDateTime getFechaCierre() {
        return fechaCierre;
    }

    public void setFechaCierre(LocalDateTime fechaCierre) {
        this.fechaCierre = fechaCierre;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
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
        SesionUsuario that = (SesionUsuario) o;
        return Objects.equals(idSesion, that.idSesion);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idSesion);
    }
}
