package com.restaurante.controller;

import com.restaurante.dto.request.ConfiguracionRequest;
import com.restaurante.dto.response.ConfiguracionResponse;
import com.restaurante.service.ConfiguracionEmpresaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/configuracion")
public class ConfiguracionEmpresaController {

    @Autowired
    private ConfiguracionEmpresaService configuracionEmpresaService;

    @GetMapping
    public ResponseEntity<ConfiguracionResponse> getConfiguracion() {
        return ResponseEntity.ok(configuracionEmpresaService.getConfiguracion());
    }

    @PutMapping
    public ResponseEntity<ConfiguracionResponse> updateConfiguracion(@Valid @RequestBody ConfiguracionRequest request) {
        return ResponseEntity.ok(configuracionEmpresaService.updateConfiguracion(request));
    }
}
