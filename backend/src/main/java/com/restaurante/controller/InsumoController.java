package com.restaurante.controller;

import com.restaurante.dto.request.InsumoRequest;
import com.restaurante.dto.response.InsumoResponse;
import com.restaurante.service.InsumoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/insumos")
public class InsumoController {

    @Autowired
    private InsumoService insumoService;

    @GetMapping
    public ResponseEntity<List<InsumoResponse>> getAllInsumos() {
        return ResponseEntity.ok(insumoService.getAllInsumos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InsumoResponse> getInsumoById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(insumoService.getInsumoById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<InsumoResponse> createInsumo(@Valid @RequestBody InsumoRequest request) {
        return ResponseEntity.ok(insumoService.createInsumo(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InsumoResponse> updateInsumo(@PathVariable Integer id, @Valid @RequestBody InsumoRequest request) {
        try {
            return ResponseEntity.ok(insumoService.updateInsumo(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInsumo(@PathVariable Integer id) {
        try {
            insumoService.deleteInsumo(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
