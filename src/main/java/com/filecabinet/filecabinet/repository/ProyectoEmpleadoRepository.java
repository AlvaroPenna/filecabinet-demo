package com.filecabinet.filecabinet.repository;

import com.filecabinet.filecabinet.entidades.ProyectoEmpleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProyectoEmpleadoRepository extends JpaRepository<ProyectoEmpleado, Long> {

    // Buscar asignaciones de un usuario
    List<ProyectoEmpleado> findByUsuarioId(Long usuarioId);

    // Buscar una asignación específica de forma segura
    Optional<ProyectoEmpleado> findByIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByIdAndUsuarioId(Long id, Long usuarioId);
    
    // Verificar si el empleado YA está asignado a ese proyecto para evitar duplicados
    // Asumiendo que tienes los campos proyecto y empleado en la entidad
    boolean existsByProyectoIdAndEmpleadoIdAndUsuarioId(Long proyectoId, Long empleadoId, Long usuarioId);
}