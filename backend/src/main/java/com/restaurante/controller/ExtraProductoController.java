package com.restaurante.controller;

import com.restaurante.dto.request.ExtraProductoRequest;
import com.restaurante.dto.response.ExtraProductoResponse;
import com.restaurante.service.ExtraProductoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/extras")
public class ExtraProductoController {

    @Autowired
    private ExtraProductoService extraProductoService;

    @GetMapping
    public ResponseEntity<List<ExtraProductoResponse>> getAllExtras() {
        return ResponseEntity.ok(extraProductoService.getAllExtras());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExtraProductoResponse> getExtraById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(extraProductoService.getExtraById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ExtraProductoResponse> createExtra(@Valid @RequestBody ExtraProductoRequest request) {
        return ResponseEntity.ok(extraProductoService.createExtra(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExtraProductoResponse> updateExtra(@PathVariable Integer id, @Valid @RequestBody ExtraProductoRequest request) {
        try {
            return ResponseEntity.ok(extraProductoService.updateExtra(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExtra(@PathVariable Integer id) {
        try {
            extraProductoService.deleteExtra(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
