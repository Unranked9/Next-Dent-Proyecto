package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.dto.EvolucionRequestDTO;
import com.clinica.next_dent_api.dto.PresupuestoRequestDTO;
import com.clinica.next_dent_api.model.Presupuesto;
import com.clinica.next_dent_api.model.PresupuestoDetalle;
import com.clinica.next_dent_api.service.PresupuestoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/presupuestos")
public class PresupuestoController {

    @Autowired
    private PresupuestoService presupuestoService;

    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<List<Presupuesto>> obtenerPorPaciente(@PathVariable Integer idPaciente) {
        return ResponseEntity.ok(presupuestoService.obtenerPorPaciente(idPaciente));
    }

    @PostMapping
    public ResponseEntity<Presupuesto> crearPresupuesto(@RequestBody PresupuestoRequestDTO request) {
        Presupuesto creado = presupuestoService.generarPresupuesto(
                request.getIdPaciente(),
                request.getDetalles()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Presupuesto> actualizarEstado(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        String nuevoEstado = body.get("estado");
        return presupuestoService.actualizarEstado(id, nuevoEstado)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/detalles/{idDetalle}/evolucionar")
    public ResponseEntity<?> evolucionarDetalle(
            @PathVariable Integer idDetalle,
            @RequestBody EvolucionRequestDTO payload) {

        Object response = presupuestoService.evolucionarPrestacion(
                idDetalle,
                payload.getIdDoctor(),
                payload.getNotaClinica(),
                payload.getFinalizado()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/detalles")
    public ResponseEntity<?> agregarDetalles(
            @PathVariable Integer id,
            @RequestBody List<PresupuestoDetalle> detalles) {
        try {
            return ResponseEntity.ok(presupuestoService.agregarDetallesAPresupuesto(id, detalles));
        } catch (IllegalStateException ex) {
            java.util.Map<String, String> error = new java.util.HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/detalles/{idDetalle}/anular")
    public ResponseEntity<?> anularDetalle(
            @PathVariable Integer idDetalle,
            @RequestBody java.util.Map<String, String> payload) {
        try {
            String motivo = payload.getOrDefault("motivo", "Sin especificar");
            return ResponseEntity.ok(presupuestoService.anularDetalle(idDetalle, motivo));
        } catch (IllegalStateException ex) {
            java.util.Map<String, String> error = new java.util.HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
