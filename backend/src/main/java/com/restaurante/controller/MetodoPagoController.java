package com.restaurante.controller;

import com.restaurante.dto.request.MetodoPagoRequest;
import com.restaurante.dto.response.MetodoPagoResponse;
import com.restaurante.service.MetodoPagoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/metodo-pagos")
public class MetodoPagoController {

    @Autowired
    private MetodoPagoService metodoPagoService;

    @GetMapping
    public ResponseEntity<List<MetodoPagoResponse>> getAllMetodoPagos() {
        return ResponseEntity.ok(metodoPagoService.getAllMetodoPagos());
    }

    @GetMapping("/activos")
    public ResponseEntity<List<MetodoPagoResponse>> getActivosMetodoPagos() {
        return ResponseEntity.ok(metodoPagoService.getActivosMetodoPagos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MetodoPagoResponse> getMetodoPagoById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(metodoPagoService.getMetodoPagoById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<MetodoPagoResponse> createMetodoPago(@Valid @RequestBody MetodoPagoRequest request) {
        return ResponseEntity.ok(metodoPagoService.createMetodoPago(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MetodoPagoResponse> updateMetodoPago(@PathVariable Integer id, @Valid @RequestBody MetodoPagoRequest request) {
        try {
            return ResponseEntity.ok(metodoPagoService.updateMetodoPago(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMetodoPago(@PathVariable Integer id) {
        try {
            metodoPagoService.deleteMetodoPago(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
