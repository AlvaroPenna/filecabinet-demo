package com.filecabinet.filecabinet.service;

import com.filecabinet.filecabinet.dto.ClienteDto;
import com.filecabinet.filecabinet.entidades.Cliente;
import com.filecabinet.filecabinet.entidades.Usuario;
import com.filecabinet.filecabinet.repository.ClienteRepository;
import com.filecabinet.filecabinet.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;

    public ClienteService(ClienteRepository clienteRepository, UsuarioRepository usuarioRepository) {
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public ClienteDto createCliente(ClienteDto clienteDto, Long userId) {
        // 1. Recuperar Usuario
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        // 2. Buscar si el cliente YA existe (por CIF o Email)
        Cliente clienteParaVincular = clienteRepository.findByCif(clienteDto.getCif())
                .orElse(clienteRepository.findByEmail(clienteDto.getEmail())
                .orElse(null));

        // 3. Si no existe, lo creamos
        if (clienteParaVincular == null) {
            clienteParaVincular = new Cliente(); // Usamos constructor vacío o builder
            // Mapeamos manualmente SIN setear ID para asegurar que es nuevo
            mapDtoToEntity(clienteDto, clienteParaVincular);
            clienteParaVincular = clienteRepository.save(clienteParaVincular);
        }

        // 4. Crear la relación (vincular)
        // Verificamos si ya contiene el cliente para no duplicar en la lista (aunque Set lo evitaría, List no)
        if (!usuario.getClientes().contains(clienteParaVincular)) {
            usuario.getClientes().add(clienteParaVincular);
            usuarioRepository.save(usuario);
        } else {
             // Opcional: Avisar si ya estaba vinculado, o simplemente devolver el existente silenciosamente.
             // throw new ResponseStatusException(HttpStatus.CONFLICT, "Cliente ya asociado");
        }

        return toDto(clienteParaVincular);
    }

    @Transactional(readOnly = true)
    public List<ClienteDto> getClientesByUsuarioId(Long userId) {
        return clienteRepository.findByUsuarios_Id(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ClienteDto> getClienteByIdAndUsuario(Long clienteId, Long userId) {
        return clienteRepository.findByIdAndUsuarios_Id(clienteId, userId)
                .map(this::toDto);
    }

    @Transactional
    public Optional<ClienteDto> updateCliente(Long id, ClienteDto clienteDto, Long userId) {
        // Buscamos asegurando la relación
        return clienteRepository.findByIdAndUsuarios_Id(id, userId).map(clienteExistente -> {
            // Actualizamos campos usando el helper
            mapDtoToEntity(clienteDto, clienteExistente);
            // IMPORTANTE: No tocamos el ID ni el CIF si no es necesario
            Cliente guardado = clienteRepository.save(clienteExistente);
            return toDto(guardado);
        });
    }

    @Transactional
    public boolean deleteCliente(Long id, Long userId) {
        Usuario usuario = usuarioRepository.findById(userId).orElse(null);
        if (usuario == null) return false;

        // Buscamos el cliente DIRECTAMENTE desde la lista del usuario o BD
        // Es más eficiente buscarlo y verificar relación de una vez
        Cliente cliente = clienteRepository.findByIdAndUsuarios_Id(id, userId).orElse(null);
        
        if (cliente == null) return false; // El usuario no tiene este cliente o no existe

        // Desvincular
        boolean eliminado = usuario.getClientes().remove(cliente);
        if (eliminado) {
            usuarioRepository.save(usuario);
            return true;
        }
        return false;
    }

    // --- Mappers ---

    // Helper para pasar datos de DTO a Entidad (Reutilizable en Create y Update)
    private void mapDtoToEntity(ClienteDto source, Cliente target) {
        target.setNombre(source.getNombre());
        target.setApellidos(source.getApellidos());
        target.setCif(source.getCif());
        target.setEmail(source.getEmail());
        target.setTelefono(source.getTelefono());
        target.setDireccion(source.getDireccion());
        target.setCiudad(source.getCiudad());
        target.setCodigoPostal(source.getCodigoPostal());
        // NO seteamos ID aquí
    }

    private ClienteDto toDto(Cliente cliente) {
        if (cliente == null) return null;
        ClienteDto dto = new ClienteDto();
        dto.setId(cliente.getId());
        dto.setNombre(cliente.getNombre());
        dto.setApellidos(cliente.getApellidos());
        dto.setCif(cliente.getCif());
        dto.setDireccion(cliente.getDireccion());
        dto.setCiudad(cliente.getCiudad());
        dto.setCodigoPostal(cliente.getCodigoPostal());
        dto.setEmail(cliente.getEmail());
        dto.setTelefono(cliente.getTelefono());
        return dto;
    }
    
    // Método auxiliar obsoleto o interno, asegúrate si lo necesitas público
    @Transactional(readOnly = true)
    public Cliente clienteById(Long id) {
        return clienteRepository.findById(id).orElse(null);
    }
}