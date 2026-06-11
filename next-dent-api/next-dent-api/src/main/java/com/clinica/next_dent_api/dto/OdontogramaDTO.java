package com.clinica.next_dent_api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

/**
 * DTO de respuesta para el Odontograma.
 *
 * Combina los campos del encabezado del odontograma con la lista completa
 * de estados de dientes, de modo que el frontend recibe todo en un único objeto.
 *
 * Estructura JSON resultante:
 * {
 *   "idOdontograma": 1,
 *   "idPaciente": 5,
 *   "fechaActualizacion": "2024-01-15",
 *   "tipo": "ACTUAL",
 *   "dientes": [
 *     {
 *       "idOdontograma": 1,
 *       "numeroFdi": 11,
 *       "condicionGeneral": "CARIES",
 *       "supVestibular": "CARIES",
 *       "supLingual": null,
 *       ...
 *     }
 *   ]
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OdontogramaDTO {

    /** PK del odontograma en tb_odontograma */
    private Integer idOdontograma;

    /** Paciente al que pertenece */
    private Integer idPaciente;

    /** Ciclo clínico al que pertenece este odontograma */
    private Integer idCiclo;

    /** Fecha de la última actualización (ISO-8601, ej. "2024-01-15") */
    private String fechaActualizacion;

    /** Tipo de odontograma: "INICIAL" o "ACTUAL" */
    private String tipo;

    /**
     * Lista de estados de dientes vinculados a este odontograma.
     * Nunca es null: si no hay registros en tb_diente_estado, viaja como [].
     */
    private List<DienteEstadoDTO> dientes;

    /** Observaciones generales del odontograma */
    private String observaciones;
}
