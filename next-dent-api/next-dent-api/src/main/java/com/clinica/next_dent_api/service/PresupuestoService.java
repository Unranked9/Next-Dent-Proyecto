package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.dto.EvolucionResponseDTO;
import com.clinica.next_dent_api.model.*;
import com.clinica.next_dent_api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PresupuestoService {

    @Autowired
    private PresupuestoRepository presupuestoRepository;

    @Autowired
    private PresupuestoDetalleRepository presupuestoDetalleRepository;

    @Autowired
    private OdontogramaRepository odontogramaRepository;

    @Autowired
    private DienteEstadoRepository dienteEstadoRepository;

    @Autowired
    private EvolucionRepository evolucionRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    public List<Presupuesto> obtenerPorPaciente(Integer idPaciente) {
        return presupuestoRepository.findByIdPacienteOrderByFechaCreacionDesc(idPaciente);
    }

    public Optional<Presupuesto> obtenerPorId(Integer idPresupuesto) {
        return presupuestoRepository.findById(idPresupuesto);
    }

    @Transactional
    public Presupuesto generarPresupuesto(Integer idPaciente, List<PresupuestoDetalle> detalles) {
        Presupuesto presupuesto = new Presupuesto();
        presupuesto.setIdPaciente(idPaciente);
        presupuesto.setFechaCreacion(LocalDateTime.now());
        presupuesto.setEstado("PENDIENTE");
        presupuesto.setTotal(BigDecimal.ZERO);
        Presupuesto presupuestoGuardado = presupuestoRepository.save(presupuesto);

        BigDecimal total = BigDecimal.ZERO;
        for (PresupuestoDetalle detalle : detalles) {
            detalle.setPresupuesto(presupuestoGuardado);
            // --- CORRECCIÓN CRÍTICA DE HIBERNATE Y PAGOS ---
            detalle.setEstado("PENDIENTE"); // Obligatorio para MySQL
            detalle.setSaldoPendiente(detalle.getPrecioUnitario()); // La deuda inicial
            // -----------------------------------------------
            total = total.add(detalle.getPrecioUnitario());
        }
        presupuestoDetalleRepository.saveAll(detalles);

        presupuestoGuardado.setTotal(total);
        return presupuestoRepository.save(presupuestoGuardado);
    }

    @Transactional
    public Optional<Presupuesto> actualizarEstado(Integer idPresupuesto, String nuevoEstado) {
        return presupuestoRepository.findById(idPresupuesto).map(presupuesto -> {
            presupuesto.setEstado(nuevoEstado);
            return presupuestoRepository.save(presupuesto);
        });
    }

    @Transactional
    public EvolucionResponseDTO evolucionarPrestacion(Integer idDetalle, Integer idDoctor, String notaClinica, Boolean finalizado) {
        PresupuestoDetalle detalle = presupuestoDetalleRepository.findById(idDetalle)
                .orElseThrow(() -> new RuntimeException("Detalle de presupuesto no encontrado: " + idDetalle));

        if ("REALIZADO".equals(detalle.getEstado())) {
            throw new RuntimeException("Este tratamiento ya fue evolucionado previamente: " + idDetalle);
        }

        Integer idPaciente = detalle.getPresupuesto().getIdPaciente();
        Integer numeroFdi = detalle.getNumeroFdi();

        // Lógica Multi-cita: Solo si finalizado es true, tocamos el Odontograma
        if (finalizado != null && finalizado) {
            detalle.setEstado("REALIZADO");

            if (numeroFdi != null) {
                // AUTO-CREACIÓN CON CLONACIÓN:
                Optional<Odontograma> optActual = odontogramaRepository
                        .findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, TipoOdontograma.ACTUAL);

                Odontograma odontogramaActual;
                if (optActual.isPresent()) {
                    odontogramaActual = optActual.get();
                } else {
                    // 1. Creamos el Odontograma ACTUAL vacio usando setters (A prueba de balas)
                    Odontograma nuevoActual = new Odontograma();
                    nuevoActual.setIdPaciente(idPaciente);
                    nuevoActual.setFechaActualizacion(LocalDate.now().toString());
                    nuevoActual.setTipo(TipoOdontograma.ACTUAL);
                    odontogramaActual = odontogramaRepository.save(nuevoActual);

                    // 2. Buscamos el INICIAL para clonar sus hallazgos
                    final Integer newIdActual = odontogramaActual.getIdOdontograma();
                    odontogramaRepository.findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, TipoOdontograma.INICIAL)
                            .ifPresent(odontogramaInicial -> {
                                List<DienteEstado> dientesIniciales = dienteEstadoRepository.findByIdOdontograma(odontogramaInicial.getIdOdontograma());
                                List<DienteEstado> dientesClonados = dientesIniciales.stream().map(dInicial -> {
                                    DienteEstado dClon = new DienteEstado();
                                    dClon.setIdOdontograma(newIdActual);
                                    dClon.setNumeroFdi(dInicial.getNumeroFdi());
                                    dClon.setCondicionGeneral(dInicial.getCondicionGeneral());
                                    dClon.setSupVestibular(dInicial.getSupVestibular());
                                    dClon.setSupLingual(dInicial.getSupLingual());
                                    dClon.setSupMesial(dInicial.getSupMesial());
                                    dClon.setSupDistal(dInicial.getSupDistal());
                                    dClon.setSupOclusal(dInicial.getSupOclusal());


                                    dClon.setSiglaRecuadro(dInicial.getSiglaRecuadro());
                                    dClon.setColorRecuadro(dInicial.getColorRecuadro());
                                    return dClon;
                                }).collect(java.util.stream.Collectors.toList());
                                dienteEstadoRepository.saveAll(dientesClonados);
                            });
                }

                // 3. Ahora buscamos el diente específico a evolucionar en el ACTUAL (ya clonado)
                DienteEstado dienteEstado = dienteEstadoRepository
                        .findByIdOdontogramaAndNumeroFdi(odontogramaActual.getIdOdontograma(), numeroFdi)
                        .orElseGet(() -> {
                            DienteEstado nuevo = new DienteEstado();
                            nuevo.setIdOdontograma(odontogramaActual.getIdOdontograma());
                            nuevo.setNumeroFdi(numeroFdi);
                            return nuevo;
                        });

                // 4. Aplicamos la evolución
                String carasAfectadas = detalle.getCarasAfectadas();
                if (carasAfectadas != null && !carasAfectadas.isBlank()) {
                    aplicarEvolucionPorCaras(dienteEstado, carasAfectadas);
                } else {
                    aplicarEvolucionPorSimbolo(dienteEstado);
                }
                dienteEstadoRepository.save(dienteEstado);
            }
        } else {
            // Si no está finalizado, solo se queda en progreso
            detalle.setEstado("EN_PROGRESO");
        }

        presupuestoDetalleRepository.save(detalle);

        Doctor doctor = doctorRepository.findById(idDoctor)
                .orElseThrow(() -> new RuntimeException("Doctor no encontrado: " + idDoctor));

        Evolucion evolucion = new Evolucion();
        evolucion.setIdPaciente(idPaciente);
        evolucion.setDoctor(doctor);
        evolucion.setNumeroFdi(numeroFdi);
        evolucion.setFecha(LocalDate.now().toString());
        evolucion.setDescripcion(notaClinica);
        Evolucion evolucionGuardada = evolucionRepository.save(evolucion);

        return new EvolucionResponseDTO(
                true,
                "Prestación evolucionada correctamente",
                evolucionGuardada.getIdEvolucion()
        );
    }

    private void aplicarEvolucionPorCaras(DienteEstado d, String carasAfectadas) {
        String sufijo = obtenerSufijoRestauracion(d.getSiglaRecuadro());
        String estadoRestaurado = "RESTAURADO" + sufijo;

        for (String cara : carasAfectadas.toUpperCase().split(",")) {
            switch (cara.trim()) {
                case "V" -> d.setSupVestibular(estadoRestaurado);
                case "L" -> d.setSupLingual(estadoRestaurado);
                case "M" -> d.setSupMesial(estadoRestaurado);
                case "D" -> d.setSupDistal(estadoRestaurado);
                case "O" -> d.setSupOclusal(estadoRestaurado);
            }
        }

        d.setColorRecuadro("AZUL");
        d.setEstadoSalud("BIEN");
        d.setEstadoClinico("REALIZADO"); // <-- CORRECCIÓN CRÍTICA
    }

    private void aplicarEvolucionPorSimbolo(DienteEstado d) {
        // Barrido Inteligente: convertir caries existentes en la restauración correspondiente
        String sufijo = obtenerSufijoRestauracion(d.getSiglaRecuadro());
        String estadoSuperficie = sufijo.isEmpty() ? "SANO" : "RESTAURADO" + sufijo;

        if ("CARIES".equals(d.getSupVestibular())) d.setSupVestibular(estadoSuperficie);
        if ("CARIES".equals(d.getSupLingual())) d.setSupLingual(estadoSuperficie);
        if ("CARIES".equals(d.getSupMesial())) d.setSupMesial(estadoSuperficie);
        if ("CARIES".equals(d.getSupDistal())) d.setSupDistal(estadoSuperficie);
        if ("CARIES".equals(d.getSupOclusal())) d.setSupOclusal(estadoSuperficie);

        String condicion = d.getCondicionGeneral();
        if (condicion == null) condicion = "";

        if (condicion.contains("EXTRACCION") || condicion.contains("REMANENTE")) {
            d.setCondicionGeneral("AUSENTE");
        } else if (condicion.contains("CORONA") || "CORONA_TEMP".equals(condicion)) {
            d.setCondicionGeneral("CORONA_DEF");
        } else if (condicion.contains("ENDODONCIA")) {
            d.setCondicionGeneral("ENDODONCIA");
        } else if ("CARIES".equals(condicion)) {
            d.setCondicionGeneral("SANO");
        }

        d.setColorRecuadro("AZUL");
        d.setEstadoSalud("BIEN");
        d.setEstadoClinico("REALIZADO"); // <-- CORRECCIÓN CRÍTICA
    }

    private String obtenerSufijoRestauracion(String sigla) {
        if (sigla == null) return "";
        if (sigla.contains("AM")) return "_AM";
        if (sigla.contains("R")) return "_R";
        if (sigla.contains("IV")) return "_IV";
        if (sigla.contains("PC")) return "_PC";
        return "";
    }

    @Transactional
    public Presupuesto agregarDetallesAPresupuesto(Integer idPresupuesto, List<PresupuestoDetalle> nuevosDetalles) {
        Presupuesto presupuesto = presupuestoRepository.findById(idPresupuesto)
                .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado: " + idPresupuesto));

        if (!"PENDIENTE".equals(presupuesto.getEstado())) {
            throw new IllegalStateException("Solo se pueden agregar tratamientos a presupuestos en estado PENDIENTE.");
        }

        BigDecimal totalAdicional = BigDecimal.ZERO;
        for (PresupuestoDetalle detalle : nuevosDetalles) {
            detalle.setPresupuesto(presupuesto);
            detalle.setEstado("PENDIENTE");
            detalle.setSaldoPendiente(detalle.getPrecioUnitario());
            totalAdicional = totalAdicional.add(detalle.getPrecioUnitario());
        }
        presupuestoDetalleRepository.saveAll(nuevosDetalles);

        presupuesto.setTotal(presupuesto.getTotal().add(totalAdicional));
        return presupuestoRepository.save(presupuesto);
    }

    @Transactional
    public PresupuestoDetalle anularDetalle(Integer idDetalle, String motivo) {
        PresupuestoDetalle detalle = presupuestoDetalleRepository.findById(idDetalle)
                .orElseThrow(() -> new RuntimeException("Detalle no encontrado"));

        if ("REALIZADO".equals(detalle.getEstado())) {
            throw new IllegalStateException("No se puede anular un tratamiento que ya ha sido realizado.");
        }

        if ("ANULADO".equals(detalle.getEstado())) {
            throw new IllegalStateException("El tratamiento ya se encuentra anulado.");
        }

        detalle.setEstado("ANULADO");
        detalle.setMotivoAnulacion(motivo);
        detalle.setSaldoPendiente(java.math.BigDecimal.ZERO);
        presupuestoDetalleRepository.save(detalle);

        Presupuesto presupuesto = detalle.getPresupuesto();
        presupuesto.setTotal(presupuesto.getTotal().subtract(detalle.getPrecioUnitario()));
        presupuestoRepository.save(presupuesto);

        return detalle;
    }
}