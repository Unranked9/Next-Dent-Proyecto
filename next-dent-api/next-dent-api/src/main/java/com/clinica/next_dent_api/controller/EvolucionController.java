package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.dto.EvolucionHistorialDTO;
import com.clinica.next_dent_api.model.Evolucion;
import com.clinica.next_dent_api.service.EvolucionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evoluciones")
public class EvolucionController {

    @Autowired
    private EvolucionService evolucionService;

    @GetMapping
    public List<Evolucion> listarTodos() {
        return evolucionService.obtenerTodos();
    }

    @GetMapping("/paciente/{idPaciente}")
    public List<EvolucionHistorialDTO> listarHistorialPorPaciente(@PathVariable Integer idPaciente) {
        return evolucionService.obtenerHistorialPorPaciente(idPaciente);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Evolucion> obtenerPorId(@PathVariable Integer id) {
        return evolucionService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Evolucion> crear(@RequestBody Evolucion evolucion) {
        Evolucion nueva = evolucionService.guardar(evolucion);
        return ResponseEntity.status(HttpStatus.CREATED).body(nueva);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Evolucion> actualizar(@PathVariable Integer id, @RequestBody Evolucion evolucion) {
        return evolucionService.obtenerPorId(id)
                .map(existente -> {
                    evolucion.setIdEvolucion(id);
                    return ResponseEntity.ok(evolucionService.guardar(evolucion));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        evolucionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
