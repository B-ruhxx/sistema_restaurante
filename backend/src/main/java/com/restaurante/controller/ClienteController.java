package com.restaurante.controller;

import com.restaurante.dto.request.ClienteRequest;
import com.restaurante.dto.response.ClienteResponse;
import com.restaurante.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping
    public ResponseEntity<List<ClienteResponse>> getAllClientes() {
        return ResponseEntity.ok(clienteService.getAllClientes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteResponse> getClienteById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(clienteService.getClienteById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> createCliente(@Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.ok(clienteService.createCliente(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponse> updateCliente(@PathVariable Integer id, @Valid @RequestBody ClienteRequest request) {
        try {
            return ResponseEntity.ok(clienteService.updateCliente(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCliente(@PathVariable Integer id) {
        try {
            clienteService.deleteCliente(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
