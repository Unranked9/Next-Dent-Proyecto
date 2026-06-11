package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.OdontogramaMultipieza;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface OdontogramaMultipiezaRepository extends JpaRepository<OdontogramaMultipieza, Integer> {

    List<OdontogramaMultipieza> findByIdOdontograma(Integer idOdontograma);

    @Transactional
    void deleteByIdOdontograma(Integer idOdontograma);
}
