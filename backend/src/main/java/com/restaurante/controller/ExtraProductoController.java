package com.restaurante.controller;

import com.restaurante.entity.ExtraProducto;
import com.restaurante.repository.ExtraProductoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/extras")
public class ExtraProductoController {

    @Autowired
    private ExtraProductoRepository repository;

    @GetMapping
    public ResponseEntity<List<ExtraProducto>> getAllExtras() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExtraProducto> getExtraById(@PathVariable Integer id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ExtraProducto> createExtra(@Valid @RequestBody ExtraProducto extra) {
        if (extra.getEstado() == null) {
            extra.setEstado(ExtraProducto.Estado.ACTIVO);
        }
        return ResponseEntity.ok(repository.save(extra));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExtraProducto> updateExtra(@PathVariable Integer id, @Valid @RequestBody ExtraProducto details) {
        return repository.findById(id).map(extra -> {
            extra.setNombre(details.getNombre());
            extra.setPrecio(details.getPrecio());
            extra.setEstado(details.getEstado());
            return ResponseEntity.ok(repository.save(extra));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExtra(@PathVariable Integer id) {
        return repository.findById(id).map(extra -> {
            extra.setEstado(ExtraProducto.Estado.INACTIVO);
            repository.save(extra);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
