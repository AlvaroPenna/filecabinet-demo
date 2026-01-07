package com.filecabinet.filecabinet.controllers;

import com.filecabinet.filecabinet.config.CustomUserDetails;
import com.filecabinet.filecabinet.dto.PresupuestoDto;
import com.filecabinet.filecabinet.service.PresupuestoService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/presupuestos")
public class PresupuestoController {

    private final PresupuestoService presupuestoService;

    public PresupuestoController(PresupuestoService presupuestoService) {
        this.presupuestoService = presupuestoService;
    }

    // MEJORA: Filtramos por el usuario logueado
    @GetMapping
    public List<PresupuestoDto> getAllPresupuestos(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return presupuestoService.getAllPresupuestosByUserId(userDetails.getUserId());
    }

    // MEJORA: Verificamos que el ID pertenezca al usuario logueado
    @GetMapping("/{id}")
    public ResponseEntity<PresupuestoDto> getPresupuestoById(
            @PathVariable Long id, 
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        return presupuestoService.getPresupuestoByIdAndUserId(id, userDetails.getUserId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    // CORRECCIÓN: Agregado @Valid
    public ResponseEntity<PresupuestoDto> createPresupuesto(
            @Valid @RequestBody PresupuestoDto presupuestoDto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
            
        long userId = userDetails.getUserId();
        PresupuestoDto newPresupuesto = presupuestoService.createPresupuesto(presupuestoDto, userId);
        return new ResponseEntity<>(newPresupuesto, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    // MEJORA: Pasamos userId para asegurar propiedad
    public ResponseEntity<PresupuestoDto> updatePresupuesto(
            @PathVariable Long id, 
            @Valid @RequestBody PresupuestoDto presupuestoDto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
            
        return presupuestoService.updatePresupuesto(id, presupuestoDto, userDetails.getUserId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    // MEJORA: Pasamos userId para asegurar propiedad
    public ResponseEntity<Void> deletePresupuesto(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
            
        if (presupuestoService.deletePresupuesto(id, userDetails.getUserId())) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/exportar-excel/{id}")
    // CORRECCIÓN: Nombre del método corregido
    public void exportarPresupuestoExcel(@PathVariable Long id, 
                                         HttpServletResponse response,
                                         @AuthenticationPrincipal CustomUserDetails userDetails) throws IOException {
        presupuestoService.generarExcel(id, response, userDetails);
    }
}