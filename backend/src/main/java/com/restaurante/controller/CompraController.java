package com.restaurante.controller;

import com.restaurante.dto.CompraRequest;
import com.restaurante.dto.response.CompraResponse;
import com.restaurante.entity.Empleado;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.CompraService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/compras")
public class CompraController {

    @Autowired
    private CompraService compraService;

    @PostMapping
    public ResponseEntity<CompraResponse> registrarCompra(@Valid @RequestBody CompraRequest request,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        CompraResponse response = compraService.registrarCompra(request, empleado);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/anular")
    public ResponseEntity<CompraResponse> anularCompra(@PathVariable Integer id,
                                                      @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        CompraResponse response = compraService.anularCompra(id, empleado);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompraResponse> obtenerCompra(@PathVariable Integer id) {
        return compraService.obtenerCompraPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<CompraResponse>> listarCompras() {
        return ResponseEntity.ok(compraService.listarCompras());
    }
}
