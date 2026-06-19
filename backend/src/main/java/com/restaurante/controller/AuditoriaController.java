package com.restaurante.controller;

import com.restaurante.dto.response.AuditoriaResponse;
import com.restaurante.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auditoria")
public class AuditoriaController {

    @Autowired
    private AuditoriaService auditoriaService;

    @GetMapping
    public ResponseEntity<List<AuditoriaResponse>> getAllAuditoria() {
        return ResponseEntity.ok(auditoriaService.getAllAuditoria());
    }

    @GetMapping("/tabla/{tabla}")
    public ResponseEntity<List<AuditoriaResponse>> getAuditoriaByTabla(@PathVariable String tabla) {
        return ResponseEntity.ok(auditoriaService.getAuditoriaByTabla(tabla));
    }
}
