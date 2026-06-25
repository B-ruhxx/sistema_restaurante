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

    public List<CategoriaResponse> getAllCategorias() {
        return categoriaRepository.findByEstado(Categoria.Estado.ACTIVO).stream()
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
        categoria.setImg(request.getImg());
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
}
