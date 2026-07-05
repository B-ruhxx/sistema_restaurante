package com.restaurante.service;

import com.restaurante.dto.response.SecurityAlertResponse;
import com.restaurante.entity.AlertaSeguridad;
import com.restaurante.entity.Empleado;
import com.restaurante.repository.AlertaSeguridadRepository;
import com.restaurante.repository.EmpleadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AlertaSeguridadService {

    private static final String FAILED_LOGIN_TITLE = "Intento fallido de inicio de sesión";

    @Autowired
    private AlertaSeguridadRepository alertaSeguridadRepository;

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Transactional
    public void registrarLoginFallido(String username, String ip) {
        String usuario = username != null && !username.isBlank() ? username.trim() : "desconocido";
        Optional<Empleado> empleado = empleadoRepository.findByUsername(usuario);

        guardarAlerta(
                AlertaSeguridad.Tipo.INFO,
                FAILED_LOGIN_TITLE,
                "Credenciales inválidas para el usuario " + usuario + " desde la IP " + normalizarIp(ip) + ".",
                empleado.orElse(null),
                usuario,
                ip);

        long intentosRecientes = alertaSeguridadRepository.countByUsuarioIgnoreCaseAndTituloAndFechaAfter(
                usuario,
                FAILED_LOGIN_TITLE,
                LocalDateTime.now().minusMinutes(15));

        if (intentosRecientes == 3 || (intentosRecientes > 3 && intentosRecientes % 3 == 0)) {
            guardarAlerta(
                    AlertaSeguridad.Tipo.WARNING,
                    "Múltiples intentos fallidos",
                    "Se detectaron " + intentosRecientes + " intentos fallidos en los últimos 15 minutos.",
                    empleado.orElse(null),
                    usuario,
                    ip);
        }
    }

    @Transactional(readOnly = true)
    public List<SecurityAlertResponse> listarAlertasAbiertas() {
        return alertaSeguridadRepository.findTop50ByEstadoOrderByFechaDesc(AlertaSeguridad.Estado.ABIERTA).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SecurityAlertResponse resolverAlerta(Integer idAlerta) {
        AlertaSeguridad alerta = alertaSeguridadRepository.findById(idAlerta)
                .orElseThrow(() -> new IllegalArgumentException("Alerta no encontrada: " + idAlerta));
        alerta.setEstado(AlertaSeguridad.Estado.RESUELTA);
        return toResponse(alertaSeguridadRepository.save(alerta));
    }

    private void guardarAlerta(AlertaSeguridad.Tipo tipo, String titulo, String descripcion,
                               Empleado empleado, String usuario, String ip) {
        AlertaSeguridad alerta = new AlertaSeguridad();
        alerta.setTipo(tipo);
        alerta.setTitulo(titulo);
        alerta.setDescripcion(descripcion);
        alerta.setEmpleado(empleado);
        alerta.setUsuario(usuario);
        alerta.setIp(ip);
        alerta.setEstado(AlertaSeguridad.Estado.ABIERTA);
        alertaSeguridadRepository.save(alerta);
    }

    private SecurityAlertResponse toResponse(AlertaSeguridad alerta) {
        SecurityAlertResponse response = new SecurityAlertResponse();
        response.setId(String.valueOf(alerta.getIdAlerta()));
        response.setTipo(alerta.getTipo() != null ? alerta.getTipo().name().toLowerCase() : "info");
        response.setTitulo(alerta.getTitulo());
        response.setDescripcion(alerta.getDescripcion());
        response.setFecha(alerta.getFecha() != null
                ? alerta.getFecha().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : "-");
        response.setUsuario(alerta.getUsuario() != null ? alerta.getUsuario() : nombreEmpleado(alerta.getEmpleado()));
        return response;
    }

    private String nombreEmpleado(Empleado empleado) {
        if (empleado == null) {
            return null;
        }
        String apellido = empleado.getApellido() != null ? empleado.getApellido() : "";
        return (empleado.getNombre() + " " + apellido).trim();
    }

    private String normalizarIp(String ip) {
        return ip != null && !ip.isBlank() ? ip : "desconocida";
    }
}
