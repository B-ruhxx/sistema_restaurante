package com.restaurante.controller;

import com.restaurante.entity.MetodoPago;
import com.restaurante.repository.MetodoPagoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/metodo-pagos")
public class MetodoPagoController {

    @Autowired
    private MetodoPagoRepository metodoPagoRepository;

    @GetMapping
    public ResponseEntity<List<MetodoPago>> getAllMetodoPagos() {
        return ResponseEntity.ok(metodoPagoRepository.findAll());
    }

    @GetMapping("/activos")
    public ResponseEntity<List<MetodoPago>> getActivosMetodoPagos() {
        return ResponseEntity.ok(metodoPagoRepository.findByEstado(MetodoPago.Estado.ACTIVO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MetodoPago> getMetodoPagoById(@PathVariable Integer id) {
        return metodoPagoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<MetodoPago> createMetodoPago(@Valid @RequestBody MetodoPago metodoPago) {
        if (metodoPago.getEstado() == null) {
            metodoPago.setEstado(MetodoPago.Estado.ACTIVO);
        }
        if (metodoPago.getRequiereOperacion() == null) {
            metodoPago.setRequiereOperacion(false);
        }
        return ResponseEntity.ok(metodoPagoRepository.save(metodoPago));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MetodoPago> updateMetodoPago(@PathVariable Integer id, @Valid @RequestBody MetodoPago details) {
        return metodoPagoRepository.findById(id).map(metodoPago -> {
            metodoPago.setNombre(details.getNombre());
            metodoPago.setRequiereOperacion(details.getRequiereOperacion());
            metodoPago.setEstado(details.getEstado());
            return ResponseEntity.ok(metodoPagoRepository.save(metodoPago));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMetodoPago(@PathVariable Integer id) {
        return metodoPagoRepository.findById(id).map(metodoPago -> {
            metodoPago.setEstado(MetodoPago.Estado.INACTIVO);
            metodoPagoRepository.save(metodoPago);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
