package com.restaurante.service;

import com.restaurante.dto.mapper.EmpleadoMapper;
import com.restaurante.dto.request.EmpleadoRequest;
import com.restaurante.dto.response.EmpleadoActividadResponse;
import com.restaurante.dto.response.EmpleadoResponse;
import com.restaurante.dto.response.EmpleadoSesionResponse;
import com.restaurante.entity.Auditoria;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.Rol;
import com.restaurante.entity.SesionUsuario;
import com.restaurante.repository.AuditoriaRepository;
import com.restaurante.repository.EmpleadoRepository;
import com.restaurante.repository.RolRepository;
import com.restaurante.repository.SesionUsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmpleadoService {

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private SesionUsuarioRepository sesionUsuarioRepository;

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmpleadoMapper empleadoMapper;

    public List<EmpleadoResponse> getAllEmpleados() {
        return empleadoRepository.findAll().stream()
                .map(empleadoMapper::toResponse)
                .collect(Collectors.toList());
    }

    public EmpleadoResponse getEmpleadoById(Integer id) {
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado con ID: " + id));
        return empleadoMapper.toResponse(empleado);
    }

    public List<EmpleadoSesionResponse> getSesionesEmpleado(Integer idEmpleado) {
        empleadoRepository.findById(idEmpleado)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado con ID: " + idEmpleado));
        List<Auditoria> actividades = auditoriaRepository.findByEmpleadoIdEmpleadoOrderByFechaDesc(idEmpleado);

        return sesionUsuarioRepository.findByEmpleadoIdEmpleadoOrderByFechaInicioDesc(idEmpleado).stream()
                .map(sesion -> toSesionResponse(sesion, actividades))
                .collect(Collectors.toList());
    }

    public List<EmpleadoActividadResponse> getActividadEmpleado(Integer idEmpleado) {
        empleadoRepository.findById(idEmpleado)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado con ID: " + idEmpleado));

        return auditoriaRepository.findByEmpleadoIdEmpleadoOrderByFechaDesc(idEmpleado).stream()
                .limit(20)
                .map(this::toActividadResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmpleadoResponse createEmpleado(EmpleadoRequest request) {
        if (empleadoRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("El nombre de usuario ya está registrado.");
        }
        if (request.getEmail() != null && empleadoRepository.findAll().stream().anyMatch(e -> request.getEmail().equalsIgnoreCase(e.getEmail()))) {
            throw new IllegalArgumentException("El correo electrónico ya está registrado.");
        }

        Empleado empleado = empleadoMapper.toEntity(request);
        
        // Encriptar clave
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            empleado.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        } else {
            throw new IllegalArgumentException("La contraseña es obligatoria para nuevos empleados.");
        }

        if (empleado.getEstado() == null) {
            empleado.setEstado(Empleado.Estado.ACTIVO);
        }

        // Resolver Rol
        if (request.getIdRol() != null) {
            Rol rol = rolRepository.findById(request.getIdRol())
                    .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + request.getIdRol()));
            empleado.setRol(rol);
        }

        Empleado savedEmpleado = empleadoRepository.save(empleado);
        return empleadoMapper.toResponse(savedEmpleado);
    }

    @Transactional
    public EmpleadoResponse updateEmpleado(Integer id, EmpleadoRequest request) {
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado con ID: " + id));

        if (!empleado.getUsername().equals(request.getUsername()) &&
                empleadoRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("El nombre de usuario ya está registrado.");
        }

        empleado.setNombre(request.getNombre());
        empleado.setApellido(request.getApellido());
        empleado.setUsername(request.getUsername());
        empleado.setTelefono(request.getTelefono());
        empleado.setEmail(request.getEmail());
        empleado.setAvatarUrl(request.getAvatarUrl());
        
        if (request.getEstado() != null) {
            empleado.setEstado(Empleado.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        // Encriptar clave si es proporcionada y no está ya encriptada
        if (request.getPassword() != null && !request.getPassword().isEmpty() && !request.getPassword().startsWith("$2a$")) {
            empleado.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        // Resolver Rol
        if (request.getIdRol() != null) {
            Rol rol = rolRepository.findById(request.getIdRol())
                    .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + request.getIdRol()));
            empleado.setRol(rol);
        }

        Empleado savedEmpleado = empleadoRepository.save(empleado);
        return empleadoMapper.toResponse(savedEmpleado);
    }

    @Transactional
    public void deleteEmpleado(Integer id) {
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado con ID: " + id));
        empleado.setEstado(Empleado.Estado.INACTIVO);
        empleadoRepository.save(empleado);
    }

    @Autowired
    private com.restaurante.dto.mapper.RolMapper rolMapper;

    public List<com.restaurante.dto.response.RolResponse> getAllRoles() {
        return rolRepository.findAll().stream()
                .map(rolMapper::toResponse)
                .collect(Collectors.toList());
    }

    private EmpleadoSesionResponse toSesionResponse(SesionUsuario sesion, List<Auditoria> actividades) {
        LocalDateTime inicio = sesion.getFechaLogin();
        LocalDateTime fin = sesion.getFechaLogout() != null ? sesion.getFechaLogout() : LocalDateTime.now();

        EmpleadoSesionResponse response = new EmpleadoSesionResponse();
        response.setId(String.valueOf(sesion.getIdSesion()));
        response.setFecha(inicio != null ? inicio.toLocalDate().toString() : "-");
        response.setHoraInicio(inicio != null ? inicio.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")) : "-");
        response.setHoraFin(sesion.getFechaLogout() != null
                ? sesion.getFechaLogout().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"))
                : null);
        response.setDuracion(inicio != null ? formatDuration(Duration.between(inicio, fin)) : "-");
        response.setActividades(actividades.stream()
                .filter(a -> a.getFechaEvento() != null && inicio != null)
                .filter(a -> !a.getFechaEvento().isBefore(inicio) && !a.getFechaEvento().isAfter(fin))
                .count());
        return response;
    }

    private EmpleadoActividadResponse toActividadResponse(Auditoria auditoria) {
        EmpleadoActividadResponse response = new EmpleadoActividadResponse();
        response.setId(String.valueOf(auditoria.getIdAuditoria()));
        response.setAccion(formatAccion(auditoria));
        response.setModulo(formatModulo(auditoria.getTablaAfectada()));
        response.setFecha(auditoria.getFechaEvento() != null
                ? auditoria.getFechaEvento().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                : "-");
        response.setDetalles(formatDetalles(auditoria));
        return response;
    }

    private String formatAccion(Auditoria auditoria) {
        String accion = auditoria.getAccion() != null ? auditoria.getAccion().name() : "EVENTO";
        String modulo = formatModulo(auditoria.getTablaAfectada());
        return switch (accion) {
            case "CREAR" -> "Creó registro";
            case "ACTUALIZAR" -> "Actualizó registro";
            case "ELIMINAR" -> "Eliminó registro";
            default -> "Registró evento";
        } + " en " + modulo;
    }

    private String formatModulo(String tabla) {
        if (tabla == null || tabla.isBlank()) {
            return "Sistema";
        }
        String normalized = tabla.replace("_", " ").trim();
        return normalized.substring(0, 1).toUpperCase() + normalized.substring(1);
    }

    private String formatDetalles(Auditoria auditoria) {
        String idRegistro = auditoria.getIdRegistro() != null ? auditoria.getIdRegistro() : "N/A";
        return "Registro: " + idRegistro;
    }

    private String formatDuration(Duration duration) {
        long minutes = Math.max(duration.toMinutes(), 0);
        long hours = minutes / 60;
        long remainingMinutes = minutes % 60;
        if (hours == 0) {
            return remainingMinutes + "m";
        }
        if (remainingMinutes == 0) {
            return hours + "h";
        }
        return hours + "h " + remainingMinutes + "m";
    }
}
