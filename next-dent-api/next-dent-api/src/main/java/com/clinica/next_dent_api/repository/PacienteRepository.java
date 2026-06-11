package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Integer> {
    // Solo con extender JpaRepository ya tienes listar(), guardar(), eliminar(), etc.
}