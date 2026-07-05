package com.restaurante.controller;

import com.restaurante.dto.request.AjusteInventarioRequest;
import com.restaurante.dto.response.AjusteInventarioResponse;
import com.restaurante.entity.Empleado;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.MovimientoInventarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventario")
public class InventarioController {

    @Autowired
    private MovimientoInventarioService movimientoInventarioService;

    @PostMapping("/ajustes")
    public ResponseEntity<AjusteInventarioResponse> registrarAjuste(
            @Valid @RequestBody AjusteInventarioRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        return ResponseEntity.ok(movimientoInventarioService.registrarAjusteSalida(request, empleado));
    }
}
