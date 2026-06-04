package com.restaurante.controller;

import com.restaurante.entity.Insumo;
import com.restaurante.repository.InsumoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/insumos")
public class InsumoController {

    @Autowired
    private InsumoRepository repository;

    @GetMapping
    public ResponseEntity<List<Insumo>> getAllInsumos() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Insumo> getInsumoById(@PathVariable Integer id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Insumo> createInsumo(@Valid @RequestBody Insumo insumo) {
        if (insumo.getEstado() == null) {
            insumo.setEstado(Insumo.Estado.ACTIVO);
        }
        return ResponseEntity.ok(repository.save(insumo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Insumo> updateInsumo(@PathVariable Integer id, @Valid @RequestBody Insumo details) {
        return repository.findById(id).map(insumo -> {
            insumo.setNombre(details.getNombre());
            insumo.setUnidad(details.getUnidad());
            insumo.setStockMinimo(details.getStockMinimo());
            insumo.setEstado(details.getEstado());
            // note: stock and cost are updated through purchases and POS sales transactions
            return ResponseEntity.ok(repository.save(insumo));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInsumo(@PathVariable Integer id) {
        return repository.findById(id).map(insumo -> {
            insumo.setEstado(Insumo.Estado.INACTIVO);
            repository.save(insumo);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
