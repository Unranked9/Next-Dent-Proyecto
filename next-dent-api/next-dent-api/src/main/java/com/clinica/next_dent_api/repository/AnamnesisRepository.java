package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.Anamnesis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AnamnesisRepository extends JpaRepository<Anamnesis, Integer> {

    // Mantenemos este por compatibilidad interna de clonación
    Optional<Anamnesis> findFirstByIdPacienteOrderByIdAnamnesisDesc(Integer idPaciente);

    // NUEVO: Búsqueda exacta por ciclo
    Optional<Anamnesis> findByIdCiclo(Integer idCiclo);
}
