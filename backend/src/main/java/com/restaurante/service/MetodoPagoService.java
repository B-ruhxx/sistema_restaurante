package com.restaurante.service;

import com.restaurante.dto.mapper.MetodoPagoMapper;
import com.restaurante.dto.request.MetodoPagoRequest;
import com.restaurante.dto.response.MetodoPagoResponse;
import com.restaurante.entity.MetodoPago;
import com.restaurante.repository.MetodoPagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MetodoPagoService {

    @Autowired
    private MetodoPagoRepository metodoPagoRepository;

    @Autowired
    private MetodoPagoMapper metodoPagoMapper;

    public List<MetodoPagoResponse> getAllMetodoPagos() {
        return metodoPagoRepository.findAll().stream()
                .map(metodoPagoMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<MetodoPagoResponse> getActivosMetodoPagos() {
        return metodoPagoRepository.findByEstado(MetodoPago.Estado.ACTIVO).stream()
                .map(metodoPagoMapper::toResponse)
                .collect(Collectors.toList());
    }

    public MetodoPagoResponse getMetodoPagoById(Integer id) {
        MetodoPago mp = metodoPagoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado con ID: " + id));
        return metodoPagoMapper.toResponse(mp);
    }

    @Transactional
    public MetodoPagoResponse createMetodoPago(MetodoPagoRequest request) {
        MetodoPago mp = metodoPagoMapper.toEntity(request);
        if (mp.getEstado() == null) {
            mp.setEstado(MetodoPago.Estado.ACTIVO);
        }
        if (mp.getRequiereReferencia() == null) {
            mp.setRequiereReferencia(false);
        }
        MetodoPago savedMp = metodoPagoRepository.save(mp);
        return metodoPagoMapper.toResponse(savedMp);
    }

    @Transactional
    public MetodoPagoResponse updateMetodoPago(Integer id, MetodoPagoRequest request) {
        MetodoPago mp = metodoPagoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado con ID: " + id));

        mp.setNombre(request.getNombre());
        mp.setCodigo(request.getCodigo());
        if (request.getRequiereReferencia() != null) {
            mp.setRequiereReferencia(request.getRequiereReferencia());
        }
        if (request.getEstado() != null) {
            mp.setEstado(MetodoPago.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        MetodoPago savedMp = metodoPagoRepository.save(mp);
        return metodoPagoMapper.toResponse(savedMp);
    }

    @Transactional
    public void deleteMetodoPago(Integer id) {
        MetodoPago mp = metodoPagoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Método de pago no encontrado con ID: " + id));
        mp.setEstado(MetodoPago.Estado.INACTIVO);
        metodoPagoRepository.save(mp);
    }
}
