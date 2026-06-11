package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.Odontograma;
import com.clinica.next_dent_api.model.TipoOdontograma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OdontogramaRepository extends JpaRepository<Odontograma, Integer> {

    List<Odontograma> findByIdPaciente(Integer idPaciente);

    Optional<Odontograma> findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(Integer idPaciente, TipoOdontograma tipo);

    Optional<Odontograma> findFirstByIdCicloAndTipoOrderByIdOdontogramaDesc(Integer idCiclo, TipoOdontograma tipo);
}
