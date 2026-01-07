package com.filecabinet.filecabinet.repository;

import com.filecabinet.filecabinet.entidades.Proyecto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProyectoRepository extends JpaRepository<Proyecto, Long> {

    List<Proyecto> findByUsuarioId(Long usuarioId);

    Optional<Proyecto> findByIdAndUsuarioId(Long id, Long usuarioId);

    boolean existsByIdAndUsuarioId(Long id, Long usuarioId);

    // Para evitar que un usuario cree dos proyectos con el mismo nombre (opcional)
    boolean existsByNombreAndUsuarioId(String nombre, Long usuarioId);
}