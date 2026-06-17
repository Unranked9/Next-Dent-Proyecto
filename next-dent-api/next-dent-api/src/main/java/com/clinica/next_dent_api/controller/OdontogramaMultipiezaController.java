package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.dto.OdontogramaMultipiezaDTO;
import com.clinica.next_dent_api.service.OdontogramaMultipiezaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/odontogramas/multipieza")
public class OdontogramaMultipiezaController {

    @Autowired
    private OdontogramaMultipiezaService odontogramaMultipiezaService;

    @GetMapping("/{idOdontograma}")
    public ResponseEntity<List<OdontogramaMultipiezaDTO>> obtenerPorOdontograma(@PathVariable Integer idOdontograma) {
        List<OdontogramaMultipiezaDTO> tratamientos = odontogramaMultipiezaService.obtenerPorOdontograma(idOdontograma);
        return ResponseEntity.ok(tratamientos);
    }

    @PostMapping("/{idOdontograma}")
    public ResponseEntity<List<OdontogramaMultipiezaDTO>> guardarTratamientos(
            @PathVariable Integer idOdontograma,
            @RequestBody List<OdontogramaMultipiezaDTO> dtos) {
        List<OdontogramaMultipiezaDTO> guardados = odontogramaMultipiezaService.guardarTratamientos(idOdontograma, dtos);
        return ResponseEntity.ok(guardados);
    }
}
