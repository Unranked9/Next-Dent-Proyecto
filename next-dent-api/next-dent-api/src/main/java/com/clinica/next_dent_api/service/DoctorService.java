package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.model.Doctor;
import com.clinica.next_dent_api.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    public List<Doctor> obtenerTodos() {
        return doctorRepository.findAll();
    }

    public Optional<Doctor> obtenerPorId(Integer id) {
        return doctorRepository.findById(id);
    }

    public Doctor guardar(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    public void eliminar(Integer id) {
        doctorRepository.deleteById(id);
    }
}
