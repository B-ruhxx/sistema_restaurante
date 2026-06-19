package com.restaurante.controller;

import com.restaurante.dto.request.ProveedorRequest;
import com.restaurante.dto.response.ProveedorResponse;
import com.restaurante.service.ProveedorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/proveedores")
public class ProveedorController {

    @Autowired
    private ProveedorService proveedorService;

    @GetMapping
    public ResponseEntity<List<ProveedorResponse>> getAllProveedores() {
        return ResponseEntity.ok(proveedorService.getAllProveedores());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProveedorResponse> getProveedorById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(proveedorService.getProveedorById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ProveedorResponse> createProveedor(@Valid @RequestBody ProveedorRequest request) {
        return ResponseEntity.ok(proveedorService.createProveedor(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProveedorResponse> updateProveedor(@PathVariable Integer id, @Valid @RequestBody ProveedorRequest request) {
        try {
            return ResponseEntity.ok(proveedorService.updateProveedor(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProveedor(@PathVariable Integer id) {
        try {
            proveedorService.deleteProveedor(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
