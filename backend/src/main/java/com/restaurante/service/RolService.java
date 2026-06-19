package com.restaurante.service;

import com.restaurante.dto.mapper.RolMapper;
import com.restaurante.dto.request.RolRequest;
import com.restaurante.dto.response.RolResponse;
import com.restaurante.entity.Rol;
import com.restaurante.entity.Permiso;
import com.restaurante.repository.RolRepository;
import com.restaurante.repository.PermisoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
public class RolService {

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PermisoRepository permisoRepository;

    @Autowired
    private RolMapper rolMapper;

    public List<RolResponse> getAllRoles() {
        return rolRepository.findAll().stream()
                .map(rolMapper::toResponse)
                .collect(Collectors.toList());
    }

    public RolResponse getRoleById(Integer id) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + id));
        return rolMapper.toResponse(rol);
    }

    @Transactional
    public RolResponse createRole(RolRequest request) {
        if (rolRepository.findByNombre(request.getNombre().toUpperCase()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un rol con ese nombre.");
        }
        Rol rol = new Rol();
        rol.setNombre(request.getNombre().toUpperCase());
        rol.setDescripcion(request.getDescripcion());
        if (request.getEstado() != null) {
            rol.setEstado(Rol.Estado.valueOf(request.getEstado().toUpperCase()));
        } else {
            rol.setEstado(Rol.Estado.ACTIVO);
        }

        if (request.getPermisoIds() != null) {
            List<Permiso> permisos = permisoRepository.findAllById(request.getPermisoIds());
            rol.setPermisos(new HashSet<>(permisos));
        }

        Rol savedRol = rolRepository.save(rol);
        return rolMapper.toResponse(savedRol);
    }

    @Transactional
    public RolResponse updateRole(Integer id, RolRequest request) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + id));

        if (!rol.getNombre().equalsIgnoreCase(request.getNombre()) && 
            rolRepository.findByNombre(request.getNombre().toUpperCase()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un rol con ese nombre.");
        }

        rol.setNombre(request.getNombre().toUpperCase());
        rol.setDescripcion(request.getDescripcion());
        if (request.getEstado() != null) {
            rol.setEstado(Rol.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        if (request.getPermisoIds() != null) {
            List<Permiso> permisos = permisoRepository.findAllById(request.getPermisoIds());
            rol.setPermisos(new HashSet<>(permisos));
        }

        Rol savedRol = rolRepository.save(rol);
        return rolMapper.toResponse(savedRol);
    }

    @Transactional
    public void deleteRole(Integer id) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + id));
        
        rol.setEstado(Rol.Estado.INACTIVO);
        rolRepository.save(rol);
    }
}
