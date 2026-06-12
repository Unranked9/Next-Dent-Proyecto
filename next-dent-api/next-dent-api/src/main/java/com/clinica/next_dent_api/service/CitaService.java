package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.model.Cita;
import com.clinica.next_dent_api.model.Paciente;
import com.clinica.next_dent_api.repository.CitaRepository;
import com.clinica.next_dent_api.repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CitaService {

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    public List<Cita> obtenerTodas() {
        return citaRepository.findAll();
    }

    public Optional<Cita> obtenerPorId(Integer id) {
        return citaRepository.findById(id);
    }

    public List<Cita> obtenerPorPaciente(Integer idPac) {
        return citaRepository.findByPaciente_IdPac(idPac);
    }

    public Cita guardarCita(Cita cita) {
        if (cita.getPaciente() != null && cita.getPaciente().getIdPac() != null) {
            Paciente paciente = pacienteRepository
                .findById(cita.getPaciente().getIdPac())
                .orElseThrow(() -> new RuntimeException(
                    "Paciente no encontrado: " + cita.getPaciente().getIdPac()
                ));
            cita.setPaciente(paciente);
        }
        return citaRepository.save(cita);
    }

    public void eliminarCita(Integer id) {
        citaRepository.deleteById(id);
    }
}
