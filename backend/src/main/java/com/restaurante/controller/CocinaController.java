package com.restaurante.controller;

import com.restaurante.dto.PedidoEstadoRequest;
import com.restaurante.dto.response.ComandaDetalleResponse;
import com.restaurante.dto.response.ComandaResponse;
import com.restaurante.entity.DetallePedido;
import com.restaurante.service.CocinaService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cocina")
public class CocinaController {
    @Autowired
    private CocinaService cocinaService;

    @GetMapping("/comandas")
    @PreAuthorize("hasAuthority('GESTION_COCINA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<List<ComandaResponse>> comandas() {
        return ResponseEntity.ok(cocinaService.listarComandas());
    }

    @PostMapping("/pedidos/{id}/iniciar")
    @PreAuthorize("hasAuthority('GESTION_COCINA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<ComandaResponse> iniciar(@PathVariable Integer id) {
        return ResponseEntity.ok(cocinaService.iniciarPreparacion(id));
    }

    @PostMapping("/pedidos/{id}/finalizar")
    @PreAuthorize("hasAuthority('GESTION_COCINA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<ComandaResponse> finalizar(@PathVariable Integer id) {
        return ResponseEntity.ok(cocinaService.finalizarPreparacion(id));
    }

    @PatchMapping("/detalles/{id}/estado")
    @PreAuthorize("hasAuthority('GESTION_COCINA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<ComandaDetalleResponse> cambiarEstadoDetalle(@PathVariable Integer id,
                                                                        @Valid @RequestBody PedidoEstadoRequest request) {
        DetallePedido.EstadoCocina estado = DetallePedido.EstadoCocina.valueOf(request.getEstado().toUpperCase());
        return ResponseEntity.ok(cocinaService.cambiarEstadoDetalle(id, estado));
    }
}
