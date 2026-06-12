package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.dto.PagoDetalleItemDTO;
import com.clinica.next_dent_api.dto.PagoReporteDTO;
import com.clinica.next_dent_api.dto.PagoPorDiaDTO;
import com.clinica.next_dent_api.dto.PagoRequestDTO;
import com.clinica.next_dent_api.model.Pago;
import com.clinica.next_dent_api.model.PagoDetalle;
import com.clinica.next_dent_api.model.PresupuestoDetalle;
import com.clinica.next_dent_api.repository.PagoDetalleRepository;
import com.clinica.next_dent_api.repository.PagoRepository;
import com.clinica.next_dent_api.repository.PresupuestoDetalleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PagoRepository pagoRepository;
    private final PagoDetalleRepository pagoDetalleRepository;
    private final PresupuestoDetalleRepository presupuestoDetalleRepository;

    public PagoReporteDTO generarReporte(LocalDate desde, LocalDate hasta) {
        LocalDateTime desdeDateTime = desde.atStartOfDay();
        LocalDateTime hastaDateTime = hasta.atTime(23, 59, 59);

        List<Pago> pagos = pagoRepository.findByFechaPagoBetween(desdeDateTime, hastaDateTime);

        BigDecimal total = pagos.stream()
                .map(Pago::getMontoTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<LocalDate, List<Pago>> agrupadosPorDia = pagos.stream()
                .collect(Collectors.groupingBy(p -> p.getFechaPago().toLocalDate()));

        List<PagoPorDiaDTO> porDia = agrupadosPorDia.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new PagoPorDiaDTO(
                        e.getKey().toString(),
                        e.getValue().stream().map(Pago::getMontoTotal).reduce(BigDecimal.ZERO, BigDecimal::add),
                        e.getValue().size()
                ))
                .collect(Collectors.toList());

        return new PagoReporteDTO(total, pagos.size(), porDia);
    }

    // ── NUEVO: usado por el KPI "Cobrado hoy" ─────────────────────────────────
    public List<Pago> obtenerTodos() {
        return pagoRepository.findAll();
    }

    public List<Pago> obtenerHistorialPaciente(Integer idPaciente) {
        return pagoRepository.findByIdPacienteOrderByFechaPagoDesc(idPaciente);
    }

    public List<PresupuestoDetalle> obtenerDeudaActual(Integer idPaciente) {
        return presupuestoDetalleRepository.findTratamientosConSaldoByPaciente(idPaciente);
    }

    @Transactional
    public Pago registrarPago(PagoRequestDTO dto) {
        BigDecimal montoTotal = dto.getDetalles().stream()
                .map(PagoDetalleItemDTO::getMontoAbonar)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Pago pago = new Pago();
        pago.setIdPaciente(dto.getIdPaciente());
        pago.setIdUsuarioReceptor(dto.getIdUsuarioReceptor());
        pago.setFechaPago(LocalDateTime.now());
        pago.setMontoTotal(montoTotal);
        pago.setMedioPago(dto.getMedioPago());
        pago.setObservaciones(dto.getObservaciones());
        Pago pagoGuardado = pagoRepository.save(pago);

        for (PagoDetalleItemDTO item : dto.getDetalles()) {
            PresupuestoDetalle detalle = presupuestoDetalleRepository
                    .findById(item.getIdPresupuestoDetalle())
                    .orElseThrow(() -> new RuntimeException(
                            "Detalle de presupuesto no encontrado: " + item.getIdPresupuestoDetalle()));

            if (item.getMontoAbonar().compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("El monto a abonar debe ser mayor a cero para el detalle: "
                        + item.getIdPresupuestoDetalle());
            }

            BigDecimal saldoActual = detalle.getSaldoPendiente();

            if (saldoActual.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("El tratamiento " + item.getIdPresupuestoDetalle()
                        + " ya se encuentra completamente pagado.");
            }

            if (item.getMontoAbonar().compareTo(saldoActual) > 0) {
                throw new RuntimeException("El monto a abonar (" + item.getMontoAbonar()
                        + ") supera el saldo pendiente (" + saldoActual
                        + ") del detalle: " + item.getIdPresupuestoDetalle());
            }

            PagoDetalle pagoDetalle = new PagoDetalle();
            pagoDetalle.setPago(pagoGuardado);
            pagoDetalle.setIdPresupuestoDetalle(item.getIdPresupuestoDetalle());
            pagoDetalle.setMontoAplicado(item.getMontoAbonar());
            pagoDetalleRepository.save(pagoDetalle);

            BigDecimal nuevoSaldo = saldoActual.subtract(item.getMontoAbonar());
            detalle.setSaldoPendiente(nuevoSaldo);

            if (nuevoSaldo.compareTo(BigDecimal.ZERO) <= 0) {
                detalle.setEstado("PAGADO");
            } else {
                detalle.setEstado("CON_SALDO");
            }

            presupuestoDetalleRepository.save(detalle);
        }

        return pagoGuardado;
    }
}
