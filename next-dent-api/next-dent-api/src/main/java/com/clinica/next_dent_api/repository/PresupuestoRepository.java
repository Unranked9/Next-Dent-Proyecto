package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PresupuestoRepository extends JpaRepository<Presupuesto, Integer> {

    List<Presupuesto> findByIdPacienteOrderByFechaCreacionDesc(Integer idPaciente);
}
