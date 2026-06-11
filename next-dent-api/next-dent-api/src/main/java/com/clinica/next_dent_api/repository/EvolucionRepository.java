package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.Evolucion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvolucionRepository extends JpaRepository<Evolucion, Integer> {

    List<Evolucion> findByIdPacienteOrderByFechaAsc(Integer idPaciente);

    @Query("SELECT e FROM Evolucion e LEFT JOIN FETCH e.doctor WHERE e.idPaciente = :idPaciente ORDER BY e.fecha ASC")
    List<Evolucion> findHistorialConDoctorByIdPaciente(@Param("idPaciente") Integer idPaciente);
}
