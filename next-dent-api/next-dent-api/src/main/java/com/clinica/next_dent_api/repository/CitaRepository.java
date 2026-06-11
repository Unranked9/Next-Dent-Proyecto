package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Integer> {

    List<Cita> findByPaciente_IdPac(Integer idPac);
}
