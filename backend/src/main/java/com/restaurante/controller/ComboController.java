package com.restaurante.controller;

import com.restaurante.dto.request.ComboRequest;
import com.restaurante.dto.response.ComboResponse;
import com.restaurante.service.ComboService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/combos")
public class ComboController {

    @Autowired
    private ComboService comboService;

    @GetMapping
    public ResponseEntity<List<ComboResponse>> getAllCombos() {
        return ResponseEntity.ok(comboService.getAllCombos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComboResponse> getComboById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(comboService.getComboById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ComboResponse> createCombo(@Valid @RequestBody ComboRequest request) {
        try {
            return ResponseEntity.ok(comboService.createCombo(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ComboResponse> updateCombo(@PathVariable Integer id, @Valid @RequestBody ComboRequest request) {
        try {
            return ResponseEntity.ok(comboService.updateCombo(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCombo(@PathVariable Integer id) {
        try {
            comboService.deleteCombo(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
