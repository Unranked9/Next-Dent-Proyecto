package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.model.*;
import com.clinica.next_dent_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CicloClinicoService {

    private final CicloClinicoRepository cicloClinicoRepository;
    private final AnamnesisRepository anamnesisRepository;
    private final OdontogramaRepository odontogramaRepository;
    private final DienteEstadoRepository dienteEstadoRepository;
    private final OdontogramaMultipiezaRepository odontogramaMultipiezaRepository;

    @Transactional
    public CicloClinico iniciarNuevoCiclo(Integer idPaciente, boolean importarAnterior) {
        String fechaHoyStr = LocalDate.now().toString();

        CicloClinico nuevoCiclo = new CicloClinico();
        nuevoCiclo.setIdPaciente(idPaciente);
        nuevoCiclo.setNombre("Control Clínico - " + fechaHoyStr);
        nuevoCiclo.setFechaInicio(LocalDate.now());
        nuevoCiclo.setEstado("ACTIVO");
        nuevoCiclo = cicloClinicoRepository.save(nuevoCiclo);

        Anamnesis nuevaAnamnesis = new Anamnesis();
        nuevaAnamnesis.setIdPaciente(idPaciente);
        nuevaAnamnesis.setIdCiclo(nuevoCiclo.getIdCiclo());
        if (importarAnterior) {
            Optional<Anamnesis> ultimaAnamnesis = anamnesisRepository
                    .findFirstByIdPacienteOrderByIdAnamnesisDesc(idPaciente);
            nuevaAnamnesis.setRespuestasJson(
                    ultimaAnamnesis.map(Anamnesis::getRespuestasJson).orElse("{}"));
        } else {
            nuevaAnamnesis.setRespuestasJson("{}");
        }
        anamnesisRepository.save(nuevaAnamnesis);

        // Consulta ANTES de persistir los nuevos odontogramas para evitar encontrarse a sí mismo
        Optional<Odontograma> ultimoActual = Optional.empty();
        if (importarAnterior) {
            ultimoActual = odontogramaRepository
                    .findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, TipoOdontograma.ACTUAL);
        }

        Odontograma oInicial = new Odontograma();
        oInicial.setIdPaciente(idPaciente);
        oInicial.setFechaActualizacion(fechaHoyStr);
        oInicial.setTipo(TipoOdontograma.INICIAL);
        oInicial.setObservaciones("Inicio de nuevo ciclo clínico");
        oInicial.setIdCiclo(nuevoCiclo.getIdCiclo());
        Odontograma nuevoInicial = odontogramaRepository.save(oInicial);

        Odontograma oActual = new Odontograma();
        oActual.setIdPaciente(idPaciente);
        oActual.setFechaActualizacion(fechaHoyStr);
        oActual.setTipo(TipoOdontograma.ACTUAL);
        oActual.setObservaciones("Evolución de nuevo ciclo clínico");
        oActual.setIdCiclo(nuevoCiclo.getIdCiclo());
        Odontograma nuevoActual = odontogramaRepository.save(oActual);

        if (ultimoActual.isPresent()) {
            List<DienteEstado> dientesAntiguos = dienteEstadoRepository
                    .findByIdOdontograma(ultimoActual.get().getIdOdontograma());
            List<DienteEstado> nuevosDientes = new ArrayList<>();

            for (DienteEstado antiguo : dientesAntiguos) {
                nuevosDientes.add(clonarDiente(antiguo, nuevoInicial.getIdOdontograma()));
                nuevosDientes.add(clonarDiente(antiguo, nuevoActual.getIdOdontograma()));
            }
            dienteEstadoRepository.saveAll(nuevosDientes);

            List<OdontogramaMultipieza> multisAntiguos = odontogramaMultipiezaRepository
                    .findByIdOdontograma(ultimoActual.get().getIdOdontograma());
            List<OdontogramaMultipieza> nuevosMultis = new ArrayList<>();

            for (OdontogramaMultipieza original : multisAntiguos) {
                OdontogramaMultipieza clonIn = new OdontogramaMultipieza();
                clonIn.setIdOdontograma(nuevoInicial.getIdOdontograma());
                clonIn.setTipoTratamiento(original.getTipoTratamiento());
                clonIn.setColor(original.getColor());
                clonIn.setPiezaInicio(original.getPiezaInicio());
                clonIn.setPiezaFin(original.getPiezaFin());
                nuevosMultis.add(clonIn);

                OdontogramaMultipieza clonAc = new OdontogramaMultipieza();
                clonAc.setIdOdontograma(nuevoActual.getIdOdontograma());
                clonAc.setTipoTratamiento(original.getTipoTratamiento());
                clonAc.setColor(original.getColor());
                clonAc.setPiezaInicio(original.getPiezaInicio());
                clonAc.setPiezaFin(original.getPiezaFin());
                nuevosMultis.add(clonAc);
            }
            odontogramaMultipiezaRepository.saveAll(nuevosMultis);
        }

        return nuevoCiclo;
    }

    public List<CicloClinico> obtenerCiclosPorPaciente(Integer idPaciente) {
        return cicloClinicoRepository.findByIdPacienteOrderByIdCicloDesc(idPaciente);
    }

    private DienteEstado clonarDiente(DienteEstado original, Integer nuevoIdOdontograma) {
        DienteEstado clon = new DienteEstado();
        clon.setIdOdontograma(nuevoIdOdontograma);
        clon.setNumeroFdi(original.getNumeroFdi());
        clon.setCondicionGeneral(original.getCondicionGeneral());
        clon.setSupVestibular(original.getSupVestibular());
        clon.setSupLingual(original.getSupLingual());
        clon.setSupMesial(original.getSupMesial());
        clon.setSupDistal(original.getSupDistal());
        clon.setSupOclusal(original.getSupOclusal());
        clon.setEstadoSalud(original.getEstadoSalud());
        clon.setEstadoClinico(original.getEstadoClinico());
        clon.setSiglaRecuadro(original.getSiglaRecuadro());
        clon.setColorRecuadro(original.getColorRecuadro());
        clon.setTrazoRaiz(original.getTrazoRaiz());
        clon.setTrazoCorona(original.getTrazoCorona());
        clon.setTrazoExterno(original.getTrazoExterno());
        clon.setNotas("Importado de ciclo anterior");
        return clon;
    }
}
