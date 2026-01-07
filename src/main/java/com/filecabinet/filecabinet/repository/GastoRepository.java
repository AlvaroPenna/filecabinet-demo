package com.filecabinet.filecabinet.repository;

import com.filecabinet.filecabinet.entidades.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GastoRepository extends JpaRepository<Gasto, Long> {
    
    // Buscar todos los gastos de un usuario
    List<Gasto> findByUsuarioId(Long usuarioId);

    // Buscar uno específico asegurando propiedad
    Optional<Gasto> findByIdAndUsuarioId(Long id, Long usuarioId);

    // Verificar para borrar
    boolean existsByIdAndUsuarioId(Long id, Long usuarioId);

    // Evitar duplicados de número de gasto/factura
    boolean existsByNumGastoAndUsuarioId(String numGasto, Long usuarioId);
}