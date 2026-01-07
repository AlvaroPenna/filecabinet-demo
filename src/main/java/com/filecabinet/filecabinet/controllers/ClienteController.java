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
import com.filecabinet.filecabinet.dto.ClienteDto;
import com.filecabinet.filecabinet.service.ClienteService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {


    private final ClienteService clientesService;

    public ClienteController(ClienteService clientesService){
        this.clientesService = clientesService;
    }

    @GetMapping
    public List<ClienteDto> getAllClientes(@AuthenticationPrincipal CustomUserDetails userDetails){
        Long userId = userDetails.getUserId();
        return clientesService.getClientesByUsuarioId(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteDto> getClienteById(
        @PathVariable Long id, 
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    
        Long userId = userDetails.getUserId();
        return clientesService.getClienteByIdAndUsuario(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ClienteDto> createCliente(
        @Valid @RequestBody ClienteDto clienteDto,
        @AuthenticationPrincipal CustomUserDetails userDetails){
            Long userId = userDetails.getUserId();
            ClienteDto newCliente = clientesService.createCliente(clienteDto, userId);
            return ResponseEntity.ok(newCliente);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteDto> updateCliente(@PathVariable Long id, 
            @Valid @RequestBody ClienteDto clienteDto,
            @AuthenticationPrincipal CustomUserDetails userDetails){

        Long userId = userDetails.getUserId();
        return clientesService.updateCliente(id, clienteDto, userId) 
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCliente(@PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails){
                
        Long userId = userDetails.getUserId();
        if(clientesService.deleteCliente(id, userId)){ 
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}