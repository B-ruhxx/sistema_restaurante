package com.restaurante.controller;

import com.restaurante.dto.CajaAperturaRequest;
import com.restaurante.dto.CajaCierreRequest;
import com.restaurante.dto.CobrarPedidoRequest;
import com.restaurante.dto.MovimientoCajaRequest;
import com.restaurante.dto.response.CajaResponse;
import com.restaurante.dto.response.MovimientoCajaResponse;
import com.restaurante.dto.response.PedidoResponse;
import com.restaurante.dto.response.VentaResponse;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.MovimientoCaja;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.CajaService;
import com.restaurante.service.VentaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cajas")
public class CajaController {

    @Autowired
    private CajaService cajaService;

    @Autowired
    private VentaService ventaService;

    @PostMapping("/abrir")
    @PreAuthorize("hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<CajaResponse> abrirCaja(@Valid @RequestBody CajaAperturaRequest request,
                                           @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        CajaResponse response = cajaService.abrirCaja(empleado, request.getMontoApertura(), request.getObservacion());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cerrar/{id}")
    @PreAuthorize("hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<CajaResponse> cerrarCaja(@PathVariable Integer id,
                                            @Valid @RequestBody CajaCierreRequest request) {
        CajaResponse response = cajaService.cerrarCaja(id, request.getMontoCierre(), request.getObservacion());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/movimientos")
    @PreAuthorize("hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<MovimientoCajaResponse> registrarMovimiento(@PathVariable Integer id,
                                                               @Valid @RequestBody MovimientoCajaRequest request) {
        MovimientoCaja.Tipo tipo = MovimientoCaja.Tipo.valueOf(request.getTipo().toUpperCase());
        MovimientoCajaResponse response = cajaService.registrarMovimiento(id, tipo, request.getConcepto(), request.getMonto());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/movimientos")
    @PreAuthorize("hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<List<MovimientoCajaResponse>> listarMovimientos(@PathVariable Integer id) {
        List<MovimientoCajaResponse> response = cajaService.obtenerMovimientos(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/historial")
    @PreAuthorize("hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<List<CajaResponse>> historialCajas() {
        return ResponseEntity.ok(cajaService.obtenerHistorialCajas());
    }

    @GetMapping("/activa")
    @PreAuthorize("hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<CajaResponse> obtenerCajaActiva(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        return cajaService.obtenerCajaAbiertaParaEmpleado(empleado)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/pedidos-pendientes")
    @PreAuthorize("hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<List<PedidoResponse>> pedidosPendientesCobro() {
        return ResponseEntity.ok(cajaService.obtenerPedidosPendientesCobro());
    }

    @GetMapping("/pedidos/mesa/{idMesa}")
    @PreAuthorize("hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<List<PedidoResponse>> pedidosPorMesa(@PathVariable Integer idMesa) {
        return ResponseEntity.ok(cajaService.obtenerPedidosCobrablesPorMesa(idMesa));
    }

    @GetMapping("/pedidos/buscar")
    @PreAuthorize("hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<List<PedidoResponse>> buscarPedidos(@RequestParam(defaultValue = "") String query) {
        return ResponseEntity.ok(cajaService.buscarPedidosParaCaja(query));
    }

    @PostMapping("/pedidos/{idPedido}/cobrar")
    @PreAuthorize("hasAuthority('GESTION_CAJA') or hasAuthority('ACCESO_TOTAL')")
    public ResponseEntity<VentaResponse> cobrarPedido(@PathVariable Integer idPedido,
                                                       @Valid @RequestBody CobrarPedidoRequest request,
                                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        return ResponseEntity.ok(ventaService.generarVentaPagadaDesdePedido(idPedido, request, empleado));
    }
}
