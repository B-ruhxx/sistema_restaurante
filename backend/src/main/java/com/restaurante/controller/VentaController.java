package com.restaurante.controller;

import com.restaurante.dto.VentaAnulacionRequest;
import com.restaurante.dto.VentaPagoRequest;
import com.restaurante.dto.VentaRequest;
import com.restaurante.entity.*;
import com.restaurante.repository.*;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.VentaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/ventas")
public class VentaController {

    @Autowired
    private VentaService ventaService;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private MetodoPagoRepository metodoPagoRepository;

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private ConfiguracionEmpresaRepository configuracionEmpresaRepository;

    @PostMapping
    public ResponseEntity<Venta> registrarVenta(@Valid @RequestBody VentaRequest request,
                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();

        // Fetch IGV percentage from company configuration
        ConfiguracionEmpresa config = configuracionEmpresaRepository.findAll().stream().findFirst().orElse(null);
        java.math.BigDecimal igvPorcentaje = (config != null && config.getIgv() != null)
                ? config.getIgv() : new java.math.BigDecimal("18.00");

        Venta venta = new Venta();
        venta.setEmpleado(empleado);
        venta.setTipoComprobante(Venta.TipoComprobante.valueOf(request.getTipoComprobante().toUpperCase()));
        venta.setSerie(request.getSerie());
        venta.setCorrelativo(request.getCorrelativo());
        venta.setIgvPorcentaje(igvPorcentaje);

        if (request.getIdPedido() != null) {
            Pedido pedido = pedidoRepository.findById(request.getIdPedido())
                    .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado."));
            venta.setPedido(pedido);
        }

        // Build VentaPago objects from request
        List<VentaPago> pagos = new ArrayList<>();
        for (VentaPagoRequest pagoReq : request.getPagos()) {
            VentaPago pago = new VentaPago();
            MetodoPago metodoPago = metodoPagoRepository.findById(pagoReq.getIdMetodoPago())
                    .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado."));
            pago.setMetodoPago(metodoPago);
            pago.setMonto(pagoReq.getMonto());
            pago.setNumeroOperacion(pagoReq.getNumeroOperacion());
            pago.setEstado(VentaPago.Estado.PENDIENTE);
            pagos.add(pago);
        }

        // Build detalles from pedido
        List<DetalleVenta> detalles = new ArrayList<>();
        if (venta.getPedido() != null) {
            List<DetallePedido> detallesPedido = detallePedidoRepository.findByPedidoIdPedido(venta.getPedido().getIdPedido());
            for (DetallePedido dp : detallesPedido) {
                DetalleVenta dv = new DetalleVenta();
                dv.setProducto(dp.getProducto());
                dv.setCombo(dp.getCombo());
                dv.setCantidad(dp.getCantidad());
                dv.setPrecioUnitario(dp.getPrecioUnitario());
                // Subtotal will be calculated/verified in service, but we can set it here too
                dv.setSubtotal(dp.getSubtotal());
                detalles.add(dv);
            }
        }

        Venta ventaGuardada = ventaService.registrarVenta(venta, detalles, pagos);
        return ResponseEntity.ok(ventaGuardada);
    }

    @PostMapping("/{id}/pagar")
    public ResponseEntity<Venta> pagarVenta(@PathVariable Integer id,
                                             @RequestBody List<VentaPagoRequest> pagosReq) {
        List<VentaPago> pagos = new ArrayList<>();
        for (VentaPagoRequest pagoReq : pagosReq) {
            VentaPago pago = new VentaPago();
            MetodoPago metodoPago = metodoPagoRepository.findById(pagoReq.getIdMetodoPago())
                    .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado."));
            pago.setMetodoPago(metodoPago);
            pago.setMonto(pagoReq.getMonto());
            pago.setNumeroOperacion(pagoReq.getNumeroOperacion());
            pago.setEstado(VentaPago.Estado.APROBADO);
            pagos.add(pago);
        }
        Venta venta = ventaService.pagarVenta(id, pagos);
        return ResponseEntity.ok(venta);
    }

    @PostMapping("/{id}/anular")
    public ResponseEntity<Venta> anularVenta(@PathVariable Integer id,
                                              @Valid @RequestBody VentaAnulacionRequest request,
                                              @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        Venta venta = ventaService.anularVenta(id, request.getMotivo(), empleado);
        return ResponseEntity.ok(venta);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Venta> obtenerVenta(@PathVariable Integer id) {
        return ventaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Venta>> listarVentas() {
        return ResponseEntity.ok(ventaRepository.findAll());
    }
}
