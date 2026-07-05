package com.restaurante.service;

import com.restaurante.dto.mapper.ProductoMapper;
import com.restaurante.dto.mapper.RecetaProductoMapper;
import com.restaurante.dto.request.ProductoRequest;
import com.restaurante.dto.response.ProductoDetalleResponse;
import com.restaurante.dto.response.LoteProductoResponse;
import com.restaurante.dto.response.ProductoResponse;
import com.restaurante.dto.response.RecetaProductoResponse;
import com.restaurante.entity.Categoria;
import com.restaurante.entity.Insumo;
import com.restaurante.entity.LoteProducto;
import com.restaurante.entity.Producto;
import com.restaurante.entity.RecetaProducto;
import com.restaurante.repository.CategoriaRepository;
import com.restaurante.repository.InsumoRepository;
import com.restaurante.repository.LoteProductoRepository;
import com.restaurante.repository.ProductoRepository;
import com.restaurante.repository.RecetaProductoRepository;
import com.restaurante.service.policy.ProductoPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private LoteProductoRepository loteProductoRepository;

    @Autowired
    private RecetaProductoRepository recetaProductoRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private ProductoMapper productoMapper;

    @Autowired
    private RecetaProductoMapper recetaProductoMapper;

    @Autowired
    private ProductoPolicy productoPolicy;

    public List<ProductoResponse> getAllProductos() {
        return getAllProductos("ACTIVO");
    }

    public List<ProductoResponse> getAllProductos(String estado) {
        String normalized = estado == null ? "ACTIVO" : estado.trim().toUpperCase();
        List<Producto> productos;
        if ("TODOS".equals(normalized)) {
            productos = productoRepository.findAll();
        } else {
            productos = productoRepository.findByEstado(Producto.Estado.valueOf(normalized));
        }

        return productos.stream()
                .map(this::toResponseWithHierarchy)
                .collect(Collectors.toList());
    }

    public List<ProductoResponse> getProductosPadre(String estado) {
        Producto.Estado estadoProducto = parseEstadoOrDefault(estado);
        return productoRepository.findByEsSkuFalseAndEstado(estadoProducto).stream()
                .map(this::toResponseWithHierarchy)
                .collect(Collectors.toList());
    }

    public List<ProductoResponse> getSkusByPadre(Integer idPadre, String estado) {
        Producto padre = productoRepository.findById(idPadre)
                .orElseThrow(() -> new IllegalArgumentException("Producto padre no encontrado con ID: " + idPadre));
        if (Boolean.TRUE.equals(padre.getEsSku())) {
            throw new IllegalArgumentException("El producto indicado no es un producto padre.");
        }

        Producto.Estado estadoProducto = parseEstadoOrDefault(estado);
        return productoRepository.findByProductoPadreIdProductoAndEstado(idPadre, estadoProducto).stream()
                .map(this::toResponseWithHierarchy)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStockProducto(Integer idProducto) {
        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + idProducto));
        ProductoResponse response = toResponseWithHierarchy(producto);
        Map<String, Object> stock = new LinkedHashMap<>();
        stock.put("idProducto", response.getIdProducto());
        stock.put("esSku", response.getEsSku());
        stock.put("stockActual", response.getStockActual());
        stock.put("stockTotal", response.getStockTotal());
        stock.put("stockMinimo", response.getStockMinimo());
        stock.put("lotesDisponibles", response.getLotesDisponibles());
        stock.put("proximoVencimiento", response.getProximoVencimiento());
        return stock;
    }

    public ProductoDetalleResponse getProductoById(Integer id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));

        ProductoDetalleResponse response = new ProductoDetalleResponse();
        response.setProducto(toResponseWithHierarchy(producto));

        if (Boolean.FALSE.equals(producto.getEsSku())) {
            return response;
        }

        if (producto.getTipoProducto() == Producto.TipoProducto.PREPARADO) {
            List<RecetaProductoResponse> recetaResponses = recetaProductoRepository
                    .findByProductoIdProducto(id).stream()
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
        aplicarJerarquiaCatalogo(producto, request, null);
        normalizarOperacionCatalogo(producto);
        productoPolicy.validarCatalogo(producto);

        Producto savedProducto = productoRepository.save(producto);
        ProductoDetalleResponse response = new ProductoDetalleResponse();
        response.setProducto(toResponseWithHierarchy(savedProducto));

        if (Boolean.FALSE.equals(savedProducto.getEsSku())) {
            return response;
        }

        if (savedProducto.getTipoProducto() == Producto.TipoProducto.PREPARADO) {
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
    public ProductoDetalleResponse createProductoPadre(ProductoRequest request) {
        request.setEsSku(false);
        request.setIdProductoPadre(null);
        request.setPrecio(null);
        request.setSku(null);
        request.setTipoProducto(null);
        request.setTiempoPreparacionMinutos(null);
        request.setReceta(null);
        return createProducto(request);
    }

    @Transactional
    public ProductoDetalleResponse createSku(Integer idPadre, ProductoRequest request) {
        request.setEsSku(true);
        request.setIdProductoPadre(idPadre);
        return createProducto(request);
    }

    @Transactional
    public ProductoDetalleResponse updateProducto(Integer id, ProductoRequest request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));

        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setImagenUrl(request.getImagenUrl());
        producto.setSku(productoMapper.normalizeSku(request.getSku()));
        if (request.getEsSku() != null) {
            producto.setEsSku(request.getEsSku());
        }
        if (request.getTiempoPreparacionMinutos() != null) {
            producto.setTiempoPreparacionMinutos(request.getTiempoPreparacionMinutos());
        }
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
        aplicarJerarquiaCatalogo(producto, request, id);
        normalizarOperacionCatalogo(producto);
        productoPolicy.validarCatalogo(producto);

        Producto savedProducto = productoRepository.save(producto);
        ProductoDetalleResponse response = new ProductoDetalleResponse();
        response.setProducto(toResponseWithHierarchy(savedProducto));

        if (Boolean.FALSE.equals(savedProducto.getEsSku())) {
            return response;
        }

        if (savedProducto.getTipoProducto() == Producto.TipoProducto.PREPARADO) {
            recetaProductoRepository.deleteByProductoIdProducto(id);

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

    @Transactional
    public ProductoResponse updateEstado(Integer id, String estado) {
        if (estado == null || estado.isBlank()) {
            throw new IllegalArgumentException("El estado es obligatorio.");
        }
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));
        producto.setEstado(Producto.Estado.valueOf(estado.trim().toUpperCase()));
        return toResponseWithHierarchy(productoRepository.save(producto));
    }

    @Transactional(readOnly = true)
    public List<LoteProductoResponse> getLotesProducto(Integer idProducto) {
        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + idProducto));

        List<LoteProducto> lotes = Boolean.FALSE.equals(producto.getEsSku())
                ? loteProductoRepository.findByProductoProductoPadreIdProductoOrderByFechaVencimientoAscIdLoteProductoAsc(
                        producto.getIdProducto())
                : loteProductoRepository.findByProductoIdProductoOrderByFechaVencimientoAscIdLoteProductoAsc(
                        producto.getIdProducto());

        return lotes.stream()
                .map(this::toLoteProductoResponse)
                .collect(Collectors.toList());
    }

    private ProductoResponse toResponseWithHierarchy(Producto producto) {
        ProductoResponse response = productoMapper.toResponse(producto);
        boolean tieneSkus = productoRepository.countByProductoPadreIdProducto(producto.getIdProducto()) > 0;
        response.setTieneSkus(tieneSkus);

        if (Boolean.FALSE.equals(producto.getEsSku())) {
            response.setStockTotal(toInt(loteProductoRepository.sumDisponibleByProductoPadre(producto.getIdProducto())));
            response.setStockActual(response.getStockTotal());
            response.setLotesDisponibles(toInt(loteProductoRepository.countDisponiblesByProductoPadre(producto.getIdProducto())));
            response.setProximoVencimiento(loteProductoRepository.findProximoVencimientoByProductoPadre(producto.getIdProducto()));
        } else {
            response.setStockActual(toInt(loteProductoRepository.sumDisponibleByProducto(producto.getIdProducto())));
            response.setStockTotal(response.getStockActual());
            response.setLotesDisponibles(toInt(loteProductoRepository.countDisponiblesByProducto(producto.getIdProducto())));
            response.setProximoVencimiento(loteProductoRepository.findProximoVencimientoByProducto(producto.getIdProducto()));
        }

        return response;
    }

    private LoteProductoResponse toLoteProductoResponse(LoteProducto lote) {
        LoteProductoResponse response = new LoteProductoResponse();
        response.setIdLoteProducto(lote.getIdLoteProducto());
        if (lote.getProducto() != null) {
            response.setIdProducto(lote.getProducto().getIdProducto());
            response.setNombreProducto(lote.getProducto().getNombre());
            response.setSkuProducto(lote.getProducto().getSku());
        }
        response.setCantidadInicial(lote.getCantidadInicial());
        response.setCantidadDisponible(lote.getCantidadDisponible());
        response.setCostoUnitario(lote.getCostoUnitario());
        response.setFechaVencimiento(lote.getFechaVencimiento());
        if (lote.getEstado() != null) {
            response.setEstado(lote.getEstado().name());
        }
        if (lote.getDetalleCompra() != null && lote.getDetalleCompra().getCompra() != null) {
            response.setIdCompra(lote.getDetalleCompra().getCompra().getIdCompra());
            response.setCodigoCompra(lote.getDetalleCompra().getCompra().getCodigoCompra());
            response.setFechaCompra(lote.getDetalleCompra().getCompra().getFecha());
            if (lote.getDetalleCompra().getCompra().getProveedor() != null) {
                response.setProveedorNombre(lote.getDetalleCompra().getCompra().getProveedor().getRazonSocial());
            }
        }
        return response;
    }

    private Integer toInt(Long value) {
        return value == null ? 0 : value.intValue();
    }

    private Producto.Estado parseEstadoOrDefault(String estado) {
        String normalized = estado == null || estado.isBlank() ? "ACTIVO" : estado.trim().toUpperCase();
        return Producto.Estado.valueOf(normalized);
    }

    private void aplicarJerarquiaCatalogo(Producto producto, ProductoRequest request, Integer currentId) {
        boolean esSku = request.getEsSku() != null
                ? request.getEsSku()
                : !Boolean.FALSE.equals(producto.getEsSku());
        producto.setEsSku(esSku);

        if (!esSku && request.getIdProductoPadre() != null) {
            throw new IllegalArgumentException("Un producto padre no puede depender de otro producto.");
        }

        if (request.getIdProductoPadre() == null) {
            producto.setProductoPadre(null);
            return;
        }

        if (currentId != null && currentId.equals(request.getIdProductoPadre())) {
            throw new IllegalArgumentException("Un producto no puede ser padre de si mismo.");
        }

        Producto padre = productoRepository.findById(request.getIdProductoPadre())
                .orElseThrow(() -> new IllegalArgumentException("Producto padre no encontrado."));

        if (Boolean.TRUE.equals(padre.getEsSku())) {
            throw new IllegalArgumentException("El producto padre debe estar marcado como contenedor, no como SKU.");
        }

        producto.setProductoPadre(padre);
    }

    private void normalizarOperacionCatalogo(Producto producto) {
        if (Boolean.FALSE.equals(producto.getEsSku())) {
            producto.setSku(null);
            producto.setPrecio(null);
            producto.setTipoProducto(null);
            producto.setTiempoPreparacionMinutos(null);
            return;
        }
        if (producto.getTipoProducto() == Producto.TipoProducto.INVENTARIO_DIRECTO) {
            producto.setTiempoPreparacionMinutos(null);
        }
    }
}
