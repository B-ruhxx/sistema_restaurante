package com.restaurante.controller;

import com.restaurante.dto.response.PrecuentaResponse;
import com.restaurante.entity.Empleado;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.PrecuentaService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class PrecuentaController {
    @Autowired
    private PrecuentaService precuentaService;

    @PostMapping("/pedidos/{id}/precuenta")
    @PreAuthorize("hasAuthority('GESTION_PRECUENTA') or hasAuthority('GESTION_POS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<PrecuentaResponse> emitir(@PathVariable Integer id,
                                                     @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        return ResponseEntity.ok(precuentaService.emitirPrecuenta(id, empleado));
    }

    @GetMapping("/precuentas/{id}")
    @PreAuthorize("hasAuthority('GESTION_PRECUENTA') or hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<PrecuentaResponse> obtener(@PathVariable Integer id) {
        return ResponseEntity.ok(precuentaService.obtener(id));
    }

    @GetMapping("/precuentas/pedido/{idPedido}")
    @PreAuthorize("hasAuthority('GESTION_PRECUENTA') or hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<List<PrecuentaResponse>> porPedido(@PathVariable Integer idPedido) {
        return ResponseEntity.ok(precuentaService.obtenerPorPedido(idPedido));
    }
}
