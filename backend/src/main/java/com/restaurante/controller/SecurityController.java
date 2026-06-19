package com.restaurante.controller;

import com.restaurante.entity.SesionUsuario;
import com.restaurante.repository.SesionUsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/seguridad")
public class SecurityController {

    @Autowired
    private SesionUsuarioRepository sesionUsuarioRepository;

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
}
