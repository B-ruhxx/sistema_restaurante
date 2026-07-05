package com.restaurante.dto.response;

public class EmpleadoSesionResponse {
    private String id;
    private String fecha;
    private String horaInicio;
    private String horaFin;
    private String duracion;
    private long actividades;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(String horaInicio) {
        this.horaInicio = horaInicio;
    }

    public String getHoraFin() {
        return horaFin;
    }

    public void setHoraFin(String horaFin) {
        this.horaFin = horaFin;
    }

    public String getDuracion() {
        return duracion;
    }

    public void setDuracion(String duracion) {
        this.duracion = duracion;
    }

    public long getActividades() {
        return actividades;
    }

    public void setActividades(long actividades) {
        this.actividades = actividades;
    }
}
