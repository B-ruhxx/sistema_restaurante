package com.restaurante.controller;

import com.restaurante.dto.request.AbrirPedidoMesaRequest;
import com.restaurante.dto.request.MesaEstadoRequest;
import com.restaurante.dto.request.MesaRequest;
import com.restaurante.dto.response.MesaResponse;
import com.restaurante.dto.response.PedidoResponse;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.Mesa;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.MesaService;
import com.restaurante.service.PedidoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/mesas")
public class MesaController {
    @Autowired
    private MesaService mesaService;

    @Autowired
    private PedidoService pedidoService;

    @GetMapping
    @PreAuthorize("hasAuthority('GESTION_MESAS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<List<MesaResponse>> listar() {
        return ResponseEntity.ok(mesaService.listar());
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('GESTION_MESAS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<List<MesaResponse>> disponibles() {
        return ResponseEntity.ok(mesaService.listarDisponibles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTION_MESAS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<MesaResponse> obtener(@PathVariable Integer id) {
        return ResponseEntity.ok(mesaService.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GESTION_MESAS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<MesaResponse> crear(@Valid @RequestBody MesaRequest request) {
        return ResponseEntity.ok(mesaService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTION_MESAS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<MesaResponse> actualizar(@PathVariable Integer id, @Valid @RequestBody MesaRequest request) {
        return ResponseEntity.ok(mesaService.actualizar(id, request));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAuthority('GESTION_MESAS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<MesaResponse> cambiarEstado(@PathVariable Integer id, @Valid @RequestBody MesaEstadoRequest request) {
        return ResponseEntity.ok(mesaService.cambiarEstado(id, Mesa.Estado.valueOf(request.getEstado().toUpperCase())));
    }

    @PostMapping("/{id}/abrir-pedido")
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<PedidoResponse> abrirPedido(@PathVariable Integer id,
                                                       @RequestBody(required = false) AbrirPedidoMesaRequest request,
                                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        return ResponseEntity.ok(pedidoService.abrirPedidoMesa(id, request, empleado));
    }

    @PostMapping("/{id}/liberar")
    @PreAuthorize("hasAuthority('GESTION_MESAS') or hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<MesaResponse> liberar(@PathVariable Integer id) {
        return ResponseEntity.ok(mesaService.liberar(id));
    }
}
