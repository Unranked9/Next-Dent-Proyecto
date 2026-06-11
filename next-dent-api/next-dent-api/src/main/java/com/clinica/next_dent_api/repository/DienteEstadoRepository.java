package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.DienteEstado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DienteEstadoRepository extends JpaRepository<DienteEstado, Integer> {

    List<DienteEstado> findByIdOdontograma(Integer idOdontograma);

    Optional<DienteEstado> findByIdOdontogramaAndNumeroFdi(Integer idOdontograma, Integer numeroFdi);
}
