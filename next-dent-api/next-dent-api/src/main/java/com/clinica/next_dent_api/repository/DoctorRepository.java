package com.clinica.next_dent_api.repository;

import com.clinica.next_dent_api.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorRepository extends JpaRepository<Doctor, Integer> {
}
