package com.restaurante.controller;

import com.restaurante.entity.ComboDetalle;
import com.restaurante.entity.ComboProducto;
import com.restaurante.entity.Producto;
import com.restaurante.repository.ComboDetalleRepository;
import com.restaurante.repository.ComboProductoRepository;
import com.restaurante.repository.ProductoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/combos")
public class ComboController {

    @Autowired
    private ComboProductoRepository comboRepository;

    @Autowired
    private ComboDetalleRepository comboDetalleRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping
    public ResponseEntity<List<ComboProducto>> getAllCombos() {
        return ResponseEntity.ok(comboRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getComboById(@PathVariable Integer id) {
        return comboRepository.findById(id).map(combo -> {
            List<ComboDetalle> detalles = comboDetalleRepository.findByComboIdCombo(id);
            Map<String, Object> response = new HashMap<>();
            response.put("combo", combo);
            response.put("detalles", detalles);
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createCombo(@Valid @RequestBody ComboRequest request) {
        ComboProducto combo = new ComboProducto();
        combo.setNombre(request.getNombre());
        combo.setDescripcion(request.getDescripcion());
        combo.setPrecio(request.getPrecio());
        combo.setEstado(request.getEstado() != null ? ComboProducto.Estado.valueOf(request.getEstado().toUpperCase()) : ComboProducto.Estado.ACTIVO);

        ComboProducto savedCombo = comboRepository.save(combo);
        List<ComboDetalle> savedDetalles = new ArrayList<>();

        if (request.getDetalles() != null) {
            for (ComboDetalleRequest detReq : request.getDetalles()) {
                Producto prod = productoRepository.findById(detReq.getIdProducto())
                        .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + detReq.getIdProducto()));
                ComboDetalle det = new ComboDetalle();
                det.setCombo(savedCombo);
                det.setProducto(prod);
                det.setCantidad(detReq.getCantidad());
                savedDetalles.add(comboDetalleRepository.save(det));
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("combo", savedCombo);
        response.put("detalles", savedDetalles);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateCombo(@PathVariable Integer id, @Valid @RequestBody ComboRequest request) {
        return comboRepository.findById(id).map(combo -> {
            combo.setNombre(request.getNombre());
            combo.setDescripcion(request.getDescripcion());
            combo.setPrecio(request.getPrecio());
            combo.setEstado(request.getEstado() != null ? ComboProducto.Estado.valueOf(request.getEstado().toUpperCase()) : ComboProducto.Estado.ACTIVO);

            ComboProducto savedCombo = comboRepository.save(combo);

            // Remove previous details and insert new ones
            List<ComboDetalle> existingDetalles = comboDetalleRepository.findByComboIdCombo(id);
            comboDetalleRepository.deleteAll(existingDetalles);

            List<ComboDetalle> savedDetalles = new ArrayList<>();
            if (request.getDetalles() != null) {
                for (ComboDetalleRequest detReq : request.getDetalles()) {
                    Producto prod = productoRepository.findById(detReq.getIdProducto())
                            .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + detReq.getIdProducto()));
                    ComboDetalle det = new ComboDetalle();
                    det.setCombo(savedCombo);
                    det.setProducto(prod);
                    det.setCantidad(detReq.getCantidad());
                    savedDetalles.add(comboDetalleRepository.save(det));
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("combo", savedCombo);
            response.put("detalles", savedDetalles);
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCombo(@PathVariable Integer id) {
        return comboRepository.findById(id).map(combo -> {
            combo.setEstado(ComboProducto.Estado.INACTIVO);
            comboRepository.save(combo);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // Requests DTOs static inner classes for simplicity
    public static class ComboRequest {
        private String nombre;
        private String descripcion;
        private BigDecimal precio;
        private String estado;
        private List<ComboDetalleRequest> detalles;

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }

        public String getDescripcion() { return descripcion; }
        public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

        public BigDecimal getPrecio() { return precio; }
        public void setPrecio(BigDecimal precio) { this.precio = precio; }

        public String getEstado() { return estado; }
        public void setEstado(String estado) { this.estado = estado; }

        public List<ComboDetalleRequest> getDetalles() { return detalles; }
        public void setDetalles(List<ComboDetalleRequest> detalles) { this.detalles = detalles; }
    }

    public static class ComboDetalleRequest {
        private Integer idProducto;
        private Integer cantidad;

        public Integer getIdProducto() { return idProducto; }
        public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }

        public Integer getCantidad() { return cantidad; }
        public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    }
}
