package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.dto.PagoRequestDTO;
import com.clinica.next_dent_api.model.Pago;
import com.clinica.next_dent_api.model.PresupuestoDetalle;
import com.clinica.next_dent_api.service.PagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

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
}
