package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.model.Cita;
import com.clinica.next_dent_api.repository.CitaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CitaService {

    @Autowired
    private CitaRepository citaRepository;

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
        return citaRepository.save(cita);
    }

    public void eliminarCita(Integer id) {
        citaRepository.deleteById(id);
    }
}
