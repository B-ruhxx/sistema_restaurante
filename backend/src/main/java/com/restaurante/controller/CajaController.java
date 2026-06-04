package com.restaurante.controller;

import com.restaurante.dto.CajaAperturaRequest;
import com.restaurante.dto.CajaCierreRequest;
import com.restaurante.dto.MovimientoCajaRequest;
import com.restaurante.entity.Caja;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.MovimientoCaja;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.CajaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cajas")
public class CajaController {

    @Autowired
    private CajaService cajaService;

    @PostMapping("/abrir")
    public ResponseEntity<Caja> abrirCaja(@Valid @RequestBody CajaAperturaRequest request,
                                           @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        Caja caja = cajaService.abrirCaja(empleado, request.getMontoApertura(), request.getObservacion());
        return ResponseEntity.ok(caja);
    }

    @PostMapping("/cerrar/{id}")
    public ResponseEntity<Caja> cerrarCaja(@PathVariable Integer id,
                                            @Valid @RequestBody CajaCierreRequest request) {
        Caja caja = cajaService.cerrarCaja(id, request.getMontoCierre(), request.getObservacion());
        return ResponseEntity.ok(caja);
    }

    @PostMapping("/{id}/movimientos")
    public ResponseEntity<MovimientoCaja> registrarMovimiento(@PathVariable Integer id,
                                                               @Valid @RequestBody MovimientoCajaRequest request) {
        MovimientoCaja.Tipo tipo = MovimientoCaja.Tipo.valueOf(request.getTipo().toUpperCase());
        MovimientoCaja movimiento = cajaService.registrarMovimiento(id, tipo, request.getConcepto(), request.getMonto());
        return ResponseEntity.ok(movimiento);
    }

    @GetMapping("/{id}/movimientos")
    public ResponseEntity<List<MovimientoCaja>> listarMovimientos(@PathVariable Integer id) {
        List<MovimientoCaja> movimientos = cajaService.obtenerMovimientos(id);
        return ResponseEntity.ok(movimientos);
    }

    @GetMapping("/historial")
    public ResponseEntity<List<Caja>> historialCajas() {
        return ResponseEntity.ok(cajaService.obtenerHistorialCajas());
    }

    @GetMapping("/activa")
    public ResponseEntity<Caja> obtenerCajaActiva(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        return cajaService.obtenerCajaAbiertaParaEmpleado(empleado)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
