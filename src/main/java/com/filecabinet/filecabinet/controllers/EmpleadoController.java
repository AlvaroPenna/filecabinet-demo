package com.filecabinet.filecabinet.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.filecabinet.filecabinet.config.CustomUserDetails;
import com.filecabinet.filecabinet.dto.EmpleadoDto;
import com.filecabinet.filecabinet.service.EmpleadoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/trabajadores")
public class EmpleadoController {

    private final EmpleadoService empleadoService;

    public EmpleadoController(EmpleadoService trabajadorService) {
        this.empleadoService = trabajadorService;
    }

    @GetMapping
    public List<EmpleadoDto> getAllTrabajadores(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUserId();
        return empleadoService.getAllTrabajadores(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmpleadoDto> getTrabajadorById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUserId();
        return empleadoService.getTrabajadorById(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EmpleadoDto> createTrabajador(
            @Valid @RequestBody EmpleadoDto trabajadorDto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUserId();
        EmpleadoDto newTrabajador = empleadoService.createTrabajador(trabajadorDto, userId);
        return ResponseEntity.ok(newTrabajador);
    }
    @PutMapping("/{id}")
    public ResponseEntity<EmpleadoDto> updateTrabajador(
            @PathVariable Long id,
            @Valid @RequestBody EmpleadoDto trabajadorDto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUserId();
        return empleadoService.updateTrabajador(id, userId, trabajadorDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrabajador(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long userId = userDetails.getUserId();
        if (empleadoService.deleteTrabajador(id, userId)) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}