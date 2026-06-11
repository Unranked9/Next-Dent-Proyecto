package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.model.CicloClinico;
import com.clinica.next_dent_api.service.CicloClinicoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ciclos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CicloClinicoController {

    private final CicloClinicoService cicloClinicoService;

    @PostMapping("/paciente/{idPaciente}/nuevo")
    public ResponseEntity<CicloClinico> iniciarNuevoCiclo(
            @PathVariable Integer idPaciente,
            @RequestParam(defaultValue = "true") boolean importarAnterior) {

        return ResponseEntity.ok(cicloClinicoService.iniciarNuevoCiclo(idPaciente, importarAnterior));
    }

    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<List<CicloClinico>> obtenerCiclosPorPaciente(@PathVariable Integer idPaciente) {
        return ResponseEntity.ok(cicloClinicoService.obtenerCiclosPorPaciente(idPaciente));
    }
}
