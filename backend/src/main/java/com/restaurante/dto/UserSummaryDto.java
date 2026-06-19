package com.restaurante.dto;

public class UserSummaryDto {
    private Integer idEmpleado;
    private String nombre;
    private String apellido;
    private String username;
    private String rol;
    private String avatarUrl;
    private java.util.List<String> permisos;

    public UserSummaryDto() {}

    public UserSummaryDto(Integer idEmpleado, String nombre, String apellido, String username, String rol) {
        this.idEmpleado = idEmpleado;
        this.nombre = nombre;
        this.apellido = apellido;
        this.username = username;
        this.rol = rol;
    }

    public UserSummaryDto(Integer idEmpleado, String nombre, String apellido, String username, String rol, String avatarUrl) {
        this.idEmpleado = idEmpleado;
        this.nombre = nombre;
        this.apellido = apellido;
        this.username = username;
        this.rol = rol;
        this.avatarUrl = avatarUrl;
    }

    public UserSummaryDto(Integer idEmpleado, String nombre, String apellido, String username, String rol, String avatarUrl, java.util.List<String> permisos) {
        this.idEmpleado = idEmpleado;
        this.nombre = nombre;
        this.apellido = apellido;
        this.username = username;
        this.rol = rol;
        this.avatarUrl = avatarUrl;
        this.permisos = permisos;
    }

    public Integer getIdEmpleado() { return idEmpleado; }
    public void setIdEmpleado(Integer idEmpleado) { this.idEmpleado = idEmpleado; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public java.util.List<String> getPermisos() { return permisos; }
    public void setPermisos(java.util.List<String> permisos) { this.permisos = permisos; }
}
