package com.restaurante.controller;

import com.restaurante.dto.PedidoEstadoRequest;
import com.restaurante.dto.PedidoRequest;
import com.restaurante.dto.response.DetallePedidoResponse;
import com.restaurante.dto.response.PedidoResponse;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.Pedido;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pedidos")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    @PostMapping
    public ResponseEntity<PedidoResponse> crearPedido(@Valid @RequestBody PedidoRequest request,
                                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        PedidoResponse response = pedidoService.crearPedido(request, empleado);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<PedidoResponse> actualizarEstado(@PathVariable Integer id,
                                                            @Valid @RequestBody PedidoEstadoRequest request,
                                                            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Pedido.Estado nuevoEstado = Pedido.Estado.valueOf(request.getEstado().toUpperCase());
        Empleado empleado = userDetails.getEmpleado();
        PedidoResponse response = pedidoService.actualizarEstado(id, nuevoEstado, empleado);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/detalles")
    public ResponseEntity<List<DetallePedidoResponse>> obtenerDetalles(@PathVariable Integer id) {
        return ResponseEntity.ok(pedidoService.obtenerDetalles(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PedidoResponse> obtenerPedido(@PathVariable Integer id) {
        return pedidoService.obtenerPedidoPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<PedidoResponse>> listarPedidos() {
        return ResponseEntity.ok(pedidoService.listarPedidos());
    }
}
