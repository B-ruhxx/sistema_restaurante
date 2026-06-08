package com.restaurante.controller;

import com.restaurante.entity.Empleado;
import com.restaurante.entity.Rol;
import com.restaurante.repository.EmpleadoRepository;
import com.restaurante.repository.RolRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/empleados")
public class EmpleadoController {

    @Autowired
    private EmpleadoRepository repository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<Empleado>> getAllEmpleados() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Empleado> getEmpleadoById(@PathVariable Integer id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createEmpleado(@Valid @RequestBody Empleado empleado) {
        if (repository.findByUsername(empleado.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("El nombre de usuario ya está registrado.");
        }
        if (empleado.getEmail() != null && repository.findAll().stream().anyMatch(e -> empleado.getEmail().equalsIgnoreCase(e.getEmail()))) {
            return ResponseEntity.badRequest().body("El correo electrónico ya está registrado.");
        }

        // Encrypt password
        empleado.setPasswordHash(passwordEncoder.encode(empleado.getPasswordHash()));
        if (empleado.getEstado() == null) {
            empleado.setEstado(Empleado.Estado.ACTIVO);
        }

        // Resolve Rol
        if (empleado.getRol() != null && empleado.getRol().getIdRol() != null) {
            Rol rol = rolRepository.findById(empleado.getRol().getIdRol())
                    .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado."));
            empleado.setRol(rol);
        }

        return ResponseEntity.ok(repository.save(empleado));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmpleado(@PathVariable Integer id, @Valid @RequestBody Empleado details) {
        return repository.findById(id).map(empleado -> {
            if (!empleado.getUsername().equals(details.getUsername()) &&
                    repository.findByUsername(details.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body("El nombre de usuario ya está registrado.");
            }

            empleado.setNombre(details.getNombre());
            empleado.setApellido(details.getApellido());
            empleado.setUsername(details.getUsername());
            empleado.setTelefono(details.getTelefono());
            empleado.setEmail(details.getEmail());
            empleado.setAvatarUrl(details.getAvatarUrl());
            empleado.setEstado(details.getEstado());

            if (details.getPasswordHash() != null && !details.getPasswordHash().isEmpty() && !details.getPasswordHash().startsWith("$2a$")) {
                empleado.setPasswordHash(passwordEncoder.encode(details.getPasswordHash()));
            }

            if (details.getRol() != null && details.getRol().getIdRol() != null) {
                Rol rol = rolRepository.findById(details.getRol().getIdRol())
                        .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado."));
                empleado.setRol(rol);
            }

            return ResponseEntity.ok(repository.save(empleado));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmpleado(@PathVariable Integer id) {
        return repository.findById(id).map(empleado -> {
            empleado.setEstado(Empleado.Estado.INACTIVO);
            repository.save(empleado);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Rol>> getAllRoles() {
        return ResponseEntity.ok(rolRepository.findAll());
    }
}
