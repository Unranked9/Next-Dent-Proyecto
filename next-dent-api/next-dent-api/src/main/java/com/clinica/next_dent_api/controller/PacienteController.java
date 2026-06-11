package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.model.Paciente;
import com.clinica.next_dent_api.service.PacienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pacientes")
@CrossOrigin(origins = "*") // Permite que nuestro futuro frontend en React consuma esta API
public class PacienteController {

    @Autowired
    private PacienteService pacienteService;

    @GetMapping
    public List<Paciente> listarPacientes() {
        return pacienteService.obtenerTodos();
    }

    // --- ¡AQUÍ ESTÁ EL MÉTODO QUE FALTABA! ---
    @GetMapping("/{id}")
    public ResponseEntity<Paciente> obtenerPacientePorId(@PathVariable Integer id) {
        return pacienteService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    // ------------------------------------------

    @PostMapping
    public ResponseEntity<Paciente> crearPaciente(@RequestBody Paciente paciente) {
        Paciente nuevo = pacienteService.guardarPaciente(paciente);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Paciente> actualizarPaciente(@PathVariable Integer id, @RequestBody Paciente paciente) {
        return pacienteService.obtenerPorId(id)
                .map(existente -> {
                    paciente.setIdPac(id);
                    return ResponseEntity.ok(pacienteService.guardarPaciente(paciente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarPaciente(@PathVariable Integer id) {
        return pacienteService.obtenerPorId(id)
                .map(existente -> {
                    pacienteService.eliminarPaciente(id);
                    return ResponseEntity.<Void>noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}