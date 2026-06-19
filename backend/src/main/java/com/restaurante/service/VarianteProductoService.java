package com.restaurante.service;

import com.restaurante.dto.mapper.VarianteProductoMapper;
import com.restaurante.dto.request.VarianteProductoRequest;
import com.restaurante.dto.response.VarianteProductoResponse;
import com.restaurante.entity.Producto;
import com.restaurante.entity.VarianteProducto;
import com.restaurante.repository.ProductoRepository;
import com.restaurante.repository.VarianteProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VarianteProductoService {

    @Autowired
    private VarianteProductoRepository varianteProductoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private VarianteProductoMapper varianteProductoMapper;

    public List<VarianteProductoResponse> getVariantesByProducto(Integer idProducto) {
        return varianteProductoRepository.findByProductoIdProducto(idProducto).stream()
                .map(varianteProductoMapper::toResponse)
                .collect(Collectors.toList());
    }

    public VarianteProductoResponse getVarianteById(Integer id) {
        VarianteProducto vp = varianteProductoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Variante no encontrada con ID: " + id));
        return varianteProductoMapper.toResponse(vp);
    }

    @Transactional
    public VarianteProductoResponse createVariante(VarianteProductoRequest request) {
        Producto producto = productoRepository.findById(request.getIdProducto())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: ID " + request.getIdProducto()));

        VarianteProducto variante = varianteProductoMapper.toEntity(request);
        variante.setProducto(producto);
        if (variante.getPrecioExtra() == null) {
            variante.setPrecioExtra(BigDecimal.ZERO);
        }
        if (variante.getEstado() == null) {
            variante.setEstado(VarianteProducto.Estado.ACTIVO);
        }

        VarianteProducto savedVp = varianteProductoRepository.save(variante);
        return varianteProductoMapper.toResponse(savedVp);
    }

    @Transactional
    public VarianteProductoResponse updateVariante(Integer id, VarianteProductoRequest request) {
        VarianteProducto variante = varianteProductoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Variante no encontrada con ID: " + id));

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

        VarianteProducto savedVp = varianteProductoRepository.save(variante);
        return varianteProductoMapper.toResponse(savedVp);
    }

    @Transactional
    public void deleteVariante(Integer id) {
        VarianteProducto variante = varianteProductoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Variante no encontrada con ID: " + id));
        variante.setEstado(VarianteProducto.Estado.INACTIVO);
        varianteProductoRepository.save(variante);
    }
}
