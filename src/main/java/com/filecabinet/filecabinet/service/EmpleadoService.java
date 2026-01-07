package com.filecabinet.filecabinet.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.filecabinet.filecabinet.dto.EmpleadoDto;
import com.filecabinet.filecabinet.entidades.Empleado;
import com.filecabinet.filecabinet.entidades.Usuario;
import com.filecabinet.filecabinet.repository.EmpleadoRepository;
import com.filecabinet.filecabinet.repository.UsuarioRepository;

@Service
public class EmpleadoService {

    private final EmpleadoRepository empleadoRepository;
    private final UsuarioRepository usuarioRepository;

    public EmpleadoService(EmpleadoRepository trabajadorRepository, UsuarioRepository usuarioRepository){
        this.empleadoRepository = trabajadorRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // CORRECCIÓN: Typo "getAllTrabajores" -> "getAllTrabajadores"
    @Transactional(readOnly = true)
    public List<EmpleadoDto> getAllTrabajadores(Long userId){
        return empleadoRepository.findByUsuarioId(userId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<EmpleadoDto> getTrabajadorById(Long trabajadorId, Long userId){
        return empleadoRepository.findByIdAndUsuarioId(trabajadorId, userId).map(this::toDto);
    }

    @Transactional
    public EmpleadoDto createTrabajador(EmpleadoDto trabajadorDto, Long userId){
        String empleadoNif = trabajadorDto.getNif();
        
        if(empleadoRepository.existsByNifAndUsuarioId(empleadoNif, userId)){
            throw new IllegalStateException("El empleado con nif " + empleadoNif +" ya ha sido registrado");
        }
        
        Empleado trabajador = toEntity(trabajadorDto);
        
        // CORRECCIÓN: Es mejor lanzar excepción si el usuario no existe que dejarlo null
        if(userId != null){
            Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            trabajador.setUsuario(usuario);
        }
        
        Empleado savedTrabajador = empleadoRepository.save(trabajador);
        return toDto(savedTrabajador);
    }

    @Transactional
    public Optional<EmpleadoDto> updateTrabajador(Long trabajadorId, Long userId, EmpleadoDto trabajadorDetails){
        return empleadoRepository.findByIdAndUsuarioId(trabajadorId, userId).map(trabajador -> {
            
            // CORRECCIÓN CRÍTICA: Eliminada la línea trabajador.setId(...)
            // Nunca debemos cambiar el ID de una entidad existente.
            
            trabajador.setNombre(trabajadorDetails.getNombre());
            trabajador.setApellidos(trabajadorDetails.getApellidos());
            trabajador.setNif(trabajadorDetails.getNif());
            trabajador.setTelefono(trabajadorDetails.getTelefono());
            trabajador.setEmail(trabajadorDetails.getEmail());
            trabajador.setDireccion(trabajadorDetails.getDireccion());
            trabajador.setCiudad(trabajadorDetails.getCiudad());
            trabajador.setCodigoPostal(trabajadorDetails.getCodigoPostal());
            
            return toDto(empleadoRepository.save(trabajador));
        });
    }

    @Transactional
    public boolean deleteTrabajador(Long trabajadorId, Long userId){
        // Simplificación: existsByIdAndUsuarioId es más eficiente si solo vas a borrar
        if (empleadoRepository.existsByIdAndUsuarioId(trabajadorId, userId)) {
            empleadoRepository.deleteById(trabajadorId);
            return true;
        }
        return false;
    }

    // --- MAPPERS ---

    private Empleado toEntity(EmpleadoDto dto){
        if(dto == null){
            return null;
        }
        Empleado entity = new Empleado();
        // NOTA: Al crear, es mejor NO setear el ID y dejar que la DB lo genere.
        // Si viene un ID en el DTO para creación, se ignora o se maneja aparte.
        entity.setNombre(dto.getNombre());
        entity.setApellidos(dto.getApellidos());
        entity.setNif(dto.getNif());
        entity.setTelefono(dto.getTelefono());
        entity.setEmail(dto.getEmail());
        entity.setDireccion(dto.getDireccion());
        entity.setCiudad(dto.getCiudad());
        entity.setCodigoPostal(dto.getCodigoPostal());
        return entity;
    }

    private EmpleadoDto toDto(Empleado entity){
        if(entity == null){
            return null;
        }
        EmpleadoDto dto = new EmpleadoDto();
        dto.setId(entity.getId());
        dto.setNombre(entity.getNombre());
        dto.setApellidos(entity.getApellidos());
        dto.setNif(entity.getNif());
        dto.setTelefono(entity.getTelefono());
        dto.setEmail(entity.getEmail());
        dto.setDireccion(entity.getDireccion());
        dto.setCiudad(entity.getCiudad());
        dto.setCodigoPostal(entity.getCodigoPostal());
        return dto;
    }
}