package com.restaurante.service;

import com.restaurante.dto.mapper.RolMapper;
import com.restaurante.dto.response.PermisoResponse;
import com.restaurante.repository.PermisoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PermisoService {

    @Autowired
    private PermisoRepository permisoRepository;

    @Autowired
    private RolMapper rolMapper;

    public List<PermisoResponse> getAllPermisos() {
        return permisoRepository.findAll().stream()
                .map(rolMapper::toPermisoResponse)
                .collect(Collectors.toList());
    }
}
