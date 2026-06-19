package com.restaurante.controller;

import com.restaurante.dto.request.RolRequest;
import com.restaurante.dto.response.RolResponse;
import com.restaurante.service.RolService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
public class RolController {

    @Autowired
    private RolService rolService;

    @GetMapping
    public ResponseEntity<List<RolResponse>> getAllRoles() {
        return ResponseEntity.ok(rolService.getAllRoles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RolResponse> getRoleById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(rolService.getRoleById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createRole(@Valid @RequestBody RolRequest request) {
        try {
            RolResponse response = rolService.createRole(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRole(@PathVariable Integer id, @Valid @RequestBody RolRequest request) {
        try {
            RolResponse response = rolService.updateRole(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("no encontrado")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRole(@PathVariable Integer id) {
        try {
            rolService.deleteRole(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
