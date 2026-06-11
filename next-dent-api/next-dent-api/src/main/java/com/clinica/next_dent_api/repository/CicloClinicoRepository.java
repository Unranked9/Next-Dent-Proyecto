package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.CicloClinico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CicloClinicoRepository extends JpaRepository<CicloClinico, Integer> {

    List<CicloClinico> findByIdPacienteOrderByIdCicloDesc(Integer idPaciente);
}
