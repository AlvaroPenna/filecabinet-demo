package com.filecabinet.filecabinet.controllers;

import java.util.List;
import jakarta.validation.Valid; // Importante

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.filecabinet.filecabinet.config.CustomUserDetails;
import com.filecabinet.filecabinet.dto.ProyectoEmpleadoDto;
import com.filecabinet.filecabinet.service.ProyectoEmpleadoService;

@RestController
@RequestMapping("/api/proyectos-trabajadores")
public class ProyectoEmpleadoController {

    private final ProyectoEmpleadoService proyectoEmpleadoService;

    public ProyectoEmpleadoController(ProyectoEmpleadoService proyectoEmpleadoService) {
        this.proyectoEmpleadoService = proyectoEmpleadoService;
    }

    // LEER TODOS (Filtrado por usuario logueado)
    @GetMapping
    public ResponseEntity<List<ProyectoEmpleadoDto>> getAllProyectoTrabajadores(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Long userId = userDetails.getUserId();
        List<ProyectoEmpleadoDto> dtos = proyectoEmpleadoService.getAllProyectoTrabajador(userId);
        return ResponseEntity.ok(dtos);
    }

    // LEER UNO (Por ID de la asignación)
    @GetMapping("/{id}")
    public ResponseEntity<ProyectoEmpleadoDto> getProyectoTrabajadorById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        return proyectoEmpleadoService.getProyectoEmpleadoById(id, userDetails.getUserId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // CREAR
    @PostMapping
    public ResponseEntity<ProyectoEmpleadoDto> createProyectoTrabajador(
            @Valid @RequestBody ProyectoEmpleadoDto dto, // Agregado @Valid
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUserId();  
        ProyectoEmpleadoDto createdDto = proyectoEmpleadoService.createProyectoEmpleado(dto, userId);
        return new ResponseEntity<>(createdDto, HttpStatus.CREATED);
    }

    // ACTUALIZAR (Ej: Cambiar horas asignadas o rol)
    @PutMapping("/{id}")
    public ResponseEntity<ProyectoEmpleadoDto> updateProyectoTrabajador(
            @PathVariable Long id,
            @Valid @RequestBody ProyectoEmpleadoDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        return proyectoEmpleadoService.updateProyectoTrabajador(id, userDetails.getUserId(), dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ELIMINAR (Desasignar empleado del proyecto)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProyectoTrabajador(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (proyectoEmpleadoService.deleteProyectoEmpleado(id, userDetails.getUserId())) {
            return ResponseEntity.noContent().build(); 
        } else {
            return ResponseEntity.notFound().build(); 
        }
    }
}