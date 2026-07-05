package com.restaurante.service;

import com.restaurante.dto.mapper.CategoriaMapper;
import com.restaurante.dto.request.CategoriaRequest;
import com.restaurante.dto.response.CategoriaResponse;
import com.restaurante.entity.Categoria;
import com.restaurante.exception.ResourceNotFoundException;
import com.restaurante.repository.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoriaService {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private CategoriaMapper categoriaMapper;

    public List<CategoriaResponse> getAllCategorias(String estado) {
        List<Categoria> categorias;
        if (estado == null || estado.isBlank() || "ACTIVO".equalsIgnoreCase(estado)) {
            categorias = categoriaRepository.findByEstadoOrderByNombreAsc(Categoria.Estado.ACTIVO);
        } else if ("INACTIVO".equalsIgnoreCase(estado)) {
            categorias = categoriaRepository.findByEstadoOrderByNombreAsc(Categoria.Estado.INACTIVO);
        } else if ("TODOS".equalsIgnoreCase(estado)) {
            categorias = categoriaRepository.findAllByOrderByNombreAsc();
        } else {
            throw new IllegalArgumentException("Estado de categoría no válido: " + estado);
        }

        return categorias.stream()
                .map(categoriaMapper::toResponse)
                .collect(Collectors.toList());
    }

    public CategoriaResponse getCategoriaById(Integer id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));
        return categoriaMapper.toResponse(categoria);
    }

    @Transactional
    public CategoriaResponse createCategoria(CategoriaRequest request) {
        Categoria categoria = categoriaMapper.toEntity(request);
        if (categoria.getEstado() == null) {
            categoria.setEstado(Categoria.Estado.ACTIVO);
        }
        Categoria savedCategoria = categoriaRepository.save(categoria);
        return categoriaMapper.toResponse(savedCategoria);
    }

    @Transactional
    public CategoriaResponse updateCategoria(Integer id, CategoriaRequest request) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));

        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        categoria.setImagenUrl(request.getImagenUrl());
        if (request.getEstado() != null) {
            categoria.setEstado(Categoria.Estado.valueOf(request.getEstado().toUpperCase()));
        }

        Categoria savedCategoria = categoriaRepository.save(categoria);
        return categoriaMapper.toResponse(savedCategoria);
    }

    @Transactional
    public void deleteCategoria(Integer id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));
        categoria.setEstado(Categoria.Estado.INACTIVO);
        categoriaRepository.save(categoria);
    }

    @Transactional
    public CategoriaResponse updateEstadoCategoria(Integer id, String estado) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));
        categoria.setEstado(Categoria.Estado.valueOf(estado.toUpperCase()));
        return categoriaMapper.toResponse(categoriaRepository.save(categoria));
    }
}
