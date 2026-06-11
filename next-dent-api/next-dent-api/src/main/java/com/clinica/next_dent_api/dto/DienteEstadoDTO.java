package com.clinica.next_dent_api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO para recibir el estado de un diente desde el frontend.
 *
 * Utilizado por POST /api/odontograma/diente
 *
 * Campos:
 *  - idOdontograma : ID del odontograma al que pertenece el diente.
 *  - numeroFdi     : Número del diente según nomenclatura FDI (ej: 11, 21, 36...).
 *  - condicionGeneral : Diagnóstico principal del diente (SANO, CARIES, AUSENTE, etc.).
 *  - supVestibular / supLingual / supMesial / supDistal / supOclusal : estado de cada cara.
 *  - notas         : Observaciones clínicas adicionales.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DienteEstadoDTO {

    private Integer idOdontograma;

    private Integer numeroFdi;

    /** Diagnóstico general del diente (SANO, CARIES, AUSENTE, EXTRACCIÓN, etc.) */
    private String condicionGeneral;

    // ── Caras del diente ──────────────────────────────────────────────────────
    private String supVestibular;

    private String supLingual;

    private String supMesial;

    private String supDistal;

    private String supOclusal;

    private String siglaRecuadro;

    private String colorRecuadro;

    private String trazoRaiz;

    private String trazoCorona;

    private String trazoExterno;

    private String estadoSalud;

    private String estadoClinico;

    /** Observaciones clínicas adicionales */
    private String notas;
}
