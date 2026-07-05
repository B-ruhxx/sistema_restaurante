package com.restaurante.controller;

import com.restaurante.dto.PedidoEstadoRequest;
import com.restaurante.dto.PedidoRequest;
import com.restaurante.dto.DetallePedidoRequest;
import com.restaurante.dto.PedidoCancelacionRequest;
import com.restaurante.dto.request.AbrirPedidoMesaRequest;
import com.restaurante.dto.response.DetallePedidoResponse;
import com.restaurante.dto.response.PedidoResponse;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.Pedido;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pedidos")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    @PostMapping
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<PedidoResponse> crearPedido(@Valid @RequestBody PedidoRequest request,
                                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        PedidoResponse response = pedidoService.crearPedido(request, empleado);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mesa/{idMesa}")
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<PedidoResponse> crearPedidoMesa(@PathVariable Integer idMesa,
                                                           @RequestBody(required = false) AbrirPedidoMesaRequest request,
                                                           @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        return ResponseEntity.ok(pedidoService.abrirPedidoMesa(idMesa, request, empleado));
    }

    @PutMapping("/{id}/cliente/{idCliente}")
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<PedidoResponse> asignarCliente(@PathVariable Integer id,
                                                          @PathVariable Integer idCliente) {
        return ResponseEntity.ok(pedidoService.asignarCliente(id, idCliente));
    }

    @PostMapping("/{id}/detalles")
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<DetallePedidoResponse> agregarDetalle(@PathVariable Integer id,
                                                                 @Valid @RequestBody DetallePedidoRequest request) {
        return ResponseEntity.ok(pedidoService.agregarDetalle(id, request));
    }

    @PostMapping("/{id}/enviar-cocina")
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<PedidoResponse> enviarCocina(@PathVariable Integer id,
                                                        @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        return ResponseEntity.ok(pedidoService.enviarACocina(id, empleado));
    }

    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('GESTION_COCINA') or hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<PedidoResponse> actualizarEstado(@PathVariable Integer id,
                                                            @Valid @RequestBody PedidoEstadoRequest request,
                                                            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Pedido.Estado nuevoEstado = parseEstado(request.getEstado());
        Empleado empleado = userDetails.getEmpleado();
        PedidoResponse response = pedidoService.actualizarEstado(id, nuevoEstado, empleado);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('GESTION_COCINA') or hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<PedidoResponse> patchEstado(@PathVariable Integer id,
                                                       @Valid @RequestBody PedidoEstadoRequest request,
                                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        return actualizarEstado(id, request, userDetails);
    }

    @PostMapping("/{id}/cancelar")
    @PreAuthorize("hasAuthority('ACCESO_TOTAL') or hasRole('ADMINISTRADOR') or hasRole('SUPERVISOR')")
    public ResponseEntity<PedidoResponse> cancelarPedido(@PathVariable Integer id,
                                                          @Valid @RequestBody PedidoCancelacionRequest request,
                                                          @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        return ResponseEntity.ok(pedidoService.cancelarPedido(id, request.getMotivo(), empleado));
    }

    @GetMapping("/{id}/detalles")
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('GESTION_COCINA') or hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<List<DetallePedidoResponse>> obtenerDetalles(@PathVariable Integer id) {
        return ResponseEntity.ok(pedidoService.obtenerDetalles(id));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<PedidoResponse> obtenerPedido(@PathVariable Integer id) {
        return pedidoService.obtenerPedidoPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/mesa/{idMesa}/activo")
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<PedidoResponse> obtenerPedidoActivoPorMesa(@PathVariable Integer idMesa) {
        return pedidoService.obtenerPedidoActivoPorMesa(idMesa)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTION_POS') or hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<List<PedidoResponse>> listarPedidos() {
        return ResponseEntity.ok(pedidoService.listarPedidos());
    }

    private Pedido.Estado parseEstado(String estado) {
        return Pedido.Estado.valueOf(estado.toUpperCase());
    }
}
