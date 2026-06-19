package com.restaurante.controller;

import com.restaurante.dto.request.EmpleadoRequest;
import com.restaurante.dto.response.EmpleadoResponse;
import com.restaurante.dto.response.RolResponse;
import com.restaurante.service.EmpleadoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/empleados")
public class EmpleadoController {

    @Autowired
    private EmpleadoService empleadoService;

    @GetMapping
    public ResponseEntity<List<EmpleadoResponse>> getAllEmpleados() {
        return ResponseEntity.ok(empleadoService.getAllEmpleados());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmpleadoResponse> getEmpleadoById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(empleadoService.getEmpleadoById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createEmpleado(@Valid @RequestBody EmpleadoRequest request) {
        try {
            EmpleadoResponse response = empleadoService.createEmpleado(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmpleado(@PathVariable Integer id, @Valid @RequestBody EmpleadoRequest request) {
        try {
            EmpleadoResponse response = empleadoService.updateEmpleado(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("no encontrado")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmpleado(@PathVariable Integer id) {
        try {
            empleadoService.deleteEmpleado(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/roles")
    public ResponseEntity<List<RolResponse>> getAllRoles() {
        return ResponseEntity.ok(empleadoService.getAllRoles());
    }
}
