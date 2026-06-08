package com.restaurante.controller;

import com.restaurante.entity.Categoria;
import com.restaurante.repository.CategoriaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaRepository repository;

    @GetMapping
    public ResponseEntity<List<Categoria>> getAllCategorias() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Categoria> getCategoriaById(@PathVariable Integer id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Categoria> createCategoria(@Valid @RequestBody Categoria categoria) {
        if (categoria.getEstado() == null) {
            categoria.setEstado(Categoria.Estado.ACTIVO);
        }
        return ResponseEntity.ok(repository.save(categoria));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Categoria> updateCategoria(@PathVariable Integer id, @Valid @RequestBody Categoria details) {
        return repository.findById(id).map(categoria -> {
            categoria.setNombre(details.getNombre());
            categoria.setDescripcion(details.getDescripcion());
            categoria.setImagenUrl(details.getImagenUrl());
            categoria.setEstado(details.getEstado());
            return ResponseEntity.ok(repository.save(categoria));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategoria(@PathVariable Integer id) {
        return repository.findById(id).map(categoria -> {
            categoria.setEstado(Categoria.Estado.INACTIVO);
            repository.save(categoria);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
