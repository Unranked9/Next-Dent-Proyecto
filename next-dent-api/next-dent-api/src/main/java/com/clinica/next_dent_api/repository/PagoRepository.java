package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PagoRepository extends JpaRepository<Pago, Integer> {

    List<Pago> findByIdPacienteOrderByFechaPagoDesc(Integer idPaciente);

    @Query("SELECT p FROM Pago p WHERE p.fechaPago >= :desde AND p.fechaPago <= :hasta")
    List<Pago> findByFechaPagoBetween(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );
}
