package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.model.Anamnesis;
import com.clinica.next_dent_api.service.AnamnesisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/anamnesis")
public class AnamnesisController {

    @Autowired
    private AnamnesisService anamnesisService;

    @GetMapping
    public List<Anamnesis> listarTodos() {
        return anamnesisService.obtenerTodos();
    }

    @GetMapping("/ciclo/{idCiclo}")
    public ResponseEntity<Anamnesis> obtenerPorCiclo(@PathVariable Integer idCiclo) {
        return anamnesisService.obtenerPorCiclo(idCiclo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build()); // 204 en lugar de 404 para evitar errores en consola si está vacío
    }

    @PostMapping
    public ResponseEntity<Anamnesis> guardar(@RequestBody Anamnesis anamnesis) {
        Anamnesis guardada = anamnesisService.guardar(anamnesis);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Anamnesis> actualizar(@PathVariable Integer id, @RequestBody Anamnesis anamnesis) {
        anamnesis.setIdAnamnesis(id);
        return ResponseEntity.ok(anamnesisService.guardar(anamnesis));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        anamnesisService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
