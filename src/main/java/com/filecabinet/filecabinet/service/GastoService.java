package com.filecabinet.filecabinet.service;

import com.filecabinet.filecabinet.dto.GastoDto;
import com.filecabinet.filecabinet.entidades.Cliente;
import com.filecabinet.filecabinet.entidades.Gasto;
import com.filecabinet.filecabinet.entidades.Proyecto;
import com.filecabinet.filecabinet.entidades.Usuario;
import com.filecabinet.filecabinet.repository.ClienteRepository;
import com.filecabinet.filecabinet.repository.GastoRepository;
import com.filecabinet.filecabinet.repository.ProyectoRepository;
import com.filecabinet.filecabinet.repository.UsuarioRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GastoService {

    private final GastoRepository gastosRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProyectoRepository proyectoRepository;

    public GastoService(GastoRepository gastosRepository, ClienteRepository clienteRepository,
            UsuarioRepository usuarioRepository, ProyectoRepository proyectoRepository) {
        this.gastosRepository = gastosRepository;
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.proyectoRepository = proyectoRepository;
    }

    // SEGURIDAD: Filtrar por usuario
    @Transactional(readOnly = true)
    public List<GastoDto> getAllGastos(Long userId) {
        return gastosRepository.findByUsuarioId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // SEGURIDAD: Filtrar por usuario y ID
    @Transactional(readOnly = true)
    public Optional<GastoDto> getGastoById(Long id, Long userId) {
        return gastosRepository.findByIdAndUsuarioId(id, userId).map(this::toDto);
    }

    @Transactional
    public GastoDto createGasto(GastoDto gastoDto, Long userId) {
        String numeroFactura = gastoDto.getNumGasto();

        if (gastosRepository.existsByNumGastoAndUsuarioId(numeroFactura, userId)) {
            throw new IllegalStateException("El gasto con número " + numeroFactura + " ya ha sido registrado.");
        }
        
        // Pasamos userId para vincular Cliente/Proyecto de forma segura
        Gasto gasto = toEntity(gastoDto, userId); 
        
        if (userId != null) {
            Usuario usuario = usuarioRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + userId));
            gasto.setUsuario(usuario);
        }

        Gasto savedGasto = gastosRepository.save(gasto);
        return toDto(savedGasto);
    }

    @Transactional
    public Optional<GastoDto> updateGasto(Long id, Long userId, GastoDto gastoDetails) {
        // SEGURIDAD: Buscamos con findByIdAndUsuarioId
        return gastosRepository.findByIdAndUsuarioId(id, userId).map(gasto -> {
            
            // Actualizar campos básicos
            gasto.setNumGasto(gastoDetails.getNumGasto());
            gasto.setFechaEmision(gastoDetails.getFechaEmision());
            gasto.setTotal_bruto(gastoDetails.getTotal_bruto());
            gasto.setTotal_iva(gastoDetails.getTotal_iva());
            gasto.setTotal_neto(gastoDetails.getTotal_neto());
            gasto.setProveedor(gastoDetails.getProveedor());
            gasto.setTipo_iva(gastoDetails.getTipo_iva());

            // Actualizar Cliente
            if (gastoDetails.getCliente_id() != null) {
                Cliente cliente = clienteRepository.findByIdAndUsuarios_Id(gastoDetails.getCliente_id(), userId)
                        .orElse(null);
                gasto.setCliente(cliente);
            } else {
                gasto.setCliente(null);
            }

            // Actualizar Proyecto
            if (gastoDetails.getProyecto_id() != null) {
                Proyecto proyecto = proyectoRepository.findByIdAndUsuarioId(gastoDetails.getProyecto_id(), userId)
                        .orElse(null);
                gasto.setProyecto(proyecto);
            } else {
                gasto.setProyecto(null);
            }

            return toDto(gastosRepository.save(gasto));
        });
    }

    @Transactional
    public boolean deleteGasto(Long id, Long userId) {
        // SEGURIDAD: Verificar propiedad antes de borrar
        if (gastosRepository.existsByIdAndUsuarioId(id, userId)) {
            gastosRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // --- MAPPERS ---

    private Gasto toEntity(GastoDto dto, Long userId) {
        if (dto == null) return null;
        Gasto entity = new Gasto();
        // ID no se setea en creación
        entity.setNumGasto(dto.getNumGasto());
        entity.setFechaEmision(dto.getFechaEmision());
        entity.setTotal_bruto(dto.getTotal_bruto());
        entity.setTotal_iva(dto.getTotal_iva());
        entity.setTotal_neto(dto.getTotal_neto());
        entity.setProveedor(dto.getProveedor());
        entity.setTipo_iva(dto.getTipo_iva());
        
        // Vinculación segura de relaciones
        if (dto.getCliente_id() != null) {
            Cliente cliente = clienteRepository.findByIdAndUsuarios_Id(dto.getCliente_id(), userId)
                    .orElse(null);
            entity.setCliente(cliente);
        }
        if (dto.getProyecto_id() != null) {
            Proyecto proyecto = proyectoRepository.findByIdAndUsuarioId(dto.getProyecto_id(), userId)
                    .orElse(null);
            entity.setProyecto(proyecto);
        }
        return entity;
    }

    private GastoDto toDto(Gasto entity) {
        if (entity == null) return null;
        GastoDto dto = new GastoDto();
        dto.setId(entity.getId()); // <--- IMPORTANTE: Faltaba esto
        dto.setNumGasto(entity.getNumGasto());
        dto.setFechaEmision(entity.getFechaEmision());
        dto.setTotal_bruto(entity.getTotal_bruto());
        dto.setTotal_iva(entity.getTotal_iva());
        dto.setTotal_neto(entity.getTotal_neto());
        dto.setProveedor(entity.getProveedor());
        dto.setTipo_iva(entity.getTipo_iva());
        
        if (entity.getCliente() != null) {
            dto.setCliente_id(entity.getCliente().getId());
        }

        if (entity.getProyecto() != null) {
            dto.setProyecto_id(entity.getProyecto().getId());
        }
        return dto;
    }
}