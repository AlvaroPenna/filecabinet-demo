package com.filecabinet.filecabinet.controllers;

import java.util.List;

import jakarta.validation.Valid; // <--- Importante

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.filecabinet.filecabinet.config.CustomUserDetails;
import com.filecabinet.filecabinet.dto.ProyectoDto;
import com.filecabinet.filecabinet.service.ProyectoService;

@RestController
@RequestMapping("/api/proyectos")
public class ProyectoController {

    private final ProyectoService proyectoService;

    public ProyectoController(ProyectoService proyectoService) {
        this.proyectoService = proyectoService;
    }

    @GetMapping
    public ResponseEntity<List<ProyectoDto>> getAllProyectos(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUserId();
        List<ProyectoDto> proyectos = proyectoService.getAllProyectos(userId);
        return ResponseEntity.ok(proyectos);
    }

    // CORRECCIÓN: Usar /{id} para que sea variable, no texto fijo
    @GetMapping("/{id}")
    public ResponseEntity<ProyectoDto> getProyectoById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) { // Cambiado a 'id' para coincidir con la URL
        
        Long userId = userDetails.getUserId();
        return proyectoService.getProyectoById(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ProyectoDto> createProyecto(
            @Valid @RequestBody ProyectoDto proyectoDto, // Agregado @Valid
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Long userId = userDetails.getUserId();
        ProyectoDto createdDto = proyectoService.createProyecto(proyectoDto, userId);
        return ResponseEntity.ok(createdDto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProyectoDto> updateProyecto(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id, // Cambiado nombre para coincidir con /{id}
            @Valid @RequestBody ProyectoDto proyectoDetails) { // Agregado @Valid
        
        Long userId = userDetails.getUserId();
        return proyectoService.updateProyecto(id, userId, proyectoDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProyecto(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) { // Simplificado a 'id'
        
        Long userId = userDetails.getUserId();
        if (proyectoService.deleteProyecto(id, userId)) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}