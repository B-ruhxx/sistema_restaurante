package com.restaurante.controller;

import com.restaurante.dto.request.VarianteProductoRequest;
import com.restaurante.dto.response.VarianteProductoResponse;
import com.restaurante.service.VarianteProductoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/variantes")
public class VarianteProductoController {

    @Autowired
    private VarianteProductoService varianteProductoService;

    @GetMapping("/producto/{idProducto}")
    public ResponseEntity<List<VarianteProductoResponse>> getVariantesByProducto(@PathVariable Integer idProducto) {
        return ResponseEntity.ok(varianteProductoService.getVariantesByProducto(idProducto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VarianteProductoResponse> getVarianteById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(varianteProductoService.getVarianteById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createVariante(@Valid @RequestBody VarianteProductoRequest request) {
        try {
            return ResponseEntity.ok(varianteProductoService.createVariante(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVariante(@PathVariable Integer id, @Valid @RequestBody VarianteProductoRequest request) {
        try {
            return ResponseEntity.ok(varianteProductoService.updateVariante(id, request));
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("no encontrada")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVariante(@PathVariable Integer id) {
        try {
            varianteProductoService.deleteVariante(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
