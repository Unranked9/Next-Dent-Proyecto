package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.model.Anamnesis;
import com.clinica.next_dent_api.repository.AnamnesisRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AnamnesisService {

    @Autowired
    private AnamnesisRepository anamnesisRepository;

    public List<Anamnesis> obtenerTodos() {
        return anamnesisRepository.findAll();
    }

    public Optional<Anamnesis> obtenerPorCiclo(Integer idCiclo) {
        return anamnesisRepository.findByIdCiclo(idCiclo);
    }

    public Anamnesis guardar(Anamnesis anamnesis) {
        // Priorizamos buscar si ya existe una anamnesis en ESTE ciclo
        Optional<Anamnesis> existente = anamnesisRepository.findByIdCiclo(anamnesis.getIdCiclo());
        existente.ifPresent(a -> anamnesis.setIdAnamnesis(a.getIdAnamnesis()));
        return anamnesisRepository.save(anamnesis);
    }

    public void eliminar(Integer id) {
        anamnesisRepository.deleteById(id);
    }
}
