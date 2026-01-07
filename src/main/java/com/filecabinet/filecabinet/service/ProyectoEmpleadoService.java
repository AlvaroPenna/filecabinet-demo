package com.filecabinet.filecabinet.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.filecabinet.filecabinet.dto.ProyectoEmpleadoDto;
import com.filecabinet.filecabinet.entidades.Empleado;
import com.filecabinet.filecabinet.entidades.Proyecto;
import com.filecabinet.filecabinet.entidades.ProyectoEmpleado;
import com.filecabinet.filecabinet.entidades.Usuario;
import com.filecabinet.filecabinet.repository.EmpleadoRepository;
import com.filecabinet.filecabinet.repository.ProyectoRepository;
// He renombrado esto para consistencia con la entidad. Asegúrate que tu repositorio se llame así.
import com.filecabinet.filecabinet.repository.ProyectoEmpleadoRepository; 
import com.filecabinet.filecabinet.repository.UsuarioRepository;

@Service
public class ProyectoEmpleadoService {

    private final ProyectoEmpleadoRepository proyectoEmpleadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProyectoRepository proyectoRepository;
    private final EmpleadoRepository empleadoRepository;

    public ProyectoEmpleadoService(ProyectoEmpleadoRepository proyectoEmpleadoRepository, UsuarioRepository usuarioRepository,
            ProyectoRepository proyectoRepository, EmpleadoRepository empleadoRepository){
        this.proyectoEmpleadoRepository = proyectoEmpleadoRepository;
        this.usuarioRepository = usuarioRepository;
        this.empleadoRepository = empleadoRepository;
        this.proyectoRepository = proyectoRepository;
    }

    @Transactional(readOnly = true)
    public List<ProyectoEmpleadoDto> getAllProyectoTrabajador(Long userId){
        return proyectoEmpleadoRepository.findByUsuarioId(userId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ProyectoEmpleadoDto> getProyectoEmpleadoById(Long proyectoTrabajadorId, Long userId){
        return proyectoEmpleadoRepository.findByIdAndUsuarioId(proyectoTrabajadorId, userId).map(this::toDto);
    }

    @Transactional
    public ProyectoEmpleadoDto createProyectoEmpleado(ProyectoEmpleadoDto dto, Long userId){
        // 1. Validar Usuario
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // 2. Convertir a entidad pasando userId para validar propiedad de Proyecto y Empleado
        ProyectoEmpleado entity = toEntity(dto, userId);
        entity.setUsuario(usuario);

        // 3. Guardar
        ProyectoEmpleado saved = proyectoEmpleadoRepository.save(entity);
        return toDto(saved);
    }

    @Transactional
    public Optional<ProyectoEmpleadoDto> updateProyectoTrabajador(Long id, Long userId, ProyectoEmpleadoDto dto){
        return proyectoEmpleadoRepository.findByIdAndUsuarioId(id, userId).map(entity -> {
            
            // CORRECCIÓN: No tocamos el ID.
            // CORRECCIÓN: Actualizamos todos los campos editables.
            
            entity.setDia(dto.getDia());
            entity.setHoras(dto.getHoras());
            entity.setTareaRealizada(dto.getTareaRealizada()); // Faltaba este campo

            // Nota: Normalmente no permitimos cambiar el Proyecto o el Empleado en un update.
            // Si quisieras permitirlo, tendrías que buscarlos de nuevo con seguridad (como en create).

            return toDto(proyectoEmpleadoRepository.save(entity));
        });
    }

    @Transactional
    public boolean deleteProyectoEmpleado(Long id, Long userId){
        if (proyectoEmpleadoRepository.existsByIdAndUsuarioId(id, userId)) {
            proyectoEmpleadoRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // --- MAPPERS ---

    private ProyectoEmpleado toEntity(ProyectoEmpleadoDto dto, Long userId){
        if(dto == null) return null;
        
        ProyectoEmpleado entity = new ProyectoEmpleado();
        
        // SEGURIDAD: Buscamos Empleado y Proyecto asegurando que sean del usuario (AndUsuarioId)
        // Si no son suyos, lanzamos excepción o dejamos null (aquí lanzo excepción para ser estricto).
        
        if(dto.getEmpleado_id() != null){
            Empleado empleado = empleadoRepository.findByIdAndUsuarioId(dto.getEmpleado_id(), userId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado o no te pertenece"));
            entity.setEmpleado(empleado);
        }
        
        if(dto.getProyecto_id() != null){
            Proyecto proyecto = proyectoRepository.findByIdAndUsuarioId(dto.getProyecto_id(), userId)
                .orElseThrow(() -> new RuntimeException("Proyecto no encontrado o no te pertenece"));
            entity.setProyecto(proyecto);
        }       
        
        entity.setDia(dto.getDia());
        entity.setHoras(dto.getHoras());
        entity.setTareaRealizada(dto.getTareaRealizada());
        
        return entity;
    }

    private ProyectoEmpleadoDto toDto(ProyectoEmpleado entity){
        if(entity == null) return null;
        
        ProyectoEmpleadoDto dto = new ProyectoEmpleadoDto();
        dto.setId(entity.getId());
        dto.setDia(entity.getDia());
        dto.setHoras(entity.getHoras());
        dto.setTareaRealizada(entity.getTareaRealizada());
        
        // CORRECCIÓN: Devolver los IDs relacionados para que el frontend sepa de quién hablamos
        if(entity.getEmpleado() != null) {
            dto.setEmpleado_id(entity.getEmpleado().getId());
            // dto.setNombreEmpleado(entity.getEmpleado().getNombre()); // Opcional si el DTO lo soporta
        }
        if(entity.getProyecto() != null) {
            dto.setProyecto_id(entity.getProyecto().getId());
        }
        
        return dto;
    }
}