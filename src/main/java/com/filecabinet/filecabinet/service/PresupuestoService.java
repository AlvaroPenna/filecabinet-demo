package com.filecabinet.filecabinet.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.filecabinet.filecabinet.config.CustomUserDetails;
import com.filecabinet.filecabinet.dto.DetalleDocumentoDto;
import com.filecabinet.filecabinet.dto.PresupuestoDto;
import com.filecabinet.filecabinet.entidades.Cliente;
import com.filecabinet.filecabinet.entidades.DetalleDocumento;
import com.filecabinet.filecabinet.entidades.Presupuesto;
import com.filecabinet.filecabinet.entidades.Proyecto;
import com.filecabinet.filecabinet.entidades.Usuario;
import com.filecabinet.filecabinet.repository.ClienteRepository;
import com.filecabinet.filecabinet.repository.PresupuestoRepository;
import com.filecabinet.filecabinet.repository.ProyectoRepository;
import com.filecabinet.filecabinet.repository.UsuarioRepository;
import com.filecabinet.filecabinet.util.PresupuestoExcelExporter;

import jakarta.servlet.http.HttpServletResponse;

@Service
public class PresupuestoService {

    private final PresupuestoRepository presupuestoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final ProyectoRepository proyectoRepository;

    public PresupuestoService(PresupuestoRepository presupuestoRepository, UsuarioRepository usuarioRepository, 
        ClienteRepository clienteRepository, ProyectoRepository proyectoRepository){
        this.presupuestoRepository = presupuestoRepository;
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.proyectoRepository = proyectoRepository;
    }

    // SEGURIDAD: Cambiado findAll() por findByUsuarioId()
    @Transactional(readOnly = true)
    public List<PresupuestoDto> getAllPresupuestosByUserId(Long userId){
        return presupuestoRepository.findByUsuarioId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // SEGURIDAD: Cambiado findById() por findByIdAndUsuarioId()
    @Transactional(readOnly = true)
    public Optional<PresupuestoDto> getPresupuestoByIdAndUserId(Long id, Long userId){
        return presupuestoRepository.findByIdAndUsuarioId(id, userId).map(this::toDto);
    }

    @Transactional
    public PresupuestoDto createPresupuesto(PresupuestoDto presupuestoDto, Long userId){
        String numPresupuesto = presupuestoDto.getNumPresupuesto();
        // Esta validación ya era correcta
        if(presupuestoRepository.existsByNumPresupuestoAndUsuarioId(numPresupuesto, userId)){
            throw new IllegalStateException("El presupuesto con número " + numPresupuesto + " ya ha sido registrado.");
        }
        Presupuesto presupuesto = toEntity(presupuestoDto);

        if (userId != null) {
            Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + userId));
            presupuesto.setUsuario(usuario);
        }

        List<DetalleDocumento> detallesEntidades = mapDetallesToEntity(presupuestoDto.getDetalles(), presupuesto);
        presupuesto.setDetalles(detallesEntidades);

        Presupuesto savedPresupuesto = presupuestoRepository.save(presupuesto);
        return toDto(savedPresupuesto);
    }

    @Transactional
    public Optional<PresupuestoDto> updatePresupuesto(Long id, PresupuestoDto presupuestoDetails, Long userId){
        return presupuestoRepository.findByIdAndUsuarioId(id, userId).map(presupuesto -> {
            
            presupuesto.setNumPresupuesto(presupuestoDetails.getNumPresupuesto());
            presupuesto.setEstadoAceptacion(presupuestoDetails.getEstadoAceptacion());
            presupuesto.setFechaAceptacion(presupuestoDetails.getFechaAceptacion());
            presupuesto.setFechaEmision(presupuestoDetails.getFechaEmision());
            presupuesto.setTotal_bruto(presupuestoDetails.getTotal_bruto());
            presupuesto.setTotal_iva(presupuestoDetails.getTotal_iva());
            presupuesto.setTotal_neto(presupuestoDetails.getTotal_neto());
            presupuesto.setTipo_iva(presupuestoDetails.getTipo_iva());

            if(presupuestoDetails.getCliente_id() != null) {
                 presupuesto.setCliente(clienteRepository.findById(presupuestoDetails.getCliente_id()).orElse(null));
            }
            if(presupuestoDetails.getProyecto_id() != null) {
                 presupuesto.setProyecto(proyectoRepository.findById(presupuestoDetails.getProyecto_id()).orElse(null));
            }

            if(presupuestoDetails.getDetalles() != null){
                presupuesto.getDetalles().clear();
                List<DetalleDocumento> nuevosDetalles = mapDetallesToEntity(presupuestoDetails.getDetalles(), presupuesto);
                presupuesto.getDetalles().addAll(nuevosDetalles);
            }

            return toDto(presupuestoRepository.save(presupuesto));
        });
    }

    // SEGURIDAD: Comprobamos ownership antes de borrar
    @Transactional
    public boolean deletePresupuesto(Long id, Long userId){
        if(presupuestoRepository.existsByIdAndUsuarioId(id, userId)){
            presupuestoRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // Métodos auxiliares de mapeo (Sin cambios grandes, solo lógica estándar)
    public Presupuesto toEntity(PresupuestoDto dto){
        Presupuesto entity = new Presupuesto();
        entity.setNumPresupuesto(dto.getNumPresupuesto());
        entity.setEstadoAceptacion(dto.getEstadoAceptacion());
        entity.setFechaAceptacion(dto.getFechaAceptacion());
        entity.setFechaEmision(dto.getFechaEmision());
        entity.setTotal_bruto(dto.getTotal_bruto());
        entity.setTotal_iva(dto.getTotal_iva());
        entity.setTotal_neto(dto.getTotal_neto());
        entity.setTipo_iva(dto.getTipo_iva());
        
        // OJO: Aquí idealmente también deberíamos buscar clientes por usuarioId
        // para evitar que un usuario asigne un cliente de otro usuario.
        if(dto.getCliente_id() != null){
            Cliente cliente = clienteRepository.findById(dto.getCliente_id()).orElse(null);
            entity.setCliente(cliente); 
        }
        if (dto.getProyecto_id() != null) {
            Proyecto proyecto = proyectoRepository.findById(dto.getProyecto_id()).orElse(null);
            entity.setProyecto(proyecto);
        }
        return entity;
    }

    public PresupuestoDto toDto(Presupuesto entity){
        PresupuestoDto dto = new PresupuestoDto();
        dto.setId(entity.getId()); // ¡Importante setear el ID del presupuesto!
        dto.setNumPresupuesto(entity.getNumPresupuesto());
        dto.setEstadoAceptacion(entity.getEstadoAceptacion());
        dto.setFechaAceptacion(entity.getFechaAceptacion());
        dto.setFechaEmision(entity.getFechaEmision());
        dto.setTotal_bruto(entity.getTotal_bruto());
        dto.setTotal_iva(entity.getTotal_iva());
        dto.setTotal_neto(entity.getTotal_neto());
        dto.setTipo_iva(entity.getTipo_iva());

        if (entity.getCliente() != null) {
            dto.setCliente_id(entity.getCliente().getId());
        }
        if (entity.getProyecto() != null) {
            dto.setProyecto_id(entity.getProyecto().getId());
        }
        if (entity.getDetalles() != null) {
            List<DetalleDocumentoDto> detallesDto = entity.getDetalles().stream()
                .map(this::toDetalleDto)
                .collect(Collectors.toList());
            dto.setDetalles(detallesDto);
        }
        return dto;
    }

    private DetalleDocumento toDetalleEntity(DetalleDocumentoDto dto) {
        DetalleDocumento entity = new DetalleDocumento();
        if (dto.getId() != null) {
            entity.setId(dto.getId()); 
        }
        entity.setTrabajo(dto.getTrabajo());
        entity.setDescripcion(dto.getDescripcion());
        entity.setCantidad(dto.getCantidad());
        entity.setPrecioUnitario(dto.getPrecioUnitario());
        entity.setSubTotal(dto.getSubTotal());
        return entity;
    }

    private DetalleDocumentoDto toDetalleDto(DetalleDocumento entity) {
        DetalleDocumentoDto dto = new DetalleDocumentoDto();
        dto.setId(entity.getId());
        dto.setTrabajo(entity.getTrabajo());
        dto.setDescripcion(entity.getDescripcion());
        dto.setCantidad(entity.getCantidad());
        dto.setPrecioUnitario(entity.getPrecioUnitario());
        dto.setSubTotal(entity.getSubTotal());
        return dto;
    }

    private List<DetalleDocumento> mapDetallesToEntity(List<DetalleDocumentoDto> dtos, Presupuesto presupuesto) {
            if (dtos == null) {
                return new ArrayList<>(); 
            }
        return dtos.stream()
                .map(dto -> {
                    DetalleDocumento entity = toDetalleEntity(dto);
                    entity.setDocumentoComercial(presupuesto); 
                    return entity;
                })
                .collect(Collectors.toList()); 
    }

    @Transactional(readOnly = true)
    public void generarExcel(Long id, HttpServletResponse response, CustomUserDetails userDetails) throws IOException {
        // SEGURIDAD: Usamos el método seguro directamente
        Presupuesto presupuesto = presupuestoRepository.findByIdAndUsuarioId(id, userDetails.getUserId())
                .orElseThrow(() -> new AccessDeniedException("Presupuesto no encontrado o no tienes permiso"));

        // Nota: Si quieres permitir que los ADMIN descarguen cualquier presupuesto, 
        // deberías mantener tu lógica anterior de "findById" genérico + check de roles.
        // Pero para uso normal de usuarios, findByIdAndUsuarioId es lo mejor.

        response.setContentType("application/octet-stream");
        String headerKey = "Content-Disposition";
        String headerValue = "attachment; filename=Presupuesto_" + presupuesto.getNumPresupuesto() + ".xlsx";
        response.setHeader(headerKey, headerValue);
        
        PresupuestoExcelExporter exporter = new PresupuestoExcelExporter(presupuesto);
        exporter.export(response);
    }
}