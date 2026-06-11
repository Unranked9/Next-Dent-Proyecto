package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.PresupuestoDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PresupuestoDetalleRepository extends JpaRepository<PresupuestoDetalle, Integer> {

    @Query("SELECT d FROM PresupuestoDetalle d WHERE d.presupuesto.idPaciente = :idPaciente AND d.saldoPendiente > 0")
    List<PresupuestoDetalle> findTratamientosConSaldoByPaciente(@Param("idPaciente") Integer idPaciente);

    boolean existsByPresupuesto_IdPacienteAndEstado(Integer idPaciente, String estado);
}
