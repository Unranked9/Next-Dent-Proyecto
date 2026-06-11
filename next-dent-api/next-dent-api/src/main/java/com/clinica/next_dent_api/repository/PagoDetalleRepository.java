package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.PagoDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface PagoDetalleRepository extends JpaRepository<PagoDetalle, Integer> {

    @Query("SELECT COALESCE(SUM(pd.montoAplicado), 0) FROM PagoDetalle pd WHERE pd.idPresupuestoDetalle = :idDetalle")
    BigDecimal sumMontoAplicadoByIdPresupuestoDetalle(@Param("idDetalle") Integer idDetalle);
}
