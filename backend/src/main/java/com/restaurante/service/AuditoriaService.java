package com.restaurante.service;

import com.restaurante.dto.mapper.AuditoriaMapper;
import com.restaurante.dto.response.AuditoriaResponse;
import com.restaurante.repository.AuditoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AuditoriaService {

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    @Autowired
    private AuditoriaMapper auditoriaMapper;

    public List<AuditoriaResponse> getAllAuditoria() {
        return auditoriaRepository.findAll().stream()
                .map(auditoriaMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<AuditoriaResponse> getAuditoriaByTabla(String tabla) {
        return auditoriaRepository.findByTablaAfectadaOrderByFechaEventoDesc(tabla).stream()
                .map(auditoriaMapper::toResponse)
                .collect(Collectors.toList());
    }
}
