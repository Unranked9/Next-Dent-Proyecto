package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.dto.EvolucionHistorialDTO;
import com.clinica.next_dent_api.model.Doctor;
import com.clinica.next_dent_api.model.Evolucion;
import com.clinica.next_dent_api.repository.EvolucionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EvolucionService {

    @Autowired
    private EvolucionRepository evolucionRepository;

    public List<Evolucion> obtenerTodos() {
        return evolucionRepository.findAll();
    }

    public List<Evolucion> obtenerPorPaciente(Integer idPaciente) {
        return evolucionRepository.findByIdPacienteOrderByFechaAsc(idPaciente);
    }

    @Transactional(readOnly = true)
    public List<EvolucionHistorialDTO> obtenerHistorialPorPaciente(Integer idPaciente) {
        return evolucionRepository.findHistorialConDoctorByIdPaciente(idPaciente)
                .stream()
                .map(this::toHistorialDTO)
                .collect(Collectors.toList());
    }

    public Optional<Evolucion> obtenerPorId(Integer id) {
        return evolucionRepository.findById(id);
    }

    public Evolucion guardar(Evolucion evolucion) {
        return evolucionRepository.save(evolucion);
    }

    public void eliminar(Integer id) {
        evolucionRepository.deleteById(id);
    }

    private EvolucionHistorialDTO toHistorialDTO(Evolucion evolucion) {
        Doctor doctor = evolucion.getDoctor();
        String nombreDoctor = doctor != null
                ? doctor.getNombre() + " " + doctor.getApellido()
                : "Sin asignar";
        return new EvolucionHistorialDTO(
                evolucion.getIdEvolucion(),
                evolucion.getFecha(),
                evolucion.getDescripcion(),
                nombreDoctor,
                evolucion.getNumeroFdi(),
                evolucion.getIdTarifa()
        );
    }
}
