package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.model.DienteEstado;
import com.clinica.next_dent_api.repository.DienteEstadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DienteEstadoService {

    @Autowired
    private DienteEstadoRepository dienteEstadoRepository;

    public List<DienteEstado> obtenerPorOdontograma(Integer idOdontograma) {
        return dienteEstadoRepository.findByIdOdontograma(idOdontograma);
    }

    public DienteEstado guardarOActualizar(DienteEstado dienteEstado) {
        Optional<DienteEstado> existente = dienteEstadoRepository
                .findByIdOdontogramaAndNumeroFdi(dienteEstado.getIdOdontograma(), dienteEstado.getNumeroFdi());

        existente.ifPresent(d -> {
            dienteEstado.setIdRegistro(d.getIdRegistro());
        });

        return dienteEstadoRepository.save(dienteEstado);
    }
}
