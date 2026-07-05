package com.restaurante.controller;

import com.restaurante.dto.response.SecurityAlertResponse;
import com.restaurante.entity.SesionUsuario;
import com.restaurante.repository.SesionUsuarioRepository;
import com.restaurante.service.AlertaSeguridadService;
import com.restaurante.service.TokenWhitelistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/seguridad")
public class SecurityController {

    @Autowired
    private SesionUsuarioRepository sesionUsuarioRepository;

    @Autowired
    private AlertaSeguridadService alertaSeguridadService;

    @Autowired
    private TokenWhitelistService tokenWhitelistService;

    @GetMapping("/sesiones")
    public ResponseEntity<List<Map<String, Object>>> getSesiones() {
        List<SesionUsuario> sesiones = sesionUsuarioRepository.findAll();
        
        List<Map<String, Object>> response = sesiones.stream().map(s -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", String.valueOf(s.getIdSesion()));
            map.put("usuario", s.getEmpleado().getNombre() + " " + (s.getEmpleado().getApellido() != null ? s.getEmpleado().getApellido() : ""));
            map.put("dispositivo", "Navegador Web");
            map.put("navegador", "Escritorio / Móvil");
            map.put("ip", s.getIp() != null ? s.getIp() : "0.0.0.0");
            map.put("ubicacion", "Intranet / Local");
            map.put("inicio", s.getFechaLogin().toString().replace("T", " "));
            map.put("ultimaActividad", s.getFechaLogin().toString().replace("T", " "));
            map.put("actual", false);
            map.put("logout", s.getFechaLogout() != null ? s.getFechaLogout().toString().replace("T", " ") : null);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/alertas")
    public ResponseEntity<List<SecurityAlertResponse>> getAlertas() {
        List<SesionUsuario> sesiones = sesionUsuarioRepository.findAll();
        List<SecurityAlertResponse> alertas = new ArrayList<>(alertaSeguridadService.listarAlertasAbiertas());
        LocalDateTime now = LocalDateTime.now();

        Map<Integer, List<SesionUsuario>> sesionesActivasPorEmpleado = sesiones.stream()
                .filter(s -> s.getFechaLogout() == null)
                .filter(s -> s.getEmpleado() != null)
                .collect(Collectors.groupingBy(s -> s.getEmpleado().getIdEmpleado()));

        sesionesActivasPorEmpleado.forEach((idEmpleado, sesionesActivas) -> {
            if (sesionesActivas.size() > 1) {
                SesionUsuario sesion = sesionesActivas.get(0);
                alertas.add(buildAlert(
                        "multi-session-" + idEmpleado,
                        "warning",
                        "Múltiples sesiones activas",
                        "El usuario tiene " + sesionesActivas.size() + " sesiones activas simultáneas.",
                        sesion.getFechaLogin(),
                        getNombreEmpleado(sesion)));
            }
        });

        sesiones.stream()
                .filter(s -> s.getFechaLogout() == null && s.getFechaLogin() != null)
                .filter(s -> Duration.between(s.getFechaLogin(), now).toHours() >= 12)
                .forEach(s -> alertas.add(buildAlert(
                        "long-session-" + s.getIdSesion(),
                        "info",
                        "Sesión activa prolongada",
                        "La sesión lleva más de 12 horas activa desde la IP " + (s.getIp() != null ? s.getIp() : "desconocida") + ".",
                        s.getFechaLogin(),
                        getNombreEmpleado(s))));

        sesiones.stream()
                .filter(s -> s.getFechaLogout() == null && s.getIp() != null && !s.getIp().isBlank())
                .collect(Collectors.groupingBy(SesionUsuario::getIp))
                .forEach((ip, sesionesIp) -> {
                    long usuarios = sesionesIp.stream()
                            .map(s -> s.getEmpleado() != null ? s.getEmpleado().getIdEmpleado() : null)
                            .distinct()
                            .count();
                    if (usuarios > 1) {
                        SesionUsuario sesion = sesionesIp.get(0);
                        alertas.add(buildAlert(
                                "shared-ip-" + ip,
                                "info",
                                "IP compartida en sesiones activas",
                                "Hay " + usuarios + " usuarios activos desde la IP " + ip + ".",
                                sesion.getFechaLogin(),
                                null));
                    }
                });

        return ResponseEntity.ok(alertas);
    }

    @PostMapping("/alertas/{idAlerta}/resolver")
    public ResponseEntity<SecurityAlertResponse> resolverAlerta(@PathVariable Integer idAlerta) {
        return ResponseEntity.ok(alertaSeguridadService.resolverAlerta(idAlerta));
    }

    @PostMapping("/sesiones/{idSesion}/cerrar")
    public ResponseEntity<Void> cerrarSesion(@PathVariable Long idSesion) {
        SesionUsuario sesion = sesionUsuarioRepository.findById(idSesion)
                .orElseThrow(() -> new IllegalArgumentException("Sesión no encontrada: " + idSesion));
        if (sesion.getFechaLogout() == null) {
            sesion.setFechaLogout(LocalDateTime.now());
            sesionUsuarioRepository.save(sesion);
            if (sesion.getEmpleado() != null) {
                tokenWhitelistService.revokeActiveToken(sesion.getEmpleado().getIdEmpleado());
            }
        }
        return ResponseEntity.noContent().build();
    }

    private SecurityAlertResponse buildAlert(String id, String tipo, String titulo, String descripcion,
                                             LocalDateTime fecha, String usuario) {
        SecurityAlertResponse alert = new SecurityAlertResponse();
        alert.setId(id);
        alert.setTipo(tipo);
        alert.setTitulo(titulo);
        alert.setDescripcion(descripcion);
        alert.setFecha(fecha != null ? fecha.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "-");
        alert.setUsuario(usuario);
        return alert;
    }

    private String getNombreEmpleado(SesionUsuario sesion) {
        if (sesion.getEmpleado() == null) {
            return null;
        }
        String apellido = sesion.getEmpleado().getApellido() != null ? sesion.getEmpleado().getApellido() : "";
        return (sesion.getEmpleado().getNombre() + " " + apellido).trim();
    }
}
