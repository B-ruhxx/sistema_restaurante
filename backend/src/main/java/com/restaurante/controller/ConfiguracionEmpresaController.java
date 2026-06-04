package com.restaurante.controller;

import com.restaurante.entity.ConfiguracionEmpresa;
import com.restaurante.repository.ConfiguracionEmpresaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/configuracion")
public class ConfiguracionEmpresaController {

    @Autowired
    private ConfiguracionEmpresaRepository repository;

    @GetMapping
    public ResponseEntity<ConfiguracionEmpresa> getConfiguracion() {
        return repository.findAll().stream().findFirst()
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    ConfiguracionEmpresa config = new ConfiguracionEmpresa();
                    config.setNombreEmpresa("Mi Restaurante");
                    config.setRuc("20000000001");
                    config.setMoneda("PEN");
                    config.setIgv(new java.math.BigDecimal("18.00"));
                    config.setSerieBoleta("B001");
                    config.setSerieFactura("F001");
                    return ResponseEntity.ok(repository.save(config));
                });
    }

    @PutMapping
    public ResponseEntity<ConfiguracionEmpresa> updateConfiguracion(@Valid @RequestBody ConfiguracionEmpresa config) {
        ConfiguracionEmpresa existing = repository.findAll().stream().findFirst().orElse(null);
        if (existing != null) {
            config.setIdConfiguracion(existing.getIdConfiguracion());
        }
        return ResponseEntity.ok(repository.save(config));
    }
}
