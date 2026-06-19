package com.restaurante.controller;

import com.restaurante.dto.request.CategoriaRequest;
import com.restaurante.dto.response.CategoriaResponse;
import com.restaurante.service.CategoriaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService;

    @GetMapping
    public ResponseEntity<List<CategoriaResponse>> getAllCategorias() {
        return ResponseEntity.ok(categoriaService.getAllCategorias());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaResponse> getCategoriaById(@PathVariable Integer id) {
        try {
            CategoriaResponse response = categoriaService.getCategoriaById(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<CategoriaResponse> createCategoria(@Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.ok(categoriaService.createCategoria(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoriaResponse> updateCategoria(@PathVariable Integer id, @Valid @RequestBody CategoriaRequest request) {
        try {
            return ResponseEntity.ok(categoriaService.updateCategoria(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategoria(@PathVariable Integer id) {
        try {
            categoriaService.deleteCategoria(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
