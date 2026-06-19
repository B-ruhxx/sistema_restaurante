package com.restaurante.service;

import com.restaurante.dto.mapper.InventarioProductoMapper;
import com.restaurante.dto.mapper.ProductoMapper;
import com.restaurante.dto.mapper.RecetaProductoMapper;
import com.restaurante.dto.request.ProductoRequest;
import com.restaurante.dto.response.ProductoDetalleResponse;
import com.restaurante.dto.response.ProductoResponse;
import com.restaurante.dto.response.RecetaProductoResponse;
import com.restaurante.entity.Categoria;
import com.restaurante.entity.Insumo;
import com.restaurante.entity.InventarioProducto;
import com.restaurante.entity.Producto;
import com.restaurante.entity.RecetaProducto;
import com.restaurante.repository.CategoriaRepository;
import com.restaurante.repository.InsumoRepository;
import com.restaurante.repository.InventarioProductoRepository;
import com.restaurante.repository.ProductoRepository;
import com.restaurante.repository.RecetaProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductoService {

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
    private ProductoMapper productoMapper;

    @Autowired
    private InventarioProductoMapper inventarioProductoMapper;

    @Autowired
    private RecetaProductoMapper recetaProductoMapper;

    public List<ProductoResponse> getAllProductos() {
        return productoRepository.findAll().stream()
                .map(productoMapper::toResponse)
                .collect(Collectors.toList());
    }

    public ProductoDetalleResponse getProductoById(Integer id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));

        ProductoDetalleResponse response = new ProductoDetalleResponse();
        response.setProducto(productoMapper.toResponse(producto));

        if (producto.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
            inventarioProductoRepository.findByProductoIdProducto(id)
                    .ifPresent(inv -> response.setInventario(inventarioProductoMapper.toResponse(inv)));
        } else {
            List<RecetaProductoResponse> recetaResponses = recetaProductoRepository.findByProductoIdProducto(id).stream()
                    .map(recetaProductoMapper::toResponse)
                    .collect(Collectors.toList());
            response.setReceta(recetaResponses);
        }

        return response;
    }

    @Transactional
    public ProductoDetalleResponse createProducto(ProductoRequest request) {
        Producto producto = productoMapper.toEntity(request);

        if (request.getIdCategoria() != null) {
            Categoria cat = categoriaRepository.findById(request.getIdCategoria())
                    .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada."));
            producto.setCategoria(cat);
        }

        Producto savedProducto = productoRepository.save(producto);
        ProductoDetalleResponse response = new ProductoDetalleResponse();
        response.setProducto(productoMapper.toResponse(savedProducto));

        if (savedProducto.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
            InventarioProducto inv = new InventarioProducto();
            inv.setProducto(savedProducto);
            inv.setStock(request.getStockInicial() != null ? request.getStockInicial() : 0);
            inv.setStockMinimo(request.getStockMinimo() != null ? request.getStockMinimo() : 5);
            InventarioProducto savedInv = inventarioProductoRepository.save(inv);
            response.setInventario(inventarioProductoMapper.toResponse(savedInv));
        } else {
            List<RecetaProducto> savedReceta = new ArrayList<>();
            if (request.getReceta() != null) {
                for (ProductoRequest.RecetaItemRequest itemReq : request.getReceta()) {
                    Insumo ins = insumoRepository.findById(itemReq.getIdInsumo())
                            .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado: ID " + itemReq.getIdInsumo()));
                    RecetaProducto rec = new RecetaProducto();
                    rec.setProducto(savedProducto);
                    rec.setInsumo(ins);
                    rec.setCantidad(itemReq.getCantidad());
                    savedReceta.add(recetaProductoRepository.save(rec));
                }
            }
            response.setReceta(savedReceta.stream()
                    .map(recetaProductoMapper::toResponse)
                    .collect(Collectors.toList()));
        }

        return response;
    }

    @Transactional
    public ProductoDetalleResponse updateProducto(Integer id, ProductoRequest request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));

        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setImagenUrl(request.getImagenUrl());
        if (request.getEstado() != null) {
            producto.setEstado(Producto.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        if (request.getIdCategoria() != null) {
            Categoria cat = categoriaRepository.findById(request.getIdCategoria())
                    .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada."));
            producto.setCategoria(cat);
        } else {
            producto.setCategoria(null);
        }

        Producto savedProducto = productoRepository.save(producto);
        ProductoDetalleResponse response = new ProductoDetalleResponse();
        response.setProducto(productoMapper.toResponse(savedProducto));

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
            response.setInventario(inventarioProductoMapper.toResponse(savedInv));
        } else {
            // Eliminar detalles anteriores y volver a insertar
            List<RecetaProducto> existing = recetaProductoRepository.findByProductoIdProducto(id);
            recetaProductoRepository.deleteAll(existing);

            List<RecetaProducto> savedReceta = new ArrayList<>();
            if (request.getReceta() != null) {
                for (ProductoRequest.RecetaItemRequest itemReq : request.getReceta()) {
                    Insumo ins = insumoRepository.findById(itemReq.getIdInsumo())
                            .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado: ID " + itemReq.getIdInsumo()));
                    RecetaProducto rec = new RecetaProducto();
                    rec.setProducto(savedProducto);
                    rec.setInsumo(ins);
                    rec.setCantidad(itemReq.getCantidad());
                    savedReceta.add(recetaProductoRepository.save(rec));
                }
            }
            response.setReceta(savedReceta.stream()
                    .map(recetaProductoMapper::toResponse)
                    .collect(Collectors.toList()));
        }

        return response;
    }

    @Transactional
    public void deleteProducto(Integer id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));
        producto.setEstado(Producto.Estado.INACTIVO);
        productoRepository.save(producto);
    }
}
