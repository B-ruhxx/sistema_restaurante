package com.restaurante.controller;

import com.restaurante.dto.CompraRequest;
import com.restaurante.dto.DetalleCompraRequest;
import com.restaurante.entity.*;
import com.restaurante.repository.CompraInsumoRepository;
import com.restaurante.repository.InsumoRepository;
import com.restaurante.repository.ProveedorRepository;
import com.restaurante.security.CustomUserDetails;
import com.restaurante.service.CompraService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/compras")
public class CompraController {

    @Autowired
    private CompraService compraService;

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private CompraInsumoRepository compraInsumoRepository;

    @PostMapping
    public ResponseEntity<CompraInsumo> registrarCompra(@Valid @RequestBody CompraRequest request,
                                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();

        Proveedor proveedor = proveedorRepository.findById(request.getIdProveedor())
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado."));

        CompraInsumo compra = new CompraInsumo();
        compra.setCodigoCompra(request.getCodigoCompra());
        compra.setProveedor(proveedor);
        compra.setEmpleado(empleado);
        compra.setObservacion(request.getObservacion());

        List<DetalleCompraInsumo> detalles = new ArrayList<>();
        for (DetalleCompraRequest det : request.getDetalles()) {
            Insumo insumo = insumoRepository.findById(det.getIdInsumo())
                    .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado: " + det.getIdInsumo()));

            DetalleCompraInsumo detalle = new DetalleCompraInsumo();
            detalle.setInsumo(insumo);
            detalle.setCantidad(det.getCantidad());
            detalle.setPrecioUnitario(det.getPrecioUnitario());
            detalles.add(detalle);
        }

        CompraInsumo compraGuardada = compraService.registrarCompra(compra, detalles);
        return ResponseEntity.ok(compraGuardada);
    }

    @PostMapping("/{id}/anular")
    public ResponseEntity<CompraInsumo> anularCompra(@PathVariable Integer id,
                                                      @AuthenticationPrincipal CustomUserDetails userDetails) {
        Empleado empleado = userDetails.getEmpleado();
        CompraInsumo compra = compraService.anularCompra(id, empleado);
        return ResponseEntity.ok(compra);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompraInsumo> obtenerCompra(@PathVariable Integer id) {
        return compraInsumoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<CompraInsumo>> listarCompras() {
        return ResponseEntity.ok(compraInsumoRepository.findAll());
    }
}
