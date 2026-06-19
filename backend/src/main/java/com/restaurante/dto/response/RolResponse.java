package com.restaurante.dto.response;

import java.util.List;

public class RolResponse {
    private Integer idRol;
    private String nombre;
    private String descripcion;
    private String estado;
    private List<PermisoResponse> permisos;

    public Integer getIdRol() {
        return idRol;
    }

    public void setIdRol(Integer idRol) {
        this.idRol = idRol;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public List<PermisoResponse> getPermisos() {
        return permisos;
    }

    public void setPermisos(List<PermisoResponse> permisos) {
        this.permisos = permisos;
    }
}
