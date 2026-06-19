package com.restaurante.service;

import com.restaurante.dto.mapper.MovimientoInventarioMapper;
import com.restaurante.dto.response.MovimientoInventarioResponse;
import com.restaurante.repository.MovimientoInventarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MovimientoInventarioService {

    @Autowired
    private MovimientoInventarioRepository movimientoInventarioRepository;

    @Autowired
    private MovimientoInventarioMapper movimientoInventarioMapper;

    public List<MovimientoInventarioResponse> getAllMovimientos() {
        return movimientoInventarioRepository.findAll().stream()
                .map(movimientoInventarioMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<MovimientoInventarioResponse> getMovimientosByInsumo(Integer idInsumo) {
        return movimientoInventarioRepository.findByInsumoIdInsumo(idInsumo).stream()
                .map(movimientoInventarioMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<MovimientoInventarioResponse> getMovimientosByProducto(Integer idProducto) {
        return movimientoInventarioRepository.findByProductoIdProducto(idProducto).stream()
                .map(movimientoInventarioMapper::toResponse)
                .collect(Collectors.toList());
    }
}
