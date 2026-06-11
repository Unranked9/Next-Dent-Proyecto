package com.clinica.next_dent_api.controller;

import com.clinica.next_dent_api.dto.DienteEstadoDTO;
import com.clinica.next_dent_api.dto.OdontogramaDTO;
import com.clinica.next_dent_api.exception.OdontogramaInicialBloqueadoException;
import com.clinica.next_dent_api.model.DienteEstado;
import com.clinica.next_dent_api.model.TipoOdontograma;
import com.clinica.next_dent_api.service.DienteEstadoService;
import com.clinica.next_dent_api.service.OdontogramaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
// Se aceptan AMBAS variantes de ruta para mantener compatibilidad:
//   /api/odontograma  (singular) ← ruta que usa el frontend actual
//   /api/odontogramas (plural)   ← ruta original del backend
@RequestMapping({"/api/odontograma", "/api/odontogramas"})
public class OdontogramaController {

    @Autowired
    private OdontogramaService odontogramaService;

    @Autowired
    private DienteEstadoService dienteEstadoService;

    /**
     * Consulta el odontograma de un paciente por tipo (INICIAL o ACTUAL).
     *
     * Respuestas posibles:
     *   200 OK          → el odontograma existe; body = OdontogramaDTO con su lista de dientes.
     *   204 No Content  → paciente nuevo o sin odontograma aún; body vacío. CERO errores 500.
     */
    @GetMapping("/paciente/{idPaciente}")
    public ResponseEntity<OdontogramaDTO> obtenerPorTipo(
            @PathVariable Integer idPaciente,
            @RequestParam(defaultValue = "ACTUAL") TipoOdontograma tipo) {

        return odontogramaService.obtenerPorPacienteYTipo(idPaciente, tipo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/ciclo/{idCiclo}")
    public ResponseEntity<OdontogramaDTO> obtenerOdontogramaPorCiclo(
            @PathVariable Integer idCiclo,
            @RequestParam(defaultValue = "INICIAL") TipoOdontograma tipo) {

        return odontogramaService.obtenerPorCicloYTipo(idCiclo, tipo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * Guarda el odontograma completo de un paciente en una sola llamada (Upsert integral).
     *
     * Flujo Upsert:
     *   – Si el paciente NO tiene odontograma del tipo indicado → lo crea y guarda los dientes.
     *   – Si YA tiene odontograma → actualiza los dientes existentes e inserta los nuevos.
     *
     * POST /api/odontograma/paciente/{idPaciente}/guardar?tipo=INICIAL&idCiclo=3
     * Body: OdontogramaDTO con lista de dientes.
     *
     * Retorna 200 OK con el OdontogramaDTO actualizado (cabecera + lista de dientes).
     */
    @PostMapping("/paciente/{idPaciente}/guardar")
    public ResponseEntity<OdontogramaDTO> guardarOdontogramaCompleto(
            @PathVariable Integer idPaciente,
            @RequestParam(defaultValue = "INICIAL") TipoOdontograma tipo,
            @RequestParam(required = false) Integer idCiclo,
            @RequestBody OdontogramaDTO payload) {

        OdontogramaDTO resultado = odontogramaService.guardarOdontogramaUpsert(idPaciente, tipo, payload, idCiclo);
        return ResponseEntity.ok(resultado);
    }

    /**
     * Guarda o actualiza un diente en el odontograma INICIAL del paciente.
     *
     * Flujo de seguridad:
     *   1. Sin ?forzar=true (defecto): si ya existen tratamientos REALIZADOS, retorna
     *      409 CONFLICT con requiereConfirmacion=true para que el frontend muestre un modal.
     *   2. Con ?forzar=true: persiste directamente, sobreescribiendo el diagnóstico inicial.
     *
     * IMPORTANTE: /evolucionar es el único camino legítimo para modificar el odontograma ACTUAL.
     */
    @PostMapping("/paciente/{idPaciente}/diente-inicial")
    public ResponseEntity<?> guardarDienteInicial(
            @PathVariable Integer idPaciente,
            @RequestBody DienteEstado dienteEstado,
            @RequestParam(defaultValue = "false") boolean forzar) {

        try {
            DienteEstado guardado = odontogramaService.guardarEnInicial(idPaciente, dienteEstado, forzar);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
        } catch (OdontogramaInicialBloqueadoException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("requiereConfirmacion", true);
            error.put("mensaje", ex.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
    }

    /**
     * Guarda o actualiza (upsert) un diente en el odontograma ACTUAL.
     *
     * Rutas aceptadas:
     *   POST /api/odontograma/diente   ← frontend actual
     *   POST /api/odontogramas/diente  ← compatibilidad backend previo
     *
     * Body esperado:
     * {
     *   "idOdontograma": 1,
     *   "numeroFdi": 21,
     *   "condicionGeneral": "CARIES",
     *   "supVestibular": "CARIES",
     *   "supLingual": null,
     *   "supMesial": null,
     *   "supDistal": null,
     *   "supOclusal": null,
     *   "notas": "Lesión incipiente"
     * }
     *
     * Lógica: si ya existe un registro para (idOdontograma, numeroFdi) → actualiza;
     *         si no existe → crea uno nuevo. Siempre devuelve 201 CREATED.
     */
    @PostMapping("/diente")
    public ResponseEntity<DienteEstado> guardarDienteEstado(@RequestBody DienteEstadoDTO dto) {
        DienteEstado guardado = odontogramaService.guardarDienteEstado(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    /**
     * Guarda en bloque los estados del odontograma INICIAL identificado por su ID.
     * La operación es atómica: si falla algún registro, ningún cambio se persiste.
     * Solo acepta odontogramas de tipo INICIAL; retorna 400 para cualquier otro tipo.
     *
     * POST /api/odontogramas/{id}/estados
     * Body: [ { "numeroFdi": 11, "condicionGeneral": "SANO", ... }, ... ]
     */
    @PostMapping("/{id}/estados")
    public ResponseEntity<?> guardarEstados(
            @PathVariable Integer id,
            @RequestBody List<DienteEstado> estados) {
        try {
            List<DienteEstado> guardados = odontogramaService.guardarEstados(id, estados);
            return ResponseEntity.ok(guardados);
        } catch (IllegalStateException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Guarda en bloque los estados del odontograma INICIAL del paciente.
     * Si el paciente aún no tiene odontograma INICIAL, lo crea automáticamente.
     * Punto de entrada recomendado para pacientes nuevos.
     *
     * POST /api/odontogramas/paciente/{idPaciente}/estados-inicial
     * Body: [ { "numeroFdi": 11, "condicionGeneral": "SANO", ... }, ... ]
     */
    @PostMapping("/paciente/{idPaciente}/estados-inicial")
    public ResponseEntity<?> guardarEstadosInicial(
            @PathVariable Integer idPaciente,
            @RequestBody List<DienteEstado> estados) {
        List<DienteEstado> guardados = odontogramaService.guardarEstadosPorPaciente(idPaciente, estados);
        return ResponseEntity.ok(guardados);
    }

    /**
     * Inicia un nuevo Ciclo Clínico (Episodio de Atención) para el paciente.
     *
     * Crea un nuevo par INICIAL + ACTUAL con fecha de hoy.
     * Si importarAnterior=true (defecto), clona los dientes del último ACTUAL
     * en ambos nuevos odontogramas para ahorrar trabajo al doctor.
     * Si importarAnterior=false, ambos odontogramas arrancan con la boca en blanco.
     *
     * POST /api/odontograma/paciente/{idPaciente}/nuevo-ciclo?importarAnterior=true
     * Retorna 200 OK con el OdontogramaDTO del nuevo INICIAL.
     */
    @PostMapping("/paciente/{idPaciente}/nuevo-ciclo")
    public ResponseEntity<OdontogramaDTO> iniciarNuevoCiclo(
            @PathVariable Integer idPaciente,
            @RequestParam(defaultValue = "true") boolean importarAnterior) {
        OdontogramaDTO resultado = odontogramaService.iniciarNuevoCiclo(idPaciente, importarAnterior);
        return ResponseEntity.ok(resultado);
    }
}
