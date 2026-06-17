package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.dto.PagoReporteDTO;
import com.clinica.next_dent_api.dto.PagoRequestDTO;
import com.clinica.next_dent_api.model.Pago;
import com.clinica.next_dent_api.model.PresupuestoDetalle;
import com.clinica.next_dent_api.service.PagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

    // ── NUEVO: devuelve todos los pagos (necesario para KPI "Cobrado hoy") ──
    @GetMapping
    public ResponseEntity<List<Pago>> listarTodos() {
        return ResponseEntity.ok(pagoService.obtenerTodos());
    }

    @PostMapping
    public ResponseEntity<Pago> registrarPago(@RequestBody PagoRequestDTO dto) {
        Pago pago = pagoService.registrarPago(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(pago);
    }

    @GetMapping("/paciente/{id}")
    public ResponseEntity<List<Pago>> historialPaciente(@PathVariable Integer id) {
        return ResponseEntity.ok(pagoService.obtenerHistorialPaciente(id));
    }

    @GetMapping("/paciente/{id}/deuda")
    public ResponseEntity<List<PresupuestoDetalle>> deudaActual(@PathVariable Integer id) {
        return ResponseEntity.ok(pagoService.obtenerDeudaActual(id));
    }

    @GetMapping("/reporte")
    public ResponseEntity<PagoReporteDTO> getReporte(
            @RequestParam("desde") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam("hasta") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        return ResponseEntity.ok(pagoService.generarReporte(desde, hasta));
    }
}
