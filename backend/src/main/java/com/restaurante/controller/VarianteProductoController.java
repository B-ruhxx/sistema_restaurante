package com.restaurante.controller;

import com.restaurante.entity.Producto;
import com.restaurante.entity.VarianteProducto;
import com.restaurante.repository.ProductoRepository;
import com.restaurante.repository.VarianteProductoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/variantes")
public class VarianteProductoController {

    @Autowired
    private VarianteProductoRepository varianteProductoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping("/producto/{idProducto}")
    public ResponseEntity<List<VarianteProducto>> getVariantesByProducto(@PathVariable Integer idProducto) {
        return ResponseEntity.ok(varianteProductoRepository.findByProductoIdProducto(idProducto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VarianteProducto> getVarianteById(@PathVariable Integer id) {
        return varianteProductoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createVariante(@Valid @RequestBody VarianteProductoRequest request) {
        Producto producto = productoRepository.findById(request.getIdProducto())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: ID " + request.getIdProducto()));

        VarianteProducto variante = new VarianteProducto();
        variante.setProducto(producto);
        variante.setNombre(request.getNombre());
        variante.setDescripcion(request.getDescripcion());
        variante.setPrecioExtra(request.getPrecioExtra() != null ? request.getPrecioExtra() : BigDecimal.ZERO);
        variante.setEstado(request.getEstado() != null ? VarianteProducto.Estado.valueOf(request.getEstado().toUpperCase()) : VarianteProducto.Estado.ACTIVO);

        return ResponseEntity.ok(varianteProductoRepository.save(variante));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVariante(@PathVariable Integer id, @Valid @RequestBody VarianteProductoRequest request) {
        return varianteProductoRepository.findById(id).map(variante -> {
            if (request.getIdProducto() != null) {
                Producto producto = productoRepository.findById(request.getIdProducto())
                        .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: ID " + request.getIdProducto()));
                variante.setProducto(producto);
            }
            variante.setNombre(request.getNombre());
            variante.setDescripcion(request.getDescripcion());
            variante.setPrecioExtra(request.getPrecioExtra() != null ? request.getPrecioExtra() : BigDecimal.ZERO);
            if (request.getEstado() != null) {
                variante.setEstado(VarianteProducto.Estado.valueOf(request.getEstado().toUpperCase()));
            }
            return ResponseEntity.ok(varianteProductoRepository.save(variante));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVariante(@PathVariable Integer id) {
        return varianteProductoRepository.findById(id).map(variante -> {
            variante.setEstado(VarianteProducto.Estado.INACTIVO);
            varianteProductoRepository.save(variante);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // DTO class for request binding
    public static class VarianteProductoRequest {
        private Integer idProducto;
        private String nombre;
        private String descripcion;
        private BigDecimal precioExtra;
        private String estado;

        public Integer getIdProducto() { return idProducto; }
        public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }

        public String getDescripcion() { return descripcion; }
        public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

        public BigDecimal getPrecioExtra() { return precioExtra; }
        public void setPrecioExtra(BigDecimal precioExtra) { this.precioExtra = precioExtra; }

        public String getEstado() { return estado; }
        public void setEstado(String estado) { this.estado = estado; }
    }
}
