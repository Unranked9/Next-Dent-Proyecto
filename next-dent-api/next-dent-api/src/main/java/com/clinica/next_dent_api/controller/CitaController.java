package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.model.Cita;
import com.clinica.next_dent_api.service.CitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/citas")
public class CitaController {

    @Autowired
    private CitaService citaService;

    @GetMapping
    public List<Cita> listarCitas() {
        return citaService.obtenerTodas();
    }

    @GetMapping("/paciente/{idPac}")
    public List<Cita> listarPorPaciente(@PathVariable Integer idPac) {
        return citaService.obtenerPorPaciente(idPac);
    }

    @PostMapping
    public ResponseEntity<Cita> crearCita(@RequestBody Cita cita) {
        Cita nueva = citaService.guardarCita(cita);
        return ResponseEntity.status(HttpStatus.CREATED).body(nueva);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cita> actualizarCita(@PathVariable Integer id, @RequestBody Cita cita) {
        return citaService.obtenerPorId(id)
                .map(existente -> {
                    cita.setIdCita(id);
                    return ResponseEntity.ok(citaService.guardarCita(cita));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarCita(@PathVariable Integer id) {
        return citaService.obtenerPorId(id)
                .map(existente -> {
                    citaService.eliminarCita(id);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
