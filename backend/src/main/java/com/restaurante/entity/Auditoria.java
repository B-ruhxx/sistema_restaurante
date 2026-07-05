package com.restaurante.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "auditoria")
public class Auditoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_auditoria")
    private Long idAuditoria;

    @Column(name = "entidad", length = 80, nullable = false)
    private String entidad;

    @Enumerated(EnumType.STRING)
    @Column(name = "accion", columnDefinition = "ENUM('CREAR','ACTUALIZAR','ELIMINAR','ANULAR','LOGIN','LOGOUT','ERROR','OTRO')", nullable = false)
    private Accion accion;

    @Column(name = "id_registro", length = 80, nullable = false)
    private String idRegistro;

    @ManyToOne
    @JoinColumn(name = "id_empleado")
    private Empleado empleado;

    @Column(name = "resumen", length = 255)
    private String resumen;

    @Column(name = "detalle", columnDefinition = "json")
    private String detalle;

    @Column(name = "ip", length = 45)
    private String ip;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;

    public enum Accion {
        CREAR, ACTUALIZAR, ELIMINAR, ANULAR, LOGIN, LOGOUT, ERROR, OTRO
    }

    public Auditoria() {
    }

    // --- GETTERS Y SETTERS ---

    public Long getIdAuditoria() {
        return idAuditoria;
    }

    public void setIdAuditoria(Long idAuditoria) {
        this.idAuditoria = idAuditoria;
    }

    public String getTablaAfectada() {
        return entidad;
    }

    public void setTablaAfectada(String tablaAfectada) {
        this.entidad = tablaAfectada;
    }

    public String getEntidad() {
        return entidad;
    }

    public void setEntidad(String entidad) {
        this.entidad = entidad;
    }

    public Accion getAccion() {
        return accion;
    }

    public void setAccion(Accion accion) {
        this.accion = accion;
    }

    public String getIdRegistro() {
        return idRegistro;
    }

    public void setIdRegistro(String idRegistro) {
        this.idRegistro = idRegistro;
    }

    public Empleado getEmpleado() {
        return empleado;
    }

    public void setEmpleado(Empleado empleado) {
        this.empleado = empleado;
    }

    public String getDatosAnteriores() {
        return null;
    }

    public void setDatosAnteriores(String datosAnteriores) {
        mergeDetalle("anteriores", datosAnteriores);
    }

    public String getDatosNuevos() {
        return detalle;
    }

    public void setDatosNuevos(String datosNuevos) {
        mergeDetalle("nuevos", datosNuevos);
    }

    public String getResumen() {
        return resumen;
    }

    public void setResumen(String resumen) {
        this.resumen = resumen;
    }

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
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

    public LocalDateTime getFechaEvento() {
        return fecha;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    private void mergeDetalle(String key, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (detalle == null || detalle.isBlank()) {
            detalle = "{\"" + key + "\":" + value + "}";
            return;
        }
        String body = detalle.trim();
        if (body.endsWith("}")) {
            detalle = body.substring(0, body.length() - 1) + ",\"" + key + "\":" + value + "}";
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Auditoria auditoria = (Auditoria) o;
        return Objects.equals(idAuditoria, auditoria.idAuditoria);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idAuditoria);
    }
}
