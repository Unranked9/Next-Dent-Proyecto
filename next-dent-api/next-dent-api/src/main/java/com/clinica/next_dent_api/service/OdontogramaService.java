package com.clinica.next_dent_api.service;

import com.clinica.next_dent_api.dto.DienteEstadoDTO;
import com.clinica.next_dent_api.dto.OdontogramaDTO;
import com.clinica.next_dent_api.exception.OdontogramaInicialBloqueadoException;
import com.clinica.next_dent_api.model.DienteEstado;
import com.clinica.next_dent_api.model.Odontograma;
import com.clinica.next_dent_api.model.TipoOdontograma;
import com.clinica.next_dent_api.repository.DienteEstadoRepository;
import com.clinica.next_dent_api.repository.OdontogramaRepository;
import com.clinica.next_dent_api.repository.PresupuestoDetalleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OdontogramaService {

    @Autowired
    private OdontogramaRepository odontogramaRepository;

    @Autowired
    private DienteEstadoRepository dienteEstadoRepository;

    @Autowired
    private PresupuestoDetalleRepository presupuestoDetalleRepository;

    /**
     * Retorna el odontograma ACTUAL del paciente. Si no existe ninguno,
     * crea los dos registros fundacionales: INICIAL y ACTUAL.
     * Solo /evolucionar debe escribir sobre ACTUAL.
     */
    @Transactional
    public Odontograma obtenerOCrear(Integer idPaciente) {
        return odontogramaRepository.findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, TipoOdontograma.ACTUAL)
                .orElseGet(() -> crearPar(idPaciente));
    }

    /**
     * Retorna el odontograma INICIAL del paciente. Si no existe ninguno,
     * crea el par INICIAL + ACTUAL.
     */
    @Transactional
    public Odontograma obtenerOCrearInicial(Integer idPaciente) {
        return odontogramaRepository.findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, TipoOdontograma.INICIAL)
                .orElseGet(() -> {
                    crearPar(idPaciente);
                    return odontogramaRepository.findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, TipoOdontograma.INICIAL)
                            .orElseThrow(() -> new RuntimeException("Error al crear odontograma INICIAL para paciente: " + idPaciente));
                });
    }

    /**
     * Guarda o actualiza un diente en el odontograma INICIAL.
     *
     * Regla de integridad:
     *   - Si el paciente ya tiene tratamientos REALIZADOS y forzar=false → lanza
     *     OdontogramaInicialBloqueadoException (HTTP 409) para que el frontend
     *     muestre confirmación antes de proceder.
     *   - Si forzar=true → la operación procede con plena consciencia del riesgo legal.
     *
     * El endpoint /evolucionar es el único camino legítimo para modificar ACTUAL.
     */
    @Transactional
    public DienteEstado guardarEnInicial(Integer idPaciente, DienteEstado dienteEstado, boolean forzar) {
        boolean tieneTratamientosRealizados = presupuestoDetalleRepository
                .existsByPresupuesto_IdPacienteAndEstado(idPaciente, "REALIZADO");

        if (tieneTratamientosRealizados && !forzar) {
            throw new OdontogramaInicialBloqueadoException(idPaciente);
        }

        Odontograma inicial = obtenerOCrearInicial(idPaciente);

        dienteEstado.setIdOdontograma(inicial.getIdOdontograma());

        dienteEstadoRepository
                .findByIdOdontogramaAndNumeroFdi(inicial.getIdOdontograma(), dienteEstado.getNumeroFdi())
                .ifPresent(existente -> dienteEstado.setIdRegistro(existente.getIdRegistro()));

        return dienteEstadoRepository.save(dienteEstado);
    }

    /**
     * Guarda en bloque los estados de dientes para un odontograma INICIAL.
     * Si el FDI ya existe → actualiza campos. Si no → crea el registro.
     * La transacción es atómica: un fallo revierte todos los cambios.
     */
    @Transactional
    public List<DienteEstado> guardarEstados(Integer idOdontograma, List<DienteEstado> nuevosEstados) {
        Odontograma odontograma = odontogramaRepository.findById(idOdontograma)
                .orElseThrow(() -> new RuntimeException("Odontograma no encontrado: " + idOdontograma));

        if (odontograma.getTipo() != TipoOdontograma.INICIAL) {
            throw new IllegalStateException(
                    "Este endpoint solo modifica odontogramas INICIAL. Use /evolucionar para el ACTUAL.");
        }

        Map<Integer, DienteEstado> existentesPorFdi = dienteEstadoRepository
                .findByIdOdontograma(idOdontograma)
                .stream()
                .collect(Collectors.toMap(DienteEstado::getNumeroFdi, Function.identity()));

        List<DienteEstado> aGuardar = new ArrayList<>();
        for (DienteEstado nuevo : nuevosEstados) {
            nuevo.setIdOdontograma(idOdontograma);
            DienteEstado existente = existentesPorFdi.get(nuevo.getNumeroFdi());
            if (existente != null) {
                existente.setCondicionGeneral(nuevo.getCondicionGeneral());
                existente.setSupVestibular(nuevo.getSupVestibular());
                existente.setSupLingual(nuevo.getSupLingual());
                existente.setSupMesial(nuevo.getSupMesial());
                existente.setSupDistal(nuevo.getSupDistal());
                existente.setSupOclusal(nuevo.getSupOclusal());
                existente.setSiglaRecuadro(nuevo.getSiglaRecuadro());
                existente.setColorRecuadro(nuevo.getColorRecuadro());
                existente.setTrazoRaiz(nuevo.getTrazoRaiz());
                existente.setTrazoCorona(nuevo.getTrazoCorona());
                existente.setTrazoExterno(nuevo.getTrazoExterno());
                existente.setNotas(nuevo.getNotas());
                existente.setEstadoSalud(nuevo.getEstadoSalud());
                existente.setEstadoClinico(nuevo.getEstadoClinico());
                aGuardar.add(existente);
            } else {
                aGuardar.add(nuevo);
            }
        }

        return dienteEstadoRepository.saveAll(aGuardar);
    }

    /**
     * Busca o crea el odontograma INICIAL del paciente y luego guarda en bloque
     * los estados de los dientes. Punto de entrada seguro para pacientes nuevos.
     */
    @Transactional
    public List<DienteEstado> guardarEstadosPorPaciente(Integer idPaciente, List<DienteEstado> nuevosEstados) {
        Odontograma inicial = obtenerOCrearInicial(idPaciente);
        return guardarEstados(inicial.getIdOdontograma(), nuevosEstados);
    }

    /**
     * Upsert de un diente en el odontograma ACTUAL identificado por DTO.
     *
     * Flujo:
     *   1. Recibe un {@link DienteEstadoDTO} con idOdontograma + numeroFdi + caras + diagnóstico.
     *   2. Busca en tb_diente_estado si ya existe un registro para (idOdontograma, numeroFdi).
     *      - SI existe  → actualiza condicionGeneral, todas las caras y notas.
     *      - NO existe  → crea un registro nuevo.
     *   3. Persiste y devuelve la entidad guardada.
     *
     * Usado por: POST /api/odontograma/diente
     */
    @Transactional
    public DienteEstado guardarDienteEstado(DienteEstadoDTO dto) {

        // Buscar si ya existe un registro para este odontograma + diente
        DienteEstado entidad = dienteEstadoRepository
                .findByIdOdontogramaAndNumeroFdi(dto.getIdOdontograma(), dto.getNumeroFdi())
                .orElse(new DienteEstado());   // si no existe → entidad nueva (INSERT)

        // Asignar / actualizar campos (UPDATE o INSERT comparte el mismo mapeo)
        entidad.setIdOdontograma(dto.getIdOdontograma());
        entidad.setNumeroFdi(dto.getNumeroFdi());
        entidad.setCondicionGeneral(dto.getCondicionGeneral());
        entidad.setSupVestibular(dto.getSupVestibular());
        entidad.setSupLingual(dto.getSupLingual());
        entidad.setSupMesial(dto.getSupMesial());
        entidad.setSupDistal(dto.getSupDistal());
        entidad.setSupOclusal(dto.getSupOclusal());
        entidad.setSiglaRecuadro(dto.getSiglaRecuadro());
        entidad.setColorRecuadro(dto.getColorRecuadro());
        entidad.setTrazoRaiz(dto.getTrazoRaiz());
        entidad.setTrazoCorona(dto.getTrazoCorona());
        entidad.setTrazoExterno(dto.getTrazoExterno());
        entidad.setNotas(dto.getNotas());
        entidad.setEstadoSalud(dto.getEstadoSalud());
        entidad.setEstadoClinico(dto.getEstadoClinico());

        return dienteEstadoRepository.save(entidad);
    }

    /**
     * Devuelve el OdontogramaDTO del paciente para el tipo solicitado (INICIAL o ACTUAL).
     *
     * Comportamiento seguro para pacientes nuevos:
     *   – Si el odontograma NO existe → devuelve Optional.empty() (sin auto-crear, sin excepción).
     *   – Si EXISTE → devuelve Optional con el DTO completo (cabecera + dientes).
     *
     * El controller mapea Optional.empty() → 204 No Content, eliminando los errores 500
     * que se producían cuando el frontend consultaba a un paciente sin odontograma previo.
     */
    @Transactional(readOnly = true)
    public java.util.Optional<OdontogramaDTO> obtenerPorPacienteYTipo(Integer idPaciente, TipoOdontograma tipo) {

        java.util.Optional<Odontograma> optOdontograma =
                odontogramaRepository.findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, tipo);

        if (optOdontograma.isEmpty()) {
            return java.util.Optional.empty();
        }

        Odontograma odontograma = optOdontograma.get();

        List<DienteEstadoDTO> dientes = dienteEstadoRepository
                .findByIdOdontograma(odontograma.getIdOdontograma())
                .stream()
                .map(this::mapToDienteEstadoDTO)
                .collect(Collectors.toList());

        OdontogramaDTO dto = new OdontogramaDTO();
        dto.setIdOdontograma(odontograma.getIdOdontograma());
        dto.setIdPaciente(odontograma.getIdPaciente());
        dto.setFechaActualizacion(odontograma.getFechaActualizacion());
        dto.setTipo(odontograma.getTipo().name());
        dto.setDientes(dientes);
        dto.setObservaciones(odontograma.getObservaciones());
        return java.util.Optional.of(dto);
    }

    @Transactional(readOnly = true)
    public java.util.Optional<OdontogramaDTO> obtenerPorCicloYTipo(Integer idCiclo, TipoOdontograma tipo) {
        java.util.Optional<Odontograma> optOdontograma =
                odontogramaRepository.findFirstByIdCicloAndTipoOrderByIdOdontogramaDesc(idCiclo, tipo);

        if (optOdontograma.isEmpty()) {
            return java.util.Optional.empty();
        }

        Odontograma odontograma = optOdontograma.get();
        List<DienteEstadoDTO> dientes = dienteEstadoRepository
                .findByIdOdontograma(odontograma.getIdOdontograma())
                .stream()
                .map(this::mapToDienteEstadoDTO)
                .collect(Collectors.toList());

        OdontogramaDTO dto = new OdontogramaDTO();
        dto.setIdOdontograma(odontograma.getIdOdontograma());
        dto.setIdPaciente(odontograma.getIdPaciente());
        dto.setIdCiclo(odontograma.getIdCiclo());
        dto.setFechaActualizacion(odontograma.getFechaActualizacion());
        dto.setTipo(odontograma.getTipo().name());
        dto.setDientes(dientes);
        dto.setObservaciones(odontograma.getObservaciones());
        return java.util.Optional.of(dto);
    }

    @Transactional
    public OdontogramaDTO guardarOdontogramaUpsert(
            Integer idPaciente,
            TipoOdontograma tipo,
            OdontogramaDTO payload,
            Integer idCicloParam) {

        List<DienteEstadoDTO> hallazgos = payload.getDientes() != null ? payload.getDientes() : new ArrayList<>();
        Integer cicloFinal = (idCicloParam != null) ? idCicloParam : payload.getIdCiclo();

        // 1. Buscar cabecera (Con Auto-Sanación de huérfanos)
        java.util.Optional<Odontograma> existente;
        if (cicloFinal != null) {
            existente = odontogramaRepository.findFirstByIdCicloAndTipoOrderByIdOdontogramaDesc(cicloFinal, tipo);
            if (existente.isEmpty()) {
                existente = odontogramaRepository.findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, tipo);
            }
        } else {
            existente = odontogramaRepository.findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, tipo);
        }

        Odontograma odontograma = existente.orElseGet(() -> {
            Odontograma nuevo = new Odontograma();
            nuevo.setIdPaciente(idPaciente);
            nuevo.setTipo(tipo);
            return nuevo;
        });

        // Auto-sanar el ciclo si estaba en NULL
        odontograma.setIdCiclo(cicloFinal);
        odontograma.setObservaciones(payload.getObservaciones());
        odontograma.setFechaActualizacion(LocalDate.now().toString());
        odontograma = odontogramaRepository.save(odontograma);

        Integer idOdontograma = odontograma.getIdOdontograma();

        // 2. Guardar dientes del INICIAL
        Map<Integer, DienteEstado> existentesPorFdi = dienteEstadoRepository
                .findByIdOdontograma(idOdontograma)
                .stream()
                .collect(Collectors.toMap(DienteEstado::getNumeroFdi, Function.identity()));

        List<DienteEstado> aGuardar = new ArrayList<>();
        for (DienteEstadoDTO h : hallazgos) {
            DienteEstado entidad = existentesPorFdi.getOrDefault(h.getNumeroFdi(), new DienteEstado());
            entidad.setIdOdontograma(idOdontograma);
            entidad.setNumeroFdi(h.getNumeroFdi());
            entidad.setCondicionGeneral(h.getCondicionGeneral());
            entidad.setSupVestibular(h.getSupVestibular());
            entidad.setSupLingual(h.getSupLingual());
            entidad.setSupMesial(h.getSupMesial());
            entidad.setSupDistal(h.getSupDistal());
            entidad.setSupOclusal(h.getSupOclusal());
            entidad.setSiglaRecuadro(h.getSiglaRecuadro());
            entidad.setColorRecuadro(h.getColorRecuadro());
            entidad.setTrazoRaiz(h.getTrazoRaiz());
            entidad.setTrazoCorona(h.getTrazoCorona());
            entidad.setTrazoExterno(h.getTrazoExterno());
            entidad.setNotas(h.getNotas());
            entidad.setEstadoSalud(h.getEstadoSalud());
            entidad.setEstadoClinico(h.getEstadoClinico());
            aGuardar.add(entidad);
        }
        dienteEstadoRepository.saveAll(aGuardar);

        // 3. PUENTE DE SINCRONIZACIÓN AUTO-HEALING (INICIAL -> ACTUAL)
        if (tipo == TipoOdontograma.INICIAL) {
            java.util.Optional<Odontograma> actualOpt;
            if (cicloFinal != null) {
                actualOpt = odontogramaRepository.findFirstByIdCicloAndTipoOrderByIdOdontogramaDesc(cicloFinal, TipoOdontograma.ACTUAL);
                if (actualOpt.isEmpty()) {
                    actualOpt = odontogramaRepository.findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, TipoOdontograma.ACTUAL);
                }
            } else {
                actualOpt = odontogramaRepository.findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, TipoOdontograma.ACTUAL);
            }

            Odontograma actual = actualOpt.orElseGet(() -> {
                Odontograma nuevoActual = new Odontograma();
                nuevoActual.setIdPaciente(idPaciente);
                nuevoActual.setTipo(TipoOdontograma.ACTUAL);
                nuevoActual.setFechaActualizacion(LocalDate.now().toString());
                return nuevoActual;
            });

            // Auto-sanar el ciclo del ACTUAL
            actual.setIdCiclo(cicloFinal);
            actual = odontogramaRepository.save(actual);

            Integer idActual = actual.getIdOdontograma();
            Map<Integer, DienteEstado> existentesActual = dienteEstadoRepository
                    .findByIdOdontograma(idActual)
                    .stream()
                    .collect(Collectors.toMap(DienteEstado::getNumeroFdi, Function.identity()));

            List<DienteEstado> aGuardarActual = new ArrayList<>();
            for (DienteEstadoDTO h : hallazgos) {
                DienteEstado entidadActual = existentesActual.getOrDefault(h.getNumeroFdi(), new DienteEstado());

                if ("REALIZADO".equals(entidadActual.getEstadoClinico()) || "TRATADO".equals(entidadActual.getEstadoClinico())) {
                    continue;
                }

                entidadActual.setIdOdontograma(idActual);
                entidadActual.setNumeroFdi(h.getNumeroFdi());
                entidadActual.setCondicionGeneral(h.getCondicionGeneral());
                entidadActual.setSupVestibular(h.getSupVestibular());
                entidadActual.setSupLingual(h.getSupLingual());
                entidadActual.setSupMesial(h.getSupMesial());
                entidadActual.setSupDistal(h.getSupDistal());
                entidadActual.setSupOclusal(h.getSupOclusal());
                entidadActual.setSiglaRecuadro(h.getSiglaRecuadro());
                entidadActual.setColorRecuadro(h.getColorRecuadro());
                entidadActual.setTrazoRaiz(h.getTrazoRaiz());
                entidadActual.setTrazoCorona(h.getTrazoCorona());
                entidadActual.setTrazoExterno(h.getTrazoExterno());
                entidadActual.setNotas(h.getNotas());
                entidadActual.setEstadoSalud(h.getEstadoSalud());
                entidadActual.setEstadoClinico(entidadActual.getEstadoClinico() != null ? entidadActual.getEstadoClinico() : h.getEstadoClinico());

                aGuardarActual.add(entidadActual);
            }
            dienteEstadoRepository.saveAll(aGuardarActual);
        }

        List<DienteEstadoDTO> dientesDTO = dienteEstadoRepository
                .findByIdOdontograma(idOdontograma)
                .stream()
                .map(this::mapToDienteEstadoDTO)
                .collect(Collectors.toList());

        OdontogramaDTO resultado = new OdontogramaDTO();
        resultado.setIdOdontograma(idOdontograma);
        resultado.setIdPaciente(idPaciente);
        resultado.setIdCiclo(odontograma.getIdCiclo());
        resultado.setFechaActualizacion(odontograma.getFechaActualizacion());
        resultado.setTipo(tipo.name());
        resultado.setDientes(dientesDTO);
        resultado.setObservaciones(odontograma.getObservaciones());
        return resultado;
    }

    // ── Helpers de mapeo ─────────────────────────────────────────────────────────

    /**
     * Convierte una entidad DienteEstado (fila de tb_diente_estado) a su DTO de respuesta.
     * El mapeo es explícito campo a campo para evitar sorpresas si se añaden columnas
     * a la entidad que no deben exponerse en la API.
     */
    private DienteEstadoDTO mapToDienteEstadoDTO(DienteEstado entidad) {
        DienteEstadoDTO dto = new DienteEstadoDTO();
        dto.setIdOdontograma(entidad.getIdOdontograma());
        dto.setNumeroFdi(entidad.getNumeroFdi());
        dto.setCondicionGeneral(entidad.getCondicionGeneral());
        dto.setSupVestibular(entidad.getSupVestibular());
        dto.setSupLingual(entidad.getSupLingual());
        dto.setSupMesial(entidad.getSupMesial());
        dto.setSupDistal(entidad.getSupDistal());
        dto.setSupOclusal(entidad.getSupOclusal());
        dto.setSiglaRecuadro(entidad.getSiglaRecuadro());
        dto.setColorRecuadro(entidad.getColorRecuadro());
        dto.setTrazoRaiz(entidad.getTrazoRaiz());
        dto.setTrazoCorona(entidad.getTrazoCorona());
        dto.setTrazoExterno(entidad.getTrazoExterno());
        dto.setNotas(entidad.getNotas());
        dto.setEstadoSalud(entidad.getEstadoSalud());
        dto.setEstadoClinico(entidad.getEstadoClinico());
        return dto;
    }

    @Transactional
    public OdontogramaDTO iniciarNuevoCiclo(Integer idPaciente, boolean importarAnterior) {
        // 1. Buscar el último ACTUAL (Historial) antes de crear los nuevos
        java.util.Optional<Odontograma> ultimoActual = odontogramaRepository
                .findFirstByIdPacienteAndTipoOrderByIdOdontogramaDesc(idPaciente, TipoOdontograma.ACTUAL);

        // 2. Crear los nuevos registros fundacionales para el ciclo de hoy
        String fechaHoy = LocalDate.now().toString();

        Odontograma oInicial = new Odontograma();
        oInicial.setIdPaciente(idPaciente);
        oInicial.setFechaActualizacion(fechaHoy);
        oInicial.setTipo(TipoOdontograma.INICIAL);
        oInicial.setObservaciones("Inicio de nuevo ciclo clínico");
        Odontograma nuevoInicial = odontogramaRepository.save(oInicial);

        Odontograma oActual = new Odontograma();
        oActual.setIdPaciente(idPaciente);
        oActual.setFechaActualizacion(fechaHoy);
        oActual.setTipo(TipoOdontograma.ACTUAL);
        oActual.setObservaciones("Inicio de nuevo ciclo clínico");
        Odontograma nuevoActual = odontogramaRepository.save(oActual);
        // 3. Si el doctor lo solicita y hay historial, clonamos los dientes
        if (importarAnterior && ultimoActual.isPresent()) {
            List<DienteEstado> dientesAntiguos = dienteEstadoRepository.findByIdOdontograma(ultimoActual.get().getIdOdontograma());
            List<DienteEstado> nuevosDientes = new ArrayList<>();

            for (DienteEstado antiguo : dientesAntiguos) {
                nuevosDientes.add(clonarDienteParaOdontograma(antiguo, nuevoInicial.getIdOdontograma()));
                nuevosDientes.add(clonarDienteParaOdontograma(antiguo, nuevoActual.getIdOdontograma()));
            }
            dienteEstadoRepository.saveAll(nuevosDientes);
        }

        // 4. Devolvemos el DTO del nuevo INICIAL para que React recargue la pantalla
        return obtenerPorPacienteYTipo(idPaciente, TipoOdontograma.INICIAL)
                .orElseThrow(() -> new RuntimeException("Error al recuperar el nuevo ciclo"));
    }

    private DienteEstado clonarDienteParaOdontograma(DienteEstado original, Integer nuevoIdOdontograma) {
        DienteEstado clon = new DienteEstado();
        clon.setIdOdontograma(nuevoIdOdontograma);
        clon.setNumeroFdi(original.getNumeroFdi());
        clon.setCondicionGeneral(original.getCondicionGeneral());
        clon.setSupVestibular(original.getSupVestibular());
        clon.setSupLingual(original.getSupLingual());
        clon.setSupMesial(original.getSupMesial());
        clon.setSupDistal(original.getSupDistal());
        clon.setSupOclusal(original.getSupOclusal());
        clon.setSiglaRecuadro(original.getSiglaRecuadro());
        clon.setColorRecuadro(original.getColorRecuadro());
        clon.setEstadoSalud(original.getEstadoSalud());
        clon.setEstadoClinico(original.getEstadoClinico());
        clon.setTrazoRaiz(original.getTrazoRaiz());
        clon.setTrazoCorona(original.getTrazoCorona());
        clon.setTrazoExterno(original.getTrazoExterno());
        clon.setNotas("Importado de ciclo anterior. " + (original.getNotas() != null ? original.getNotas() : ""));
        return clon;
    }

    public Odontograma guardar(Odontograma odontograma) {
        return odontogramaRepository.save(odontograma);
    }

    private Odontograma crearPar(Integer idPaciente) {
        String fecha = LocalDate.now().toString();

        Odontograma inicial = new Odontograma();
        inicial.setIdPaciente(idPaciente);
        inicial.setFechaActualizacion(fecha);
        inicial.setTipo(TipoOdontograma.INICIAL);
        odontogramaRepository.save(inicial);

        Odontograma actual = new Odontograma();
        actual.setIdPaciente(idPaciente);
        actual.setFechaActualizacion(fecha);
        actual.setTipo(TipoOdontograma.ACTUAL);
        return odontogramaRepository.save(actual);
    }
}
