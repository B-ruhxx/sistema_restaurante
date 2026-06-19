package com.restaurante.controller;

import com.restaurante.dto.response.PermisoResponse;
import com.restaurante.service.PermisoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/permisos")
public class PermisoController {

    @Autowired
    private PermisoService permisoService;

    @GetMapping
    public ResponseEntity<List<PermisoResponse>> getAllPermisos() {
        return ResponseEntity.ok(permisoService.getAllPermisos());
    }
}
