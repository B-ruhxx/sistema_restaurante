package com.restaurante.controller;

import com.restaurante.entity.*;
import com.restaurante.repository.*;
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
@RequestMapping("/api/v1/productos")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private InventarioProductoRepository inventarioProductoRepository;

    @Autowired
    private RecetaProductoRepository recetaProductoRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private DetalleVentaRepository detalleVentaRepository;

    @Autowired
    private ComboDetalleRepository comboDetalleRepository;

    @Autowired
    private MovimientoInventarioRepository movimientoInventarioRepository;

    @Autowired
    private VarianteProductoRepository varianteProductoRepository;

    @GetMapping
    public ResponseEntity<List<Producto>> getAllProductos() {
        return ResponseEntity.ok(productoRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductoById(@PathVariable Integer id) {
        return productoRepository.findById(id).map(producto -> {
            Map<String, Object> response = new HashMap<>();
            response.put("producto", producto);
            
            if (producto.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
                inventarioProductoRepository.findByProductoIdProducto(id)
                        .ifPresent(inv -> response.put("inventario", inv));
            } else {
                List<RecetaProducto> receta = recetaProductoRepository.findByProductoIdProducto(id);
                response.put("receta", receta);
            }
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createProducto(@Valid @RequestBody ProductoRequest request) {
        Producto producto = new Producto();
        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setImagenUrl(request.getImagenUrl());
        producto.setTipoProducto(Producto.TipoProducto.valueOf(request.getTipoProducto().toUpperCase()));
        producto.setEstado(request.getEstado() != null ? Producto.Estado.valueOf(request.getEstado().toUpperCase()) : Producto.Estado.ACTIVO);

        if (request.getIdCategoria() != null) {
            Categoria cat = categoriaRepository.findById(request.getIdCategoria())
                    .orElseThrow(() -> new IllegalArgumentException("Categoria no encontrada."));
            producto.setCategoria(cat);
        }

        Producto savedProducto = productoRepository.save(producto);
        Map<String, Object> response = new HashMap<>();
        response.put("producto", savedProducto);

        if (savedProducto.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
            InventarioProducto inv = new InventarioProducto();
            inv.setProducto(savedProducto);
            inv.setStock(request.getStockInicial() != null ? request.getStockInicial() : 0);
            inv.setStockMinimo(request.getStockMinimo() != null ? request.getStockMinimo() : 5);
            InventarioProducto savedInv = inventarioProductoRepository.save(inv);
            response.put("inventario", savedInv);
        } else {
            List<RecetaProducto> savedReceta = new ArrayList<>();
            if (request.getReceta() != null) {
                for (RecetaItemRequest itemReq : request.getReceta()) {
                    Insumo ins = insumoRepository.findById(itemReq.getIdInsumo())
                            .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado: ID " + itemReq.getIdInsumo()));
                    RecetaProducto rec = new RecetaProducto();
                    rec.setProducto(savedProducto);
                    rec.setInsumo(ins);
                    rec.setCantidad(itemReq.getCantidad());
                    savedReceta.add(recetaProductoRepository.save(rec));
                }
            }
            response.put("receta", savedReceta);
        }

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateProducto(@PathVariable Integer id, @Valid @RequestBody ProductoRequest request) {
        return productoRepository.findById(id).map(producto -> {
            producto.setNombre(request.getNombre());
            producto.setDescripcion(request.getDescripcion());
            producto.setPrecio(request.getPrecio());
            producto.setImagenUrl(request.getImagenUrl());
            producto.setEstado(request.getEstado() != null ? Producto.Estado.valueOf(request.getEstado().toUpperCase()) : Producto.Estado.ACTIVO);

            if (request.getIdCategoria() != null) {
                Categoria cat = categoriaRepository.findById(request.getIdCategoria())
                        .orElseThrow(() -> new IllegalArgumentException("Categoria no encontrada."));
                producto.setCategoria(cat);
            } else {
                producto.setCategoria(null);
            }

            Producto savedProducto = productoRepository.save(producto);
            Map<String, Object> response = new HashMap<>();
            response.put("producto", savedProducto);

            if (savedProducto.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
                InventarioProducto inv = inventarioProductoRepository.findByProductoIdProducto(id)
                        .orElse(new InventarioProducto());
                inv.setProducto(savedProducto);
                if (request.getStockInicial() != null) {
                    inv.setStock(request.getStockInicial());
                }
                if (request.getStockMinimo() != null) {
                    inv.setStockMinimo(request.getStockMinimo());
                }
                InventarioProducto savedInv = inventarioProductoRepository.save(inv);
                response.put("inventario", savedInv);
            } else {
                // Delete previous recipe details and re-add
                List<RecetaProducto> existing = recetaProductoRepository.findByProductoIdProducto(id);
                recetaProductoRepository.deleteAll(existing);

                List<RecetaProducto> savedReceta = new ArrayList<>();
                if (request.getReceta() != null) {
                    for (RecetaItemRequest itemReq : request.getReceta()) {
                        Insumo ins = insumoRepository.findById(itemReq.getIdInsumo())
                                .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado: ID " + itemReq.getIdInsumo()));
                        RecetaProducto rec = new RecetaProducto();
                        rec.setProducto(savedProducto);
                        rec.setInsumo(ins);
                        rec.setCantidad(itemReq.getCantidad());
                        savedReceta.add(recetaProductoRepository.save(rec));
                    }
                }
                response.put("receta", savedReceta);
            }

            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteProducto(
            @PathVariable Integer id,
            @RequestParam(value = "physical", defaultValue = "false") boolean physical) {
        return productoRepository.findById(id).map(producto -> {
            if (physical) {
                // Check if product is referenced anywhere
                boolean usedInPedidos = detallePedidoRepository.existsByProductoIdProducto(id);
                boolean usedInVentas = detalleVentaRepository.existsByProductoIdProducto(id);
                boolean usedInCombos = comboDetalleRepository.existsByProductoIdProducto(id);
                boolean usedInInventario = movimientoInventarioRepository.existsByProductoIdProducto(id);

                if (usedInPedidos || usedInVentas || usedInCombos || usedInInventario) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "message", "No se puede eliminar el producto físicamente porque está siendo usado en transacciones del sistema (pedidos, ventas, combos o movimientos de inventario)."
                    ));
                }

                // Delete in cascade:
                // 1. Delete variants
                List<VarianteProducto> variantes = varianteProductoRepository.findByProductoIdProducto(id);
                varianteProductoRepository.deleteAll(variantes);

                // 2. Delete recipes
                List<RecetaProducto> recetas = recetaProductoRepository.findByProductoIdProducto(id);
                recetaProductoRepository.deleteAll(recetas);

                // 3. Delete stock definition
                inventarioProductoRepository.findByProductoIdProducto(id).ifPresent(inv -> {
                    inventarioProductoRepository.delete(inv);
                });

                // 4. Finally delete product
                productoRepository.delete(producto);
                return ResponseEntity.ok(Map.of("message", "Producto eliminado físicamente con éxito."));
            } else {
                producto.setEstado(Producto.Estado.INACTIVO);
                productoRepository.save(producto);
                return ResponseEntity.ok(Map.of("message", "Producto desactivado con éxito."));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Static Request classes for binding
    public static class ProductoRequest {
        private String nombre;
        private String descripcion;
        private BigDecimal precio;
        private String imagenUrl;
        private String tipoProducto;
        private String estado;
        private Integer idCategoria;
        private Integer stockInicial;
        private Integer stockMinimo;
        private List<RecetaItemRequest> receta;

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }

        public String getDescripcion() { return descripcion; }
        public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

        public BigDecimal getPrecio() { return precio; }
        public void setPrecio(BigDecimal precio) { this.precio = precio; }

        public String getTipoProducto() { return tipoProducto; }
        public void setTipoProducto(String tipoProducto) { this.tipoProducto = tipoProducto; }

        public String getEstado() { return estado; }
        public void setEstado(String estado) { this.estado = estado; }

        public Integer getIdCategoria() { return idCategoria; }
        public void setIdCategoria(Integer idCategoria) { this.idCategoria = idCategoria; }

        public Integer getStockInicial() { return stockInicial; }
        public void setStockInicial(Integer stockInicial) { this.stockInicial = stockInicial; }

        public Integer getStockMinimo() { return stockMinimo; }
        public void setStockMinimo(Integer stockMinimo) { this.stockMinimo = stockMinimo; }

        public List<RecetaItemRequest> getReceta() { return receta; }
        public void setReceta(List<RecetaItemRequest> receta) { this.receta = receta; }

        public String getImagenUrl() { return imagenUrl; }
        public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }
    }

    public static class RecetaItemRequest {
        private Integer idInsumo;
        private BigDecimal cantidad;

        public Integer getIdInsumo() { return idInsumo; }
        public void setIdInsumo(Integer idInsumo) { this.idInsumo = idInsumo; }

        public BigDecimal getCantidad() { return cantidad; }
        public void setCantidad(BigDecimal cantidad) { this.cantidad = cantidad; }
    }
}
