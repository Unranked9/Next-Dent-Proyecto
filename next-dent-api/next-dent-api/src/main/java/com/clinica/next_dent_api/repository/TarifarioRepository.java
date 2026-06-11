package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.Tarifario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TarifarioRepository extends JpaRepository<Tarifario, Integer> {
    // Esta línea es la que crea la magia de buscar solo los activos
    List<Tarifario> findByEstadoTrue();
}