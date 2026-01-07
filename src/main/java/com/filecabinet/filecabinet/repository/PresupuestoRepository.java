package com.filecabinet.filecabinet.repository;

import com.filecabinet.filecabinet.entidades.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
    
    // Buscar todos los presupuestos de un usuario específico
    List<Presupuesto> findByUsuarioId(Long usuarioId);

    // Buscar un presupuesto específico solo si pertenece al usuario
    Optional<Presupuesto> findByIdAndUsuarioId(Long id, Long usuarioId);

    // Comprobar si existe un presupuesto de un usuario
    boolean existsByIdAndUsuarioId(Long id, Long usuarioId);

    // (Este ya lo tenías, lo mantenemos)
    boolean existsByNumPresupuestoAndUsuarioId(String numPresupuesto, Long usuarioId);
}