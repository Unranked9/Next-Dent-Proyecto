package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.model.Tarifario;
import com.clinica.next_dent_api.service.TarifarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tarifario")
public class TarifarioController {

    @Autowired
    private TarifarioService tarifarioService;

    // AL HACER GET A /api/tarifario DEBE DEVOLVER LA LISTA
    @GetMapping
    public ResponseEntity<List<Tarifario>> listarActivos() {
        // Asegúrate de que tu servicio tenga un método que devuelva la lista
        return ResponseEntity.ok(tarifarioService.obtenerActivos());
    }

    @PostMapping
    public ResponseEntity<Tarifario> crear(@RequestBody Tarifario tarifario) {
        return ResponseEntity.ok(tarifarioService.guardar(tarifario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tarifario> actualizar(@PathVariable Integer id, @RequestBody Tarifario tarifario) {
        return ResponseEntity.ok(tarifarioService.actualizar(id, tarifario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        tarifarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}