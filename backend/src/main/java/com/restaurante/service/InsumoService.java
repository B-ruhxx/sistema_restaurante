package com.restaurante.service;

import com.restaurante.dto.mapper.InsumoMapper;
import com.restaurante.dto.request.InsumoRequest;
import com.restaurante.dto.response.InsumoResponse;
import com.restaurante.entity.Insumo;
import com.restaurante.repository.InsumoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InsumoService {

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private InsumoMapper insumoMapper;

    public List<InsumoResponse> getAllInsumos() {
        return insumoRepository.findAll().stream()
                .map(insumoMapper::toResponse)
                .collect(Collectors.toList());
    }

    public InsumoResponse getInsumoById(Integer id) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado con ID: " + id));
        return insumoMapper.toResponse(insumo);
    }

    @Transactional
    public InsumoResponse createInsumo(InsumoRequest request) {
        Insumo insumo = insumoMapper.toEntity(request);
        if (insumo.getEstado() == null) {
            insumo.setEstado(Insumo.Estado.ACTIVO);
        }
        Insumo savedInsumo = insumoRepository.save(insumo);
        return insumoMapper.toResponse(savedInsumo);
    }

    @Transactional
    public InsumoResponse updateInsumo(Integer id, InsumoRequest request) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado con ID: " + id));

        insumo.setNombre(request.getNombre());
        insumo.setUnidad(request.getUnidad());
        insumo.setStockMinimo(request.getStockMinimo());
        if (request.getEstado() != null) {
            insumo.setEstado(Insumo.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        Insumo savedInsumo = insumoRepository.save(insumo);
        return insumoMapper.toResponse(savedInsumo);
    }

    @Transactional
    public void deleteInsumo(Integer id) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado con ID: " + id));
        insumo.setEstado(Insumo.Estado.INACTIVO);
        insumoRepository.save(insumo);
    }
}
