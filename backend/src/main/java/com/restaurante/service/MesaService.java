package com.restaurante.service;

import com.restaurante.dto.mapper.MesaMapper;
import com.restaurante.dto.request.MesaRequest;
import com.restaurante.dto.response.MesaResponse;
import com.restaurante.entity.Mesa;
import com.restaurante.exception.ResourceNotFoundException;
import com.restaurante.repository.MesaRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MesaService {
    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private MesaMapper mesaMapper;

    @Transactional(readOnly = true)
    public List<MesaResponse> listar() {
        return mesaRepository.findAll().stream().map(mesaMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MesaResponse> listarDisponibles() {
        return mesaRepository.findByEstado(Mesa.Estado.DISPONIBLE).stream().map(mesaMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MesaResponse obtener(Integer idMesa) {
        return mesaMapper.toResponse(findMesa(idMesa));
    }

    public MesaResponse crear(MesaRequest request) {
        Mesa mesa = mesaMapper.toEntity(request);
        if (mesa.getEstado() == null) {
            mesa.setEstado(Mesa.Estado.DISPONIBLE);
        }
        return mesaMapper.toResponse(mesaRepository.save(mesa));
    }

    public MesaResponse actualizar(Integer idMesa, MesaRequest request) {
        Mesa mesa = findMesa(idMesa);
        mesaMapper.apply(request, mesa);
        return mesaMapper.toResponse(mesaRepository.save(mesa));
    }

    private Mesa findMesa(Integer idMesa) {
        return mesaRepository.findById(idMesa)
                .orElseThrow(() -> new ResourceNotFoundException("Mesa no encontrada con ID: " + idMesa));
    }
}
