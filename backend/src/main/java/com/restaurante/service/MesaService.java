package com.restaurante.service;

import com.restaurante.dto.mapper.MesaMapper;
import com.restaurante.dto.request.MesaRequest;
import com.restaurante.dto.response.MesaResponse;
import com.restaurante.entity.Mesa;
import com.restaurante.entity.Pedido;
import com.restaurante.exception.ResourceNotFoundException;
import com.restaurante.repository.MesaRepository;
import com.restaurante.repository.PedidoRepository;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MesaService {
    private static final Set<Pedido.Estado> ESTADOS_ACTIVOS = Set.of(
            Pedido.Estado.ABIERTO,
            Pedido.Estado.ENVIADO_COCINA,
            Pedido.Estado.EN_PREPARACION,
            Pedido.Estado.LISTO,
            Pedido.Estado.ENTREGADO,
            Pedido.Estado.CUENTA_SOLICITADA,
            Pedido.Estado.CUENTA_EMITIDA);

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private MesaMapper mesaMapper;

    @Transactional(readOnly = true)
    public List<MesaResponse> listar() {
        return mesaRepository.findAll().stream().map(mesaMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MesaResponse> listarDisponibles() {
        return mesaRepository.findByEstado(Mesa.Estado.LIBRE).stream().map(mesaMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MesaResponse obtener(Integer idMesa) {
        return mesaMapper.toResponse(findMesa(idMesa));
    }

    public MesaResponse crear(MesaRequest request) {
        Mesa mesa = mesaMapper.toEntity(request);
        if (mesa.getEstado() == null) {
            mesa.setEstado(Mesa.Estado.LIBRE);
        }
        return mesaMapper.toResponse(mesaRepository.save(mesa));
    }

    public MesaResponse actualizar(Integer idMesa, MesaRequest request) {
        Mesa mesa = findMesa(idMesa);
        mesaMapper.apply(request, mesa);
        return mesaMapper.toResponse(mesaRepository.save(mesa));
    }

    public MesaResponse cambiarEstado(Integer idMesa, Mesa.Estado estado) {
        Mesa mesa = findMesa(idMesa);
        mesa.setEstado(estado);
        return mesaMapper.toResponse(mesaRepository.save(mesa));
    }

    public MesaResponse liberar(Integer idMesa) {
        Mesa mesa = findMesa(idMesa);
        if (pedidoRepository.existsByMesaIdMesaAndEstadoIn(idMesa, ESTADOS_ACTIVOS)) {
            throw new IllegalStateException("No se puede liberar una mesa con pedido activo no pagado.");
        }
        mesa.setEstado(Mesa.Estado.LIBRE);
        return mesaMapper.toResponse(mesaRepository.save(mesa));
    }

    private Mesa findMesa(Integer idMesa) {
        return mesaRepository.findById(idMesa)
                .orElseThrow(() -> new ResourceNotFoundException("Mesa no encontrada con ID: " + idMesa));
    }
}
