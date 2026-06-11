package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PagoRepository extends JpaRepository<Pago, Integer> {

    List<Pago> findByIdPacienteOrderByFechaPagoDesc(Integer idPaciente);
}
