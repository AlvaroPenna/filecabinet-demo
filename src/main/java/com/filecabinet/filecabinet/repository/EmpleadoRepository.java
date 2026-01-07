package com.filecabinet.filecabinet.repository;

import com.filecabinet.filecabinet.entidades.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {

    // Buscar empleados de un usuario (Jefe)
    List<Empleado> findByUsuarioId(Long usuarioId);

    // Buscar empleado específico asegurando pertenencia
    Optional<Empleado> findByIdAndUsuarioId(Long id, Long usuarioId);

    // Verificar existencia para borrar
    boolean existsByIdAndUsuarioId(Long id, Long usuarioId);

    // Evitar duplicados de DNI/NIF para el mismo usuario
    boolean existsByNifAndUsuarioId(String nif, Long usuarioId);
}