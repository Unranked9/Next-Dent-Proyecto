package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.model.Tratamiento;
import com.clinica.next_dent_api.repository.TratamientoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TratamientoService {

    @Autowired
    private TratamientoRepository tratamientoRepository;

    public List<Tratamiento> obtenerTodos() {
        return tratamientoRepository.findAll();
    }

    public Optional<Tratamiento> obtenerPorId(Integer id) {
        return tratamientoRepository.findById(id);
    }

    public Tratamiento guardar(Tratamiento tratamiento) {
        return tratamientoRepository.save(tratamiento);
    }

    public void eliminar(Integer id) {
        tratamientoRepository.deleteById(id);
    }
}
