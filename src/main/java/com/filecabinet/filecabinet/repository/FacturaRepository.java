package com.filecabinet.filecabinet.repository;

import com.filecabinet.filecabinet.entidades.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FacturaRepository extends JpaRepository<Factura, Long> {
    
    // Buscar todas las facturas de un usuario
    List<Factura> findByUsuarioId(Long usuarioId);

    // Buscar una factura específica y asegurar que sea del usuario
    Optional<Factura> findByIdAndUsuarioId(Long id, Long usuarioId);

    // Verificar existencia por ID y Usuario
    boolean existsByIdAndUsuarioId(Long id, Long usuarioId);

    // Este ya lo tienes, lo mantenemos
    boolean existsByNumFacturaAndUsuarioId(String numFactura, Long usuarioId);
}