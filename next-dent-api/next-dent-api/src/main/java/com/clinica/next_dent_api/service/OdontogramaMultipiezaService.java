package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.dto.OdontogramaMultipiezaDTO;
import com.clinica.next_dent_api.model.OdontogramaMultipieza;
import com.clinica.next_dent_api.repository.OdontogramaMultipiezaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OdontogramaMultipiezaService {

    @Autowired
    private OdontogramaMultipiezaRepository odontogramaMultipiezaRepository;

    @Autowired
    private com.clinica.next_dent_api.repository.OdontogramaRepository odontogramaRepository;

    @Transactional
    public List<OdontogramaMultipiezaDTO> guardarTratamientos(Integer idOdontograma, List<OdontogramaMultipiezaDTO> dtos) {
        // 1. Limpiar y guardar en el odontograma actual (usualmente el INICIAL)
        odontogramaMultipiezaRepository.deleteByIdOdontograma(idOdontograma);

        List<OdontogramaMultipieza> entidades = dtos.stream()
                .map(dto -> toEntity(dto, idOdontograma))
                .collect(Collectors.toList());

        List<OdontogramaMultipieza> guardadas = odontogramaMultipiezaRepository.saveAll(entidades);

        // 2. PUENTE DE SINCRONIZACIÓN MULTIPIEZA (INICIAL -> ACTUAL)
        odontogramaRepository.findById(idOdontograma).ifPresent(odontograma -> {
            if (odontograma.getTipo() == com.clinica.next_dent_api.model.TipoOdontograma.INICIAL && odontograma.getIdCiclo() != null) {
                odontogramaRepository.findFirstByIdCicloAndTipoOrderByIdOdontogramaDesc(odontograma.getIdCiclo(), com.clinica.next_dent_api.model.TipoOdontograma.ACTUAL)
                        .ifPresent(actual -> {
                            Integer idActual = actual.getIdOdontograma();
                            odontogramaMultipiezaRepository.deleteByIdOdontograma(idActual);
                            List<OdontogramaMultipieza> copiaActual = dtos.stream()
                                    .map(dto -> toEntity(dto, idActual))
                                    .collect(Collectors.toList());
                            odontogramaMultipiezaRepository.saveAll(copiaActual);
                        });
            }
        });

        return guardadas.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<OdontogramaMultipiezaDTO> obtenerPorOdontograma(Integer idOdontograma) {
        return odontogramaMultipiezaRepository.findByIdOdontograma(idOdontograma)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private OdontogramaMultipieza toEntity(OdontogramaMultipiezaDTO dto, Integer idOdontograma) {
        OdontogramaMultipieza entidad = new OdontogramaMultipieza();
        entidad.setIdOdontograma(idOdontograma);
        entidad.setTipoTratamiento(dto.getTipoTratamiento());
        entidad.setColor(dto.getColor());
        entidad.setPiezaInicio(dto.getPiezaInicio());
        entidad.setPiezaFin(dto.getPiezaFin());
        entidad.setNotas(dto.getNotas());
        return entidad;
    }

    private OdontogramaMultipiezaDTO toDTO(OdontogramaMultipieza entidad) {
        return new OdontogramaMultipiezaDTO(
                entidad.getIdMultipieza(),
                entidad.getIdOdontograma(),
                entidad.getTipoTratamiento(),
                entidad.getColor(),
                entidad.getPiezaInicio(),
                entidad.getPiezaFin(),
                entidad.getNotas()
        );
    }
}
