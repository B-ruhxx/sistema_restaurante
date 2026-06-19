package com.restaurante.service;

import com.restaurante.dto.mapper.EmpleadoMapper;
import com.restaurante.dto.request.EmpleadoRequest;
import com.restaurante.dto.response.EmpleadoResponse;
import com.restaurante.entity.Empleado;
import com.restaurante.entity.Rol;
import com.restaurante.repository.EmpleadoRepository;
import com.restaurante.repository.RolRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmpleadoService {

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmpleadoMapper empleadoMapper;

    public List<EmpleadoResponse> getAllEmpleados() {
        return empleadoRepository.findAll().stream()
                .map(empleadoMapper::toResponse)
                .collect(Collectors.toList());
    }

    public EmpleadoResponse getEmpleadoById(Integer id) {
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado con ID: " + id));
        return empleadoMapper.toResponse(empleado);
    }

    @Transactional
    public EmpleadoResponse createEmpleado(EmpleadoRequest request) {
        if (empleadoRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("El nombre de usuario ya está registrado.");
        }
        if (request.getEmail() != null && empleadoRepository.findAll().stream().anyMatch(e -> request.getEmail().equalsIgnoreCase(e.getEmail()))) {
            throw new IllegalArgumentException("El correo electrónico ya está registrado.");
        }

        Empleado empleado = empleadoMapper.toEntity(request);
        
        // Encriptar clave
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            empleado.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        } else {
            throw new IllegalArgumentException("La contraseña es obligatoria para nuevos empleados.");
        }

        if (empleado.getEstado() == null) {
            empleado.setEstado(Empleado.Estado.ACTIVO);
        }

        // Resolver Rol
        if (request.getIdRol() != null) {
            Rol rol = rolRepository.findById(request.getIdRol())
                    .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + request.getIdRol()));
            empleado.setRol(rol);
        }

        Empleado savedEmpleado = empleadoRepository.save(empleado);
        return empleadoMapper.toResponse(savedEmpleado);
    }

    @Transactional
    public EmpleadoResponse updateEmpleado(Integer id, EmpleadoRequest request) {
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado con ID: " + id));

        if (!empleado.getUsername().equals(request.getUsername()) &&
                empleadoRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("El nombre de usuario ya está registrado.");
        }

        empleado.setNombre(request.getNombre());
        empleado.setApellido(request.getApellido());
        empleado.setUsername(request.getUsername());
        empleado.setTelefono(request.getTelefono());
        empleado.setEmail(request.getEmail());
        empleado.setAvatarUrl(request.getAvatarUrl());
        
        if (request.getEstado() != null) {
            empleado.setEstado(Empleado.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        // Encriptar clave si es proporcionada y no está ya encriptada
        if (request.getPassword() != null && !request.getPassword().isEmpty() && !request.getPassword().startsWith("$2a$")) {
            empleado.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        // Resolver Rol
        if (request.getIdRol() != null) {
            Rol rol = rolRepository.findById(request.getIdRol())
                    .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + request.getIdRol()));
            empleado.setRol(rol);
        }

        Empleado savedEmpleado = empleadoRepository.save(empleado);
        return empleadoMapper.toResponse(savedEmpleado);
    }

    @Transactional
    public void deleteEmpleado(Integer id) {
        Empleado empleado = empleadoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado con ID: " + id));
        empleado.setEstado(Empleado.Estado.INACTIVO);
        empleadoRepository.save(empleado);
    }

    @Autowired
    private com.restaurante.dto.mapper.RolMapper rolMapper;

    public List<com.restaurante.dto.response.RolResponse> getAllRoles() {
        return rolRepository.findAll().stream()
                .map(rolMapper::toResponse)
                .collect(Collectors.toList());
    }
}
