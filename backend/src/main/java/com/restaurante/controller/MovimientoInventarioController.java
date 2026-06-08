package com.restaurante.controller;

import com.restaurante.entity.MovimientoInventario;
import com.restaurante.repository.MovimientoInventarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventario/movimientos")
public class MovimientoInventarioController {

    @Autowired
    private MovimientoInventarioRepository repository;

    @GetMapping
    public ResponseEntity<List<MovimientoInventario>> getAllMovimientos() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/insumo/{idInsumo}")
    public ResponseEntity<List<MovimientoInventario>> getMovimientosByInsumo(@PathVariable Integer idInsumo) {
        return ResponseEntity.ok(repository.findByInsumoIdInsumo(idInsumo));
    }

    @GetMapping("/producto/{idProducto}")
    public ResponseEntity<List<MovimientoInventario>> getMovimientosByProducto(@PathVariable Integer idProducto) {
        return ResponseEntity.ok(repository.findByProductoIdProducto(idProducto));
    }
}
