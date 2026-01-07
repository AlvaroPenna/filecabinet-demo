package com.filecabinet.filecabinet.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.filecabinet.filecabinet.dto.ProyectoDto;
import com.filecabinet.filecabinet.entidades.Cliente;
import com.filecabinet.filecabinet.entidades.Proyecto;
import com.filecabinet.filecabinet.entidades.Usuario;
import com.filecabinet.filecabinet.repository.ClienteRepository;
import com.filecabinet.filecabinet.repository.ProyectoRepository;
import com.filecabinet.filecabinet.repository.UsuarioRepository;

@Service
public class ProyectoService {

    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;

    public ProyectoService(ProyectoRepository proyectoRepository, UsuarioRepository usuarioRepository, ClienteRepository clienteRepository){
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public List<ProyectoDto> getAllProyectos(Long userId){
        return proyectoRepository.findByUsuarioId(userId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ProyectoDto> getProyectoById(Long proyectoId, Long userId){
        return proyectoRepository.findByIdAndUsuarioId(proyectoId, userId).map(this::toDto);
    }

    @Transactional
    public ProyectoDto createProyecto(ProyectoDto proyectoDto, Long userId){
        String nombreProyecto = proyectoDto.getNombre();
        
        // Validación de duplicados
        if(proyectoRepository.existsByNombreAndUsuarioId(nombreProyecto, userId)){
            throw new IllegalStateException("El proyecto con nombre " + nombreProyecto + " ya ha sido registrado.");
        }
        
        // Conversión a entidad
        Proyecto proyecto = toEntity(proyectoDto, userId);
        
        // Asignación de Usuario (Obligatorio)
        if(userId != null){
            Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            proyecto.setUsuario(usuario);
        }

        Proyecto savedProyecto = proyectoRepository.save(proyecto);
        return toDto(savedProyecto);
    }

    @Transactional
    public Optional<ProyectoDto> updateProyecto(Long proyectoId, Long userId, ProyectoDto proyectoDetails){
        return proyectoRepository.findByIdAndUsuarioId(proyectoId, userId).map(proyecto -> {
            
            // 1. Actualizar campos escalares
            proyecto.setNombre(proyectoDetails.getNombre());
            proyecto.setDireccion(proyectoDetails.getDireccion());
            proyecto.setCiudad(proyectoDetails.getCiudad());
            proyecto.setCodigoPostal(proyectoDetails.getCodigoPostal());
            proyecto.setFechaInicio(proyectoDetails.getFechaInicio());
            proyecto.setFechaFin(proyectoDetails.getFechaFin());

            // 2. CORRECCIÓN IMPORTANTE: Actualizar el Cliente
            if (proyectoDetails.getCliente_id() != null) {
                // Buscamos el cliente asegurando que pertenezca al usuario (SEGURIDAD)
                Cliente cliente = clienteRepository.findByIdAndUsuarios_Id(proyectoDetails.getCliente_id(), userId)
                        .orElse(null); // O lanzar excepción si el cliente no existe/no es suyo
                proyecto.setCliente(cliente);
            } else {
                // Si viene null, desvinculamos el cliente
                proyecto.setCliente(null);
            }

            return toDto(proyectoRepository.save(proyecto));
        });
    }

    @Transactional
    public boolean deleteProyecto(Long proyectoId, Long userId){
        // Manera más eficiente: exists + deleteById
        if (proyectoRepository.existsByIdAndUsuarioId(proyectoId, userId)) {
            proyectoRepository.deleteById(proyectoId);
            return true;
        }
        return false;
    }

    // --- MAPPERS ---

    private Proyecto toEntity(ProyectoDto dto, Long userId){
        if(dto == null){
            return null;
        }
        Proyecto entity = new Proyecto();
        // ID no se setea en creación
        entity.setNombre(dto.getNombre());
        entity.setDireccion(dto.getDireccion());
        entity.setCiudad(dto.getCiudad());
        entity.setCodigoPostal(dto.getCodigoPostal());
        entity.setFechaInicio(dto.getFechaInicio());
        entity.setFechaFin(dto.getFechaFin());
        
        // Mapeo de Cliente (Seguro)
        if(dto.getCliente_id() != null){
            // Usamos el repositorio para buscar el cliente de forma segura (pertenece al usuario)
            Cliente cliente = clienteRepository.findByIdAndUsuarios_Id(dto.getCliente_id(), userId)
                                            .orElse(null);
            entity.setCliente(cliente);
        }
        return entity;
    }

    private ProyectoDto toDto(Proyecto entity){
        if(entity == null){
            return null;
        }
        ProyectoDto dto = new ProyectoDto();
        dto.setId(entity.getId());
        dto.setNombre(entity.getNombre());
        dto.setDireccion(entity.getDireccion());
        dto.setCiudad(entity.getCiudad());
        dto.setCodigoPostal(entity.getCodigoPostal());
        dto.setFechaInicio(entity.getFechaInicio());
        dto.setFechaFin(entity.getFechaFin());
        
        // CORRECCIÓN IMPORTANTE: Devolver el ID del cliente al frontend
        if (entity.getCliente() != null) {
            dto.setCliente_id(entity.getCliente().getId());
            // Opcional: dto.setNombreCliente(entity.getCliente().getNombre());
        }
        
        return dto;
    }
}