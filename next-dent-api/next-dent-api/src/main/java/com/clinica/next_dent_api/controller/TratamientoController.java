package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.model.Tratamiento;
import com.clinica.next_dent_api.service.TratamientoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tratamientos")
public class TratamientoController {

    @Autowired
    private TratamientoService tratamientoService;

    @GetMapping
    public List<Tratamiento> listarTratamientos() {
        return tratamientoService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tratamiento> obtenerTratamiento(@PathVariable Integer id) {
        return tratamientoService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Tratamiento> crearTratamiento(@RequestBody Tratamiento tratamiento) {
        Tratamiento nuevo = tratamientoService.guardar(tratamiento);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tratamiento> actualizarTratamiento(@PathVariable Integer id, @RequestBody Tratamiento tratamiento) {
        return tratamientoService.obtenerPorId(id)
                .map(existente -> {
                    tratamiento.setIdTrat(id);
                    return ResponseEntity.ok(tratamientoService.guardar(tratamiento));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarTratamiento(@PathVariable Integer id) {
        return tratamientoService.obtenerPorId(id)
                .map(existente -> {
                    tratamientoService.eliminar(id);
                    return ResponseEntity.<Void>noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
