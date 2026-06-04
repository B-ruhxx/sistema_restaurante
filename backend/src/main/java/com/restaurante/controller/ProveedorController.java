package com.restaurante.controller;

import com.restaurante.entity.Proveedor;
import com.restaurante.repository.ProveedorRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/proveedores")
public class ProveedorController {

    @Autowired
    private ProveedorRepository repository;

    @GetMapping
    public ResponseEntity<List<Proveedor>> getAllProveedores() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Proveedor> getProveedorById(@PathVariable Integer id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Proveedor> createProveedor(@Valid @RequestBody Proveedor proveedor) {
        if (proveedor.getEstado() == null) {
            proveedor.setEstado(Proveedor.Estado.ACTIVO);
        }
        return ResponseEntity.ok(repository.save(proveedor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Proveedor> updateProveedor(@PathVariable Integer id, @Valid @RequestBody Proveedor details) {
        return repository.findById(id).map(proveedor -> {
            proveedor.setRazonSocial(details.getRazonSocial());
            proveedor.setNombreComercial(details.getNombreComercial());
            proveedor.setRuc(details.getRuc());
            proveedor.setTelefono(details.getTelefono());
            proveedor.setEmail(details.getEmail());
            proveedor.setDireccion(details.getDireccion());
            proveedor.setContactoPrincipal(details.getContactoPrincipal());
            proveedor.setEstado(details.getEstado());
            return ResponseEntity.ok(repository.save(proveedor));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProveedor(@PathVariable Integer id) {
        return repository.findById(id).map(proveedor -> {
            proveedor.setEstado(Proveedor.Estado.INACTIVO);
            repository.save(proveedor);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
