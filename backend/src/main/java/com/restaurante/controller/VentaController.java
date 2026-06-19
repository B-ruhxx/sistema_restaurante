package com.restaurante.controller;

import com.restaurante.dto.VentaAnulacionRequest;
import com.restaurante.dto.VentaPagoRequest;
import com.restaurante.dto.VentaRequest;
import com.restaurante.dto.response.VentaResponse;
import com.restaurante.entity.Empleado;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.VentaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ventas")
public class VentaController {

    @Autowired
    private VentaService ventaService;

    @PostMapping
    public ResponseEntity<VentaResponse> registrarVenta(@Valid @RequestBody VentaRequest request,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        VentaResponse response = ventaService.registrarVenta(request, empleado);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/pagar")
    public ResponseEntity<VentaResponse> pagarVenta(@PathVariable Integer id,
                                                     @RequestBody List<VentaPagoRequest> pagosReq) {
        VentaResponse response = ventaService.pagarVenta(id, pagosReq);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/anular")
    public ResponseEntity<VentaResponse> anularVenta(@PathVariable Integer id,
                                                      @Valid @RequestBody VentaAnulacionRequest request,
                                                      @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        VentaResponse response = ventaService.anularVenta(id, request.getMotivo(), empleado);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VentaResponse> obtenerVenta(@PathVariable Integer id) {
        return ventaService.obtenerVentaPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<VentaResponse>> listarVentas() {
        return ResponseEntity.ok(ventaService.listarVentas());
    }
}
