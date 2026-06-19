package com.restaurante.controller;

import com.restaurante.dto.response.MovimientoInventarioResponse;
import com.restaurante.service.MovimientoInventarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventario/movimientos")
public class MovimientoInventarioController {

    @Autowired
    private MovimientoInventarioService movimientoInventarioService;

    @GetMapping
    public ResponseEntity<List<MovimientoInventarioResponse>> getAllMovimientos() {
        return ResponseEntity.ok(movimientoInventarioService.getAllMovimientos());
    }

    @GetMapping("/insumo/{idInsumo}")
    public ResponseEntity<List<MovimientoInventarioResponse>> getMovimientosByInsumo(@PathVariable Integer idInsumo) {
        return ResponseEntity.ok(movimientoInventarioService.getMovimientosByInsumo(idInsumo));
    }

    @GetMapping("/producto/{idProducto}")
    public ResponseEntity<List<MovimientoInventarioResponse>> getMovimientosByProducto(@PathVariable Integer idProducto) {
        return ResponseEntity.ok(movimientoInventarioService.getMovimientosByProducto(idProducto));
    }
}
