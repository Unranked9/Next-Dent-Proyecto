package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.model.Doctor;
import com.clinica.next_dent_api.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctores")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    @GetMapping
    public List<Doctor> listarDoctores() {
        return doctorService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> obtenerDoctor(@PathVariable Integer id) {
        return doctorService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Doctor> crearDoctor(@RequestBody Doctor doctor) {
        Doctor nuevo = doctorService.guardar(doctor);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Doctor> actualizarDoctor(@PathVariable Integer id, @RequestBody Doctor doctor) {
        return doctorService.obtenerPorId(id)
                .map(existente -> {
                    doctor.setIdDoc(id);
                    return ResponseEntity.ok(doctorService.guardar(doctor));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarDoctor(@PathVariable Integer id) {
        return doctorService.obtenerPorId(id)
                .map(existente -> {
                    doctorService.eliminar(id);
                    return ResponseEntity.<Void>noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
