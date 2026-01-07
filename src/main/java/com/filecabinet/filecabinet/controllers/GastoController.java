package com.filecabinet.filecabinet.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid; // <--- Importante

import com.filecabinet.filecabinet.config.CustomUserDetails;
import com.filecabinet.filecabinet.dto.GastoDto;
import com.filecabinet.filecabinet.service.GastoService;

import java.util.List;

@RestController
@RequestMapping("/api/gastos")
public class GastoController {

    private final GastoService gastosService;

    public GastoController(GastoService gastosService) {
        this.gastosService = gastosService;
    }

    @GetMapping
    public List<GastoDto> getAllGastos(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return gastosService.getAllGastos(userDetails.getUserId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GastoDto> getGastoById(
            @PathVariable Long id, 
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        return gastosService.getGastoById(id, userDetails.getUserId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<GastoDto> createGasto(
            @Valid @RequestBody GastoDto gastoDto, // <--- Validar datos
            @AuthenticationPrincipal CustomUserDetails userDetails) {
            
        Long userId = userDetails.getUserId();
        GastoDto newGasto = gastosService.createGasto(gastoDto, userId);
        return ResponseEntity.ok(newGasto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GastoDto> updateGasto(
            @PathVariable Long id, 
            @Valid @RequestBody GastoDto gastoDetails, // <--- Validar datos
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        return gastosService.updateGasto(id, userDetails.getUserId(), gastoDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGasto(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (gastosService.deleteGasto(id, userDetails.getUserId())) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}