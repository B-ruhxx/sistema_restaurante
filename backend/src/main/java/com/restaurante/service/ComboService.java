package com.restaurante.service;

import com.restaurante.dto.mapper.ComboMapper;
import com.restaurante.dto.request.ComboRequest;
import com.restaurante.dto.response.ComboResponse;
import com.restaurante.entity.ComboDetalle;
import com.restaurante.entity.ComboProducto;
import com.restaurante.entity.Producto;
import com.restaurante.repository.ComboDetalleRepository;
import com.restaurante.repository.ComboProductoRepository;
import com.restaurante.repository.ProductoRepository;
import com.restaurante.service.policy.ProductoPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComboService {

    @Autowired
    private ComboProductoRepository comboRepository;

    @Autowired
    private ComboDetalleRepository comboDetalleRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ComboMapper comboMapper;

    @Autowired
    private ProductoPolicy productoPolicy;

    public List<ComboResponse> getAllCombos() {
        return comboRepository.findByEstado(ComboProducto.Estado.ACTIVO).stream()
                .map(combo -> {
                    List<ComboDetalle> detalles = comboDetalleRepository.findByComboIdCombo(combo.getIdCombo());
                    return comboMapper.toResponse(combo, detalles);
                })
                .collect(Collectors.toList());
    }

    public ComboResponse getComboById(Integer id) {
        ComboProducto combo = comboRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Combo no encontrado con ID: " + id));
        List<ComboDetalle> detalles = comboDetalleRepository.findByComboIdCombo(id);
        return comboMapper.toResponse(combo, detalles);
    }

    @Transactional
    public ComboResponse createCombo(ComboRequest request) {
        ComboProducto combo = comboMapper.toEntity(request);
        if (combo.getEstado() == null) {
            combo.setEstado(ComboProducto.Estado.ACTIVO);
        }

        ComboProducto savedCombo = comboRepository.save(combo);
        List<ComboDetalle> savedDetalles = new ArrayList<>();

        if (request.getDetalles() != null) {
            for (ComboRequest.ComboDetalleRequest detReq : request.getDetalles()) {
                Producto prod = productoRepository.findById(detReq.getIdProducto())
                        .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + detReq.getIdProducto()));
                validarProductoCombo(prod);
                ComboDetalle det = new ComboDetalle();
                det.setCombo(savedCombo);
                det.setProducto(prod);
                det.setCantidad(detReq.getCantidad());
                savedDetalles.add(comboDetalleRepository.save(det));
            }
        }

        return comboMapper.toResponse(savedCombo, savedDetalles);
    }

    @Transactional
    public ComboResponse updateCombo(Integer id, ComboRequest request) {
        ComboProducto combo = comboRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Combo no encontrado con ID: " + id));

        combo.setNombre(request.getNombre());
        combo.setDescripcion(request.getDescripcion());
        combo.setPrecio(request.getPrecio());
        combo.setImagenUrl(request.getImagenUrl());
        combo.setEtiqueta(request.getEtiqueta());
        combo.setValidoHasta(request.getValidoHasta());
        if (request.getEstado() != null) {
            combo.setEstado(ComboProducto.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        ComboProducto savedCombo = comboRepository.save(combo);

        // Eliminar detalles anteriores y volver a insertar
        List<ComboDetalle> existingDetalles = comboDetalleRepository.findByComboIdCombo(id);
        comboDetalleRepository.deleteAll(existingDetalles);

        List<ComboDetalle> savedDetalles = new ArrayList<>();
        if (request.getDetalles() != null) {
            for (ComboRequest.ComboDetalleRequest detReq : request.getDetalles()) {
                Producto prod = productoRepository.findById(detReq.getIdProducto())
                        .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + detReq.getIdProducto()));
                validarProductoCombo(prod);
                ComboDetalle det = new ComboDetalle();
                det.setCombo(savedCombo);
                det.setProducto(prod);
                det.setCantidad(detReq.getCantidad());
                savedDetalles.add(comboDetalleRepository.save(det));
            }
        }

        return comboMapper.toResponse(savedCombo, savedDetalles);
    }

    @Transactional
    public void deleteCombo(Integer id) {
        ComboProducto combo = comboRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Combo no encontrado con ID: " + id));
        combo.setEstado(ComboProducto.Estado.INACTIVO);
        comboRepository.save(combo);
    }

    private void validarProductoCombo(Producto producto) {
        if (Boolean.FALSE.equals(producto.getEsSku())) {
            throw new IllegalArgumentException("Los combos solo pueden incluir SKUs vendibles. No se permite un producto padre.");
        }
        if (!Boolean.TRUE.equals(producto.getEsSku()) || producto.getProductoPadre() == null) {
            throw new IllegalArgumentException("El producto del combo debe ser un SKU operativo.");
        }
        if (producto.getEstado() != Producto.Estado.ACTIVO) {
            throw new IllegalArgumentException("El SKU del combo debe estar activo.");
        }
        productoPolicy.validarEnrutamientoCocina(producto);
    }
}
