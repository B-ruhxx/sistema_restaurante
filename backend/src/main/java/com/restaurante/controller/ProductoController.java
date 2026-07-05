package com.restaurante.controller;

import com.restaurante.dto.request.ProductoRequest;
import com.restaurante.dto.response.LoteProductoResponse;
import com.restaurante.dto.response.ProductoDetalleResponse;
import com.restaurante.dto.response.ProductoResponse;
import com.restaurante.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/productos")
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @GetMapping
    public ResponseEntity<List<ProductoResponse>> getAllProductos(
            @RequestParam(defaultValue = "ACTIVO") String estado) {
        try {
            return ResponseEntity.ok(productoService.getAllProductos(estado));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/padres")
    public ResponseEntity<List<ProductoResponse>> getProductosPadre(
            @RequestParam(defaultValue = "ACTIVO") String estado) {
        try {
            return ResponseEntity.ok(productoService.getProductosPadre(estado));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{idPadre}/skus")
    public ResponseEntity<List<ProductoResponse>> getSkusByPadre(
            @PathVariable Integer idPadre,
            @RequestParam(defaultValue = "ACTIVO") String estado) {
        try {
            return ResponseEntity.ok(productoService.getSkusByPadre(idPadre, estado));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoDetalleResponse> getProductoById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(productoService.getProductoById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/lotes")
    public ResponseEntity<List<LoteProductoResponse>> getLotesProducto(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(productoService.getLotesProducto(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/stock")
    public ResponseEntity<Map<String, Object>> getStockProducto(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(productoService.getStockProducto(id));
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

    @PostMapping("/padres")
    public ResponseEntity<ProductoDetalleResponse> createProductoPadre(@Valid @RequestBody ProductoRequest request) {
        try {
            return ResponseEntity.ok(productoService.createProductoPadre(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{idPadre}/skus")
    public ResponseEntity<ProductoDetalleResponse> createSku(
            @PathVariable Integer idPadre,
            @Valid @RequestBody ProductoRequest request) {
        try {
            return ResponseEntity.ok(productoService.createSku(idPadre, request));
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

    @PatchMapping("/{id}/estado")
    public ResponseEntity<ProductoResponse> updateEstado(
            @PathVariable Integer id,
            @RequestBody Map<String, String> request) {
        try {
            return ResponseEntity.ok(productoService.updateEstado(id, request.get("estado")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
