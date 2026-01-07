package com.filecabinet.filecabinet.controllers;

import com.filecabinet.filecabinet.config.CustomUserDetails;
import com.filecabinet.filecabinet.dto.FacturaDto;
import com.filecabinet.filecabinet.service.FacturaService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/facturas")
public class FacturaController {

    private final FacturaService facturaService;

    public FacturaController(FacturaService facturaService) {
        this.facturaService = facturaService;
    }

    // SEGURIDAD: Solo devuelve las facturas del usuario logueado
    @GetMapping
    public List<FacturaDto> getAllFacturas(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return facturaService.getAllFacturasByUserId(userDetails.getUserId());
    }

    // SEGURIDAD: Verifica que el ID pertenezca al usuario antes de devolverlo
    @GetMapping("/{id}")
    public ResponseEntity<FacturaDto> getFacturaById(
            @PathVariable Long id, 
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        return facturaService.getFacturaByIdAndUserId(id, userDetails.getUserId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    // SEGURIDAD: Agregado @Valid para validar datos entrantes
    public ResponseEntity<FacturaDto> createFactura(
            @Valid @RequestBody FacturaDto facturaDto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        Long userId = userDetails.getUserId();
        FacturaDto newFactura = facturaService.createFactura(facturaDto, userId);
        return new ResponseEntity<>(newFactura, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    // SEGURIDAD: Validamos datos y pasamos userId para asegurar propiedad
    public ResponseEntity<FacturaDto> updateFactura(
            @PathVariable Long id, 
            @Valid @RequestBody FacturaDto facturaDto, 
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        return facturaService.updateFactura(id, facturaDto, userDetails.getUserId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    // SEGURIDAD: Solo borra si el usuario es dueño
    public ResponseEntity<Void> deleteFactura(
            @PathVariable Long id, 
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (facturaService.deleteFactura(id, userDetails.getUserId())) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/exportar-excel/{id}")
    public void exportarFacturaExcel(
            @PathVariable Long id, 
            HttpServletResponse response,
            @AuthenticationPrincipal CustomUserDetails userDetails) throws IOException {
        // Este ya lo tenías seguro en el ejemplo anterior porque pasabas userDetails
        facturaService.generarExcel(id, response, userDetails);
    }
}