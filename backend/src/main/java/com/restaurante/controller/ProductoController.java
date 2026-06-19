package com.restaurante.controller;

import com.restaurante.dto.request.ProductoRequest;
import com.restaurante.dto.response.ProductoDetalleResponse;
import com.restaurante.dto.response.ProductoResponse;
import com.restaurante.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/productos")
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @GetMapping
    public ResponseEntity<List<ProductoResponse>> getAllProductos() {
        return ResponseEntity.ok(productoService.getAllProductos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoDetalleResponse> getProductoById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(productoService.getProductoById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ProductoDetalleResponse> createProducto(@Valid @RequestBody ProductoRequest request) {
        try {
            return ResponseEntity.ok(productoService.createProducto(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoDetalleResponse> updateProducto(@PathVariable Integer id, @Valid @RequestBody ProductoRequest request) {
        try {
            return ResponseEntity.ok(productoService.updateProducto(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProducto(@PathVariable Integer id) {
        try {
            productoService.deleteProducto(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
