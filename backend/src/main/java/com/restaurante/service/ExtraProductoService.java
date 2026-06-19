package com.restaurante.service;

import com.restaurante.dto.mapper.ExtraProductoMapper;
import com.restaurante.dto.request.ExtraProductoRequest;
import com.restaurante.dto.response.ExtraProductoResponse;
import com.restaurante.entity.ExtraProducto;
import com.restaurante.repository.ExtraProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExtraProductoService {

    @Autowired
    private ExtraProductoRepository extraProductoRepository;

    @Autowired
    private ExtraProductoMapper extraProductoMapper;

    public List<ExtraProductoResponse> getAllExtras() {
        return extraProductoRepository.findAll().stream()
                .map(extraProductoMapper::toResponse)
                .collect(Collectors.toList());
    }

    public ExtraProductoResponse getExtraById(Integer id) {
        ExtraProducto ep = extraProductoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Extra no encontrado con ID: " + id));
        return extraProductoMapper.toResponse(ep);
    }

    @Transactional
    public ExtraProductoResponse createExtra(ExtraProductoRequest request) {
        ExtraProducto ep = extraProductoMapper.toEntity(request);
        if (ep.getEstado() == null) {
            ep.setEstado(ExtraProducto.Estado.ACTIVO);
        }
        ExtraProducto savedEp = extraProductoRepository.save(ep);
        return extraProductoMapper.toResponse(savedEp);
    }

    @Transactional
    public ExtraProductoResponse updateExtra(Integer id, ExtraProductoRequest request) {
        ExtraProducto ep = extraProductoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Extra no encontrado con ID: " + id));

        ep.setNombre(request.getNombre());
        ep.setPrecio(request.getPrecio());
        if (request.getEstado() != null) {
            ep.setEstado(ExtraProducto.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        ExtraProducto savedEp = extraProductoRepository.save(ep);
        return extraProductoMapper.toResponse(savedEp);
    }

    @Transactional
    public void deleteExtra(Integer id) {
        ExtraProducto ep = extraProductoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Extra no encontrado con ID: " + id));
        ep.setEstado(ExtraProducto.Estado.INACTIVO);
        extraProductoRepository.save(ep);
    }
}
