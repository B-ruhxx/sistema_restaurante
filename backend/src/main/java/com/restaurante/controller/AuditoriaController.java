package com.restaurante.controller;

import com.restaurante.entity.Auditoria;
import com.restaurante.repository.AuditoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auditoria")
public class AuditoriaController {

    @Autowired
    private AuditoriaRepository repository;

    @GetMapping
    public ResponseEntity<List<Auditoria>> getAllAuditoria() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/tabla/{tabla}")
    public ResponseEntity<List<Auditoria>> getAuditoriaByTabla(@PathVariable String tabla) {
        return ResponseEntity.ok(repository.findByTablaAfectadaOrderByFechaEventoDesc(tabla));
    }
}
